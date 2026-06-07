import Link from "next/link";
import ChatbotDemo from "@/components/ChatbotDemo";

export const metadata = {
  title: "Customer Support Chatbot — Veteran AI",
  description:
    "Live demo: AI assistant that answers questions about Veteran AI services and captures leads via email.",
};

export default function ChatbotPage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* ── Header ── */}
      <header
        className="flex items-center gap-4 border-b px-6 py-4"
        style={{ borderColor: "var(--border)" }}
      >
        <Link
          href="/demos"
          className="text-sm transition-opacity hover:opacity-70"
          style={{ color: "var(--muted)" }}
        >
          ← Back to demos
        </Link>

        <div className="h-4 w-px" style={{ backgroundColor: "var(--border)" }} />

        <h1 className="text-sm font-semibold text-foreground">
          Customer Support Chatbot
        </h1>

        <span
          className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
          style={{ backgroundColor: "var(--accent-dim)", color: "var(--accent)" }}
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
          Live demo
        </span>
      </header>

      {/* ── Demo layout (client) ── */}
      <ChatbotDemo />
    </div>
  );
}
