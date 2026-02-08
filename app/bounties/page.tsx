"use client";

import { useEffect, useState, useCallback } from "react";
import { useAlien } from "@alien_org/react";
import { Loader2, Plus, Tag, X, DollarSign, CheckCircle } from "lucide-react";

interface Bounty {
  id: string;
  creatorAlienId: string;
  title: string;
  description: string | null;
  rewardAmount: number | null;
  rewardToken: string | null;
  status: string;
  claimedByAlienId: string | null;
  createdAt: string;
}

function stubId(alienId: string): string {
  if (alienId.length <= 12) return alienId;
  return alienId.slice(0, 6) + ".." + alienId.slice(-4);
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const DEMO_BOUNTIES: Bounty[] = [
  {
    id: "demo-b1",
    creatorAlienId: "0xA3f7...c9E2",
    title: "Need a phone charger (USB-C)",
    description: "Left mine at home, will pay for a loaner for an hour",
    rewardAmount: 5,
    rewardToken: "USDC",
    status: "open",
    claimedByAlienId: null,
    createdAt: new Date(Date.now() - 20 * 60000).toISOString(),
  },
  {
    id: "demo-b2",
    creatorAlienId: "0xF2c8...11aB",
    title: "Recommend a good lunch spot nearby",
    description: "Looking for something quick and not too expensive",
    rewardAmount: 2,
    rewardToken: "USDC",
    status: "open",
    claimedByAlienId: null,
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    id: "demo-b3",
    creatorAlienId: "0xF2c8...11aB",
    title: "Walking buddy for the park trail",
    description: "Going for a walk in 30 min, anyone want to join?",
    rewardAmount: null,
    rewardToken: null,
    status: "open",
    claimedByAlienId: null,
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
  },
];

export default function BountiesPage() {
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

  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reward, setReward] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const fetchBounties = useCallback(async () => {
    if (!authToken) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/bounties", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        const serverBounties: Bounty[] = data.bounties ?? [];
        setBounties([...DEMO_BOUNTIES, ...serverBounties]);
      } else {
        setBounties([...DEMO_BOUNTIES]);
      }
    } catch {
      setBounties([...DEMO_BOUNTIES]);
    } finally {
      setIsLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    if (authToken) fetchBounties();
  }, [authToken, fetchBounties]);

  const handleCreate = useCallback(async () => {
    if (!authToken || !title.trim()) return;
    setIsCreating(true);
    try {
      const posStr = sessionStorage.getItem("tile-chatter-position");
      const pos = posStr ? JSON.parse(posStr) : {};
      const res = await fetch("/api/bounties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          rewardAmount: reward ? parseInt(reward, 10) : null,
          rewardToken: reward ? "USDC" : null,
          lat: pos.lat,
          lon: pos.lon,
        }),
      });
      if (res.ok) {
        setTitle("");
        setDescription("");
        setReward("");
        setShowCreate(false);
        await fetchBounties();
      }
    } catch {}
    finally {
      setIsCreating(false);
    }
  }, [authToken, title, description, reward, fetchBounties]);

  const handleClaim = useCallback(async (bountyId: string) => {
    if (!authToken || bountyId.startsWith("demo-")) return;
    try {
      await fetch(`/api/bounties/${bountyId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ action: "claim" }),
      });
      await fetchBounties();
    } catch {}
  }, [authToken, fetchBounties]);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Bounties
          </h1>
          <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
            Requests from people nearby. Help out and earn.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          {showCreate ? <X size={14} /> : <Plus size={14} />}
          {showCreate ? "Cancel" : "Post"}
        </button>
      </div>

      {showCreate && (
        <div className="rounded-xl border border-zinc-200/60 bg-white p-4 dark:border-zinc-800/60 dark:bg-zinc-900">
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="What do you need?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
              maxLength={100}
            />
            <textarea
              placeholder="Details (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
              maxLength={300}
            />
            <div className="flex items-center gap-2">
              <DollarSign size={14} className="text-zinc-400" />
              <input
                type="number"
                placeholder="Reward (USDC, optional)"
                value={reward}
                onChange={(e) => setReward(e.target.value)}
                className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
                min={0}
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={!title.trim() || isCreating}
              className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {isCreating ? "Posting..." : "Post Bounty"}
            </button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-zinc-400" />
        </div>
      )}

      <div className="flex flex-col gap-2">
        {bounties.map((bounty) => (
          <div
            key={bounty.id}
            className="rounded-xl border border-zinc-200/60 bg-white p-4 dark:border-zinc-800/60 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Tag size={14} className="shrink-0 text-amber-500" />
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {bounty.title}
                  </span>
                </div>
                {bounty.description && (
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {bounty.description}
                  </p>
                )}
                <div className="mt-1.5 flex items-center gap-3">
                  <span className="text-[10px] text-zinc-400">
                    by {stubId(bounty.creatorAlienId)}
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    {timeAgo(bounty.createdAt)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                {bounty.rewardAmount && (
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/20 dark:text-green-400">
                    ${bounty.rewardAmount} {bounty.rewardToken}
                  </span>
                )}
                {bounty.status === "open" && !bounty.id.startsWith("demo-") && (
                  <button
                    onClick={() => handleClaim(bounty.id)}
                    className="rounded-lg border border-zinc-200 px-2.5 py-1 text-[11px] font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    Claim
                  </button>
                )}
                {bounty.status === "claimed" && (
                  <span className="flex items-center gap-1 text-[11px] text-blue-500">
                    <CheckCircle size={10} /> Claimed
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {!isLoading && bounties.length === 0 && (
        <div className="rounded-xl border border-zinc-200/60 bg-white p-6 text-center dark:border-zinc-800/60 dark:bg-zinc-900">
          <Tag size={32} className="mx-auto mb-3 text-zinc-300" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No bounties yet. Be the first to post one.
          </p>
        </div>
      )}
    </>
  );
}
