"use client";

import type { Route } from "next";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function GlobalSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");

  return (
    <form
      className="sidebar-section rounded-[22px] p-3"
      onSubmit={(event) => {
        event.preventDefault();
        const query = value.trim();
        if (!query) return;
        router.push(`/search?q=${encodeURIComponent(query)}` as Route);
      }}
    >
      <label className="sidebar-label mb-3 block">Global Search</label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Address, tx hash or block"
          className="h-11 w-full rounded-[16px] border border-white/10 bg-white/6 pl-10 pr-3 text-[0.96rem] text-white outline-none transition placeholder:text-white/36 focus:border-cyan/35 focus:bg-white/8"
        />
      </div>
    </form>
  );
}
