"use client";

import { DefaultChatTransport, isTextUIPart } from "ai";
import { useChat } from "@ai-sdk/react";
import { Send, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CATALOG,
  CAPABILITY_EXAMPLE_PROMPTS,
  INDUSTRY_GREETINGS,
  IndustryKey,
} from "@/lib/prompts/chatbot-builder";

type Props = {
  industryKey: IndustryKey;
  capabilities: string[];
};

// Mounted with a config-signature `key` by the parent, so a rebuild with a
// different industry/capabilities set forces a full remount here — that's
// what guarantees useChat's message history never bleeds across configs.
export default function GeneratedChatPanel({ industryKey, capabilities }: Props) {
  const industry = CATALOG[industryKey];

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chatbot-builder", body: { industryKey, capabilities } }),
    [industryKey, capabilities]
  );

  const { messages, sendMessage, status } = useChat({
    transport,
    onError: (err) => console.error("[GeneratedChatPanel]", err),
  });

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const atBottomRef = useRef(true);

  const isLoading = status === "submitted" || status === "streaming";

  const suggestedPrompts = useMemo(
    () => capabilities.map((c) => CAPABILITY_EXAMPLE_PROMPTS[c]).filter((p): p is string => Boolean(p)),
    [capabilities]
  );

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !atBottomRef.current) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, status]);

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

  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-2xl"
      style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
    >
      {/* Header */}
      <div
        className="flex shrink-0 items-center gap-3 px-4 py-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--brand-navy)" }}
        >
          {industry.persona.charAt(0)}
        </div>
        <p className="flex-1 truncate text-sm font-semibold text-foreground">{industry.persona}</p>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
          style={{ backgroundColor: "var(--accent-dim)", color: "var(--accent)" }}
        >
          Demo assistant
        </span>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex flex-1 flex-col gap-3 overflow-y-auto p-4"
      >
        {/* In-character greeting — display only, never sent to the model */}
        <div className="chat-bubble flex justify-start">
          <div
            className="max-w-[85%] rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed"
            style={{
              backgroundColor: "var(--surface-hover)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            }}
          >
            {INDUSTRY_GREETINGS[industryKey]}
          </div>
        </div>

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
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  isUser ? "rounded-br-sm" : "rounded-bl-sm"
                }`}
                style={
                  isUser
                    ? { backgroundColor: "var(--brand-navy)", color: "#ffffff" }
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

        {status === "submitted" && (
          <div className="flex justify-start">
            <div
              className="rounded-2xl rounded-bl-sm px-4 py-3"
              style={{ backgroundColor: "var(--surface-hover)", border: "1px solid var(--border)" }}
            >
              <span className="typing-dots" aria-label="Typing...">
                <span />
                <span />
                <span />
              </span>
            </div>
          </div>
        )}

        {/* Suggested prompts — only before the visitor has sent anything */}
        {messages.length === 0 && suggestedPrompts.length > 0 && (
          <div className="mt-1 flex flex-col gap-2">
            <p className="flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
              <Sparkles size={11} style={{ color: "var(--accent)" }} />
              Try asking
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  disabled={isLoading}
                  className="suggestion-chip rounded-full px-3 py-1.5 text-left text-xs leading-snug transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--surface-hover)",
                    color: "var(--foreground)",
                    cursor: "pointer",
                  }}
                >
                  {prompt}
                </button>
              ))}
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
            placeholder={`Message ${industry.persona}...`}
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:opacity-40 disabled:opacity-50"
            style={{ color: "var(--foreground)" }}
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-opacity disabled:opacity-30 hover:opacity-80"
            style={{ backgroundColor: "var(--brand-navy)", color: "#ffffff" }}
            aria-label="Send"
          >
            <Send size={14} strokeWidth={2} />
          </button>
        </div>
        <p className="mt-1.5 text-center text-xs" style={{ color: "var(--muted)" }}>
          Enter to send · Shift+Enter for a new line
        </p>
      </div>
    </div>
  );
}
