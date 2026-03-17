"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, User } from "lucide-react";
import { Message } from "@/hooks/useChat";
import { SourcePanel } from "./SourcePanel";

interface Props {
  message: Message;
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex gap-3 mb-5 animate-fade-in ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5 ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
        }`}
      >
        {isUser ? <User size={13} /> : <Bot size={13} />}
      </div>

      {/* Bubble + sources */}
      <div
        className={`flex flex-col gap-1.5 max-w-[85%] md:max-w-[75%] ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-blue-600 text-white rounded-tr-sm"
              : "bg-white dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700/60 rounded-tl-sm"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <>
              {/* Thinking dots while waiting for first token */}
              {message.isStreaming && !message.content ? (
                <div className="flex items-center gap-1 h-5">
                  <span
                    className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:mt-3 prose-headings:mb-1">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content +
                      (message.isStreaming ? "\u00A0▋" : "")}
                  </ReactMarkdown>
                </div>
              )}
            </>
          )}
        </div>

        {/* Citations — shown after streaming finishes */}
        {!isUser &&
          !message.isStreaming &&
          message.sources &&
          message.sources.length > 0 && (
            <SourcePanel sources={message.sources} />
          )}
      </div>
    </div>
  );
}
