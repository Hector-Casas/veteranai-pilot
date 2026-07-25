"use client";

import { MessageCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useChatbotSession } from "@/lib/hooks/use-chatbot-session";
import ChatInterface from "./ChatInterface";

const GREETING_TEXT =
  "Hi, I'm Veteran AI's assistant. Curious how AI could help your business? Ask me anything.";
const SESSION_KEY = "veteranai-chat-bubble-interacted";
const AUTO_TRIGGER_DELAY_MS = 5000;

type BubbleState = "collapsed" | "greeting" | "open";

export default function ChatBubble() {
  const [state, setState] = useState<BubbleState>("collapsed");
  const [hasInteracted, setHasInteracted] = useState(false);
  const { messages, status, sendText } = useChatbotSession();

  // Restore whether this visitor already engaged with the bubble this session.
  useEffect(() => {
    setHasInteracted(sessionStorage.getItem(SESSION_KEY) === "true");
  }, []);

  const markInteracted = () => {
    sessionStorage.setItem(SESSION_KEY, "true");
    setHasInteracted(true);
  };

  // Auto-expand to the greeting after a delay or on first scroll, whichever
  // comes first — skipped entirely once the visitor has already interacted.
  useEffect(() => {
    if (hasInteracted || state !== "collapsed") return;

    const timer = setTimeout(() => setState("greeting"), AUTO_TRIGGER_DELAY_MS);
    const handleScroll = () => setState("greeting");
    window.addEventListener("scroll", handleScroll, { once: true, passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [hasInteracted, state]);

  const handleIconClick = () => {
    markInteracted();
    setState((prev) => (prev === "open" ? "collapsed" : "open"));
  };

  const handleGreetingClick = () => {
    markInteracted();
    setState("open");
  };

  const handleDismissGreeting = (e: React.MouseEvent) => {
    e.stopPropagation();
    markInteracted();
    setState("collapsed");
  };

  const handleClose = () => {
    markInteracted();
    setState("collapsed");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {state === "open" && (
        <div
          className="flex h-[520px] w-[360px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl shadow-2xl"
          style={{ backgroundColor: "var(--surface-light)", border: "1px solid var(--border-light)" }}
        >
          <div
            className="flex shrink-0 items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid var(--border-light)" }}
          >
            <p className="text-sm font-semibold text-text-primary">Veteran AI Assistant</p>
            <button
              onClick={handleClose}
              aria-label="Close chat"
              className="rounded-full p-1 text-text-secondary transition-opacity hover:opacity-70"
            >
              <X size={16} />
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <ChatInterface messages={messages} status={status} onSend={sendText} variant="light" />
          </div>
        </div>
      )}

      {state === "greeting" && (
        <div
          role="button"
          tabIndex={0}
          onClick={handleGreetingClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleGreetingClick();
          }}
          className="chat-bubble relative max-w-[260px] cursor-pointer rounded-2xl rounded-br-sm px-4 py-3 pr-7 text-left text-sm leading-relaxed shadow-xl transition-opacity hover:opacity-90"
          style={{
            backgroundColor: "var(--surface-light)",
            border: "1px solid var(--border-light)",
            color: "var(--text-primary)",
          }}
        >
          <button
            onClick={handleDismissGreeting}
            aria-label="Dismiss"
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full"
            style={{
              backgroundColor: "var(--page-base)",
              border: "1px solid var(--border-light)",
              color: "var(--text-secondary)",
            }}
          >
            <X size={11} />
          </button>
          {GREETING_TEXT}
        </div>
      )}

      {state !== "open" && (
        <button
          onClick={handleIconClick}
          aria-label="Open chat with Veteran AI's assistant"
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-brand-navy text-white shadow-xl transition-transform hover:scale-105"
        >
          <MessageCircle size={24} strokeWidth={1.75} />
          {!hasInteracted && (
            <span
              className="absolute right-0 top-0 h-3.5 w-3.5 rounded-full bg-brand-red"
              style={{ border: "2px solid var(--page-base)" }}
            />
          )}
        </button>
      )}
    </div>
  );
}
