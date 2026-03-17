"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ChatWindow } from "@/components/ChatWindow";
import { InputBar } from "@/components/InputBar";
import { useChat } from "@/hooks/useChat";
import { clearSession, getDocuments } from "@/lib/api";

export default function Home() {
  const [sessionId, setSessionId] = useState("");
  const [isDark, setIsDark] = useState(true);
  const [documents, setDocuments] = useState<string[]>([]);

  useEffect(() => {
    // Session
    let id = sessionStorage.getItem("rag-session-id");
    if (!id) { id = crypto.randomUUID(); sessionStorage.setItem("rag-session-id", id); }
    setSessionId(id);

    // Theme
    const saved = localStorage.getItem("rag-theme") ?? "dark";
    setIsDark(saved === "dark");
    document.documentElement.classList.toggle("dark", saved === "dark");

    // Fetch document list for sidebar
    getDocuments().then((r) => setDocuments(r.documents)).catch(() => {});
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("rag-theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };

  const { messages, isLoading, error, sendMessage, clearMessages } = useChat(sessionId);

  const handleNewChat = async () => {
    if (sessionId) await clearSession(sessionId).catch(() => {});
    const newId = crypto.randomUUID();
    sessionStorage.setItem("rag-session-id", newId);
    setSessionId(newId);
    clearMessages();
  };

  return (
    <div className="flex h-screen bg-[#111111] overflow-hidden">
      <Sidebar
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onNewChat={handleNewChat}
        documents={documents}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <ChatWindow messages={messages} isLoading={isLoading} />

        {error && (
          <div className="px-6 py-2 text-xs text-red-400 text-center bg-red-950/20 border-t border-red-900/30">
            {error}
          </div>
        )}

        <InputBar
          onSend={sendMessage}
          isLoading={isLoading}
          hasMessages={messages.length > 0}
        />
      </main>
    </div>
  );
}
