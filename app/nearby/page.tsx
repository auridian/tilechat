"use client";

import { useEffect, useState, useCallback } from "react";
import { useAlien } from "@alien_org/react";
import { MapPin, Loader2 } from "lucide-react";

interface NearbyRoom {
  hash: string;
  tile: string;
  expiresTs: string;
}

export default function NearbyPage() {
  const { authToken: alienToken, isBridgeAvailable } = useAlien();
  const [devToken, setDevToken] = useState<string | null>(null);
  const authToken = alienToken || devToken;

  // Dev mode: auto-fetch a dev token when bridge is not available
  useEffect(() => {
    if (!isBridgeAvailable && !alienToken && !devToken) {
      fetch("/api/dev/auth", { method: "POST" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.token) setDevToken(data.token);
        })
        .catch(() => {});
    }
  }, [isBridgeAvailable, alienToken, devToken]);
  const [rooms, setRooms] = useState<NearbyRoom[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentHash, setCurrentHash] = useState<string | null>(null);

  const fetchNearby = useCallback(async () => {
    if (!authToken || !currentHash) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/chat/nearby/${currentHash}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRooms(data.neighbors || []);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to fetch nearby rooms");
      }
    } catch {
      setError("Network error");
    } finally {
      setIsLoading(false);
    }
  }, [authToken, currentHash]);

  // Try to get current room hash from session storage
  useEffect(() => {
    const stored = sessionStorage.getItem("tile-chatter-hash");
    if (stored) setCurrentHash(stored);
  }, []);

  useEffect(() => {
    if (currentHash && authToken) fetchNearby();
  }, [currentHash, authToken, fetchNearby]);

  return (
    <>
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Nearby Rooms
        </h1>
        <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
          Active chat rooms in neighboring tiles.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-zinc-400" />
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {!isLoading && !currentHash && (
        <div className="rounded-xl border border-zinc-200/60 bg-white p-6 text-center dark:border-zinc-800/60 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Join a chat room first to see nearby rooms.
          </p>
        </div>
      )}

      {!isLoading && rooms.length === 0 && currentHash && (
        <div className="rounded-xl border border-zinc-200/60 bg-white p-6 text-center dark:border-zinc-800/60 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No active rooms nearby right now.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {rooms.map((room) => (
          <div
            key={room.hash}
            className="rounded-xl border border-zinc-200/60 bg-white p-4 dark:border-zinc-800/60 dark:bg-zinc-900"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-zinc-400" />
                <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                  {room.tile}
                </span>
              </div>
              <span className="text-[10px] text-zinc-400">
                {room.hash.slice(0, 8)}...
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
