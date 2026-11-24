import Link from "next/link";
import { cn } from "@/lib/utils";

export function Brand({ className }: { className?: string }) {
  return (
    <Link
      href="/dashboard"
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-md font-semibold tracking-tight focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className,
      )}
    >
      <span
        aria-hidden
        className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground"
      >
        L
      </span>
      <span>LeaveTrack</span>
    </Link>
  );
}
