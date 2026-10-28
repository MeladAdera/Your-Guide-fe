"use client";

import { ChevronDown, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The optional questions of a screen, tucked under "Add more, if you like" so
 * every screen looks short. Opens by itself when one of them already has an
 * answer (a returning person), and stays open once opened.
 */
export function MoreQuestions({ count, defaultOpen, children }: { count: number; defaultOpen?: boolean; children: ReactNode }) {
  const t = useTranslations("onboarding");
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const panel = useId();
  return (
    <div className={cn("rounded-[18px] ring-1 ring-border", open && "ring-0")}>
      {!open && (
        <button
          type="button"
          aria-expanded={false}
          aria-controls={panel}
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-between gap-3 rounded-[18px] px-5 py-4 text-start outline-none hover:bg-accent/50 focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="flex items-center gap-2 font-medium">
            <Plus className="size-4 text-primary" aria-hidden /> {t("addMore")}
          </span>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            {t("optionalCount", { count })} <ChevronDown className="size-4" aria-hidden />
          </span>
        </button>
      )}
      <div id={panel} hidden={!open} className="grid gap-7">
        {children}
      </div>
    </div>
  );
}
