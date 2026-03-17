"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ChatWindow } from "@/components/ChatWindow";
import { InputBar } from "@/components/InputBar";
import { ApiKeyModal } from "@/components/ApiKeyModal";
import { useChat } from "@/hooks/useChat";
import { clearSession, getDocuments } from "@/lib/api";

const API_KEY_STORAGE = "documind-api-key";
const THEME_STORAGE = "rag-theme";

export default function Home() {
  const [sessionId, setSessionId] = useState("");
  const [isDark, setIsDark] = useState(true);
  const [documents, setDocuments] = useState<string[]>([]);
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiModal, setShowApiModal] = useState(false);

  useEffect(() => {
    // Session
    let id = sessionStorage.getItem("rag-session-id");
    if (!id) { id = crypto.randomUUID(); sessionStorage.setItem("rag-session-id", id); }
    setSessionId(id);

    // Theme — default to dark
    const saved = localStorage.getItem(THEME_STORAGE) ?? "dark";
    setIsDark(saved === "dark");
    document.documentElement.classList.toggle("dark", saved === "dark");

    // API key
    const storedKey = localStorage.getItem(API_KEY_STORAGE) ?? "";
    setApiKey(storedKey);
    if (!storedKey) setShowApiModal(true);

    // Fetch document list for sidebar
    getDocuments().then((r) => setDocuments(r.documents)).catch(() => {});
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem(THEME_STORAGE, next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem(API_KEY_STORAGE, key);
    setShowApiModal(false);
  };

  const { messages, isLoading, error, sendMessage, clearMessages } = useChat(sessionId, apiKey);

  const handleNewChat = async () => {
    if (sessionId) await clearSession(sessionId).catch(() => {});
    const newId = crypto.randomUUID();
    sessionStorage.setItem("rag-session-id", newId);
    setSessionId(newId);
    clearMessages();
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#111111] overflow-hidden">
      {showApiModal && (
        <ApiKeyModal
          onSave={handleSaveApiKey}
          onClose={() => setShowApiModal(false)}
          isRequired={!apiKey}
        />
      )}

      <Sidebar
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onNewChat={handleNewChat}
        onOpenApiKey={() => setShowApiModal(true)}
        documents={documents}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <ChatWindow messages={messages} isLoading={isLoading} />

        {error && (
          <div className="px-6 py-2 text-xs text-red-500 dark:text-red-400 text-center bg-red-50 dark:bg-red-950/20 border-t border-red-200 dark:border-red-900/30 flex items-center justify-center gap-2">
            <span>{error}</span>
            {(error.toLowerCase().includes("401") || error.toLowerCase().includes("api key") || error.toLowerCase().includes("auth")) && (
              <button
                onClick={() => setShowApiModal(true)}
                className="underline font-medium hover:text-red-600 dark:hover:text-red-300"
              >
                Update key
              </button>
            )}
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
