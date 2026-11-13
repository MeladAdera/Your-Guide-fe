import { ArrowRight, ChevronRight, Timer } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import type { Session } from "@/lib/api/types";

/**
 * An open focus session, above everything on Home (docs/features/04-home.md
 * §3.1): running, or stopped with its review still owed. While it is open
 * nothing else can start (handoff §11), so it takes the primary button.
 */
export async function SessionBanner({ session }: { session: Session }) {
  const t = await getTranslations("home.session");
  const running = session.endedAt === null;

  return (
    <section aria-labelledby="session-banner-title" className="rounded-[22px] bg-primary/10 p-5 ring-1 ring-primary/30 lg:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <Timer aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
          <div className="min-w-0">
            <h2 id="session-banner-title" className="font-semibold">
              {running ? t("running") : t("awaiting")}
            </h2>
            <p dir="auto" className="mt-1 font-medium">
              {session.step.title}
            </p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
              <span dir="auto">{session.goal.title}</span>
              <ChevronRight aria-hidden className="size-3.5 shrink-0 rtl:rotate-180" />
              <span dir="auto">{session.task.title}</span>
            </p>
          </div>
        </div>
        <Button asChild className="h-12 w-full shrink-0 rounded-[10px] px-5 text-base sm:w-auto">
          <Link href="/session">
            {running ? t("back") : t("review")} <ArrowRight aria-hidden className="rtl:rotate-180" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
