/**
 * executor/client.ts
 * Server-side helpers that call the executor-api (FastAPI + ephemeral sandboxes).
 * Never imported by client components — only used in API routes and tool execute fns.
 */

const EXECUTOR_URL =
  process.env.EXECUTOR_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ExecutionEvent = {
  event: string;
  data?: unknown;
};

export type SQLResult =
  | { success: true; result: { columns: string[]; rows: unknown[][]; rowCount: number; truncated: boolean } }
  | { success: false; error: string };

export type PythonResult =
  | { success: true; result: { type: string; result: unknown; charts: string[]; summary?: string } }
  | { success: false; error: string };

// ── Internal SSE parser ───────────────────────────────────────────────────────

async function* parseSSE(response: Response): AsyncGenerator<ExecutionEvent> {
  if (!response.body) {
    yield { event: "failed", data: { error: "No response body from executor-api" } };
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let pendingEvent = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("event:")) {
          pendingEvent = trimmed.slice(6).trim();
        } else if (trimmed.startsWith("data:")) {
          const jsonStr = trimmed.slice(5).trim();
          try {
            const parsed = JSON.parse(jsonStr) as { event?: string; data?: unknown };
            yield {
              event: pendingEvent || parsed.event || "unknown",
              data: parsed.data,
            };
          } catch {
            // skip malformed line
          }
          pendingEvent = "";
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ── Streaming generators (for real-time progress, if needed) ─────────────────

export async function* streamExecuteSQL(
  datasetId: string,
  sql: string
): AsyncGenerator<ExecutionEvent> {
  try {
    const res = await fetch(`${EXECUTOR_URL}/execute-sql/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataset_id: datasetId, sql }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as Record<string, unknown>;
      const detail = body.detail;
      yield {
        event: "failed",
        data: { error: typeof detail === "string" ? detail : `HTTP ${res.status}` },
      };
      return;
    }

    yield* parseSSE(res);
  } catch (err) {
    yield {
      event: "failed",
      data: { error: err instanceof Error ? err.message : "Cannot reach executor-api" },
    };
  }
}

export async function* streamExecutePython(
  datasetId: string,
  code: string
): AsyncGenerator<ExecutionEvent> {
  try {
    const res = await fetch(`${EXECUTOR_URL}/execute-python/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataset_id: datasetId, code }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as Record<string, unknown>;
      const detail = body.detail;
      yield {
        event: "failed",
        data: { error: typeof detail === "string" ? detail : `HTTP ${res.status}` },
      };
      return;
    }

    yield* parseSSE(res);
  } catch (err) {
    yield {
      event: "failed",
      data: { error: err instanceof Error ? err.message : "Cannot reach executor-api" },
    };
  }
}

// ── Blocking helpers used by LLM tool execute() fns ──────────────────────────

export async function executeSQL(
  datasetId: string,
  sql: string
): Promise<SQLResult> {
  for await (const ev of streamExecuteSQL(datasetId, sql)) {
    if (ev.event === "completed" && ev.data) {
      const d = ev.data as {
        columns?: string[];
        rows?: unknown[][];
        row_count?: number;
        truncated?: boolean;
      };
      return {
        success: true,
        result: {
          columns: d.columns ?? [],
          rows: d.rows ?? [],
          rowCount: d.row_count ?? 0,
          truncated: d.truncated ?? false,
        },
      };
    }
    if (ev.event === "failed" && ev.data) {
      const d = ev.data as { error?: string };
      return { success: false, error: d.error ?? "Execution failed" };
    }
  }
  return { success: false, error: "Executor did not return a result" };
}

export async function executePython(
  datasetId: string,
  code: string
): Promise<PythonResult> {
  for await (const ev of streamExecutePython(datasetId, code)) {
    if (ev.event === "completed" && ev.data) {
      const d = ev.data as {
        type?: string;
        result?: unknown;
        charts?: string[];
        summary?: string;
      };
      return {
        success: true,
        result: {
          type: d.type ?? "python_result",
          result: d.result ?? null,
          charts: d.charts ?? [],
          summary: d.summary,
        },
      };
    }
    if (ev.event === "failed" && ev.data) {
      const d = ev.data as { error?: string; message?: string };
      return { success: false, error: d.error ?? d.message ?? "Execution failed" };
    }
  }
  return { success: false, error: "Executor did not return a result" };
}
