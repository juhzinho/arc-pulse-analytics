import { cn } from "@/lib/utils";

export function SectionHeader({
  eyebrow,
  title,
  description,
  className
}: {
  eyebrow: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <section className={cn("panel-shell rounded-[28px] px-6 py-7 sm:px-8 sm:py-8", className)}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-3 max-w-4xl text-[2rem] font-semibold tracking-[-0.055em] text-ink sm:text-[2.45rem]">{title}</h2>
      {description ? <p className="mt-4 max-w-3xl text-[1rem] leading-8 text-ink/66 sm:text-[1.05rem]">{description}</p> : null}
    </section>
  );
}
