"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { UserPlus, Check, ThumbsUp, ThumbsDown, TrendingUp, TrendingDown, Minus } from "lucide-react";
import toast from "react-hot-toast";

interface VoteInfo {
  up: number;
  down: number;
  score: number;
  userVote: "up" | "down" | null;
}

interface ChatMessage {
  id: string;
  alienId: string;
  body: string;
  ts: string;
  votes?: VoteInfo;
}

function formatTime(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function stubId(alienId: string): string {
  if (alienId.length <= 8) return alienId;
  return alienId.slice(0, 4) + ".." + alienId.slice(-4);
}

function getScoreColor(score: number): string {
  if (score > 5) return "text-green-500";
  if (score > 0) return "text-green-400";
  if (score < -5) return "text-red-500";
  if (score < 0) return "text-red-400";
  return "text-zinc-400";
}

function getScoreIcon(score: number) {
  if (score > 2) return TrendingUp;
  if (score < -2) return TrendingDown;
  return Minus;
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
  const [votingId, setVotingId] = useState<string | null>(null);
  const [messageVotes, setMessageVotes] = useState<Record<string, VoteInfo>>({});

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Sync votes from messages
  useEffect(() => {
    const votes: Record<string, VoteInfo> = {};
    for (const msg of messages) {
      if (msg.votes) {
        votes[msg.id] = msg.votes;
      }
    }
    setMessageVotes(votes);
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

  const handleVote = useCallback(async (postId: string, authorAlienId: string, direction: "up" | "down") => {
    if (!authToken) return;
    if (authorAlienId === currentAlienId) {
      toast("Can't vote on your own message");
      return;
    }
    setVotingId(postId);
    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ postId, authorAlienId, direction }),
      });
      if (res.ok) {
        const data = await res.json();
        // Update local vote state
        setMessageVotes(prev => {
          const current = prev[postId] || { up: 0, down: 0, score: 0, userVote: null };
          const newVote = {
            ...current,
            userVote: current.userVote === direction ? null : direction,
            up: direction === "up" 
              ? (current.userVote === "up" ? current.up - 1 : current.up + 1)
              : current.up,
            down: direction === "down"
              ? (current.userVote === "down" ? current.down - 1 : current.down + 1)
              : current.down,
          };
          newVote.score = newVote.up - newVote.down;
          return { ...prev, [postId]: newVote };
        });
        toast.success(data.changed ? "Vote recorded" : "Vote removed");
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Vote failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setVotingId(null);
    }
  }, [authToken, currentAlienId]);

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
        const isVoting = votingId === msg.id;
        const votes = messageVotes[msg.id] || msg.votes || { up: 0, down: 0, score: 0, userVote: null };
        const ScoreIcon = getScoreIcon(votes.score);
        
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
            
            {/* Vote buttons and score */}
            <div className="mt-0.5 flex items-center gap-2 px-1">
              <span className="text-[10px] text-zinc-300 dark:text-zinc-600">
                {formatTime(msg.ts)}
              </span>
              
              {!isMe && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleVote(msg.id, msg.alienId, "up")}
                    disabled={isVoting}
                    className={`flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] transition-colors ${
                      votes.userVote === "up"
                        ? "bg-green-100 text-green-600 dark:bg-green-900/30"
                        : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <ThumbsUp size={10} />
                    {votes.up > 0 && votes.up}
                  </button>
                  
                  <button
                    onClick={() => handleVote(msg.id, msg.alienId, "down")}
                    disabled={isVoting}
                    className={`flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] transition-colors ${
                      votes.userVote === "down"
                        ? "bg-red-100 text-red-600 dark:bg-red-900/30"
                        : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <ThumbsDown size={10} />
                    {votes.down > 0 && votes.down}
                  </button>
                </div>
              )}
              
              {votes.score !== 0 && (
                <span className={`flex items-center gap-0.5 text-[10px] ${getScoreColor(votes.score)}`}>
                  <ScoreIcon size={10} />
                  {votes.score > 0 ? `+${votes.score}` : votes.score}
                </span>
              )}
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
