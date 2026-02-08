"use client";

import { useAlien } from "@alien_org/react";
import { useHeartbeat } from "@/features/liveness/use-heartbeat";

export function HeartbeatProvider() {
  const { authToken } = useAlien();
  useHeartbeat(authToken ?? null);
  return null;
}
