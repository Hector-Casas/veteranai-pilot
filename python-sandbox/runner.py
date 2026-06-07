"""
runner.py — ENTRYPOINT for the python-sandbox container.

All output is emitted to stdout as JSON lines so executor-api can capture it
from the Docker log stream.  This avoids any dependency on shared filesystems
(tmpfs is destroyed when the container exits; bind mounts have permission
issues on Windows/WSL2).

Protocol
--------
Every line printed to stdout is a JSON object with at least {"event": "..."}.
The final result is emitted as: {"event": "output", "payload": {...}}
executor-api captures this event and uses payload as the analysis result.
"""
import base64
import io
import json
import os
import sqlite3
import sys
import traceback
from datetime import datetime, timezone

# ── Ensure HOME and matplotlib cache land in /tmp (root FS is read-only) ────
# Must be set BEFORE any matplotlib import touches the filesystem.
os.environ.setdefault("HOME", "/tmp")
os.environ.setdefault("MPLCONFIGDIR", "/tmp/matplotlib")
os.makedirs(os.environ["MPLCONFIGDIR"], exist_ok=True)

# ── Matplotlib: non-interactive backend BEFORE any other matplotlib import ───
os.environ.setdefault("MPLBACKEND", "Agg")
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns


# ── Stdout helpers ────────────────────────────────────────────────────────────

def log(event: str, **kwargs) -> None:
    """Emit a structured progress event to stdout (one JSON line)."""
    record = {"event": event, "ts": datetime.now(timezone.utc).isoformat(), **kwargs}
    print(json.dumps(record, default=str), flush=True)


def emit_output(payload: dict) -> None:
    """
    Emit the final analysis result to stdout.
    executor-api captures this line and uses `payload` as the response data.
    Large payloads (charts as base64) are fine — Docker log lines have a ~1 MB
    default limit and we stay well within that for typical analysis results.
    """
    print(json.dumps({"event": "output", "payload": payload}, default=str), flush=True)


# ── DB helpers ────────────────────────────────────────────────────────────────

def open_db(db_path: str) -> sqlite3.Connection:
    """Open SQLite in read-only mode."""
    return sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)


def load_all_tables(conn: sqlite3.Connection) -> dict[str, pd.DataFrame]:
    tables = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).fetchall()
    return {row[0]: pd.read_sql_query(f"SELECT * FROM [{row[0]}]", conn)
            for row in tables}


def truncate_traceback(tb: str, max_lines: int = 20) -> str:
    lines = tb.strip().splitlines()
    if len(lines) <= max_lines:
        return tb
    return f"... (truncated, showing last {max_lines} lines)\n" + "\n".join(lines[-max_lines:])


def serialize_result(value) -> dict | str | None:
    if value is None:
        return None
    if isinstance(value, pd.DataFrame):
        return {
            "type": "dataframe",
            "columns": list(value.columns),
            "data": value.head(2000).to_dict(orient="split"),
            "row_count": len(value),
        }
    if isinstance(value, (dict, list, str, int, float, bool)):
        try:
            json.dumps(value)
            return value
        except (TypeError, ValueError):
            return str(value)
    return {"type": "other", "value": str(value)}


def charts_to_base64() -> list[str]:
    """Save all open matplotlib figures to in-memory buffers and return as base64."""
    result: list[str] = []
    fig_nums = plt.get_fignums()
    if not fig_nums:
        return result
    log("rendering_charts", count=len(fig_nums))
    for fnum in fig_nums:
        fig = plt.figure(fnum)
        buf = io.BytesIO()
        fig.savefig(buf, format="png", dpi=100, bbox_inches="tight")
        buf.seek(0)
        result.append(base64.b64encode(buf.read()).decode("ascii"))
    plt.close("all")
    return result


# ── SQL execution ─────────────────────────────────────────────────────────────

