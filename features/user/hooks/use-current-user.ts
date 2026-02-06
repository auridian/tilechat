"use client";

import { useAlien } from "@alien_org/react";
import { useEffect, useState } from "react";
import { UserDTO } from "../dto";

interface UseCurrentUserReturn {
  user: UserDTO | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export function useCurrentUser(): UseCurrentUserReturn {
  const { authToken } = useAlien();
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authToken) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function fetchUser() {
      try {
        const res = await fetch("/api/me", {
          headers: { Authorization: `Bearer ${authToken}` },
          signal: controller.signal,
        });

        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error ?? "Request failed");
        }

        const data = UserDTO.parse(await res.json());
        setUser(data);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }

    fetchUser();

    return () => controller.abort();
  }, [authToken]);

  return { user, loading, error, isAuthenticated: !!authToken };
}
