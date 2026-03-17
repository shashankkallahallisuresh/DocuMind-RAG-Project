"use client";

import { BookOpen, Moon, Plus, Sun } from "lucide-react";

interface Props {
  isDark: boolean;
  onToggleTheme: () => void;
  onNewChat: () => void;
}

export function Header({ isDark, onToggleTheme, onNewChat }: Props) {
  return (
    <header className="flex-none border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-3 z-10">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <BookOpen size={15} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
              AI Tools Wiki
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 leading-tight">
              PDF Knowledge Assistant
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Plus size={13} />
            New chat
          </button>
          <button
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </div>
    </header>
  );
}
