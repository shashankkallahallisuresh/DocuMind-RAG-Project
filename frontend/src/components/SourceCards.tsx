"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, FileText } from "lucide-react";
import { Source } from "@/lib/api";

interface Props {
  sources: Source[];
}

export function SourceCards({ sources }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);

  if (!sources.length) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-white/25">
          Sources
        </span>
        <span className="text-[10px] text-white/20 bg-white/[0.05] px-1.5 py-0.5 rounded-full">
          {sources.length}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {sources.map((src, i) => (
          <div key={i} className="flex flex-col">
            <button
              onClick={() => setExpanded(expanded === i ? null : i)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] hover:border-white/[0.13] transition-all duration-150 text-left group"
            >
              <div className="w-5 h-5 rounded-md bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                <FileText size={10} className="text-blue-400" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-medium text-white/70 group-hover:text-white/90 truncate max-w-[160px] transition-colors">
                  {src.document.replace(".pdf", "")}
                </span>
                <span className="text-[10px] text-white/30">
                  p. {src.page} · {Math.round(src.score * 100)}% match
                </span>
              </div>
              <span className="text-white/20 ml-1">
                {expanded === i ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              </span>
            </button>

            {expanded === i && (
              <div className="mt-1.5 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[11px] text-white/50 leading-relaxed max-w-xs">
                {src.text.slice(0, 280)}
                {src.text.length > 280 && "…"}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
