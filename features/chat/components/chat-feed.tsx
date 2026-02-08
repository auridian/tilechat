"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { UserPlus, Check } from "lucide-react";

interface ChatMessage {
  id: string;
  alienId: string;
  body: string;
  ts: string;
}

function formatTime(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function stubId(alienId: string): string {
  if (alienId.length <= 8) return alienId;
  return alienId.slice(0, 4) + ".." + alienId.slice(-4);
}

export function ChatFeed({
  messages,
  currentAlienId,
  authToken,
}: {
  messages: ChatMessage[];
  currentAlienId?: string;
  authToken?: string;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSaveContact = useCallback(async (alienId: string) => {
    if (!authToken || savedIds.has(alienId)) return;
    setSavingId(alienId);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ contactAlienId: alienId }),
      });
      if (res.ok) {
        setSavedIds((prev) => new Set(prev).add(alienId));
      }
    } catch {
      // ignore
    } finally {
      setSavingId(null);
    }
  }, [authToken, savedIds]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-zinc-400 dark:text-zinc-500">
        No messages yet. Be the first to say something.
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
      {messages.map((msg) => {
        const isMe = currentAlienId && msg.alienId === currentAlienId;
        const isSaved = savedIds.has(msg.alienId);
        const isSaving = savingId === msg.alienId;
        return (
          <div
            key={msg.id}
            className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                isMe
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
              }`}
            >
              {!isMe && (
                <button
                  onClick={() => handleSaveContact(msg.alienId)}
                  disabled={isSaved || isSaving}
                  className="mb-0.5 flex items-center gap-1 text-[10px] font-medium text-zinc-400 transition-colors hover:text-blue-500 disabled:cursor-default dark:text-zinc-500 dark:hover:text-blue-400"
                  title={isSaved ? "Saved to contacts" : "Tap to save contact"}
                >
                  {isSaved ? (
                    <Check size={10} className="text-green-500" />
                  ) : (
                    <UserPlus size={10} />
                  )}
                  {stubId(msg.alienId)}
                </button>
              )}
              <span className="break-words">{msg.body}</span>
            </div>
            <span className="mt-0.5 px-1 text-[10px] text-zinc-300 dark:text-zinc-600">
              {formatTime(msg.ts)}
            </span>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
