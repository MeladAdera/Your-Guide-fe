import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { JourneyPath } from "./journey-path";

const TOTAL = 7;

/**
 * The card every onboarding screen sits in (docs/features/01-onboarding.md §3).
 * Laptop: the sign-in layout, the questions on the start side and a mint tile
 * on the end side with why the app asks and the path of the seven screens.
 * Phone: no tile; a seven-part step line, the title and the why line.
 */
export async function WizardFrame({
  step,
  saved,
  title,
  why,
  children,
}: {
  /** 1 to 7. */
  step: number;
  /** Which of the seven screens are saved, in order. */
  saved: boolean[];
  title: string;
  why: string;
  children: ReactNode;
}) {
  const t = await getTranslations("onboarding");
  const stepText = t("stepOf", { current: step, total: TOTAL });
  const savedCount = saved.filter(Boolean).length;

  return (
    <div className="flex-1 lg:mx-8 lg:mb-6 lg:grid lg:grid-cols-[minmax(0,1fr)_38%] lg:rounded-[28px] lg:bg-background lg:shadow-[0_30px_80px_-30px_rgb(15_61_53/0.35)]">
      <main id="content" className="min-w-0 px-5 pb-28 lg:px-16 lg:py-14">
        <div className="flex items-center gap-3 lg:hidden">
          <div aria-hidden className="grid flex-1 grid-cols-7 gap-1.5">
            {saved.map((done, i) => (
              <span key={i} className={cn("h-1.5 rounded-full", i === step - 1 ? "bg-primary/45" : done ? "bg-primary" : "bg-border")} />
            ))}
          </div>
          <span className="text-sm whitespace-nowrap text-muted-foreground">{stepText}</span>
        </div>
        <p className="hidden text-sm text-muted-foreground lg:block">{stepText}</p>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-balance lg:mt-2 lg:text-5xl lg:leading-tight">{title}</h1>
        <p className="mt-2 text-muted-foreground lg:hidden">{why}</p>
        <div className="mt-8 max-w-[600px]">{children}</div>
      </main>

      <aside className="hidden p-3 lg:block">
        <div className="sticky top-3 flex min-h-[560px] flex-col rounded-[22px] bg-illustration px-12 pt-14 pb-10 lg:h-[calc(100dvh-8rem)]">
          <p className="text-sm text-muted-foreground">{t("whyWeAsk")}</p>
          <p className="mt-2 max-w-[20ch] text-4xl leading-tight font-semibold tracking-tight text-balance">{why}</p>
          <JourneyPath saved={saved} current={step - 1} className="mt-auto" />
          <p className="mt-4 text-sm text-muted-foreground">{t("savedOf", { saved: savedCount, total: TOTAL })}</p>
        </div>
      </aside>
    </div>
  );
}
