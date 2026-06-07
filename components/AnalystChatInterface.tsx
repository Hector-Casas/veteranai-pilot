"use client";

import { DefaultChatTransport, isTextUIPart } from "ai";
import { useChat } from "@ai-sdk/react";
import {
  BarChart3,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Code2,
  Download,
  Loader2,
  Send,
  Sparkles,
  XCircle,
  Zap,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import DataTable from "./DataTable";
import { downloadCSV, downloadPNG, rowsToCSV } from "@/lib/utils/export";

// ── Types ─────────────────────────────────────────────────────────────────────

type ToolState =
  | "input-streaming"
  | "input-available"
  | "output-available"
  | "output-error";

type QueryDataOutput = {
  success: boolean;
  sql?: string;
  purpose?: string;
  columns?: string[];
  rows?: unknown[][];
  rowCount?: number;
  truncated?: boolean;
  error?: string;
};

type GenerateChartOutput = {
  success: boolean;
  code?: string;
  purpose?: string;
  result?: unknown;
  charts?: string[];
  summary?: string | null;
  error?: string;
};

type ToolPart = {
  type: "tool-query_data" | "tool-generate_chart";
  state: ToolState;
  toolCallId: string;
  input?: { sql?: string; code?: string; purpose?: string };
  output?: QueryDataOutput | GenerateChartOutput;
};

type Props = {
  datasetId: string;
  suggestedQuestions: string[];
};

// ── Activity helpers ──────────────────────────────────────────────────────────

function toolLabel(part: ToolPart): string {
  const isQuery = part.type === "tool-query_data";
  const out = part.output as { success?: boolean } | undefined;
  if (part.state === "input-streaming")
    return isQuery ? "Generando consulta SQL..." : "Generando código Python...";
  if (part.state === "input-available")
    return isQuery ? "Ejecutando query..." : "Ejecutando análisis...";
  if (part.state === "output-error")
    return isQuery ? "Error en la query" : "Error en el análisis";
  if (part.state === "output-available") {
    if (!out?.success) return isQuery ? "Error en la query" : "Error en el análisis";
    return isQuery ? "Resultado recibido" : "Análisis completado";
  }
  return part.type;
}

function toolIcon(part: ToolPart) {
  const out = part.output as { success?: boolean } | undefined;
  const isPending = part.state === "input-streaming" || part.state === "input-available";
  const isError =
    part.state === "output-error" ||
    (part.state === "output-available" && !out?.success);
  const isOk = part.state === "output-available" && out?.success;
  if (isPending) return <Loader2 size={13} className="animate-spin" style={{ color: "var(--accent)" }} />;
  if (isOk) return <CheckCircle size={13} style={{ color: "#22c55e" }} />;
  if (isError) return <XCircle size={13} style={{ color: "#ef4444" }} />;
  return <Zap size={13} style={{ color: "var(--muted)" }} />;
}

// ── Code expander ─────────────────────────────────────────────────────────────

function CodeExpander({ label, code }: { label: string; code: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs transition-opacity hover:opacity-70"
        style={{ color: "var(--muted)" }}
      >
        <Code2 size={11} />
        {open ? "Ocultar código" : label}
        {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>
      {open && (
        <pre
          className="mt-2 overflow-x-auto rounded-lg p-3 text-xs leading-relaxed"
          style={{
            backgroundColor: "var(--surface-hover)",
            border: "1px solid var(--border)",
            color: "var(--muted)",
            fontFamily: "var(--font-mono, monospace)",
          }}
        >
          {code}
        </pre>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AnalystChatInterface({ datasetId, suggestedQuestions }: Props) {
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/analyze", body: { datasetId } }),
    [datasetId]
  );

  const { messages, sendMessage, status } = useChat({
    transport,
    onError: (err) => console.error("[AnalystChat]", err),
  });

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const atBottomRef = useRef(true);

  const isLoading = status === "submitted" || status === "streaming";

  // ── Bug 1 fix: pure memos derived from messages ───────────────────────────
  // Find the last successful tool result, scanning backwards through all messages.
  const lastExportableResult = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role !== "assistant") continue;
      for (let j = msg.parts.length - 1; j >= 0; j--) {
        const part = msg.parts[j] as {
          type?: string;
          state?: string;
          toolCallId?: string;
          output?: { success?: boolean };
        };
        if (
          (part.type === "tool-query_data" || part.type === "tool-generate_chart") &&
          part.state === "output-available" &&
          part.output?.success === true
        ) {
          return {
            toolCallId: part.toolCallId ?? "",
            type: part.type as "tool-query_data" | "tool-generate_chart",
          };
        }
      }
    }
    return null;
  }, [messages]);

  // Did the user (in any recent message) ask to export?
  const userRequestedExport = useMemo(() => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUserMsg) return false;
    const text = lastUserMsg.parts
      .filter(isTextUIPart)
      .map((p) => p.text)
      .join(" ")
      .toLowerCase();
    return /\b(exporta|exportar|descarga|descargar|guarda|guardar|csv|png|excel|bajame|dame el)\b/.test(text);
  }, [messages]);

  // Activity panel — last 5 unique tool invocations
  const recentTools = useMemo(() => {
    const all = messages
      .flatMap((m) => m.parts)
      .filter(
        (p) =>
          (p as { type?: string }).type === "tool-query_data" ||
          (p as { type?: string }).type === "tool-generate_chart"
      ) as unknown as ToolPart[];
    const byId = new Map<string, ToolPart>();
    for (const p of all) byId.set(p.toolCallId, p);
    return [...byId.values()].slice(-5);
  }, [messages]);

  // ── Bug 2 fix: scroll the container directly, never scrollIntoView ────────
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !atBottomRef.current) return;
    // Direct scrollTop mutation — stays inside the container, never touches document
    container.scrollTop = container.scrollHeight;
  }, [messages, status]);

  // Textarea auto-resize
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [input]);

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isLoading) return;
    setInput("");
    atBottomRef.current = true;
    await sendMessage({ text: msg });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Export handler (per-part) ─────────────────────────────────────────────
  const handleExportPart = useCallback((part: ToolPart) => {
    if (part.type === "tool-query_data") {
      const out = part.output as QueryDataOutput;
      if (out.columns && out.rows)
        downloadCSV(rowsToCSV(out.columns, out.rows), "resultado.csv");
    } else {
      const out = part.output as GenerateChartOutput;
      const chart = out.charts?.[0];
      if (chart) downloadPNG(chart, "grafica.png");
    }
  }, []);

  // ── Tool result renderer ──────────────────────────────────────────────────
  const renderToolPart = (part: ToolPart) => {
    const isQuery = part.type === "tool-query_data";
    const isPending = part.state === "input-streaming" || part.state === "input-available";

    // Bug 1: show export button inline, exactly when this IS the last exportable result
    const showExport =
      userRequestedExport &&
      lastExportableResult?.toolCallId === part.toolCallId &&
      part.state === "output-available" &&
      (part.output as { success?: boolean })?.success === true;

    if (isPending) {
      return (
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-3 text-xs"
          style={{ backgroundColor: "var(--surface-hover)", border: "1px solid var(--border)" }}
        >
          <Loader2 size={13} className="animate-spin shrink-0" style={{ color: "var(--accent)" }} />
          <span style={{ color: "var(--muted)" }}>
            {isQuery
              ? `Ejecutando: ${part.input?.purpose ?? "consulta SQL..."}`
              : `Analizando: ${part.input?.purpose ?? "código Python..."}`}
          </span>
        </div>
      );
    }

    if (part.state === "output-error") {
      return (
        <div
          className="rounded-xl px-4 py-3 text-xs"
          style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <span style={{ color: "#ef4444" }}>No pude obtener resultados en este momento.</span>
        </div>
      );
    }

    if (part.state === "output-available") {
      if (isQuery) {
        const out = part.output as QueryDataOutput;
        if (!out.success) {
          return (
            <div
              className="rounded-xl px-4 py-3 text-xs"
              style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <p style={{ color: "#ef4444" }}>Error en la consulta: {out.error}</p>
              {out.sql && <CodeExpander label="Ver SQL que falló" code={out.sql} />}
            </div>
          );
        }
        return (
          <div className="space-y-2">
            {out.purpose && (
              <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>{out.purpose}</p>
            )}
            {out.columns && out.rows && (
              <DataTable
                columns={out.columns}
                rows={out.rows}
                rowCount={out.rowCount ?? out.rows.length}
                truncated={out.truncated}
              />
            )}
            {out.sql && <CodeExpander label="Ver SQL generado" code={out.sql} />}
            {showExport && (
              <button
                onClick={() => handleExportPart(part)}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
                style={{ backgroundColor: "var(--accent-dim)", color: "var(--accent)" }}
              >
                <Download size={12} /> Descargar CSV
              </button>
            )}
          </div>
        );
      } else {
        const out = part.output as GenerateChartOutput;
        if (!out.success) {
          return (
            <div
              className="rounded-xl px-4 py-3 text-xs"
              style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <p style={{ color: "#ef4444" }}>Error en el análisis: {out.error}</p>
              {out.code && <CodeExpander label="Ver código que falló" code={out.code} />}
            </div>
          );
        }
        return (
          <div className="space-y-3">
            {out.purpose && (
              <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>{out.purpose}</p>
            )}
            {out.charts?.map((chart, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={`data:image/png;base64,${chart}`}
                alt={`Gráfica ${i + 1}`}
                className="w-full rounded-xl"
                style={{ border: "1px solid var(--border)" }}
              />
            ))}
            {out.summary && (
              <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{out.summary}</p>
            )}
            {out.code && <CodeExpander label="Ver código Python generado" code={out.code} />}
            {showExport && (
              <button
                onClick={() => handleExportPart(part)}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
                style={{ backgroundColor: "var(--accent-dim)", color: "var(--accent)" }}
              >
                <Download size={12} /> Descargar PNG
              </button>
            )}
          </div>
        );
      }
    }

    return null;
  };

  // ── Layout ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col">
      {/* Activity panel */}
      {recentTools.length > 0 && (
        <div
          className="shrink-0 space-y-1 border-b px-4 py-3"
          style={{ borderColor: "var(--border)" }}
        >
          <p
            className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--muted)" }}
          >
            <Zap size={11} style={{ color: "var(--accent)" }} />
            Actividad del agente
          </p>
          {recentTools.map((part) => (
            <div key={part.toolCallId} className="flex items-center gap-2 text-xs">
              {toolIcon(part)}
              <span style={{ color: "var(--foreground)" }}>{toolLabel(part)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Messages — Bug 2: scrollRef container, height constrained by parent */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex flex-1 flex-col gap-4 overflow-y-auto p-4"
      >
        {/* Empty state with suggestion chips */}
        {messages.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
            <BarChart3 size={36} strokeWidth={1.25} style={{ color: "var(--muted)", opacity: 0.35 }} />
            <div>
              <p className="mb-1 text-sm font-medium text-foreground">
                ¿Qué quieres analizar?
              </p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                Escribe una pregunta o elige una sugerencia para empezar
              </p>
            </div>

            {/* Bug 3 fix: suggestion chips with clear button affordances */}
            <div className="flex flex-col items-center gap-2">
              <p className="flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
                <Sparkles size={11} style={{ color: "var(--accent)" }} />
                Sugerencias para empezar
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    disabled={isLoading}
                    className="suggestion-chip rounded-full px-4 py-2 text-xs leading-snug transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      // Stagger the fade-in animation
                      animationDelay: `${i * 60}ms`,
                      border: "1px solid rgba(255,255,255,0.12)",
                      backgroundColor: "rgba(255,255,255,0.04)",
                      color: "rgba(255,255,255,0.75)",
                      cursor: "pointer",
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((message) => {
          const isUser = message.role === "user";
          const textParts = message.parts.filter(isTextUIPart);
          const toolParts = message.parts.filter(
            (p) =>
              (p as { type?: string }).type === "tool-query_data" ||
              (p as { type?: string }).type === "tool-generate_chart"
          ) as unknown as ToolPart[];

          return (
            <div key={message.id} className="flex flex-col gap-3">
              {textParts.length > 0 && (
                <div className={`chat-bubble flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      isUser ? "rounded-br-sm" : "rounded-bl-sm"
                    }`}
                    style={
                      isUser
                        ? { backgroundColor: "var(--accent)", color: "var(--background)" }
                        : {
                            backgroundColor: "var(--surface-hover)",
                            border: "1px solid var(--border)",
                            color: "var(--foreground)",
                          }
                    }
                  >
                    {textParts.map((part, i) => (
                      <p key={i} className="whitespace-pre-wrap">{part.text}</p>
                    ))}
                  </div>
                </div>
              )}

              {toolParts.map((part) => (
                <div key={part.toolCallId} className="chat-bubble">
                  {renderToolPart(part)}
                </div>
              ))}
            </div>
          );
        })}

        {status === "submitted" && (
          <div className="flex justify-start">
            <div
              className="rounded-2xl rounded-bl-sm px-4 py-3"
              style={{ backgroundColor: "var(--surface-hover)", border: "1px solid var(--border)" }}
            >
              <span className="typing-dots" aria-label="Analizando...">
                <span /><span /><span />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 p-3" style={{ borderTop: "1px solid var(--border)" }}>
        <div
          className="flex items-end gap-2 rounded-xl p-3"
          style={{ backgroundColor: "var(--surface-hover)", border: "1px solid var(--border)" }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pregunta algo sobre los datos..."
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:opacity-40 disabled:opacity-50"
            style={{ color: "var(--foreground)" }}
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-opacity disabled:opacity-30 hover:opacity-80"
            style={{ backgroundColor: "var(--accent)", color: "var(--background)" }}
            aria-label="Enviar"
          >
            <Send size={14} strokeWidth={2} />
          </button>
        </div>
        <p className="mt-1.5 text-center text-xs" style={{ color: "var(--muted)" }}>
          Enter para enviar · Shift+Enter nueva línea
        </p>
      </div>
    </div>
  );
}
