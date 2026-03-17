"use client";

import { useEffect, useRef } from "react";
import { BookOpenText, FileText } from "lucide-react";
import { Message } from "@/hooks/useChat";
import { MessageEntry } from "./MessageEntry";

interface Props {
  messages: Message[];
  isLoading: boolean;
}

const SUGGESTED = [
  "What AI tools are covered in these documents?",
  "What are the best AI tools for writing content?",
  "How can AI be used for legal research?",
  "What AI tools help with data analysis?",
];

export function ChatWindow({ messages, isLoading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Pair messages: user[i] + assistant[i+1]
  const pairs: { user: Message; assistant: Message | undefined }[] = [];
  for (let i = 0; i < messages.length; i += 2) {
    pairs.push({ user: messages[i], assistant: messages[i + 1] });
  }

  if (pairs.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-4 py-12">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-5 shadow-xl shadow-blue-900/30">
          <BookOpenText size={22} className="text-white" />
        </div>

        <h1 className="text-[22px] font-semibold text-white/90 mb-1.5 text-center">
          What do you want to know?
        </h1>
        <p className="text-sm text-white/35 text-center mb-8 max-w-sm">
          Ask anything about your AI tools documentation.
          I&apos;ll find answers with source citations.
        </p>

        {/* Suggested questions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
          {SUGGESTED.map((s) => (
            <div
              key={s}
              className="flex items-start gap-2.5 px-4 py-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all cursor-default"
            >
              <FileText size={12} className="flex-shrink-0 mt-0.5 text-white/20" />
              <span className="text-[12px] text-white/50 leading-snug">{s}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-6">
      <div className="max-w-2xl mx-auto w-full">
        {pairs.map(({ user, assistant }) => (
          <MessageEntry
            key={user.id}
            userMessage={user}
            assistantMessage={assistant}
          />
        ))}
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
}
