"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useAlien } from "@alien_org/react";
import { Loader2 } from "lucide-react";
import { useChatRoom } from "@/features/chat/hooks/use-chat-room";
import { useGeolocation } from "@/features/chat/hooks/use-geolocation";
import { ChatFeed } from "./chat-feed";
import { ComposeBar } from "./compose-bar";
import { RoomHeader } from "./room-header";
import { LocationPicker } from "./location-picker";

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

  const handleJoinAt = useCallback(async (lat: number, lon: number) => {
    joinAttempted.current = true;
    await chat.join(lat, lon);
  }, [chat]);

  // Auto-join once we have GPS position + auth (only once)
  useEffect(() => {
    if (geo.position && authToken && !chat.room && !chat.isJoining && !joinAttempted.current) {
      handleJoinAt(geo.position.lat, geo.position.lon);
    }
  }, [geo.position, authToken, chat.room, chat.isJoining, handleJoinAt]);

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

  // Getting GPS (auto-attempt)
  if (geo.isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <Loader2 size={24} className="animate-spin text-zinc-400" />
        <p className="text-sm text-zinc-500">Getting your location...</p>
      </div>
    );
  }

  // Joining room
  if (chat.isJoining) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <Loader2 size={24} className="animate-spin text-zinc-400" />
        <p className="text-sm text-zinc-500">Joining your local room...</p>
      </div>
    );
  }

  // In room
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

        <ChatFeed messages={chat.messages} currentAlienId={chat.currentAlienId ?? undefined} authToken={authToken ?? undefined} />

        <ComposeBar
          onSend={chat.post}
          isPosting={chat.isPosting}
          cooldownRemaining={chat.cooldownRemaining}
        />
      </div>
    );
  }

  // No GPS and no room -- show location picker with map fallback
  return (
    <LocationPicker
      onSelect={handleJoinAt}
      geoError={geo.error}
      onRetryGeo={geo.requestPosition}
    />
  );
}
