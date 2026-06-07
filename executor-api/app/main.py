"""
main.py — FastAPI application for the executor-api service.

Endpoints:
  GET  /health                  — liveness probe
  GET  /datasets                — list available dataset IDs
  POST /execute-sql/stream      — run SQL query, stream SSE events
  POST /execute-python/stream   — run Python code, stream SSE events
"""
from __future__ import annotations

import logging
import logging.config
import os

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse

from app.config import Settings, get_settings
from app.docker_runner import SandboxRunner
from app.events import event_to_sse
from app.models import ExecutePythonRequest, ExecuteSQLRequest
from app.validators import validate_python, validate_sql

# ── Logging (JSON-structured) ─────────────────────────────────────────────────

def _configure_logging(level: str) -> None:
    logging.config.dictConfig({
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "json": {
                "()": "logging.Formatter",
                "fmt": '{"time":"%(asctime)s","level":"%(levelname)s","name":"%(name)s","msg":%(message)s}',
                "datefmt": "%Y-%m-%dT%H:%M:%S",
            }
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "json",
            }
        },
        "root": {"handlers": ["console"], "level": level},
    })


settings = get_settings()
_configure_logging(settings.log_level)
logger = logging.getLogger(__name__)

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Analyst Executor API",
    version="1.0",
    description="Executes SQL / Python code in ephemeral Docker sandboxes.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

runner = SandboxRunner(settings)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error('"Unhandled exception: %s"', exc, exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0"}


@app.get("/datasets")
def list_datasets():
    return [
        {"id": k, "name": k.replace("-", " ").title()}
        for k in settings.datasets.keys()
    ]


@app.post("/execute-sql/stream")
async def execute_sql_stream(req: ExecuteSQLRequest):
    valid, reason = validate_sql(req.sql)
    if not valid:
        raise HTTPException(status_code=400, detail=f"Invalid SQL: {reason}")

    if req.dataset_id not in settings.datasets:
        raise HTTPException(status_code=400, detail=f"Unknown dataset: {req.dataset_id}")

    logger.info('"sql request" dataset="%s"', req.dataset_id)

    async def event_gen():
        async for event in runner.run("sql", req.sql, req.dataset_id):
            yield event_to_sse(event)

    return EventSourceResponse(event_gen())


@app.post("/execute-python/stream")
async def execute_python_stream(req: ExecutePythonRequest):
    valid, reason = validate_python(req.code)
    if not valid:
        raise HTTPException(status_code=400, detail=f"Invalid Python: {reason}")

    if req.dataset_id not in settings.datasets:
        raise HTTPException(status_code=400, detail=f"Unknown dataset: {req.dataset_id}")

    logger.info('"python request" dataset="%s"', req.dataset_id)

    async def event_gen():
        async for event in runner.run("python", req.code, req.dataset_id):
            yield event_to_sse(event)

    return EventSourceResponse(event_gen())
