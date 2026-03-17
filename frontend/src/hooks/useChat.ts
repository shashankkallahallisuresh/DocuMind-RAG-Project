"use client";

import { useCallback, useState } from "react";
import { sendChatMessage, Source } from "@/lib/api";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  isStreaming?: boolean;
}

export function useChat(sessionId: string, apiKey?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading || !sessionId) return;

      setError(null);
      setIsLoading(true);

      // Append user message
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "user", content },
      ]);

      // Append placeholder assistant message
      const assistantId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: "",
          sources: [],
          isStreaming: true,
        },
      ]);

      try {
        await sendChatMessage(
          sessionId,
          content,
          (token) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + token }
                  : m
              )
            );
          },
          (sources) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, sources } : m
              )
            );
          },
          () => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, isStreaming: false } : m
              )
            );
            setIsLoading(false);
          },
          (errMsg) => {
            setError(errMsg);
            setMessages((prev) => prev.filter((m) => m.id !== assistantId));
            setIsLoading(false);
          },
          apiKey
        );
      } catch (err) {
        setError("Connection failed. Is the backend running?");
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        setIsLoading(false);
      }
    },
    [sessionId, isLoading, apiKey]
  );

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, isLoading, error, sendMessage, clearMessages };
}
