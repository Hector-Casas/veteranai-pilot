"use client";

import { Calendar, CheckCircle, Loader2, Mail, Zap, XCircle } from "lucide-react";
import { useChatbotSession } from "@/lib/hooks/use-chatbot-session";
import ChatInterface from "./ChatInterface";

type ToolState = "input-streaming" | "input-available" | "output-available" | "output-error";

// Minimal shapes for each tool part we care about
type LeadEmailPart = {
  type: "tool-send_lead_email";
  state: ToolState;
  toolCallId: string;
  output?: { success: boolean; error?: string };
};

type CheckAvailabilityPart = {
  type: "tool-check_availability";
  state: ToolState;
  toolCallId: string;
  output?: { success: boolean; error?: string };
};

type BookMeetingPart = {
  type: "tool-book_meeting";
  state: ToolState;
  toolCallId: string;
  output?: { success: boolean; error?: string };
};

type AnyToolPart = LeadEmailPart | CheckAvailabilityPart | BookMeetingPart;

const KNOWN_TOOL_TYPES = new Set([
  "tool-send_lead_email",
  "tool-check_availability",
  "tool-book_meeting",
]);

function isKnownToolPart(p: unknown): p is AnyToolPart {
  return (
    typeof p === "object" &&
    p !== null &&
    KNOWN_TOOL_TYPES.has((p as { type?: string }).type ?? "")
  );
}

// ── Individual event row ───────────────────────────────────────────────────

type EventConfig = {
  pendingLabel: string;
  successLabel: string;
  errorLabel: string;
  icon: React.ReactNode;
};

const EVENT_CONFIG: Record<string, EventConfig> = {
  "tool-send_lead_email": {
    pendingLabel: "Sending notification to the team...",
    successLabel: "Email sent successfully",
    errorLabel: "Error sending email",
    icon: <Mail size={13} />,
  },
  "tool-check_availability": {
    pendingLabel: "Checking availability...",
    successLabel: "Availability retrieved",
    errorLabel: "Error checking calendar",
    icon: <Calendar size={13} />,
  },
  "tool-book_meeting": {
    pendingLabel: "Scheduling meeting...",
    successLabel: "Meeting scheduled successfully",
    errorLabel: "Error scheduling meeting",
    icon: <Calendar size={13} />,
  },
};

function ToolEventRow({ event }: { event: AnyToolPart }) {
  const config = EVENT_CONFIG[event.type];
  if (!config) return null;

  const isPending = event.state === "input-streaming" || event.state === "input-available";
  const isSuccess = event.state === "output-available" && event.output?.success === true;
  const isError =
    (event.state === "output-available" && event.output?.success === false) ||
    event.state === "output-error";

  return (
    <li
      key={event.toolCallId}
      className="chat-bubble flex items-start gap-3 rounded-xl p-3 text-xs"
      style={{
        backgroundColor: "var(--surface-hover)",
        border: "1px solid var(--border)",
      }}
    >
      <span className="mt-0.5 shrink-0">
        {isPending && (
          <Loader2 size={14} className="animate-spin" style={{ color: "var(--accent)" }} />
        )}
        {isSuccess && <CheckCircle size={14} style={{ color: "#22c55e" }} />}
        {isError && <XCircle size={14} style={{ color: "#ef4444" }} />}
      </span>
      <span style={{ color: "var(--foreground)" }}>
        <span className="flex items-center gap-1 mb-0.5" style={{ color: "var(--muted)" }}>
          {config.icon}
          <span className="uppercase tracking-wide" style={{ fontSize: "10px" }}>
            {event.type.replace("tool-", "").replace(/_/g, " ")}
          </span>
        </span>
        {isPending && config.pendingLabel}
        {isSuccess && config.successLabel}
        {isError && (
          <>
            {config.errorLabel}
            {event.output?.error && (
              <span className="block mt-0.5" style={{ color: "var(--muted)" }}>
                {event.output.error}
              </span>
            )}
          </>
        )}
      </span>
    </li>
  );
}

// ── Agent activity panel ───────────────────────────────────────────────────

function AgentActivityPanel({ events }: { events: AnyToolPart[] }) {
  if (events.length === 0) {
    return (
      <p className="text-xs italic" style={{ color: "var(--muted)" }}>
        No agent activity yet. Tool calls (email, calendar) will appear here in real time.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {events.map((event) => (
        <ToolEventRow key={event.toolCallId} event={event} />
      ))}
    </ul>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function ChatbotDemo() {
  const { messages, status, sendText } = useChatbotSession();

  // Collect known tool parts across all messages.
  // Cast is safe: isKnownToolPart validates the type string at runtime.
  const toolEvents = messages
    .flatMap((msg) => msg.parts)
    .filter(isKnownToolPart) as unknown as AnyToolPart[];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-6 lg:flex-row">
      {/* ── Chat area — 2/3 ──
          Height is viewport-based so it never expands the page.
          80px accounts for the page header (~52px) + ChatbotDemo's top padding (24px).
          max-h-[700px] prevents it from looking oversized on tall screens. */}
      <section
        className="flex flex-col overflow-hidden rounded-2xl"
        style={{
          height: "calc(100vh - 80px)",
          maxHeight: "700px",
          border: "1px solid var(--border)",
          backgroundColor: "var(--surface)",
        }}
      >
        <ChatInterface messages={messages} status={status} onSend={sendText} />
      </section>

      {/* ── Info panel — 1/3 ── */}
      <aside className="flex flex-col gap-5 lg:w-80 lg:shrink-0">
        {/* About */}
        <div
          className="rounded-2xl p-6"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <h2 className="mb-3 text-sm font-semibold text-foreground">About this demo</h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            This chatbot captures leads and schedules meetings conversationally — no
            forms needed. It connects to Cal.com for availability and Resend for email
            notifications.
          </p>
        </div>

        {/* Agent activity */}
        <div
          className="rounded-2xl p-6"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div className="mb-4 flex items-center gap-2">
            <Zap size={14} style={{ color: "var(--accent)" }} />
            <h2 className="text-sm font-semibold text-foreground">Agent activity</h2>
          </div>
          <AgentActivityPanel events={toolEvents} />
        </div>

        {/* Technology */}
        <div
          className="rounded-2xl p-6"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <h2 className="mb-4 text-sm font-semibold text-foreground">Technology</h2>
          <div className="flex flex-wrap gap-2">
            {[
              "Mistral Large 3",
              "Function Calling",
              "Cal.com API v2",
              "Resend",
              "Vercel AI SDK",
              "Next.js",
            ].map((tag) => (
              <span
                key={tag}
                className="rounded-full px-3 py-1 text-xs font-medium"
                style={{ backgroundColor: "var(--accent-dim)", color: "var(--accent)" }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Coming soon */}
        <div
          className="rounded-2xl p-6"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <h2 className="mb-3 text-sm font-semibold text-foreground">Coming soon</h2>
          <ul className="space-y-2">
            {[
              "Cancel / reschedule meetings",
              "Persistent conversation history",
              "Booking reminders via email",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-xs leading-relaxed"
                style={{ color: "var(--muted)" }}
              >
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
