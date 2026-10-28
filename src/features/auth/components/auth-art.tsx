import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The sign-in illustration: a winding path, a white ball, a flag. Decorative.
 * Replaced by the sliding auth shell in the next step.
 */
export function AuthArt({ className, preload }: { className?: string; preload?: boolean }) {
  return (
    <div aria-hidden className={cn("absolute inset-0 bg-illustration", className)}>
      <Image src="/images/auth-journey.png" alt="" fill preload={preload} sizes="50vw" className="object-cover object-[85%_50%] dark:brightness-[0.6] dark:saturate-[0.8]" />
    </div>
  );
}
