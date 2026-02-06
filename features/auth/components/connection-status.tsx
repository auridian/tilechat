"use client";

import { useAlien } from "@alien_org/react";

interface RowProps {
  label: string;
  value: string;
  ok: boolean;
}

export function ConnectionStatus() {
  const { authToken, isBridgeAvailable } = useAlien();

  return (
    <div className="w-full rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
        Connection Status
      </h2>
      <div className="space-y-3">
        <Row
          label="Bridge"
          value={isBridgeAvailable ? "Connected" : "Not available"}
          ok={isBridgeAvailable}
        />
        <Row
          label="Auth Token"
          value={authToken ? "Present" : "Missing"}
          ok={!!authToken}
        />
      </div>
    </div>
  );
}

function Row({ label, value, ok }: RowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-zinc-600 dark:text-zinc-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {value}
        </span>
        <div
          className={`h-2 w-2 rounded-full ${ok ? "bg-green-500" : "bg-yellow-500"}`}
        />
      </div>
    </div>
  );
}
