"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { FormError } from "@/components/shared/form-error";
import { JourneyPath } from "@/features/onboarding/components/journey-path";
import { MoreQuestions } from "@/features/onboarding/components/more-questions";
import { PrimaryAction, WizardFooter } from "@/features/onboarding/components/wizard-footer";
import { isApiError } from "@/lib/api/errors";
import { ONBOARDING_SCREEN_PATHS, type Goal, type LifeValue } from "@/lib/api/types";
import { fillFromDraft } from "@/lib/drafts";
import { useDraft } from "@/lib/use-draft";
import { cn } from "@/lib/utils";
import { goalsApi } from "../api";
import { goalDefaults, goalPayload, goalSchema, type GoalValues } from "../goal-form";
import { useGoalSave } from "../use-goal-save";
import { GoalQuestion } from "./goal-question";

/** What the person already wrote in onboarding, shown back to them while they write the goal. */
export interface OwnWords {
  values: LifeValue[];
  becoming: string | null;
  change: string | null;
  postpone: string | null;
}

const ALL_SAVED = Array<boolean>(7).fill(true);
const IMAGE_TONE = "dark:brightness-[0.45] dark:saturate-[0.7]";
const CARD = "flex-1 lg:mx-8 lg:mb-6 lg:grid lg:grid-cols-[minmax(0,1fr)_38%] lg:rounded-[28px] lg:bg-background lg:shadow-[0_30px_80px_-30px_rgb(15_61_53/0.35)]";
const TILE = "sticky top-3 flex min-h-[560px] flex-col overflow-hidden rounded-[22px] bg-illustration lg:h-[calc(100dvh-8rem)]";

/**
 * The wizard's last step (docs/features/02-goals.md §3): the four goal
 * questions beside the person's own words, the goal taking shape at the flag
 * as they type; after saving, the same card becomes the arrival moment.
 */
export function FirstGoal({ words, back }: { words: OwnWords; back: string }) {
  const [created, setCreated] = useState<Goal | null>(null);
  return created ? <Arrival goal={created} /> : <GoalForm words={words} back={back} onCreated={setCreated} />;
}

