"use client";

import { useCurrentUser } from "../hooks/use-current-user";

interface FieldProps {
  label: string;
  value: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString();
}

function Skeleton() {
  return (
    <div className="w-full rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 h-4 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-4 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-4 w-24 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function UserInfo() {
  const { user, loading, error, isAuthenticated } = useCurrentUser();

  if (loading) {
    return <Skeleton />;
  }

  return (
    <div className="w-full rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
        User Info
      </h2>
      {error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : !isAuthenticated ? (
        <p className="text-sm text-zinc-500">
          Open this app in the Alien app to authenticate.
        </p>
      ) : user ? (
        <dl className="space-y-3 text-sm">
          <Field label="User ID" value={user.id} />
          <Field label="Alien ID" value={user.alienId} />
          <Field label="Created" value={formatDate(user.createdAt)} />
        </dl>
      ) : null}
    </div>
  );
}

function Field({ label, value }: FieldProps) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-zinc-600 dark:text-zinc-400">{label}</dt>
      <dd className="font-mono text-xs text-zinc-900 dark:text-zinc-100">
        {value.length > 16 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value}
      </dd>
    </div>
  );
}
