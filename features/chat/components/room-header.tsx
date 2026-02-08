"use client";

import { MapPin, Users, Clock } from "lucide-react";
import { useEffect, useState } from "react";

interface RoomInfo {
  hash: string;
  tile: string;
  slot: string;
  expiresTs: string;
  memberCount: number;
}

function timeUntil(expiresTs: string): string {
  const diff = new Date(expiresTs).getTime() - Date.now();
  if (diff <= 0) return "expired";
  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

export function RoomHeader({ room }: { room: RoomInfo }) {
  const [remaining, setRemaining] = useState(timeUntil(room.expiresTs));

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(timeUntil(room.expiresTs));
    }, 1000);
    return () => clearInterval(timer);
  }, [room.expiresTs]);

  return (
    <div className="rounded-xl border border-zinc-200/60 bg-white p-3 dark:border-zinc-800/60 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-zinc-400" />
          <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
            {room.tile}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Users size={13} className="text-zinc-400" />
            <span className="text-xs text-zinc-500">{room.memberCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={13} className="text-zinc-400" />
            <span className="text-xs text-zinc-500">{remaining}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
