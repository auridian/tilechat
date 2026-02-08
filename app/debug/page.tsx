"use client";

import { useEffect, useState } from "react";
import { AlienLogViewer } from "@/app/alien-logger";

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

export default function DebugPage() {
  return (
    <div className="flex flex-col gap-2">
      <BootLogs />
      <AlienLogViewer />
    </div>
  );
}
