"use client";

import { useState } from "react";
import { KeyRound, X, ExternalLink } from "lucide-react";

interface Props {
  onSave: (key: string) => void;
  onClose?: () => void;
  isRequired?: boolean;
}

export function ApiKeyModal({ onSave, onClose, isRequired = true }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const handleSave = () => {
    const trimmed = value.trim();
    if (!trimmed.startsWith("sk-or-")) {
      setError("Key must start with sk-or- (OpenRouter API key)");
      return;
    }
    onSave(trimmed);
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
              <p className="text-[11px] text-gray-500 dark:text-white/35">Required to use DocuMind</p>
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

        {/* Body */}
        <p className="text-[13px] text-gray-600 dark:text-white/50 mb-4 leading-relaxed">
          Enter your OpenRouter API key. It&apos;s stored only in your browser and sent directly to OpenRouter.
        </p>

        <input
          type="password"
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder="sk-or-v1-..."
          className="w-full px-3.5 py-2.5 rounded-xl text-[13px] bg-gray-50 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.09] text-gray-900 dark:text-white/90 placeholder-gray-400 dark:placeholder-white/20 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500/60 transition-all mb-2"
        />

        {error && (
          <p className="text-[11px] text-red-500 dark:text-red-400 mb-3">{error}</p>
        )}

        <button
          onClick={handleSave}
          disabled={!value.trim()}
          className="w-full py-2.5 rounded-xl text-[13px] font-medium bg-blue-600 hover:bg-blue-500 disabled:bg-gray-200 dark:disabled:bg-white/[0.06] text-white disabled:text-gray-400 dark:disabled:text-white/20 transition-all mb-3"
        >
          Save API Key
        </button>

        <a
          href="https://openrouter.ai/keys"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 text-[11px] text-blue-500 dark:text-blue-400 hover:underline"
        >
          Get a free OpenRouter API key
          <ExternalLink size={10} />
        </a>
      </div>
    </div>
  );
}
