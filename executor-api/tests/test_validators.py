"""Unit tests for app/validators.py — no Docker required."""
import pytest
from app.validators import validate_sql, validate_python


# ── SQL validator ─────────────────────────────────────────────────────────────

class TestValidateSQL:
    def test_simple_select_passes(self):
        ok, reason = validate_sql("SELECT * FROM customers LIMIT 5")
        assert ok is True
        assert reason is None

    def test_select_with_where_passes(self):
        ok, _ = validate_sql("SELECT id, name FROM orders WHERE status = 'completed'")
        assert ok is True

    def test_with_cte_passes(self):
        sql = "WITH cte AS (SELECT id FROM customers) SELECT * FROM cte"
        ok, _ = validate_sql(sql)
        assert ok is True

    def test_lowercase_select_passes(self):
        ok, _ = validate_sql("select * from products")
        assert ok is True

    def test_insert_rejected(self):
        ok, reason = validate_sql("INSERT INTO customers VALUES (1, 'x', 'y')")
        assert ok is False
        assert "INSERT" in reason

    def test_update_rejected(self):
        ok, reason = validate_sql("UPDATE customers SET name='evil'")
        assert ok is False

    def test_delete_rejected(self):
        ok, reason = validate_sql("DELETE FROM customers")
        assert ok is False

    def test_drop_rejected(self):
        ok, reason = validate_sql("DROP TABLE customers")
        assert ok is False

    def test_create_rejected(self):
        ok, reason = validate_sql("CREATE TABLE x (id INT)")
        assert ok is False

    def test_attach_rejected(self):
        ok, reason = validate_sql("ATTACH DATABASE '/etc/passwd' AS hack")
        assert ok is False

    def test_with_no_select_rejected(self):
        ok, reason = validate_sql("WITH x AS (INSERT INTO y VALUES (1)) SELECT 1")
        assert ok is False

    def test_multiple_statements_rejected(self):
        ok, reason = validate_sql("SELECT 1; DROP TABLE customers")
        assert ok is False

    def test_pragma_table_info_passes(self):
        ok, _ = validate_sql("PRAGMA table_info(customers)")
        assert ok is True

    def test_pragma_other_rejected(self):
        ok, reason = validate_sql("PRAGMA schema_version")
        assert ok is False

    def test_empty_rejected(self):
        ok, _ = validate_sql("")
        assert ok is False

    def test_trailing_semicolon_ok(self):
        ok, _ = validate_sql("SELECT * FROM customers;")
        assert ok is True


# ── Python validator ──────────────────────────────────────────────────────────

class TestValidatePython:
    def test_pandas_groupby_passes(self):
        code = "result = df.groupby('status')['total_amount'].sum()"
        ok, reason = validate_python(code)
        assert ok is True, reason

    def test_matplotlib_chart_passes(self):
        code = (
            "import matplotlib.pyplot as plt\n"
            "plt.figure()\n"
            "plt.plot([1,2,3])\n"
        )
        ok, reason = validate_python(code)
        assert ok is True, reason

    def test_seaborn_import_passes(self):
        code = "import seaborn as sns\nresult = sns.__version__"
        ok, reason = validate_python(code)
        assert ok is True, reason

    def test_numpy_passes(self):
        code = "import numpy as np\nresult = np.mean([1,2,3])"
        ok, reason = validate_python(code)
        assert ok is True, reason

    def test_os_import_rejected(self):
        ok, reason = validate_python("import os")
        assert ok is False
        assert "os" in reason

    def test_sys_import_rejected(self):
        ok, reason = validate_python("import sys")
        assert ok is False

    def test_subprocess_rejected(self):
        ok, reason = validate_python("import subprocess")
        assert ok is False

    def test_socket_rejected(self):
        ok, reason = validate_python("import socket")
        assert ok is False

    def test_open_call_rejected(self):
        ok, reason = validate_python("open('/etc/passwd')")
        assert ok is False
        assert "open" in reason

    def test_eval_rejected(self):
        ok, reason = validate_python("eval('1+1')")
        assert ok is False

    def test_exec_rejected(self):
        ok, reason = validate_python("exec('import os')")
        assert ok is False

    def test_dunder_class_rejected(self):
        ok, reason = validate_python("x = (1).__class__.__bases__")
        assert ok is False

    def test_builtins_access_rejected(self):
        ok, reason = validate_python("x = __builtins__")
        assert ok is False

    def test_syntax_error_rejected(self):
        ok, reason = validate_python("def broken(")
        assert ok is False
        assert "Syntax error" in reason

    def test_getattr_rejected(self):
        ok, reason = validate_python("getattr(df, 'to_csv')")
        assert ok is False
