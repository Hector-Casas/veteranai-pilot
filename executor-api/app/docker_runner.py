"""
docker_runner.py — Launches ephemeral sandbox containers via docker-py,
streams structured log events, and captures the analysis result.

Result transport
────────────────
runner.py emits the final result as a JSON line on stdout:
    {"event": "output", "payload": {...}}

executor-api captures this from the Docker log stream WHILE the container
is still running — no filesystem access after exit is needed. This sidesteps
the tmpfs-destroyed-on-exit problem and works identically on all platforms.

Code injection
──────────────
The user's code is written to a subdirectory of the shared named volume
(/sandbox-work/{run_id}/code.ext) and bind-mounted read-only into the
sandbox as /code/code.ext.  We inspect the named volume's Mountpoint to
obtain the Docker-host-side path for the bind mount.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import shutil
import socket
import threading
import uuid
from pathlib import Path
from typing import AsyncIterator

import docker
import docker.errors

from app.config import Settings
from app.events import make_event
from app.models import ExecutionEvent

logger = logging.getLogger(__name__)


class SandboxRunner:
    def __init__(self, settings: Settings, docker_client=None):
        self.settings = settings
        self._docker_client = docker_client

    @property
    def client(self):
        if self._docker_client is None:
            self._docker_client = docker.from_env()
        return self._docker_client

    # ── Public async interface ─────────────────────────────────────────

    async def run(
        self,
        exec_type: str,
        code: str,
        dataset_id: str,
    ) -> AsyncIterator[ExecutionEvent]:
        loop = asyncio.get_event_loop()
        queue: asyncio.Queue[ExecutionEvent | object] = asyncio.Queue()
        _DONE = object()

        def _thread_run():
            try:
                self._run_blocking(exec_type, code, dataset_id, queue, loop)
            except Exception as exc:
                loop.call_soon_threadsafe(
                    queue.put_nowait,
                    make_event("failed", {"error": str(exc)}),
                )
            finally:
                loop.call_soon_threadsafe(queue.put_nowait, _DONE)

        threading.Thread(target=_thread_run, daemon=True).start()

        while True:
            item = await queue.get()
            if item is _DONE:
                break
            yield item  # type: ignore[misc]

    # ── Blocking implementation ────────────────────────────────────────

    def _emit(self, queue, loop, name: str, data: dict | None = None) -> None:
        loop.call_soon_threadsafe(queue.put_nowait, make_event(name, data))

    def _run_blocking(
        self,
        exec_type: str,
        code: str,
        dataset_id: str,
        queue: asyncio.Queue,
        loop: asyncio.AbstractEventLoop,
    ) -> None:
        emit = lambda name, data=None: self._emit(queue, loop, name, data)

        run_id = uuid.uuid4().hex[:12]
        code_dir_local, code_dir_host = self._resolve_code_dirs(run_id)
        container = None

        try:
            # Write code file into the shared named volume
            ext = "py" if exec_type == "python" else "sql"
            code_filename = f"code.{ext}"
            os.makedirs(code_dir_local, exist_ok=True)
            Path(os.path.join(code_dir_local, code_filename)).write_text(
                code, encoding="utf-8"
            )

            emit("started", {"exec_type": exec_type, "run_id": run_id})

            dataset_host_path = self._resolve_dataset_host_path(dataset_id)

            emit("launching_sandbox")
            container = self.client.containers.run(
                image=self.settings.sandbox_image,
                detach=True,
                network_mode="none",   # CRITICAL: no network
                read_only=True,        # root FS read-only
                tmpfs={
                    "/work": "size=128m,mode=1777,uid=1000,gid=1000",
                    "/tmp":  "size=64m,mode=1777,uid=1000,gid=1000",
                },
                volumes={
                    dataset_host_path: {"bind": "/data/dataset.db", "mode": "ro"},
                    os.path.join(code_dir_host, code_filename): {
                        "bind": f"/code/{code_filename}",
                        "mode": "ro",
                    },
                },
                environment={
                    "EXEC_TYPE":    exec_type,
                    "DATASET_PATH": "/data/dataset.db",
                    "CODE_FILE":    f"/code/{code_filename}",
                    # OUTPUT_FILE / OUTPUT_DIR kept for reference but not read back
                    "OUTPUT_FILE":  "/work/output.json",
                    "OUTPUT_DIR":   "/work",
                    "MPLCONFIGDIR": "/tmp/matplotlib",
                    "HOME":         "/tmp",
                },
                mem_limit=self.settings.sandbox_memory_limit,
                nano_cpus=int(self.settings.sandbox_cpu_limit * 1_000_000_000),
                pids_limit=self.settings.sandbox_pids_limit,
                user="1000:1000",
                security_opt=["no-new-privileges"],
                cap_drop=["ALL"],
                working_dir="/work",
            )

            # ── Phase 1: stream logs for real-time progress events ────────────
            # Large "output" lines (charts in base64) may fail JSON parsing
            # in the streaming phase due to Docker log-frame splitting; we
            # capture them opportunistically and fall back to full-log scan.
            result_payload: dict | None = None

            for raw_chunk in container.logs(stream=True, follow=True):
                for line in self._split_log_chunk(raw_chunk):
                    obj = self._try_parse_json(line)
                    if obj is None:
                        continue
                    event_name = obj.get("event", "log")
                    if event_name == "output":
                        result_payload = obj.get("payload")
                    elif event_name not in ("runner_done",):
                        forwarded = {k: v for k, v in obj.items() if k != "event"}
                        emit(event_name, forwarded or None)

            # ── Wait for container exit (with timeout) ────────────────────────
            try:
                wait_result = container.wait(
                    timeout=self.settings.sandbox_timeout_seconds
                )
                exit_code = wait_result.get("StatusCode", -1)
            except Exception:
                container.kill()
                emit("failed", {
                    "error": "Execution timed out",
                    "timeout_seconds": self.settings.sandbox_timeout_seconds,
                })
                return

            # ── Phase 2: fallback — re-read full logs if output wasn't found ──
            # container.logs(stream=False) demultiplexes all frames at once,
            # reliably returning complete lines regardless of frame size.
            if result_payload is None:
                result_payload = self._extract_output_from_full_logs(container)

            if result_payload is None:
                emit("failed", {
                    "error": "Sandbox produced no output",
                    "exit_code": exit_code,
                })
                return

            if result_payload.get("type") == "error":
                emit("failed", result_payload)
            else:
                emit("completed", result_payload)

        except docker.errors.ImageNotFound:
            emit("failed", {
                "error": (
                    f"Sandbox image '{self.settings.sandbox_image}' not found. "
                    f"Run: docker build -t {self.settings.sandbox_image} ./python-sandbox"
                )
            })
        except Exception as exc:
            logger.exception("Unexpected error in sandbox runner")
            emit("failed", {"error": str(exc)})
        finally:
            if container is not None:
                try:
                    container.remove(force=True)
                except Exception:
                    pass
            self._cleanup_code_dir(code_dir_local)

    # ── Log parsing helpers ────────────────────────────────────────────

    @staticmethod
    def _split_log_chunk(raw_chunk: bytes) -> list[str]:
        """
        Split a raw Docker log chunk into decoded text lines.
        Docker may concatenate multiple newline-terminated log lines in one
        chunk; this ensures we process each line independently.
        """
        decoded = raw_chunk.decode("utf-8", errors="replace")
        return [ln.strip() for ln in decoded.split("\n") if ln.strip()]

    @staticmethod
    def _try_parse_json(line: str) -> dict | None:
        """
        Parse a log line as JSON, handling leading Docker stream-header bytes
        that docker-py may not strip for large log frames.
        Returns the parsed dict, or None if parsing fails.
        """
        try:
            obj = json.loads(line)
            return obj if isinstance(obj, dict) else None
        except json.JSONDecodeError:
            pass

        # Fallback: Docker stream headers (\x01\x00\x00\x00...) decoded
        # to UTF-8 may prefix the JSON.  Skip to the first '{'.
        brace = line.find("{")
        if brace > 0:
            try:
                obj = json.loads(line[brace:])
                return obj if isinstance(obj, dict) else None
            except json.JSONDecodeError:
                pass

        return None

    def _extract_output_from_full_logs(self, container) -> dict | None:
        """
        Re-read the complete container logs (non-streaming) to find the
        'output' event.  This reliably handles log lines that were too large
        to parse correctly during the streaming phase.
        """
        try:
            all_bytes: bytes = container.logs(stream=False, stdout=True, stderr=False)
        except Exception as exc:
            logger.warning("Full-log fallback failed: %s", exc)
            return None

        for raw_line in all_bytes.split(b"\n"):
            obj = self._try_parse_json(raw_line.decode("utf-8", errors="replace").strip())
            if obj and obj.get("event") == "output":
                return obj.get("payload")

        return None

    # ── Path resolution ────────────────────────────────────────────────

    def _resolve_code_dirs(self, run_id: str) -> tuple[str, str]:
        """
        Returns (local_path, host_path) for the code directory.
        local_path: accessible inside executor-api container (via named volume mount)
        host_path:  what Docker uses as bind-mount source for sandbox containers
        """
        local_base = self.settings.sandbox_work_dir  # /sandbox-work in executor-api

        try:
            vol = self.client.volumes.get(self.settings.sandbox_work_volume)
            host_base = vol.attrs["Mountpoint"]
        except Exception:
            # Local dev: executor-api runs directly on the host; same path both sides
            host_base = self.settings.host_work_dir
            local_base = self.settings.host_work_dir

        return (
            os.path.join(local_base, run_id),
            os.path.join(host_base, run_id),
        )

    def _resolve_dataset_host_path(self, dataset_id: str) -> str:
        """Get the Docker-host-side path for a dataset file via container self-inspection."""
        filename = os.path.basename(
            self.settings.datasets.get(dataset_id, f"{dataset_id}.db")
        )
        try:
            hostname = socket.gethostname()
            my_container = self.client.containers.get(hostname)
            for mount in my_container.attrs.get("Mounts", []):
                if mount.get("Destination") == "/data":
                    return os.path.join(mount["Source"], filename)
        except Exception:
            pass
        return os.path.join(self.settings.datasets_host_dir, filename)

    def _cleanup_code_dir(self, code_dir: str) -> None:
        try:
            if os.path.exists(code_dir):
                shutil.rmtree(code_dir, ignore_errors=True)
        except Exception:
            pass
