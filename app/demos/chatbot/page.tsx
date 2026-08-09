import ChatbotBuilder from "@/components/chatbot-builder/ChatbotBuilder";

export const metadata = {
  title: "Chatbot Builder — Veteran AI",
  description:
    "Pick an industry and a set of capabilities to generate a live, interactive demo chatbot in seconds.",
};

export default function ChatbotPage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* ── Header ── */}
      <header
        className="flex items-center gap-4 border-b px-6 py-4"
        style={{ borderColor: "var(--border)" }}
      >
        <h1 className="text-sm font-semibold text-foreground">
          Chatbot Builder
        </h1>

        <span
          className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
          style={{ backgroundColor: "var(--accent-dim)", color: "var(--accent)" }}
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
          Live demo
        </span>
      </header>

      {/* ── Builder (client) ── */}
      <ChatbotBuilder />
    </div>
  );
}
