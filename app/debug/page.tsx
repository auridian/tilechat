"use client";

import { useAlien, useLaunchParams } from "@alien_org/react";

export default function DebugPage() {
  const { authToken, isBridgeAvailable, contractVersion } = useAlien();
  const launchParams = useLaunchParams();

  return (
    <div className="flex flex-col gap-3 text-xs font-mono">
      <h1 className="text-lg font-bold">Debug</h1>

      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
        <p><strong>Bridge available:</strong> {String(isBridgeAvailable)}</p>
        <p><strong>Auth token:</strong> {authToken ? authToken.slice(0, 20) + "..." : "none"}</p>
        <p><strong>Contract version:</strong> {contractVersion ?? "none"}</p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
        <p className="mb-1 font-bold">Launch Params:</p>
        {launchParams ? (
          <pre className="whitespace-pre-wrap break-all">
            {JSON.stringify({
              authToken: launchParams.authToken ? "present" : "missing",
              contractVersion: launchParams.contractVersion,
              hostVersion: launchParams.hostAppVersion,
              platform: launchParams.platform,
              startParam: launchParams.startParam,
            }, null, 2)}
          </pre>
        ) : (
          <p>Not available (not running in Alien app)</p>
        )}
      </div>

      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
        <p className="mb-1 font-bold">Environment:</p>
        <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV}</p>
        <p><strong>User Agent:</strong> {typeof navigator !== "undefined" ? navigator.userAgent : "N/A"}</p>
      </div>
    </div>
  );
}
