"use client";

import { useEffect, useState } from "react";
import { useAlien, useLaunchParams } from "@alien_org/react";

interface LogEntry {
  time: string;
  level: "info" | "warn" | "error";
  msg: string;
}

const logs: LogEntry[] = [];

function log(level: LogEntry["level"], msg: string) {
  const entry = { time: new Date().toISOString().slice(11, 23), level, msg };
  logs.push(entry);
  const prefix = `[alien-debug][${entry.time}]`;
  if (level === "error") console.error(prefix, msg);
  else if (level === "warn") console.warn(prefix, msg);
  else console.log(prefix, msg);
}

function checkWindowGlobals() {
  if (typeof window === "undefined") {
    log("warn", "window is undefined (SSR)");
    return;
  }

  log("info", `window.__ALIEN_AUTH_TOKEN__: ${typeof (window as any).__ALIEN_AUTH_TOKEN__ === "string" ? "present (" + ((window as any).__ALIEN_AUTH_TOKEN__ as string).slice(0, 20) + "...)" : String((window as any).__ALIEN_AUTH_TOKEN__)}`);
  log("info", `window.__ALIEN_CONTRACT_VERSION__: ${(window as any).__ALIEN_CONTRACT_VERSION__ ?? "undefined"}`);
  log("info", `window.__ALIEN_HOST_VERSION__: ${(window as any).__ALIEN_HOST_VERSION__ ?? "undefined"}`);
  log("info", `window.__ALIEN_PLATFORM__: ${(window as any).__ALIEN_PLATFORM__ ?? "undefined"}`);
  log("info", `window.__ALIEN_START_PARAM__: ${(window as any).__ALIEN_START_PARAM__ ?? "undefined"}`);
  log("info", `window.__ALIEN_SAFE_AREA_INSETS__: ${JSON.stringify((window as any).__ALIEN_SAFE_AREA_INSETS__) ?? "undefined"}`);
  log("info", `window.__miniAppsBridge__: ${(window as any).__miniAppsBridge__ ? "present (postMessage: " + typeof (window as any).__miniAppsBridge__?.postMessage + ")" : "undefined"}`);

  const stored = sessionStorage.getItem("alien/launchParams");
  log("info", `sessionStorage alien/launchParams: ${stored ? "present (" + stored.slice(0, 60) + "...)" : "empty"}`);

  log("info", `navigator.userAgent: ${navigator.userAgent}`);
  log("info", `location.href: ${location.href}`);
  log("info", `document.readyState: ${document.readyState}`);
}

function interceptMessages() {
  if (typeof window === "undefined") return;

  const origPostMessage = window.postMessage.bind(window);

  window.addEventListener("message", (event) => {
    let data = event.data;
    if (typeof data === "string") {
      try { data = JSON.parse(data); } catch { return; }
    }
    if (data && typeof data === "object" && "type" in data && "name" in data) {
      log("info", `[bridge msg received] type=${data.type} name=${data.name} payload=${JSON.stringify(data.payload).slice(0, 200)}`);
    }
  });

  const bridge = (window as any).__miniAppsBridge__;
  if (bridge && typeof bridge.postMessage === "function") {
    const origBridgePost = bridge.postMessage.bind(bridge);
    bridge.postMessage = (msg: string) => {
      log("info", `[bridge msg sent] ${msg.slice(0, 200)}`);
      return origBridgePost(msg);
    };
  }
}

export function AlienLogger() {
  const alien = useAlien();
  const launchParams = useLaunchParams();
  const [, setTick] = useState(0);

  useEffect(() => {
    log("info", "=== AlienLogger mounted ===");
    checkWindowGlobals();
    interceptMessages();

    log("info", `useAlien() => isBridgeAvailable: ${alien.isBridgeAvailable}, authToken: ${alien.authToken ? "present" : "undefined"}, contractVersion: ${alien.contractVersion ?? "undefined"}`);
    log("info", `useLaunchParams() => ${launchParams ? JSON.stringify({ authToken: launchParams.authToken ? "present" : "missing", platform: launchParams.platform, contractVersion: launchParams.contractVersion, hostVersion: launchParams.hostAppVersion, startParam: launchParams.startParam }) : "undefined (not in Alien)"}`);

    // Force re-render to capture any late updates
    const timer = setTimeout(() => {
      log("info", "=== Late check (2s after mount) ===");
      checkWindowGlobals();
      setTick(1);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Log whenever alien context changes
  useEffect(() => {
    log("info", `[alien context update] isBridgeAvailable: ${alien.isBridgeAvailable}, authToken: ${alien.authToken ? "present" : "undefined"}`);
  }, [alien.isBridgeAvailable, alien.authToken]);

  return null;
}

export function AlienLogViewer() {
  const alien = useAlien();
  const launchParams = useLaunchParams();
  const [entries, setEntries] = useState<LogEntry[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setEntries([...logs]);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-2 p-3 text-[10px] font-mono">
      <h2 className="text-sm font-bold">Alien Debug Log</h2>

      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-700 dark:bg-zinc-800">
        <p><strong>Bridge:</strong> {String(alien.isBridgeAvailable)}</p>
        <p><strong>Token:</strong> {alien.authToken ? alien.authToken.slice(0, 30) + "..." : "none"}</p>
        <p><strong>Contract:</strong> {alien.contractVersion ?? "none"}</p>
        <p><strong>Platform:</strong> {launchParams?.platform ?? "none"}</p>
        <p><strong>Host ver:</strong> {launchParams?.hostAppVersion ?? "none"}</p>
      </div>

      <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-zinc-200 bg-black p-2 text-green-400 dark:border-zinc-700">
        {entries.length === 0 ? (
          <p className="text-zinc-500">No logs yet...</p>
        ) : (
          entries.map((e, i) => (
            <div key={i} className={`${e.level === "error" ? "text-red-400" : e.level === "warn" ? "text-yellow-400" : "text-green-400"}`}>
              <span className="text-zinc-500">{e.time}</span>{" "}
              <span className={`font-bold ${e.level === "error" ? "text-red-500" : e.level === "warn" ? "text-yellow-500" : "text-green-500"}`}>[{e.level}]</span>{" "}
              {e.msg}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
