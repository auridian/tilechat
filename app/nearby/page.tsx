"use client";

import { useEffect, useState, useCallback } from "react";
import { useAlien } from "@alien_org/react";
import { Loader2, Radar, UserPlus, Check, Tag } from "lucide-react";

interface NearbyUser {
  alienId: string;
  bio: string | null;
  distanceMeters: number;
  lastSeenAt: string | null;
  bountyCount: number;
  topBounty: { title: string; reward: number | null } | null;
}

const DEMO_NEARBY: NearbyUser[] = [
  {
    alienId: "0xA3f7...c9E2",
    bio: "coffee addict, always downtown",
    distanceMeters: 120,
    lastSeenAt: new Date(Date.now() - 3 * 60000).toISOString(),
    bountyCount: 1,
    topBounty: { title: "Need a phone charger", reward: 5 },
  },
  {
    alienId: "0x91bD...4a07",
    bio: null,
    distanceMeters: 340,
    lastSeenAt: new Date(Date.now() - 7 * 60000).toISOString(),
    bountyCount: 0,
    topBounty: null,
  },
  {
    alienId: "0xF2c8...11aB",
    bio: "looking for hiking buddies",
    distanceMeters: 780,
    lastSeenAt: new Date(Date.now() - 1 * 60000).toISOString(),
    bountyCount: 2,
    topBounty: { title: "Recommend a good lunch spot", reward: 2 },
  },
];

function stubId(alienId: string): string {
  if (alienId.length <= 12) return alienId;
  return alienId.slice(0, 6) + ".." + alienId.slice(-4);
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `~${meters}m`;
  return `~${(meters / 1000).toFixed(1)}km`;
}

function timeAgo(ts: string | null): string {
  if (!ts) return "";
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export default function NearbyPage() {
  const { authToken: alienToken, isBridgeAvailable } = useAlien();
  const [devToken, setDevToken] = useState<string | null>(null);
  const authToken = alienToken || devToken;

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

  const [users, setUsers] = useState<NearbyUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [hasPosition, setHasPosition] = useState(false);

  useEffect(() => {
    setHasPosition(!!sessionStorage.getItem("tile-chatter-position"));
  }, []);

  const fetchNearby = useCallback(async () => {
    const posStr = typeof window !== "undefined" ? sessionStorage.getItem("tile-chatter-position") : null;
    if (!authToken || !posStr) return;
    setIsLoading(true);
    try {
      const pos = JSON.parse(posStr);
      const res = await fetch("/api/nearby", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ lat: pos.lat, lon: pos.lon }),
      });
      if (res.ok) {
        const data = await res.json();
        const serverUsers: NearbyUser[] = data.users ?? [];
        setUsers([...DEMO_NEARBY, ...serverUsers]);
      } else {
        setUsers([...DEMO_NEARBY]);
      }
    } catch {
      setUsers([...DEMO_NEARBY]);
    } finally {
      setIsLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    if (authToken) fetchNearby();
  }, [authToken, fetchNearby]);

  const handleSaveContact = useCallback(async (alienId: string) => {
    if (!authToken || savedIds.has(alienId)) return;
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
    } catch {}
  }, [authToken, savedIds]);

  return (
    <>
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          People Nearby
        </h1>
        <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
          Users in your area, sorted by distance. Distances are fuzzed for privacy.
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

      {!isLoading && !hasPosition && (
        <div className="rounded-xl border border-zinc-200/60 bg-white p-6 text-center dark:border-zinc-800/60 dark:bg-zinc-900">
          <Radar size={32} className="mx-auto mb-3 text-zinc-300" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Set your location in Chat first to discover nearby people.
          </p>
        </div>
      )}

      {!isLoading && hasPosition && users.length === 0 && (
        <div className="rounded-xl border border-zinc-200/60 bg-white p-6 text-center dark:border-zinc-800/60 dark:bg-zinc-900">
          <Radar size={32} className="mx-auto mb-3 text-zinc-300" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No one nearby right now. Check back soon.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {users.map((user) => {
          const isSaved = savedIds.has(user.alienId);
          return (
            <div
              key={user.alienId}
              className="rounded-xl border border-zinc-200/60 bg-white p-4 dark:border-zinc-800/60 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {stubId(user.alienId)}
                    </span>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      {formatDistance(user.distanceMeters)}
                    </span>
                  </div>
                  {user.bio && (
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 truncate">
                      {user.bio}
                    </p>
                  )}
                  {user.lastSeenAt && (
                    <p className="mt-0.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                      {timeAgo(user.lastSeenAt)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleSaveContact(user.alienId)}
                  disabled={isSaved}
                  className="ml-3 flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-default disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  {isSaved ? <Check size={12} className="text-green-500" /> : <UserPlus size={12} />}
                  {isSaved ? "Saved" : "Save"}
                </button>
              </div>

              {user.bountyCount > 0 && user.topBounty && (
                <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-900/20">
                  <Tag size={12} className="text-amber-600 dark:text-amber-400" />
                  <span className="flex-1 truncate text-xs font-medium text-amber-700 dark:text-amber-300">
                    {user.topBounty.title}
                  </span>
                  {user.topBounty.reward && (
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                      ${user.topBounty.reward}
                    </span>
                  )}
                  {user.bountyCount > 1 && (
                    <span className="text-[10px] text-amber-500">
                      +{user.bountyCount - 1} more
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
