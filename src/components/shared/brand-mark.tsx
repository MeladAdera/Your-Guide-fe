import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The logo (a path that bends forward and a point on it) and the name. The
 * logo file uses one green that reads on both the light and the dark ground.
 */
export function BrandMark({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5 text-lg font-semibold tracking-tight whitespace-nowrap", className)}>
      <Image src="/images/logo.svg" alt="" width={26} height={26} unoptimized className="rtl:-scale-x-100" />
      {name}
    </span>
  );
}
