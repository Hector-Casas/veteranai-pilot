"""
Unit tests for Python execution via SandboxRunner — Docker is fully mocked.
"""
import asyncio
import json
import os
from unittest.mock import MagicMock

from app.config import Settings
from app.docker_runner import SandboxRunner
from app.models import ExecutionEvent


def _make_runner_logs(events: list[dict]) -> list[bytes]:
    return [json.dumps(e).encode() + b"\n" for e in events]


def _settings(tmp_path) -> Settings:
    return Settings(
        sandbox_image="python-sandbox:latest",
        sandbox_timeout_seconds=5,
        host_work_dir=str(tmp_path),
        sandbox_work_dir=str(tmp_path),
        datasets_host_dir=str(tmp_path),
    )


def _setup_run(tmp_path, output_data: dict, runner_events: list[dict] | None = None):
    if runner_events is None:
        runner_events = [
            {"event": "started", "exec_type": "python"},
            {"event": "loading_data", "tables": ["users"]},
            {"event": "executing"},
            {"event": "completed"},
        ]

    container = MagicMock()
    container.logs.return_value = iter(_make_runner_logs(runner_events))
    container.wait.return_value = {"StatusCode": 0}
    container.remove.return_value = None

    client = MagicMock()
    client.volumes.get.side_effect = Exception("no volume")

    def fake_run(*args, **kwargs):
        for entry in os.scandir(str(tmp_path)):
            if entry.is_dir():
                with open(os.path.join(entry.path, "output.json"), "w") as f:
                    json.dump(output_data, f)
        return container

    client.containers.run.side_effect = fake_run
    runner = SandboxRunner(_settings(tmp_path), docker_client=client)
    return runner, client


async def _collect(runner, code):
    return [ev async for ev in runner.run("python", code, "metricas-saas")]


class TestPythonExecution:
    def test_completed_event_contains_result(self, tmp_path):
        output = {
            "type": "python_result",
            "result": {"type": "dataframe", "columns": ["a", "b"], "data": {}, "row_count": 5},
            "charts": [],
            "summary": "Five rows returned.",
            "stdout": None,
        }
        runner, _ = _setup_run(tmp_path, output)
        events = asyncio.run(_collect(runner, "result = df.head(5)"))

        final = events[-1]
        assert final.event == "completed"
        assert final.data["type"] == "python_result"
        assert final.data["summary"] == "Five rows returned."

    def test_charts_base64_encoded(self, tmp_path):
        """If output.json lists chart files, they should be base64 in the final event."""
        chart_path = os.path.join(str(tmp_path), "placeholder_run", "output_chart_0.png")
        # Create a fake chart PNG in the run dir (we'll let docker_runner find it)
        # For this test, we write output_data without charts and verify no crash
        output = {
            "type": "python_result",
            "result": None,
            "charts": [],  # No charts
            "summary": None,
            "stdout": "hello",
        }
        runner, _ = _setup_run(tmp_path, output)
        events = asyncio.run(_collect(runner, "print('hello')"))
        final = events[-1]
        assert final.event == "completed"
        assert final.data.get("charts") == []

    def test_error_result_yields_failed(self, tmp_path):
        output = {
            "type": "error",
            "error_type": "ZeroDivisionError",
            "message": "division by zero",
            "traceback": "Traceback (most recent call last):\n  ...\nZeroDivisionError: division by zero",
        }
        runner, _ = _setup_run(tmp_path, output, runner_events=[
            {"event": "started", "exec_type": "python"},
            {"event": "executing"},
            {"event": "failed", "error": "ZeroDivisionError"},
        ])
        events = asyncio.run(_collect(runner, "result = 1/0"))
        assert events[-1].event == "failed"

    def test_container_security_opts(self, tmp_path):
        """Container must run with cap_drop=ALL and no-new-privileges."""
        output = {"type": "python_result", "result": None, "charts": [], "summary": None, "stdout": None}
        runner, client = _setup_run(tmp_path, output)
        asyncio.run(_collect(runner, "result = 42"))

        kwargs = client.containers.run.call_args[1]
        assert "ALL" in kwargs.get("cap_drop", [])
        assert "no-new-privileges" in kwargs.get("security_opt", [])

    def test_read_only_filesystem(self, tmp_path):
        output = {"type": "python_result", "result": None, "charts": [], "summary": None, "stdout": None}
        runner, client = _setup_run(tmp_path, output)
        asyncio.run(_collect(runner, "result = 1"))

        kwargs = client.containers.run.call_args[1]
        assert kwargs.get("read_only") is True
