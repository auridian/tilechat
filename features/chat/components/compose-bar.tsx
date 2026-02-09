"use client";

import { useState, useCallback, useEffect } from "react";
import { Send, Zap, AlertCircle, TrendingUp } from "lucide-react";

const MAX_LENGTH = 280;

interface ReputationInfo {
  karma: number;
  cooldownMultiplier: number;
  voteWeight: number;
}

export function ComposeBar({
  onSend,
  isPosting,
  cooldownRemaining,
  authToken,
}: {
  onSend: (message: string) => void;
  isPosting: boolean;
  cooldownRemaining: number;
  authToken?: string;
}) {
  const [text, setText] = useState("");
  const [reputation, setReputation] = useState<ReputationInfo | null>(null);

  // Fetch user reputation
  useEffect(() => {
    if (!authToken) return;
    fetch("/api/reputation", {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setReputation(data);
      })
      .catch(() => {});
  }, [authToken]);

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

  const getReputationIcon = () => {
    if (!reputation) return null;
    if (reputation.karma > 10) return <Zap size={12} className="text-amber-500" />;
    if (reputation.karma < 0) return <AlertCircle size={12} className="text-red-500" />;
    return <TrendingUp size={12} className="text-zinc-400" />;
  };

  const getReputationText = () => {
    if (!reputation) return null;
    if (reputation.karma > 10) return "Trusted - Fast posting";
    if (reputation.karma < -10) return "Restricted - Slow posting";
    if (reputation.karma < 0) return "Warning - Slower posting";
    return `Karma: ${reputation.karma}`;
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between px-1">
        {cooldownRemaining > 0 && (
          <div className="text-xs text-zinc-400 dark:text-zinc-500">
            Cooldown: {cooldownRemaining}s
          </div>
        )}
        {cooldownRemaining === 0 && reputation && (
          <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            {getReputationIcon()}
            <span>{getReputationText()}</span>
            {reputation.voteWeight > 1 && (
              <span className="text-amber-500">• Weight: x{reputation.voteWeight}</span>
            )}
          </div>
        )}
      </div>
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
