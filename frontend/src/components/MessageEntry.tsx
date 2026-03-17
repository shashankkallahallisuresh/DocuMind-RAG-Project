"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BookOpenText } from "lucide-react";
import { Message } from "@/hooks/useChat";
import { SourceCards } from "./SourceCards";

interface Props {
  userMessage: Message;
  assistantMessage?: Message;
}

export function MessageEntry({ userMessage, assistantMessage }: Props) {
  const isStreaming = assistantMessage?.isStreaming;
  const hasContent = (assistantMessage?.content ?? "").length > 0;
  const hasSources = (assistantMessage?.sources ?? []).length > 0;

  return (
    <div className="py-10 border-b border-white/[0.05] last:border-0">
      {/* User question */}
      <h2 className="text-2xl font-semibold text-white/90 mb-7 leading-snug">
        {userMessage.content}
      </h2>

      {/* Sources */}
      {hasSources && <SourceCards sources={assistantMessage!.sources!} />}

      {/* Answer */}
      {assistantMessage && (
        <div className="flex gap-3">
          {/* Model icon */}
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-900/30">
              <BookOpenText size={12} className="text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {!hasContent && isStreaming && (
              /* Thinking dots */
              <div className="flex items-center gap-1.5 h-6 mt-1">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="w-1.5 h-1.5 rounded-full bg-white/20"
                    style={{ animation: `bounce 1.2s ${delay}ms ease-in-out infinite` }}
                  />
                ))}
              </div>
            )}

            {hasContent && (
              <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-p:text-white/80 prose-headings:text-white/90 prose-strong:text-white/90 prose-li:text-white/80">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {assistantMessage.content + (isStreaming ? "\u00A0▋" : "")}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
