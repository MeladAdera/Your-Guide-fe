import { cn } from "@/lib/utils";

/** The path mark and the name: a line that bends forward and a point on it. */
export function BrandMark({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5 text-[17px] font-semibold tracking-tight", className)}>
      <svg aria-hidden focusable="false" viewBox="0 0 26 26" className="size-6 rtl:-scale-x-100">
        <path d="M3 21 C 9 21, 9 5, 15 5 S 23 12, 23 12" fill="none" stroke="var(--primary)" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="15" cy="5" r="3" fill="var(--foreground)" />
      </svg>
      {name}
    </span>
  );
}
