"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBusyState } from "@/hooks/useBusyState";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/configs", label: "Browse" },
  { href: "/pull", label: "Pull" },
  { href: "/push", label: "Push" },
  { href: "/compare", label: "Compare" },
  { href: "/promote", label: "Promote" },
  { href: "/logs", label: "Logs" },
  { href: "/history", label: "History" },
  { href: "/environments", label: "Environments" },
  { href: "/settings", label: "Settings" },
];

export function NavBar() {
  const { busy } = useBusyState();
  const pathname = usePathname();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="mx-auto px-6 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link href="/" className={cn("font-semibold text-sm", busy ? "text-slate-400 pointer-events-none" : "text-slate-900")}>
              AIC Config Pipeline
            </Link>
            <nav className="flex items-center gap-1">
              {NAV_ITEMS.map(({ href, label }) => {
                const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-disabled={busy}
                    tabIndex={busy ? -1 : undefined}
                    className={cn(
                      "px-3 py-1.5 rounded text-sm transition-colors",
                      busy
                        ? "text-slate-300 pointer-events-none cursor-not-allowed"
                        : isActive
                        ? "text-slate-900 bg-slate-100 font-medium"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
