"use client";

import { Search } from "lucide-react";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function AddressSearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const window = searchParams.get("window") ?? "24h";
  const direction = searchParams.get("direction") ?? "all";

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row"
      onSubmit={(event) => {
        event.preventDefault();
        const params = new URLSearchParams();
        if (value.trim()) params.set("q", value.trim());
        params.set("window", window);
        params.set("direction", direction);
        router.push(`/address?${params.toString()}` as Route);
      }}
    >
      <label className="sr-only" htmlFor="address-search">
        Search address
      </label>
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
        <input
          id="address-search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Paste a wallet or contract address"
          className="h-12 w-full rounded-[16px] border border-ink/10 bg-white/90 pl-11 pr-4 text-[1rem] text-ink outline-none transition placeholder:text-ink/42 focus:border-cyan/40 focus:ring-2 focus:ring-cyan/15 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/34"
        />
      </div>
      <button
        type="submit"
        className="inline-flex h-12 items-center justify-center rounded-[16px] bg-cyan px-5 text-[0.98rem] font-semibold text-slate-950 transition hover:brightness-105"
      >
        View activity
      </button>
    </form>
  );
}
