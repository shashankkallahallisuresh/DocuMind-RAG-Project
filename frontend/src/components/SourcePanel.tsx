"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import { Source } from "@/lib/api";

interface Props {
  sources: Source[];
}

export function SourcePanel({ sources }: Props) {
  const [open, setOpen] = useState(false);

  if (sources.length === 0) return null;

  return (
    <div className="w-full mt-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
      >
        <FileText size={11} className="group-hover:text-blue-500 transition-colors" />
        <span>
          {sources.length} source{sources.length !== 1 ? "s" : ""}
        </span>
        {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>

      {open && (
        <div className="mt-2 space-y-2 animate-fade-in">
          {sources.map((src, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60"
            >
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 truncate max-w-[200px]">
                  {src.document}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  p.&nbsp;{src.page}
                </span>
                <span className="ml-auto text-xs text-gray-300 dark:text-gray-600 font-mono">
                  {Math.round(src.score * 100)}%
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed">
                {src.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
