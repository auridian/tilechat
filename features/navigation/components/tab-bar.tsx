"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Compass, User } from "lucide-react";

interface Tab {
  label: string;
  href: string;
  icon: typeof House;
}

const tabs: Tab[] = [
  { label: "Home", href: "/", icon: House },
  { label: "Explore", href: "/explore", icon: Compass },
  { label: "Profile", href: "/profile", icon: User },
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
                <tab.icon
                  size={22}
                  strokeWidth={isActive ? 2 : 1.5}
                />
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
