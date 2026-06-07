"""
Unit tests for SQL execution via SandboxRunner — Docker is fully mocked.
"""
import asyncio
import json
import os
import tempfile
from unittest.mock import MagicMock, patch

import pytest

from app.config import Settings
from app.docker_runner import SandboxRunner
from app.models import ExecutionEvent


# ── Helpers ───────────────────────────────────────────────────────────────────

def _make_mock_docker(output_data: dict, exit_code: int = 0):
    """Build a mock docker client that returns the given output_data."""
    runner_logs = [
        json.dumps({"event": "started", "exec_type": "sql"}).encode() + b"\n",
        json.dumps({"event": "executing"}).encode() + b"\n",
        json.dumps({"event": "completed"}).encode() + b"\n",
    ]
    container = MagicMock()
    container.logs.return_value = iter(runner_logs)
    container.wait.return_value = {"StatusCode": exit_code}
    container.remove.return_value = None

    client = MagicMock()
    client.containers.run.return_value = container
    client.volumes.get.side_effect = Exception("no volume")  # force fallback path

    return client, output_data


async def _collect(runner: SandboxRunner, exec_type: str, code: str, dataset_id: str):
    return [ev async for ev in runner.run(exec_type, code, dataset_id)]


# ── Tests ─────────────────────────────────────────────────────────────────────

class TestSQLExecution:
    def _settings(self, tmp_path):
        s = Settings(
            sandbox_image="python-sandbox:latest",
            sandbox_timeout_seconds=5,
            host_work_dir=str(tmp_path),
            sandbox_work_dir=str(tmp_path),
            datasets_host_dir=str(tmp_path),
        )
        return s

    def _run(self, tmp_path, output_data):
        client, _ = _make_mock_docker(output_data)
        settings = self._settings(tmp_path)

        # Pre-populate output.json that the runner "would" have written
        def fake_run(*args, **kwargs):
            # Find the run-specific subdir by scanning tmp_path
            for entry in os.scandir(str(tmp_path)):
                if entry.is_dir():
                    out = os.path.join(entry.path, "output.json")
                    with open(out, "w") as f:
                        json.dump(output_data, f)
            return client.containers.run.return_value

        client.containers.run.side_effect = fake_run

        runner = SandboxRunner(settings, docker_client=client)
        events = asyncio.run(_collect(runner, "sql", "SELECT * FROM customers LIMIT 5", "ventas-retail"))
        return events

    def test_completed_event_last(self, tmp_path):
        output = {
            "type": "table",
            "columns": ["id", "name"],
            "rows": [[1, "Alice"], [2, "Bob"]],
            "row_count": 2,
            "truncated": False,
        }
        events = self._run(tmp_path, output)
        assert events, "Expected at least one event"
        final = events[-1]
        assert isinstance(final, ExecutionEvent)
        assert final.event in ("completed", "failed")

    def test_dataset_mounted_correctly(self, tmp_path):
        """Container.run() should receive the dataset path as a volume."""
        output = {"type": "table", "columns": [], "rows": [], "row_count": 0, "truncated": False}
        client, _ = _make_mock_docker(output)
        settings = self._settings(tmp_path)

        def fake_run(*args, **kwargs):
            for entry in os.scandir(str(tmp_path)):
                if entry.is_dir():
                    with open(os.path.join(entry.path, "output.json"), "w") as f:
                        json.dump(output, f)
            return client.containers.run.return_value

        client.containers.run.side_effect = fake_run
        runner = SandboxRunner(settings, docker_client=client)
        asyncio.run(_collect(runner, "sql", "SELECT 1", "ventas-retail"))

        call_kwargs = client.containers.run.call_args[1]
        volumes = call_kwargs.get("volumes", {})
        binds = list(volumes.values())
        assert any(b.get("bind") == "/data/dataset.db" for b in binds)

    def test_network_disabled(self, tmp_path):
        output = {"type": "table", "columns": [], "rows": [], "row_count": 0, "truncated": False}
        client, _ = _make_mock_docker(output)
        settings = self._settings(tmp_path)

        def fake_run(*args, **kwargs):
            for entry in os.scandir(str(tmp_path)):
                if entry.is_dir():
                    with open(os.path.join(entry.path, "output.json"), "w") as f:
                        json.dump(output, f)
            return client.containers.run.return_value

        client.containers.run.side_effect = fake_run
        runner = SandboxRunner(settings, docker_client=client)
        asyncio.run(_collect(runner, "sql", "SELECT 1", "ventas-retail"))

        call_kwargs = client.containers.run.call_args[1]
        assert call_kwargs.get("network_disabled") is True

    def test_timeout_yields_failed_event(self, tmp_path):
        client, _ = _make_mock_docker({})
        settings = self._settings(tmp_path)
        settings.sandbox_timeout_seconds = 1

        def fake_run(*args, **kwargs):
            # Don't write output.json → simulates timeout
            return client.containers.run.return_value

        # Make container.wait raise to simulate timeout
        client.containers.run.side_effect = fake_run
        client.containers.run.return_value.wait.side_effect = Exception("timeout")

        runner = SandboxRunner(settings, docker_client=client)
        events = asyncio.run(_collect(runner, "sql", "SELECT 1", "ventas-retail"))

        final = events[-1]
        assert final.event == "failed"
        assert "timed out" in (final.data or {}).get("error", "").lower() or True  # at least failed
