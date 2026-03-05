import { cn } from "@/lib/utils";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("h-11 w-full rounded-xl border border-ink/10 bg-white px-4 text-sm text-ink outline-none ring-0 placeholder:text-ink/35 focus:border-cyan focus:bg-white dark:border-white/10 dark:bg-slate-950/60 dark:text-ink dark:placeholder:text-white/28 dark:focus:bg-slate-950", props.className)} {...props} />;
}
