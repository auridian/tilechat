"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useAlien } from "@alien_org/react";
import { MapPin, Loader2 } from "lucide-react";
import { useChatRoom } from "@/features/chat/hooks/use-chat-room";
import { useGeolocation } from "@/features/chat/hooks/use-geolocation";
import { ChatFeed } from "./chat-feed";
import { ComposeBar } from "./compose-bar";
import { RoomHeader } from "./room-header";

export function ChatRoom() {
  const { authToken: alienToken, isBridgeAvailable } = useAlien();
  const [devToken, setDevToken] = useState<string | null>(null);
  const authToken = alienToken || devToken;
  const geo = useGeolocation();
  const chat = useChatRoom(authToken ?? undefined);

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

  const joinAttempted = useRef(false);

  const handleJoin = useCallback(async () => {
    if (geo.position) {
      joinAttempted.current = true;
      await chat.join(geo.position.lat, geo.position.lon);
    }
  }, [geo.position, chat]);

  // Auto-join once we have position + auth (only once)
  useEffect(() => {
    if (geo.position && authToken && !chat.room && !chat.isJoining && !joinAttempted.current) {
      handleJoin();
    }
  }, [geo.position, authToken, chat.room, chat.isJoining, handleJoin]);

  // Persist room hash for Nearby page
  useEffect(() => {
    if (chat.room) {
      sessionStorage.setItem("tile-chatter-hash", chat.room.hash);
    }
  }, [chat.room]);

  // Waiting for auth (dev or alien)
  if (!authToken) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <Loader2 size={24} className="animate-spin text-zinc-400" />
        <p className="text-sm text-zinc-500">Connecting...</p>
      </div>
    );
  }

  // Step 1: Request GPS
  if (!geo.position && !geo.isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full bg-zinc-100 p-4 dark:bg-zinc-800">
          <MapPin size={32} className="text-zinc-400" />
        </div>
        <div>
          <h2 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Enable Location
          </h2>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            tile-chatter needs your location to find your local chat room.
          </p>
        </div>
        {geo.error && (
          <p className="text-sm text-red-500">{geo.error}</p>
        )}
        <button
          onClick={geo.requestPosition}
          className="rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Share Location
        </button>
      </div>
    );
  }

  // Step 2: Getting GPS
  if (geo.isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <Loader2 size={24} className="animate-spin text-zinc-400" />
        <p className="text-sm text-zinc-500">Getting your location...</p>
      </div>
    );
  }

  // Step 3: Joining room
  if (chat.isJoining || (!chat.room && geo.position)) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <Loader2 size={24} className="animate-spin text-zinc-400" />
        <p className="text-sm text-zinc-500">Joining your local room...</p>
      </div>
    );
  }

  // Step 4: In room
  if (chat.room) {
    return (
      <div className="flex flex-1 flex-col gap-3" style={{ minHeight: "calc(100vh - 10rem)" }}>
        {devToken && (
          <div className="rounded-lg bg-amber-50 px-3 py-1.5 text-center text-[11px] text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
            Dev mode -- using local test identity
          </div>
        )}
        <RoomHeader room={chat.room} />

        {chat.error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {chat.error}
          </div>
        )}

        <ChatFeed messages={chat.messages} currentAlienId={chat.currentAlienId ?? undefined} />

        <ComposeBar
          onSend={chat.post}
          isPosting={chat.isPosting}
          cooldownRemaining={chat.cooldownRemaining}
        />
      </div>
    );
  }

  // Fallback error
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3">
      {chat.error && (
        <p className="text-sm text-red-500">{chat.error}</p>
      )}
      <button
        onClick={handleJoin}
        className="rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
      >
        Try Again
      </button>
    </div>
  );
}
