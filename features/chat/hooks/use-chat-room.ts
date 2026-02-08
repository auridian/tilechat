"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface RoomInfo {
  hash: string;
  tile: string;
  slot: string;
  expiresTs: string;
  memberCount: number;
}

interface ChatMessage {
  id: string;
  alienId: string;
  body: string;
  ts: string;
}

interface UseChatRoomReturn {
  room: RoomInfo | null;
  messages: ChatMessage[];
  isJoining: boolean;
  isPosting: boolean;
  isFetching: boolean;
  error: string | null;
  cooldownRemaining: number;
  currentAlienId: string | null;
  join: (lat: number, lon: number) => Promise<void>;
  post: (message: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const COOLDOWN_MS = 90 * 1000;
const POLL_INTERVAL_MS = 3000;

const DEMO_MODE = true;

function makeDemoMessages(): ChatMessage[] {
  if (!DEMO_MODE) return [];
  const now = Date.now();
  return [
    {
      id: "demo-1",
      alienId: "0xA3f7...c9E2",
      body: "anyone else near downtown rn?",
      ts: new Date(now - 8 * 60000).toISOString(),
    },
    {
      id: "demo-2",
      alienId: "0x91bD...4a07",
      body: "yeah just grabbed coffee on 5th. wild how quiet it is today",
      ts: new Date(now - 6 * 60000).toISOString(),
    },
    {
      id: "demo-3",
      alienId: "0xA3f7...c9E2",
      body: "fr. this app is cool btw, like a local walkie-talkie",
      ts: new Date(now - 4 * 60000).toISOString(),
    },
    {
      id: "demo-4",
      alienId: "0x91bD...4a07",
      body: "lol exactly. 30 min rooms is a neat idea",
      ts: new Date(now - 2 * 60000).toISOString(),
    },
  ];
}

export function useChatRoom(authToken?: string): UseChatRoomReturn {
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isJoining, setIsJoining] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [currentAlienId, setCurrentAlienId] = useState<string | null>(null);
  const lastPostTime = useRef<number>(0);
  const lastPosition = useRef<{ lat: number; lon: number } | null>(null);
  const joinAttempted = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rolloverRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const headers = useCallback(() => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (authToken) h["Authorization"] = `Bearer ${authToken}`;
    return h;
  }, [authToken]);

  const demoMessages = useRef<ChatMessage[]>(makeDemoMessages());

  const fetchHistory = useCallback(async (hash: string) => {
    if (!authToken) return;
    setIsFetching(true);
    try {
      const res = await fetch(`/api/chat/history/${hash}`, { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        const serverPosts: ChatMessage[] = data.posts ?? [];
        setMessages([...demoMessages.current, ...serverPosts]);
        if (data.memberCount !== undefined) {
          const demoExtra = DEMO_MODE ? 2 : 0;
          setRoom((prev) => prev ? { ...prev, memberCount: data.memberCount + demoExtra } : prev);
        }
      }
    } catch {
      // silent polling failure
    } finally {
      setIsFetching(false);
    }
  }, [authToken, headers]);

  const join = useCallback(async (lat: number, lon: number) => {
    if (!authToken) {
      setError("Not authenticated. Open this app inside Alien.");
      return;
    }
    joinAttempted.current = true;
    setIsJoining(true);
    setError(null);
    try {
      const res = await fetch("/api/chat/join", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ lat, lon }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to join room");
        return;
      }
      setRoom({
        hash: data.hash,
        tile: data.tile,
        slot: data.slot,
        expiresTs: data.expiresTs,
        memberCount: data.memberCount,
      });
      lastPosition.current = { lat, lon };
      if (data.alienId) setCurrentAlienId(data.alienId);
      setMessages([...demoMessages.current]);
      await fetchHistory(data.hash);
    } catch (e) {
      setError("Network error joining room");
    } finally {
      setIsJoining(false);
    }
  }, [authToken, headers, fetchHistory]);

  const post = useCallback(async (message: string) => {
    if (!authToken || !room) return;
    setIsPosting(true);
    setError(null);
    try {
      const res = await fetch("/api/chat/post", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ hash: room.hash, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.remaining) {
          setCooldownRemaining(data.remaining);
        }
        setError(data.error || "Failed to post");
        return;
      }
      lastPostTime.current = Date.now();
      setCooldownRemaining(Math.ceil(COOLDOWN_MS / 1000));
      setMessages((prev) => [...prev, data]);
    } catch {
      setError("Network error posting message");
    } finally {
      setIsPosting(false);
    }
  }, [authToken, room, headers]);

  const refresh = useCallback(async () => {
    if (room) await fetchHistory(room.hash);
  }, [room, fetchHistory]);

  // Polling for new messages
  useEffect(() => {
    if (!room) return;
    pollRef.current = setInterval(() => {
      fetchHistory(room.hash);
    }, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [room, fetchHistory]);

  // Slot rollover: auto re-join when room expires
  useEffect(() => {
    if (!room || !lastPosition.current) return;
    const msUntilExpiry = new Date(room.expiresTs).getTime() - Date.now();
    if (msUntilExpiry <= 0) {
      // Already expired, re-join now
      join(lastPosition.current.lat, lastPosition.current.lon);
      return;
    }
    rolloverRef.current = setTimeout(() => {
      if (lastPosition.current) {
        join(lastPosition.current.lat, lastPosition.current.lon);
      }
    }, msUntilExpiry + 500); // small buffer
    return () => {
      if (rolloverRef.current) clearTimeout(rolloverRef.current);
    };
  }, [room, join]);

  // Cooldown timer
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  return {
    room,
    messages,
    isJoining,
    isPosting,
    isFetching,
    error,
    cooldownRemaining,
    currentAlienId,
    join,
    post,
    refresh,
  };
}
