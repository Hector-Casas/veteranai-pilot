"use client";

import { useChat } from "@ai-sdk/react";

// Thin wrapper around useChat, pointed at the default /api/chat route.
// Shared by ChatbotDemo (full-page demo) and ChatBubble (landing page widget)
// so both surfaces talk to the same backend and tools without duplicating logic.
export function useChatbotSession() {
  const { messages, sendMessage, status } = useChat({
    onError: (err) => console.error("[chatbot] useChat error:", err),
  });

  const sendText = async (text: string) => {
    await sendMessage({ text });
  };

  return { messages, status, sendText };
}
