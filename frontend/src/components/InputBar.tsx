"use client";

import { KeyboardEvent, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";

interface Props {
  onSend: (message: string) => void;
  isLoading: boolean;
  hasMessages: boolean;
}

export function InputBar({ onSend, isLoading, hasMessages }: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  };

  const canSend = value.trim().length > 0 && !isLoading;

  return (
    <div className="flex-none px-4 md:px-6 py-4">
      <div className="max-w-2xl mx-auto">
        <div className="relative flex items-end gap-2 bg-white/[0.05] rounded-2xl border border-white/[0.09] hover:border-white/[0.16] focus-within:border-white/[0.22] transition-all duration-200 px-4 py-3.5 shadow-xl shadow-black/30">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => { setValue(e.target.value); handleInput(); }}
            onKeyDown={handleKeyDown}
            placeholder={hasMessages ? "Ask a follow-up…" : "Ask anything about your documents…"}
            rows={1}
            disabled={isLoading}
            className="flex-1 bg-transparent text-[14px] text-white/90 placeholder-white/25 resize-none focus:outline-none leading-relaxed"
            style={{ minHeight: "22px", maxHeight: "180px" }}
          />
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 ${
              canSend
                ? "bg-white text-black hover:bg-white/90 shadow-sm"
                : "bg-white/[0.07] text-white/20 cursor-not-allowed"
            }`}
          >
            <ArrowUp size={14} />
          </button>
        </div>
        <p className="text-center text-[11px] text-white/15 mt-2">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
