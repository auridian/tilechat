"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Tab {
  label: string;
  href: string;
  icon: (active: boolean) => React.ReactNode;
}

const tabs: Tab[] = [
  {
    label: "Home",
    href: "/",
    icon: (active) => (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth={active ? 2 : 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      >
        <path d="M3 10.5L12 3l9 7.5" />
        <path d="M5 10v9a1 1 0 001 1h3.5v-5a1.5 1.5 0 013 0v5H16a1 1 0 001-1v-9" />
      </svg>
    ),
  },
  {
    label: "Explore",
    href: "/explore",
    icon: (active) => (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth={active ? 2 : 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      >
        <circle cx="12" cy="12" r="9" />
        <polygon
          points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88"
          fill={active ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={active ? 1.5 : 1.5}
        />
      </svg>
    ),
  },
  {
    label: "Profile",
    href: "/profile",
    icon: (active) => (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth={active ? 2 : 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      >
        <circle cx="12" cy="9" r="3.5" />
        <path d="M5.5 20.5c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5" />
      </svg>
    ),
  },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="border-t border-zinc-200 bg-white/80 pb-safe-bottom pl-safe-left pr-safe-right backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-md items-stretch">
          {tabs.map((tab) => {
            const isActive =
              tab.href === "/"
                ? pathname === "/"
                : pathname.startsWith(tab.href);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative flex flex-1 flex-col items-center gap-0.5 pb-2 pt-2.5 transition-colors duration-150 ${
                  isActive
                    ? "text-zinc-900 dark:text-zinc-100"
                    : "text-zinc-400 dark:text-zinc-500"
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 h-[2px] w-6 -translate-x-1/2 rounded-full bg-zinc-900 dark:bg-zinc-100" />
                )}
                {tab.icon(isActive)}
                <span
                  className={`text-[10px] leading-tight ${
                    isActive ? "font-semibold" : "font-medium"
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