function GoalForm({ words, back, onCreated }: { words: OwnWords; back: string; onCreated: (goal: Goal) => void }) {
  const t = useTranslations("goals");
  const tv = useTranslations("onboarding.values.names");
  const locale = useLocale();
  const router = useRouter();
  const form = useForm<GoalValues>({ resolver: zodResolver(goalSchema), defaultValues: goalDefaults(null) });
  const { restored, discard } = useDraft("goal", form, (draft) => goalDefaults(fillFromDraft(null, draft)));
  const { submit, saving, formError } = useGoalSave({
    form,
    save: goalsApi.create,
    onSaved: (goal) => {
      discard();
      onCreated(goal);
    },
    // The API is the judge of "onboarding first": send the person to the first screen it names.
    onError: (e) => {
      if (!isApiError(e) || e.code !== "goal.onboarding_required" || !e.missing[0]) return false;
      router.push(`/onboarding/${ONBOARDING_SCREEN_PATHS[e.missing[0]]}`);
      return true;
    },
  });

  // The values this goal serves: not saved (the API has no field), they shape the why's starter.
  const [serves, setServes] = useState<LifeValue[]>([]);
  const toggle = (v: LifeValue) => setServes((s) => (s.includes(v) ? s.filter((x) => x !== v) : words.values.filter((x) => x === v || s.includes(x))));
  const servesText = new Intl.ListFormat(locale, { type: "conjunction" }).format(serves.map((v) => tv(v)));
  const whyStarter = serves.length ? t("starters.whyValues", { values: servesText, count: serves.length }) : t("starters.why");

  const title = useWatch({ control: form.control, name: "title" })?.trim();
  const { errors } = form.formState;
  const revealMore = Boolean(restored?.firstOutcome) || Boolean(errors.firstOutcome);

  return (
    <div className={CARD}>
      <main id="content" className="min-w-0 px-5 pb-28 lg:px-16 lg:py-14">
        <p className="text-sm text-muted-foreground">{t("first.eyebrow")}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance lg:text-5xl lg:leading-tight">{t("first.title")}</h1>
        <p className="mt-2 max-w-[60ch] text-muted-foreground lg:mt-3 lg:text-lg">{t("first.intro")}</p>

        {/* Phones have no tile: the same words sit in a mint panel that opens on tap. */}
        <details className="group mt-6 rounded-[18px] bg-illustration lg:hidden">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
            {t("first.ownWords")}
            <span aria-hidden className="text-muted-foreground transition-transform group-open:rotate-180">
              ▾
            </span>
          </summary>
          <div className="px-5 pb-5">
            <OwnWordsList words={words} />
          </div>
        </details>

        <form
          noValidate
          onSubmit={form.handleSubmit((values) => submit(goalPayload(values)))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              e.currentTarget.requestSubmit();
            }
          }}
          className="mt-8 grid max-w-[600px] gap-7"
        >
          {words.values.length > 0 && (
            <fieldset>
              <legend className="text-[17px] leading-snug font-medium">{t("first.valuesLegend")}</legend>
              <p className="mt-1 text-sm text-muted-foreground">{t("first.valuesHint")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {words.values.map((v) => {
                  const on = serves.includes(v);
                  return (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle(v)}
                      className={cn(
                        "inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-[15px] ring-1 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                        on ? "bg-primary text-primary-foreground ring-primary" : "bg-card ring-input hover:bg-accent",
                      )}
                    >
                      {on && <Check className="size-4" aria-hidden />}
                      {tv(v)}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          <GoalQuestion form={form} name="title" id="goal-title" large />
          <GoalQuestion form={form} name="whyItMatters" id="goal-why" starter={whyStarter} large />
          <GoalQuestion
            form={form}
            name="obstacle"
            id="goal-obstacle"
            starter={t("starters.obstacle")}
            why={words.postpone ? t("earlier", { text: words.postpone }) : undefined}
            large
          />
          <MoreQuestions count={1} reveal={revealMore}>
            <GoalQuestion form={form} name="firstOutcome" id="goal-firstOutcome" large />
          </MoreQuestions>

          <FormError error={formError} />
          <WizardFooter
            secondary={{ href: back, label: t("first.back") }}
            primary={
              <PrimaryAction type="submit" disabled={saving}>
                {t("first.save")}
              </PrimaryAction>
            }
          />
        </form>
      </main>

      <aside className="hidden p-3 lg:block">
        <div className={cn(TILE, "px-12 pt-12 pb-9")}>
          <p className="text-sm text-muted-foreground">{t("first.ownWords")}</p>
          {/* Their words take the room that is left; the flag and the goal below always stay in view. */}
          <div className="mt-4 min-h-0 flex-1 overflow-hidden">
            <OwnWordsList words={words} large />
          </div>
          <div className="shrink-0 pt-6">
            <JourneyPath saved={ALL_SAVED} current={-1} className="h-24 w-auto" />
            <p className="mt-3 text-sm text-muted-foreground">{t("first.flag")}</p>
            {/* Live, but not announced: it repeats what is being typed. */}
            <p dir="auto" className={cn("mt-1 line-clamp-2 text-2xl leading-snug font-semibold tracking-tight text-balance", !title && "text-muted-foreground/70")}>
              {title || t("first.preview")}
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}

/** Their values as chips, then the person they want to become and what they would change, in their words. */
function OwnWordsList({ words, large }: { words: OwnWords; large?: boolean }) {
  const t = useTranslations("goals.first");
  const tv = useTranslations("onboarding.values.names");
  return (
    <div className="grid gap-5">
      {words.values.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {words.values.map((v) => (
            <li key={v} className="rounded-full bg-card/80 px-3.5 py-1.5 text-sm font-medium">
              {tv(v)}
            </li>
          ))}
        </ul>
      )}
      {words.becoming && <Quote label={t("becoming")} large={large}>{words.becoming}</Quote>}
      {words.change && <Quote label={t("change")}>{words.change}</Quote>}
    </div>
  );
}

function Quote({ label, large, children }: { label: string; large?: boolean; children: ReactNode }) {
  return (
    <figure>
      <figcaption className="text-sm text-muted-foreground">{label}</figcaption>
      <blockquote dir="auto" className={cn("mt-1 line-clamp-3 leading-snug", large ? "text-2xl font-semibold tracking-tight text-balance" : "text-base")}>
        {children}
      </blockquote>
    </figure>
  );
}

/** Right after saving: the goal as the heading, its why, and one way on. The tile shows the journey picture with its flag. */
function Arrival({ goal }: { goal: Goal }) {
  const t = useTranslations("goals");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    window.scrollTo({ top: 0 });
    heading.current?.focus();
  }, []);

  return (
    <div className={CARD}>
      <main id="content" className="min-w-0 px-5 pb-28 lg:px-16 lg:py-14">
        <div aria-hidden className="relative mb-8 h-52 overflow-hidden rounded-[22px] bg-illustration lg:hidden">
          <Image src="/images/auth-journey.png" alt="" fill sizes="100vw" className={cn("object-cover object-[100%_0%]", IMAGE_TONE)} />
        </div>
        <p className="text-sm text-muted-foreground">{t("first.arrival.eyebrow")}</p>
        <h1 ref={heading} tabIndex={-1} dir="auto" className="mt-2 text-3xl font-semibold tracking-tight text-balance outline-none lg:text-5xl lg:leading-tight">
          {goal.title}
        </h1>
        <dl className="mt-8 grid max-w-[600px] gap-6">
          <Detail label={t("first.arrival.why")} text={goal.whyItMatters} />
          {goal.obstacle && <Detail label={t("card.ifHard")} text={goal.obstacle} />}
          {goal.firstOutcome && <Detail label={t("card.firstSign")} text={goal.firstOutcome} />}
        </dl>
        <div className="max-w-[600px]">
          <p className="mt-10 rounded-[18px] bg-accent px-5 py-4 text-accent-foreground">{t("first.arrival.next")}</p>
          {/* The next real step is breaking the goal down; Home stays as the quiet second choice. */}
          <WizardFooter
            secondary={{ href: "/home", label: t("first.arrival.home") }}
            primary={<PrimaryAction href={`/goals/${goal.id}`}>{t("first.arrival.tasks")}</PrimaryAction>}
          />
        </div>
      </main>

      <aside className="hidden p-3 lg:block">
        <div className={TILE}>
          <p className="relative z-10 max-w-[16ch] px-12 pt-14 text-4xl leading-tight font-semibold tracking-tight text-balance">{t("first.arrival.tile")}</p>
          <div aria-hidden className="absolute -inset-x-[10%] top-[30%] bottom-0 [mask-image:linear-gradient(to_bottom,transparent,black_18%)]">
            <Image src="/images/auth-journey.png" alt="" fill sizes="40vw" className={cn("object-cover object-[100%_50%]", IMAGE_TONE)} />
          </div>
        </div>
      </aside>
    </div>
  );
}

function Detail({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd dir="auto" className="mt-1 text-lg leading-relaxed whitespace-pre-line">
        {text}
      </dd>
    </div>
  );
}
