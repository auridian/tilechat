"use client";

import { useEffect, useState, useCallback } from "react";
import { useAlien } from "@alien_org/react";
import { AlienLogViewer } from "@/app/alien-logger";
import { Loader2, RefreshCw, Copy, CheckCircle, AlertCircle, Terminal, Globe } from "lucide-react";

interface EndpointCheck {
  name: string;
  url: string;
  status: "loading" | "ok" | "error";
  statusCode?: number;
  response?: unknown;
  error?: string;
}

function BootLogs() {
  const [bootLogs, setBootLogs] = useState<{ time: string; msg: string }[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const logs = (window as any).__tileChatLogs;
      if (Array.isArray(logs)) {
        setBootLogs([...logs]);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-1 p-3">
      <h2 className="text-sm font-bold font-mono">Boot Logs (pre-React)</h2>
      <div className="max-h-[30vh] overflow-y-auto rounded-lg border border-zinc-200 bg-black p-2 text-[10px] font-mono text-cyan-400 dark:border-zinc-700">
        {bootLogs.length === 0 ? (
          <p className="text-zinc-500">No boot logs captured</p>
        ) : (
          bootLogs.map((e, i) => (
            <div key={i} className={e.msg.includes("ERROR") || e.msg.includes("REJECTION") ? "text-red-400" : ""}>
              <span className="text-zinc-500">{e.time}</span> {e.msg}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function EndpointDiagnostics() {
  const { authToken: alienToken, isBridgeAvailable } = useAlien();
  const [devToken, setDevToken] = useState<string | null>(null);
  const authToken = alienToken || devToken;
  const [endpoints, setEndpoints] = useState<EndpointCheck[]>([
    { name: "Webhook", url: "/api/webhooks/payment", status: "loading" },
    { name: "Bounties", url: "/api/bounties", status: "loading" },
    { name: "Nearby", url: "/api/nearby", status: "loading" },
    { name: "Notifications", url: "/api/notifications", status: "loading" },
    { name: "Me", url: "/api/me", status: "loading" },
  ]);
  const [isChecking, setIsChecking] = useState(false);

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

  const checkEndpoints = useCallback(async () => {
    if (!authToken) return;
    setIsChecking(true);
    
    const results = await Promise.all(
      endpoints.map(async (ep) => {
        try {
          const res = await fetch(ep.url, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          const data = await res.json().catch(() => null);
          return {
            ...ep,
            status: (res.ok ? "ok" : "error") as "ok" | "error",
            statusCode: res.status,
            response: data,
            error: res.ok ? undefined : `HTTP ${res.status}`,
          };
        } catch (e) {
          return {
            ...ep,
            status: "error" as const,
            error: String(e),
          };
        }
      })
    );
    
    setEndpoints(results);
    setIsChecking(false);
  }, [authToken, endpoints]);

  useEffect(() => {
    if (authToken) checkEndpoints();
  }, [authToken, checkEndpoints]);

  const copyDiagnostics = () => {
    const text = endpoints.map(e => 
      `${e.name}: ${e.status.toUpperCase()} ${e.statusCode || ""} ${e.error || ""}`
    ).join("\n");
    navigator.clipboard.writeText(text + "\n\nBridge: " + (isBridgeAvailable ? "connected" : "dev mode"));
    // Simple toast
    const div = document.createElement("div");
    div.className = "fixed bottom-20 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900 px-4 py-2 text-xs text-white z-50";
    div.textContent = "Copied to clipboard";
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 2000);
  };

  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold font-mono flex items-center gap-1.5">
          <Globe size={14} />
          Endpoint Checks
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={checkEndpoints}
            disabled={isChecking}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-40"
          >
            <RefreshCw size={14} className={isChecking ? "animate-spin" : ""} />
          </button>
          <button
            onClick={copyDiagnostics}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
          >
            <Copy size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-1">
        {endpoints.map((ep) => (
          <div
            key={ep.name}
            className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
              ep.status === "ok"
                ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                : ep.status === "error"
                ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                : "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {ep.status === "ok" ? (
                <CheckCircle size={12} className="text-green-600 dark:text-green-400" />
              ) : ep.status === "error" ? (
                <AlertCircle size={12} className="text-red-600 dark:text-red-400" />
              ) : (
                <Loader2 size={12} className="animate-spin text-zinc-400" />
              )}
              <span className="font-medium">{ep.name}</span>
              <span className="text-zinc-400">{ep.url}</span>
            </div>
            <div className={`${
              ep.status === "ok" ? "text-green-600 dark:text-green-400" :
              ep.status === "error" ? "text-red-600 dark:text-red-400" :
              "text-zinc-400"
            }`}>
              {ep.statusCode || ep.error || ep.status}
            </div>
          </div>
        ))}
      </div>

      {/* Bridge status */}
      <div className="mt-1 rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-800">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">Alien Bridge</span>
          <span className={`font-medium ${isBridgeAvailable ? "text-green-600" : "text-amber-500"}`}>
            {isBridgeAvailable ? "Connected" : "Dev Mode (not in webview)"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function DebugPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 px-3 pt-3">
        <Terminal size={20} className="text-zinc-500" />
        <h1 className="text-lg font-semibold">Debug</h1>
      </div>
      <EndpointDiagnostics />
      <BootLogs />
      <AlienLogViewer />
    </div>
  );
}
