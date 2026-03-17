"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ChatWindow } from "@/components/ChatWindow";
import { InputBar } from "@/components/InputBar";
import { ApiKeyModal, ApiConfig } from "@/components/ApiKeyModal";
import { useChat } from "@/hooks/useChat";
import { clearSession, getDocuments } from "@/lib/api";

const API_CONFIG_STORAGE = "documind-api-config";
const THEME_STORAGE = "rag-theme";

function loadApiConfig(): ApiConfig | null {
  try {
    const raw = localStorage.getItem(API_CONFIG_STORAGE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function Home() {
  const [sessionId, setSessionId] = useState("");
  const [isDark, setIsDark] = useState(true);
  const [documents, setDocuments] = useState<string[]>([]);
  const [apiConfig, setApiConfig] = useState<ApiConfig | null>(null);
  const [showApiModal, setShowApiModal] = useState(false);

  useEffect(() => {
    let id = sessionStorage.getItem("rag-session-id");
    if (!id) { id = crypto.randomUUID(); sessionStorage.setItem("rag-session-id", id); }
    setSessionId(id);

    const saved = localStorage.getItem(THEME_STORAGE) ?? "dark";
    setIsDark(saved === "dark");
    document.documentElement.classList.toggle("dark", saved === "dark");

    const config = loadApiConfig();
    setApiConfig(config);
    if (!config) setShowApiModal(true);

    getDocuments().then((r) => setDocuments(r.documents)).catch(() => {});
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem(THEME_STORAGE, next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };

  const handleSaveApiConfig = (config: ApiConfig) => {
    setApiConfig(config);
    localStorage.setItem(API_CONFIG_STORAGE, JSON.stringify(config));
    setShowApiModal(false);
  };

  const { messages, isLoading, error, sendMessage, clearMessages } = useChat(
    sessionId,
    apiConfig ?? undefined,
  );

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
          current={apiConfig ?? undefined}
          onSave={handleSaveApiConfig}
          onClose={() => setShowApiModal(false)}
          isRequired={!apiConfig}
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