def run_sql(code_file: str, dataset_path: str) -> None:
    with open(code_file, encoding="utf-8") as f:
        sql = f.read().strip()

    log("loading_data", path=dataset_path)
    conn = open_db(dataset_path)

    sql_upper = sql.upper().lstrip()
    if not (sql_upper.startswith("SELECT") or sql_upper.startswith("WITH")):
        emit_output({
            "type": "error",
            "error_type": "ValidationError",
            "message": "Only SELECT/WITH queries are allowed inside the sandbox.",
            "traceback": None,
        })
        log("failed", error="Non-SELECT query rejected at sandbox level")
        return

    log("executing")
    df = pd.read_sql_query(sql, conn)
    conn.close()

    max_rows = 5_000
    truncated = len(df) > max_rows
    if truncated:
        df = df.head(max_rows)

    emit_output({
        "type": "table",
        "columns": list(df.columns),
        "rows": df.values.tolist(),
        "row_count": len(df),
        "truncated": truncated,
    })
    log("runner_done")


# ── Python execution ──────────────────────────────────────────────────────────

def run_python(code_file: str, dataset_path: str) -> None:
    with open(code_file, encoding="utf-8") as f:
        code = f.read()

    log("loading_data", path=dataset_path)
    conn = open_db(dataset_path)
    dfs = load_all_tables(conn)
    df = next(iter(dfs.values())) if dfs else pd.DataFrame()
    log("loading_data", tables=list(dfs.keys()))

    namespace: dict = {
        "pd": pd, "np": np, "plt": plt, "sns": sns,
        "conn": conn, "dfs": dfs, "df": df,
        **dfs,
    }

    log("executing")

    # Capture user's print() output (redirect AFTER logging "executing")
    stdout_buf = io.StringIO()
    sys.stdout = stdout_buf
    exec_error: Exception | None = None
    try:
        exec(compile(code, "<user_code>", "exec"), namespace)  # noqa: S102
    except Exception as exc:
        exec_error = exc
    finally:
        sys.stdout = sys.__stdout__

    captured_stdout = stdout_buf.getvalue()
    conn.close()

    if exec_error is not None:
        tb = traceback.format_exc()
        emit_output({
            "type": "error",
            "error_type": type(exec_error).__name__,
            "message": str(exec_error),
            "traceback": truncate_traceback(tb),
        })
        log("failed", error=str(exec_error))
        return

    # Charts: encoded to base64 in memory — no tmpfs write needed
    charts = charts_to_base64()

    result_raw = namespace.get("result")
    summary = namespace.get("summary")
    if isinstance(summary, str):
        summary = summary[:2000]

    emit_output({
        "type": "python_result",
        "result": serialize_result(result_raw),
        "charts": charts,
        "summary": summary,
        "stdout": captured_stdout[:4000] if captured_stdout else None,
    })
    log("runner_done")


# ── Entrypoint ────────────────────────────────────────────────────────────────

def main() -> None:
    exec_type    = os.environ.get("EXEC_TYPE", "")
    dataset_path = os.environ.get("DATASET_PATH", "")
    code_file    = os.environ.get("CODE_FILE", "/code/code.py")

    log("started", exec_type=exec_type)

    try:
        if exec_type == "sql":
            run_sql(code_file, dataset_path)
        elif exec_type == "python":
            run_python(code_file, dataset_path)
        else:
            emit_output({
                "type": "error",
                "error_type": "ConfigError",
                "message": f"Unknown EXEC_TYPE: {exec_type!r}",
                "traceback": None,
            })
            log("failed", error=f"Unknown EXEC_TYPE: {exec_type!r}")
    except Exception as exc:
        tb = traceback.format_exc()
        emit_output({
            "type": "error",
            "error_type": type(exc).__name__,
            "message": str(exc),
            "traceback": truncate_traceback(tb),
        })
        log("failed", error=str(exc))
        sys.exit(1)


if __name__ == "__main__":
    main()
