"""
validators.py — Defense-in-depth validators for SQL and Python user code.

These validators run BEFORE the sandbox container is launched to catch
obviously malicious or erroneous input early (saves the overhead of spinning
up a container).  The Docker sandbox with --network=none / --read-only /
--cap-drop=ALL is the primary security boundary.
"""
from __future__ import annotations

import ast
import re

# ── SQL ───────────────────────────────────────────────────────────────────────

# Keywords that signal writes or dangerous meta-operations
_SQL_BLOCKED = re.compile(
    r"\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|ATTACH|DETACH|VACUUM|REPLACE|TRUNCATE|MERGE)\b",
    re.IGNORECASE,
)

# PRAGMA is allowed only for read-only table inspection
_PRAGMA_ALLOWED = re.compile(r"^\s*PRAGMA\s+TABLE_INFO\s*\(", re.IGNORECASE)


def validate_sql(sql: str) -> tuple[bool, str | None]:
    """
    Returns (True, None) if the SQL passes, or (False, reason) if rejected.
    """
    stripped = sql.strip()
    upper = stripped.upper()

    # Must begin with SELECT or WITH
    if not (upper.startswith("SELECT") or upper.startswith("WITH")):
        return False, "Query must begin with SELECT or WITH"

    # WITH clause must contain a SELECT
    if upper.startswith("WITH") and "SELECT" not in upper:
        return False, "WITH clause must include a SELECT"

    # Block dangerous write/DDL keywords
    match = _SQL_BLOCKED.search(stripped)
    if match:
        return False, f"'{match.group().upper()}' is not allowed"

    # PRAGMA: only table_info permitted
    pragma_match = re.search(r"\bPRAGMA\b", stripped, re.IGNORECASE)
    if pragma_match:
        if not _PRAGMA_ALLOWED.search(stripped):
            return False, "Only PRAGMA table_info(...) is permitted"

    # No multiple statements (strip trailing semicolon first)
    no_strings = re.sub(r"'[^']*'", "''", stripped)  # remove string literals
    body = no_strings.rstrip("; \t\n")
    if ";" in body:
        return False, "Multiple statements are not allowed"

    return True, None


# ── Python ────────────────────────────────────────────────────────────────────

_ALLOWED_MODULES: set[str] = {
    "pandas", "numpy", "matplotlib", "matplotlib.pyplot",
    "seaborn", "sqlite3", "datetime", "json", "math",
    "statistics", "re", "collections", "itertools",
    "functools", "operator", "string", "typing",
}

_BLOCKED_BUILTINS: set[str] = {
    "os", "sys", "subprocess", "socket", "urllib", "requests",
    "__import__", "open", "eval", "exec", "compile",
    "globals", "locals", "vars", "getattr", "setattr", "delattr",
    "breakpoint", "__loader__", "__spec__",
}


def validate_python(code: str) -> tuple[bool, str | None]:
    """
    Returns (True, None) if the Python code passes static analysis,
    or (False, reason) if rejected.
    """
    try:
        tree = ast.parse(code, mode="exec")
    except SyntaxError as exc:
        return False, f"Syntax error: {exc}"

    for node in ast.walk(tree):
        # ── Import checks ────────────────────────────────────────────
        if isinstance(node, ast.Import):
            for alias in node.names:
                top = alias.name.split(".")[0]
                if not _is_allowed_module(alias.name):
                    return False, f"Importing '{alias.name}' is not allowed"
                if top in _BLOCKED_BUILTINS:
                    return False, f"Importing '{top}' is not allowed"

        elif isinstance(node, ast.ImportFrom):
            module = node.module or ""
            if not _is_allowed_module(module):
                return False, f"Importing from '{module}' is not allowed"

        # ── Dangerous built-in calls ─────────────────────────────────
        elif isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name):
                if node.func.id in _BLOCKED_BUILTINS:
                    return False, f"Use of '{node.func.id}' is not allowed"
            # Attribute calls like os.system (module import blocked above,
            # but guard against dynamic attribute lookup)
            elif isinstance(node.func, ast.Attribute):
                if node.func.attr in _BLOCKED_BUILTINS:
                    return False, f"Calling '.{node.func.attr}' is not allowed"

        # ── Dunder attribute access (escape via reflection) ──────────
        elif isinstance(node, ast.Attribute):
            if node.attr.startswith("__") and node.attr.endswith("__"):
                # Allow common safe dunders that appear in normal pandas/numpy code
                _safe_dunders = {"__len__", "__iter__", "__str__", "__repr__",
                                 "__getitem__", "__setitem__", "__contains__"}
                if node.attr not in _safe_dunders:
                    return False, f"Access to '{node.attr}' is not allowed"

        # ── Dunder variable names ────────────────────────────────────
        elif isinstance(node, ast.Name):
            if (node.id.startswith("__") and node.id.endswith("__")
                    and node.id not in {"__name__", "__doc__"}):
                return False, f"Access to '{node.id}' is not allowed"
            if node.id in _BLOCKED_BUILTINS and isinstance(getattr(node, "ctx", None), ast.Load):
                return False, f"Use of '{node.id}' is not allowed"

    return True, None


def _is_allowed_module(module: str) -> bool:
    """Check if a module (or any of its parents) is in the allow-list."""
    if module in _ALLOWED_MODULES:
        return True
    # Allow submodules like matplotlib.pyplot, pandas.core, etc.
    for allowed in _ALLOWED_MODULES:
        if module == allowed or module.startswith(allowed + "."):
            return True
    return False
