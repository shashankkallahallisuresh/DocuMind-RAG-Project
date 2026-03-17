"use client";

import { useState } from "react";
import { KeyRound, X, ExternalLink } from "lucide-react";

export type Provider = "openrouter" | "openai" | "groq" | "together";

export interface ApiConfig {
  provider: Provider;
  apiKey: string;
  model: string;
}

const PROVIDERS: { value: Provider; label: string; placeholder: string; defaultModel: string; docsUrl: string }[] = [
  {
    value: "openrouter",
    label: "OpenRouter",
    placeholder: "sk-or-v1-...",
    defaultModel: "anthropic/claude-sonnet-4-5",
    docsUrl: "https://openrouter.ai/keys",
  },
  {
    value: "openai",
    label: "OpenAI",
    placeholder: "sk-...",
    defaultModel: "gpt-4o",
    docsUrl: "https://platform.openai.com/api-keys",
  },
  {
    value: "groq",
    label: "Groq",
    placeholder: "gsk_...",
    defaultModel: "llama-3.3-70b-versatile",
    docsUrl: "https://console.groq.com/keys",
  },
  {
    value: "together",
    label: "Together AI",
    placeholder: "...",
    defaultModel: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
    docsUrl: "https://api.together.ai/settings/api-keys",
  },
];

interface Props {
  current?: ApiConfig;
  onSave: (config: ApiConfig) => void;
  onClose?: () => void;
  isRequired?: boolean;
}

export function ApiKeyModal({ current, onSave, onClose, isRequired = true }: Props) {
  const [provider, setProvider] = useState<Provider>(current?.provider ?? "openrouter");
  const [apiKey, setApiKey] = useState(current?.apiKey ?? "");
  const [model, setModel] = useState(current?.model ?? "");
  const [error, setError] = useState("");

  const selectedProvider = PROVIDERS.find((p) => p.value === provider)!;

  const handleProviderChange = (p: Provider) => {
    setProvider(p);
    setModel("");
    setError("");
  };

  const handleSave = () => {
    const trimmedKey = apiKey.trim();
    if (!trimmedKey) {
      setError("Please enter an API key");
      return;
    }
    onSave({
      provider,
      apiKey: trimmedKey,
      model: model.trim() || selectedProvider.defaultModel,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-white dark:bg-[#161616] border border-gray-200 dark:border-white/[0.08] rounded-2xl shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-900/30">
              <KeyRound size={16} className="text-white" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-gray-900 dark:text-white/90">Configure API Key</p>
              <p className="text-[11px] text-gray-500 dark:text-white/35">Stored only in your browser</p>
            </div>
          </div>
          {!isRequired && onClose && (
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/60 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Provider selector */}
        <p className="text-[11px] font-semibold text-gray-400 dark:text-white/30 uppercase tracking-widest mb-2">Provider</p>
        <div className="grid grid-cols-2 gap-1.5 mb-4">
          {PROVIDERS.map((p) => (
            <button
              key={p.value}
              onClick={() => handleProviderChange(p.value)}
              className={`px-3 py-2 rounded-xl text-[12px] font-medium border transition-all ${
                provider === p.value
                  ? "bg-blue-50 dark:bg-blue-600/20 border-blue-300 dark:border-blue-500/40 text-blue-700 dark:text-blue-300"
                  : "bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.07] text-gray-600 dark:text-white/40 hover:border-gray-300 dark:hover:border-white/[0.14]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* API Key input */}
        <p className="text-[11px] font-semibold text-gray-400 dark:text-white/30 uppercase tracking-widest mb-2">API Key</p>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => { setApiKey(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder={selectedProvider.placeholder}
          className="w-full px-3.5 py-2.5 rounded-xl text-[13px] bg-gray-50 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.09] text-gray-900 dark:text-white/90 placeholder-gray-400 dark:placeholder-white/20 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500/60 transition-all mb-3"
        />

        {/* Model input */}
        <p className="text-[11px] font-semibold text-gray-400 dark:text-white/30 uppercase tracking-widest mb-2">
          Model <span className="normal-case font-normal text-gray-400 dark:text-white/20">(optional — uses default if blank)</span>
        </p>
        <input
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder={selectedProvider.defaultModel}
          className="w-full px-3.5 py-2.5 rounded-xl text-[13px] bg-gray-50 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.09] text-gray-900 dark:text-white/90 placeholder-gray-400 dark:placeholder-white/20 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500/60 transition-all mb-3"
        />

        {error && (
          <p className="text-[11px] text-red-500 dark:text-red-400 mb-3">{error}</p>
        )}

        <button
          onClick={handleSave}
          disabled={!apiKey.trim()}
          className="w-full py-2.5 rounded-xl text-[13px] font-medium bg-blue-600 hover:bg-blue-500 disabled:bg-gray-200 dark:disabled:bg-white/[0.06] text-white disabled:text-gray-400 dark:disabled:text-white/20 transition-all mb-3"
        >
          Save Configuration
        </button>

        <a
          href={selectedProvider.docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 text-[11px] text-blue-500 dark:text-blue-400 hover:underline"
        >
          Get a {selectedProvider.label} API key
          <ExternalLink size={10} />
        </a>
      </div>
    </div>
  );
}
