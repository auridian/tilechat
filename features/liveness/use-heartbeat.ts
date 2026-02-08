"use client";

import { useEffect, useRef } from "react";

const HEARTBEAT_INTERVAL_MS = 60 * 1000; // every 60 seconds

export function useHeartbeat(authToken: string | null) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!authToken) return;

    const sendHeartbeat = async () => {
      try {
        const posStr = sessionStorage.getItem("tile-chatter-position");
        const pos = posStr ? JSON.parse(posStr) : {};
        await fetch("/api/heartbeat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            lat: pos.lat ?? null,
            lon: pos.lon ?? null,
          }),
        });
      } catch {}
    };

    // Send immediately on mount
    sendHeartbeat();

    intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [authToken]);
}
