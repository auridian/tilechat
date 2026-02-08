"use client";

import { useEffect, useState, useCallback } from "react";
import { useAlien } from "@alien_org/react";
import { UserPlus, Trash2, Loader2, Users } from "lucide-react";

interface Contact {
  id: string;
  ownerAlienId: string;
  contactAlienId: string;
  nickname: string | null;
  createdAt: string;
}

function stubId(alienId: string): string {
  if (alienId.length <= 10) return alienId;
  return alienId.slice(0, 6) + "..." + alienId.slice(-4);
}

export function ContactsPage() {
  const { authToken: alienToken, isBridgeAvailable } = useAlien();
  const [devToken, setDevToken] = useState<string | null>(null);
  const authToken = alienToken || devToken;

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addId, setAddId] = useState("");
  const [addNickname, setAddNickname] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dev mode
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

  const headers = useCallback(() => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (authToken) h["Authorization"] = `Bearer ${authToken}`;
    return h;
  }, [authToken]);

  const fetchContacts = useCallback(async () => {
    if (!authToken) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/contacts", { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts ?? []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [authToken, headers]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleAdd = async () => {
    if (!addId.trim()) return;
    setIsAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          contactAlienId: addId.trim(),
          nickname: addNickname.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add contact");
        return;
      }
      setAddId("");
      setAddNickname("");
      await fetchContacts();
    } catch {
      setError("Network error");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await fetch(`/api/contacts/${id}`, {
        method: "DELETE",
        headers: headers(),
      });
      setContacts((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // ignore
    }
  };

  if (!authToken) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <Loader2 size={24} className="animate-spin text-zinc-400" />
        <p className="text-sm text-zinc-500">Connecting...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Users size={20} className="text-zinc-500" />
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Contacts
        </h1>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
        <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Add a contact by their Alien ID
        </p>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={addId}
            onChange={(e) => setAddId(e.target.value)}
            placeholder="Alien ID"
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <input
            type="text"
            value={addNickname}
            onChange={(e) => setAddNickname(e.target.value)}
            placeholder="Nickname (optional)"
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <button
            onClick={handleAdd}
            disabled={isAdding || !addId.trim()}
            className="flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {isAdding ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <UserPlus size={14} />
            )}
            Add Contact
          </button>
        </div>
        {error && (
          <p className="mt-2 text-xs text-red-500">{error}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-zinc-400" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 py-8 text-center dark:border-zinc-700">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No contacts yet. Add someone to get started.
            </p>
          </div>
        ) : (
          contacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <div className="min-w-0 flex-1">
                {contact.nickname && (
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {contact.nickname}
                  </p>
                )}
                <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {stubId(contact.contactAlienId)}
                </p>
              </div>
              <button
                onClick={() => handleRemove(contact.id)}
                className="ml-2 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
