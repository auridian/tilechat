"use client";

import { useEffect, useState, useCallback } from "react";
import { useAlien } from "@alien_org/react";
import { Loader2, Plus, Tag, X, DollarSign, CheckCircle, XCircle, CreditCard, Clock, RefreshCw, Inbox, User } from "lucide-react";
import toast from "react-hot-toast";
import { useBountyPayment } from "@/features/payments/hooks/use-bounty-payment";

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

type TabFilter = "open" | "posted" | "claimed" | "all";

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

function statusBadge(status: string) {
  switch (status) {
    case "open":
      return (
        <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
          <Clock size={9} /> Open
        </span>
      );
    case "claimed":
      return (
        <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
          <CheckCircle size={9} /> Claimed
        </span>
      );
    case "completed":
      return (
        <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-600 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle size={9} /> Paid
        </span>
      );
    default:
      return null;
  }
}

export default function BountiesPage() {
  const { authToken: alienToken, isBridgeAvailable } = useAlien();
  const [devToken, setDevToken] = useState<string | null>(null);
  const authToken = alienToken || devToken;
  const [currentAlienId, setCurrentAlienId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabFilter>("all");

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

  // Get current alien ID from /api/me
  useEffect(() => {
    if (!authToken) return;
    fetch("/api/me", { headers: { Authorization: `Bearer ${authToken}` } })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.alienId) setCurrentAlienId(d.alienId); })
      .catch(() => {});
  }, [authToken]);

  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reward, setReward] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchBounties = useCallback(async (silent = false) => {
    if (!authToken) return;
    if (!silent) setIsLoading(true);
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
      if (!silent) setIsLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    if (authToken) fetchBounties();
  }, [authToken, fetchBounties]);

  // Auto-refresh every 30 seconds to see status changes
  useEffect(() => {
    if (!authToken) return;
    const interval = setInterval(() => {
      fetchBounties(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [authToken, fetchBounties]);

  const bountyPayment = useBountyPayment({
    onPaid: () => {
      toast.success("Payment sent! Bounty completed.");
      fetchBounties();
    },
    onCancelled: () => {
      toast("Payment cancelled", { icon: "⚠️" });
    },
    onFailed: () => {
      toast.error("Payment failed. Try again?");
    },
  });

  const handleCreate = useCallback(async () => {
    if (!authToken || !title.trim()) return;
    setIsCreating(true);
    try {
      const posStr = typeof window !== "undefined" ? sessionStorage.getItem("tile-chatter-position") : null;
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
        toast.success("Bounty posted!");
        setTitle("");
        setDescription("");
        setReward("");
        setShowCreate(false);
        await fetchBounties();
      } else {
        toast.error("Failed to post bounty");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setIsCreating(false);
    }
  }, [authToken, title, description, reward, fetchBounties]);

  const handleAction = useCallback(async (bountyId: string, action: string, bountyTitle: string) => {
    if (!authToken || bountyId.startsWith("demo-")) {
      toast("Demo bounties can't be claimed", { icon: "ℹ️" });
      return;
    }
    setActionLoading(bountyId);
    try {
      if (action === "pay") {
        await bountyPayment.payBounty(bountyId);
        // Payment flow is async via bridge, fetchBounties called in onPaid
      } else if (action === "claim") {
        const res = await fetch(`/api/bounties/${bountyId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ action }),
        });
        if (res.ok) {
          toast.success("Claimed! Waiting for poster to review...");
          await fetchBounties();
        } else {
          const err = await res.json().catch(() => ({}));
          toast.error(err.error || "Could not claim");
        }
      } else if (action === "reject") {
        const res = await fetch(`/api/bounties/${bountyId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ action }),
        });
        if (res.ok) {
          toast.success("Claim rejected. Bounty reopened.");
          await fetchBounties();
        } else {
          toast.error("Could not reject claim");
        }
      } else if (action === "complete") {
        const res = await fetch(`/api/bounties/${bountyId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ action }),
        });
        if (res.ok) {
          toast.success("Bounty marked complete!");
          await fetchBounties();
        } else {
          toast.error("Could not complete");
        }
      }
    } catch {
      toast.error("Network error");
    } finally {
      setActionLoading(null);
    }
  }, [authToken, fetchBounties, bountyPayment]);

  // Filter bounties based on active tab
  const filteredBounties = bounties.filter((b) => {
    const isDemo = b.id.startsWith("demo-");
    if (isDemo) return true; // Always show demo bounties

    switch (activeTab) {
      case "open":
        return b.status === "open" && b.creatorAlienId !== currentAlienId;
      case "posted":
        return b.creatorAlienId === currentAlienId;
      case "claimed":
        return b.claimedByAlienId === currentAlienId;
      case "all":
      default:
        return true;
    }
  });

  // Count badges for tabs
  const openCount = bounties.filter(b => b.status === "open" && b.creatorAlienId !== currentAlienId && !b.id.startsWith("demo-")).length;
  const postedCount = bounties.filter(b => b.creatorAlienId === currentAlienId && !b.id.startsWith("demo-")).length;
  const claimedCount = bounties.filter(b => b.claimedByAlienId === currentAlienId && !b.id.startsWith("demo-")).length;

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Bounties
          </h1>
          <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
            Post requests, claim tasks, earn crypto.
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

      {/* Filter tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {[
          { key: "all", label: "All", icon: Inbox, count: null },
          { key: "open", label: "Open", icon: Clock, count: openCount },
          { key: "posted", label: "My Posted", icon: User, count: postedCount },
          { key: "claimed", label: "My Claims", icon: Tag, count: claimedCount },
        ].map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as TabFilter)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === key
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            }`}
          >
            <Icon size={12} />
            {label}
            {count !== null && count > 0 && (
              <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] ${
                activeTab === key
                  ? "bg-white/20 text-white dark:bg-black/20 dark:text-zinc-900"
                  : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
              }`}>
                {count}
              </span>
            )}
          </button>
        ))}
        <button
          onClick={() => fetchBounties()}
          disabled={isLoading}
          className="ml-auto rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-40 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-400"
          title="Refresh"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      {isLoading && filteredBounties.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-zinc-400" />
        </div>
      )}

      <div className="flex flex-col gap-2">
        {filteredBounties.map((bounty) => {
          const isDemo = bounty.id.startsWith("demo-");
          const isMine = currentAlienId === bounty.creatorAlienId;
          const isClaimed = bounty.status === "claimed";
          const isOpen = bounty.status === "open";
          const isCompleted = bounty.status === "completed";
          const isBusy = actionLoading === bounty.id;

          return (
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
                      {isMine ? "You posted" : `by ${stubId(bounty.creatorAlienId)}`}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {timeAgo(bounty.createdAt)}
                    </span>
                    {isClaimed && bounty.claimedByAlienId && (
                      <span className="text-[10px] text-amber-500">
                        claimed by {stubId(bounty.claimedByAlienId)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {bounty.rewardAmount ? (
                    <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/20 dark:text-green-400">
                      ${bounty.rewardAmount} {bounty.rewardToken}
                    </span>
                  ) : null}
                  {statusBadge(bounty.status)}
                </div>
              </div>

              {/* Action buttons */}
              {!isDemo && !isCompleted && (
                <div className="mt-3 flex items-center gap-2">
                  {/* Poster sees accept+pay / reject when claimed */}
                  {isMine && isClaimed && bounty.rewardAmount && (
                    <>
                      <button
                        onClick={() => handleAction(bounty.id, "pay", bounty.title)}
                        disabled={isBusy}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                      >
                        <CreditCard size={12} />
                        {isBusy ? "Opening..." : `Accept + Pay $${bounty.rewardAmount}`}
                      </button>
                      <button
                        onClick={() => handleAction(bounty.id, "reject", bounty.title)}
                        disabled={isBusy}
                        className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <XCircle size={12} />
                        Reject
                      </button>
                    </>
                  )}
                  {/* Poster sees complete/reject for no-reward bounties */}
                  {isMine && isClaimed && !bounty.rewardAmount && (
                    <>
                      <button
                        onClick={() => handleAction(bounty.id, "complete", bounty.title)}
                        disabled={isBusy}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                      >
                        <CheckCircle size={12} />
                        {isBusy ? "..." : "Mark Complete"}
                      </button>
                      <button
                        onClick={() => handleAction(bounty.id, "reject", bounty.title)}
                        disabled={isBusy}
                        className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <XCircle size={12} />
                        Reject
                      </button>
                    </>
                  )}
                  {/* Non-poster sees claim button on open bounties */}
                  {!isMine && isOpen && (
                    <button
                      onClick={() => handleAction(bounty.id, "claim", bounty.title)}
                      disabled={isBusy}
                      className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      {isBusy ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                      {isBusy ? "Claiming..." : "Claim This"}
                    </button>
                  )}
                  {/* Non-poster sees waiting status on claimed */}
                  {!isMine && isClaimed && bounty.claimedByAlienId === currentAlienId && (
                    <span className="text-xs text-amber-500">Waiting for poster to review your claim...</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!isLoading && filteredBounties.length === 0 && (
        <div className="rounded-xl border border-zinc-200/60 bg-white p-6 text-center dark:border-zinc-800/60 dark:bg-zinc-900">
          <Tag size={32} className="mx-auto mb-3 text-zinc-300" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {activeTab === "open" && "No open bounties right now. Check back later!"}
            {activeTab === "posted" && "You haven't posted any bounties yet."}
            {activeTab === "claimed" && "You haven't claimed any bounties yet."}
            {activeTab === "all" && "No bounties yet. Be the first to post one!"}
          </p>
        </div>
      )}
    </>
  );
}
