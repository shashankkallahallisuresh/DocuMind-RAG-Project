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

export interface ApiConfig {
  apiKey: string;
  provider: string;
  model: string;
}

export function useChat(sessionId: string, config?: ApiConfig) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading || !sessionId) return;

      setError(null);
      setIsLoading(true);

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "user", content },
      ]);

      const assistantId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", sources: [], isStreaming: true },
      ]);

      try {
        await sendChatMessage(
          sessionId,
          content,
          (token) => {
            setMessages((prev) =>
              prev.map((m) => m.id === assistantId ? { ...m, content: m.content + token } : m)
            );
          },
          (sources) => {
            setMessages((prev) =>
              prev.map((m) => m.id === assistantId ? { ...m, sources } : m)
            );
          },
          () => {
            setMessages((prev) =>
              prev.map((m) => m.id === assistantId ? { ...m, isStreaming: false } : m)
            );
            setIsLoading(false);
          },
          (errMsg) => {
            setError(errMsg);
            setMessages((prev) => prev.filter((m) => m.id !== assistantId));
            setIsLoading(false);
          },
          config?.apiKey,
          config?.provider,
          config?.model,
        );
      } catch {
        setError("Connection failed. Is the backend running?");
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        setIsLoading(false);
      }
    },
    [sessionId, isLoading, config]
  );

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, isLoading, error, sendMessage, clearMessages };
}
