import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-ink/20",
  {
    variants: {
      variant: {
        default: "bg-ink text-white shadow-[0_10px_20px_rgba(15,23,42,0.12)] hover:bg-ink/92 dark:shadow-[0_10px_20px_rgba(2,6,23,0.28)]",
        outline: "border border-ink/10 bg-white text-ink hover:border-ink/20 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950/50 dark:hover:bg-slate-900"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export function Button({
  className,
  variant,
  asChild,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant }), className)} {...props} />;
}
