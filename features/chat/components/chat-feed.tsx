"use client";

import { useRef, useEffect } from "react";

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
}: {
  messages: ChatMessage[];
  currentAlienId?: string;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
                <span className="mb-0.5 block text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                  {stubId(msg.alienId)}
                </span>
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
