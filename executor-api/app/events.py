"""
events.py — Helpers for constructing ExecutionEvent objects and converting
them to the dict format expected by sse-starlette's EventSourceResponse.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.models import ExecutionEvent


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def make_event(name: str, data: dict[str, Any] | None = None) -> ExecutionEvent:
    return ExecutionEvent(event=name, timestamp=now_iso(), data=data)


def event_to_sse(event: ExecutionEvent) -> dict:
    """Convert an ExecutionEvent to the format sse-starlette accepts."""
    return {
        "event": event.event,
        "data": event.model_dump_json(),
    }
