import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

/**
 * Back (or Skip for now on the first screen) and the one primary action.
 * Fixed to the bottom of the screen on phones so it is always in reach; at the
 * end of the questions on a laptop.
 */
export function WizardFooter({
  secondary,
  primary,
}: {
  /** Back or Skip for now: a link, or nothing. */
  secondary?: { href: string; label: string };
  /** The primary button, usually the form's submit. */
  primary: ReactNode;
}) {
  return (
    <div className="mt-8 flex items-center justify-between gap-3 max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-10 max-lg:border-t max-lg:border-border max-lg:bg-background max-lg:px-5 max-lg:pt-3 max-lg:pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      {secondary ? (
        <Button asChild variant="ghost" className="h-12 px-4 text-base">
          <Link href={secondary.href}>{secondary.label}</Link>
        </Button>
      ) : (
        <span />
      )}
      {primary}
    </div>
  );
}

const PRIMARY = "h-12 rounded-[10px] px-6 text-base";
const arrow = <ArrowRight className="rtl:-scale-x-100" aria-hidden />;

/** The primary action's look: 48px, the sign-in radius, an arrow because it moves forward. A link when given `href`. */
export function PrimaryAction({ href, children, ...props }: React.ComponentProps<typeof Button> & { href?: string }) {
  if (href) {
    return (
      <Button asChild className={PRIMARY} {...props}>
        <Link href={href}>
          {children}
          {arrow}
        </Link>
      </Button>
    );
  }
  return (
    <Button className={PRIMARY} {...props}>
      {children}
      {arrow}
    </Button>
  );
}
