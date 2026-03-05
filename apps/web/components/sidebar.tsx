"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { Activity, ArrowUpRight, BarChart3, BookOpen, LayoutDashboard, Search, Shield, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { GlobalSearch } from "./global-search";

const items: Array<{ href: Route; label: string; icon: typeof LayoutDashboard }> = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/address", label: "Address Lookup", icon: Search },
  { href: "/contracts", label: "Top Contracts", icon: Activity },
  { href: "/forecasts", label: "Forecasts", icon: BarChart3 },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/methodology", label: "Methodology", icon: BookOpen }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar-dark grid-shell rounded-[28px] p-4 text-white lg:sticky lg:top-5 lg:h-[calc(100vh-40px)]">
      <div className="sidebar-section mb-5 rounded-[22px] p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-cyan">Arc Pulse</p>
            <h1 className="mt-2 text-[1.9rem] font-extrabold tracking-[-0.045em] text-white">Analytics</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-white">
              <Shield className="h-4 w-4" />
            </div>
          </div>
        </div>
        <p className="sidebar-copy mt-4">
          Arc Network telemetry with forecasting, resolution and analyst scoring.
        </p>
      </div>

      <div className="sidebar-section mb-5 rounded-[22px] p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="sidebar-label">Network mode</span>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/12 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
            Live
          </span>
        </div>
        <p className="sidebar-copy mt-4">
          SSE summaries, indexed blocks, and forecasting resolution from Arc testnet rollups.
        </p>
      </div>

      <div className="sidebar-section mb-5 rounded-[22px] p-4">
        <div className="flex items-center justify-between text-white/64">
          <span className="sidebar-label">Coverage</span>
          <ArrowUpRight className="h-4 w-4" />
        </div>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between text-[0.98rem]">
            <span className="text-white/84">Metrics API</span>
            <span className="text-[0.92rem] font-semibold text-white">v1</span>
          </div>
          <div className="flex items-center justify-between text-[0.98rem]">
            <span className="text-white/84">Forecast engine</span>
            <span className="text-[0.92rem] font-semibold text-white">active</span>
          </div>
          <div className="flex items-center justify-between text-[0.98rem]">
            <span className="text-white/84">Realtime stream</span>
            <span className="text-[0.92rem] font-semibold text-white">SSE</span>
          </div>
        </div>
      </div>

      <div className="mb-5">
        <GlobalSearch />
      </div>

      <nav className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-[18px] px-3 py-3.5 text-[0.98rem] font-medium transition",
                active
                  ? "border border-cyan/25 bg-cyan/10 text-white"
                  : "border border-transparent text-white/82 hover:bg-white/6 hover:text-white"
              )}
            >
              <span className={cn("rounded-xl border p-2 transition", active ? "border-cyan/20 bg-cyan/15 text-cyan" : "border-white/10 bg-white/6 text-white/72 group-hover:border-white/14")}>
                <Icon className="h-4 w-4" />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
