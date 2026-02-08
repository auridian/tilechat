"use client";

import { useState, useCallback } from "react";
import { Send } from "lucide-react";

const MAX_LENGTH = 280;

export function ComposeBar({
  onSend,
  isPosting,
  cooldownRemaining,
}: {
  onSend: (message: string) => void;
  isPosting: boolean;
  cooldownRemaining: number;
}) {
  const [text, setText] = useState("");

  const disabled = isPosting || cooldownRemaining > 0 || text.trim().length === 0;

  const handleSend = useCallback(() => {
    if (disabled) return;
    onSend(text.trim());
    setText("");
  }, [text, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className="flex flex-col gap-1">
      {cooldownRemaining > 0 && (
        <div className="text-center text-xs text-zinc-400 dark:text-zinc-500">
          Cooldown: {cooldownRemaining}s
        </div>
      )}
      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
            onKeyDown={handleKeyDown}
            placeholder="Say something..."
            rows={1}
            className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
          />
          <span className="absolute bottom-1 right-2 text-[10px] text-zinc-300 dark:text-zinc-600">
            {text.length}/{MAX_LENGTH}
          </span>
        </div>
        <button
          onClick={handleSend}
          disabled={disabled}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white transition-opacity disabled:opacity-30 dark:bg-zinc-100 dark:text-zinc-900"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
