from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

DatasetId = Literal["ventas-retail", "metricas-saas", "recursos-humanos"]


class ExecuteSQLRequest(BaseModel):
    dataset_id: DatasetId
    sql: str = Field(min_length=1, max_length=10_000)


class ExecutePythonRequest(BaseModel):
    dataset_id: DatasetId
    code: str = Field(min_length=1, max_length=20_000)


class ExecutionEvent(BaseModel):
    event: str
    timestamp: str
    data: dict[str, Any] | None = None


class TableResult(BaseModel):
    type: Literal["table"]
    columns: list[str]
    rows: list[list]
    row_count: int
    truncated: bool


class PythonResult(BaseModel):
    type: Literal["python_result"]
    result: dict | str | None
    charts: list[str]   # base64-encoded PNG strings
    summary: str | None
    stdout: str | None


class ExecutionError(BaseModel):
    type: Literal["error"]
    error_type: str
    message: str
    traceback: str | None
