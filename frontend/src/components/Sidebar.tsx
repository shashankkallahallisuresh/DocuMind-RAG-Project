"use client";

import { useState } from "react";
import { BookOpenText, FilePlus, FileText, Menu, Moon, Sun, X } from "lucide-react";

interface Props {
  isDark: boolean;
  onToggleTheme: () => void;
  onNewChat: () => void;
  documents: string[];
}

export function Sidebar({ isDark, onToggleTheme, onNewChat, documents }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const content = (
    <div className="flex flex-col h-full bg-[#0a0a0a] border-r border-white/[0.06] w-64">
      {/* Brand */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-900/30">
            <BookOpenText size={15} className="text-white" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-white tracking-tight">DocuMind</p>
            <p className="text-[10px] text-white/30 leading-tight">AI Document Assistant</p>
          </div>
        </div>

        {/* New Thread */}
        <button
          onClick={() => { onNewChat(); setMobileOpen(false); }}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-[13px] text-white/60 hover:text-white hover:bg-white/[0.06] rounded-xl transition-all duration-150 border border-white/[0.06] hover:border-white/[0.12]"
        >
          <FilePlus size={14} />
          New Thread
        </button>
      </div>

      {/* Documents */}
      <div className="px-3 flex-1 overflow-y-auto">
        <p className="text-[10px] font-semibold text-white/20 uppercase tracking-widest px-2 mb-2">
          Sources
        </p>
        <div className="space-y-0.5">
          {documents.map((doc) => (
            <div
              key={doc}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-default group"
            >
              <div className="w-5 h-5 rounded-md bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                <FileText size={10} className="text-white/40" />
              </div>
              <span className="text-[12px] text-white/40 truncate leading-tight">
                {doc.replace(".pdf", "")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className="p-3 border-t border-white/[0.06]">
        <button
          onClick={onToggleTheme}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-white/40 hover:text-white/70 hover:bg-white/[0.04] rounded-lg transition-all"
        >
          {isDark ? <Sun size={13} /> : <Moon size={13} />}
          {isDark ? "Light mode" : "Dark mode"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.06] text-white/60 hover:text-white"
      >
        <Menu size={15} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="relative z-50">
            {content}
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-[-2.5rem] w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.08] text-white/60"
            >
              <X size={14} />
            </button>
          </div>
          <div className="flex-1 bg-black/60" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:block flex-none">{content}</div>
    </>
  );
}
