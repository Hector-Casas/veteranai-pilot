"use client";

import { isTextUIPart, UIMessage } from "ai";
import { Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type ChatStatus = "ready" | "submitted" | "streaming" | "error";

type Props = {
  messages: UIMessage[];
  status: ChatStatus;
  onSend: (text: string) => Promise<void>;
  // "dark" (default) preserves the existing look used on /demos/chatbot.
  // "light" is for embedding on the light-themed landing page (ChatBubble).
  variant?: "dark" | "light";
};

// Color lookup so the two surfaces this component renders on (dark demo page,
// light landing bubble) each get their own palette without branching styles
// inline at every usage site below.
const PALETTES = {
  dark: {
    muted: "var(--muted)",
    userBubbleBg: "var(--accent)",
    userBubbleText: "var(--background)",
    assistantBubbleBg: "var(--surface-hover)",
    assistantBubbleBorder: "var(--border)",
    assistantBubbleText: "var(--foreground)",
    footerBg: "transparent",
    footerBorderTop: "var(--border)",
    inputBoxBg: "var(--surface-hover)",
    inputBoxBorder: "var(--border)",
    textColor: "var(--foreground)",
    placeholderClassName: "placeholder:opacity-40",
    sendBg: "var(--accent)",
    sendText: "var(--background)",
  },
  light: {
    muted: "#8a8a9a",
    userBubbleBg: "var(--brand-navy)",
    userBubbleText: "#ffffff",
    assistantBubbleBg: "#f7f8fc",
    assistantBubbleBorder: "#d5d6e2",
    assistantBubbleText: "var(--text-primary)",
    footerBg: "#f7f8fc",
    footerBorderTop: "#d5d6e2",
    inputBoxBg: "#ffffff",
    inputBoxBorder: "#d5d6e2",
    textColor: "var(--text-primary)",
    placeholderClassName: "placeholder:text-[#8a8a9a]",
    sendBg: "var(--brand-navy)",
    sendText: "#ffffff",
  },
} as const;

export default function ChatInterface({ messages, status, onSend, variant = "dark" }: Props) {
  const palette = PALETTES[variant];
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
            <p className="text-sm" style={{ color: palette.muted }}>
              Hi! Ask me about our AI services...
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
                    ? { backgroundColor: palette.userBubbleBg, color: palette.userBubbleText }
                    : {
                        backgroundColor: palette.assistantBubbleBg,
                        border: `1px solid ${palette.assistantBubbleBorder}`,
                        color: palette.assistantBubbleText,
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
                backgroundColor: palette.assistantBubbleBg,
                border: `1px solid ${palette.assistantBubbleBorder}`,
              }}
            >
              <span className="typing-dots" aria-label="Typing...">
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
      <div
        className="shrink-0 p-4"
        style={{ backgroundColor: palette.footerBg, borderTop: `1px solid ${palette.footerBorderTop}` }}
      >
        <div
          className="flex items-end gap-3 rounded-xl p-3"
          style={{
            backgroundColor: palette.inputBoxBg,
            border: `1px solid ${palette.inputBoxBorder}`,
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your question..."
            rows={1}
            disabled={isLoading}
            className={`flex-1 resize-none bg-transparent text-sm outline-none disabled:opacity-50 ${palette.placeholderClassName}`}
            style={{ color: palette.textColor }}
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading || !input.trim()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-opacity disabled:opacity-30 hover:opacity-80"
            style={{ backgroundColor: palette.sendBg, color: palette.sendText }}
            aria-label="Send message"
          >
            <Send size={14} strokeWidth={2} />
          </button>
        </div>
        <p className="mt-2 text-center text-xs" style={{ color: palette.muted }}>
          Enter to send · Shift+Enter for a new line
        </p>
      </div>
    </div>
  );
}
