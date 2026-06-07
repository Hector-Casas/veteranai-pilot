"use client";

import { isTextUIPart, UIMessage } from "ai";
import { Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type ChatStatus = "ready" | "submitted" | "streaming" | "error";

type Props = {
  messages: UIMessage[];
  status: ChatStatus;
  onSend: (text: string) => Promise<void>;
};

export default function ChatInterface({ messages, status, onSend }: Props) {
  const [input, setInput] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Tracks whether the user is close enough to the bottom to auto-scroll.
  // We start at true so the initial empty state and first messages scroll normally.
  const isNearBottomRef = useRef(true);

  const isLoading = status === "submitted" || status === "streaming";

  // Update isNearBottom as user scrolls
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distanceFromBottom < 80;
  }, []);

  // Auto-scroll only when user was already near the bottom
  useEffect(() => {
    if (!isNearBottomRef.current) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  // Auto-resize textarea up to 128px
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [input]);

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    // User just sent — always scroll to bottom for the response
    isNearBottomRef.current = true;
    await onSend(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    // h-full fills the fixed-height section in ChatbotDemo
    <div className="flex h-full flex-col">
      {/* ── Messages area — scrolls internally, never expands the page ── */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex flex-1 flex-col gap-3 overflow-y-auto p-5"
      >
        {messages.length === 0 && (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              ¡Hola! Pregúntame sobre nuestros servicios de IA...
            </p>
          </div>
        )}

        {messages.map((message) => {
          const isUser = message.role === "user";
          const textParts = message.parts.filter(isTextUIPart);
          if (textParts.length === 0) return null;

          return (
            <div
              key={message.id}
              className={`chat-bubble flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
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
                  <p key={i} className="whitespace-pre-wrap">
                    {part.text}
                  </p>
                ))}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {status === "submitted" && (
          <div className="flex justify-start">
            <div
              className="rounded-2xl rounded-bl-sm px-4 py-3"
              style={{
                backgroundColor: "var(--surface-hover)",
                border: "1px solid var(--border)",
              }}
            >
              <span className="typing-dots" aria-label="Escribiendo...">
                <span />
                <span />
                <span />
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input area — shrink-0 keeps it pinned at the bottom ── */}
      <div className="shrink-0 p-4" style={{ borderTop: "1px solid var(--border)" }}>
        <div
          className="flex items-end gap-3 rounded-xl p-3"
          style={{
            backgroundColor: "var(--surface-hover)",
            border: "1px solid var(--border)",
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu pregunta..."
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:opacity-40 disabled:opacity-50"
            style={{ color: "var(--foreground)" }}
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading || !input.trim()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-opacity disabled:opacity-30 hover:opacity-80"
            style={{ backgroundColor: "var(--accent)", color: "var(--background)" }}
            aria-label="Enviar mensaje"
          >
            <Send size={14} strokeWidth={2} />
          </button>
        </div>
        <p className="mt-2 text-center text-xs" style={{ color: "var(--muted)" }}>
          Enter para enviar · Shift+Enter para nueva línea
        </p>
      </div>
    </div>
  );
}
