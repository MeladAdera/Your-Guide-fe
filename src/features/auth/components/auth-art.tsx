import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The sign-in pages' picture: a winding track with a cobalt ball resting on it.
 * A plain static image, one file per theme, so a designer can replace the
 * files without touching code. Decorative: empty alt. Mirrored in Arabic so the
 * track runs in reading direction. When the frame is wider than the picture
 * (the phone band) the crop centres on the ball.
 */
export function AuthArt({ className, priority }: { className?: string; priority?: boolean }) {
  const img = "object-cover object-[50%_66%] rtl:-scale-x-100";
  return (
    <div aria-hidden className={cn("absolute inset-0", className)}>
      <Image src="/images/auth/path-light.svg" alt="" fill unoptimized priority={priority} sizes="50vw" className={cn(img, "dark:hidden")} />
      <Image src="/images/auth/path-dark.svg" alt="" fill unoptimized priority={priority} sizes="50vw" className={cn(img, "hidden dark:block")} />
    </div>
  );
}
