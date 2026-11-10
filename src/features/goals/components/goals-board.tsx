"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { useUser } from "@/components/shared/user-provider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { errorMessageKey } from "@/lib/api/errors";
import type { Goal } from "@/lib/api/types";
import { GOALS_KEY, goalsApi, useGoals } from "../api";
import { DeleteGoalDialog } from "./delete-goal-dialog";
import { GoalDialog } from "./goal-dialog";

/**
 * /goals (docs/features/02-goals.md §3): Active and Archived tabs, a card per
 * goal with its why, and quiet text actions. New and Edit open the goal
 * dialog; Delete asks first and may turn into an archive offer.
 */
export function GoalsBoard({ active, archived }: { active: Goal[]; archived: Goal[] }) {
  const t = useTranslations("goals");
  const activeQuery = useGoals(false, active);
  const archivedQuery = useGoals(true, archived);
  const [editing, setEditing] = useState<{ goal: Goal | null } | null>(null);
  const [deleting, setDeleting] = useState<Goal | null>(null);
  const newGoal = () => setEditing({ goal: null });

  return (
    <div className="grid gap-6 lg:gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader title={t("title")} intro={t("intro")} />
        <Button onClick={newGoal} className="h-12 rounded-[10px] px-5 text-base">
          <Plus aria-hidden /> {t("newGoal")}
        </Button>
      </div>

      <Tabs defaultValue="active" className="max-w-[720px] gap-5">
        <TabsList className="h-11 rounded-full p-1">
          <TabsTrigger value="active" className="rounded-full px-4">
            {t("tabs.active", { count: activeQuery.data.length })}
          </TabsTrigger>
          <TabsTrigger value="archived" className="rounded-full px-4">
            {t("tabs.archived", { count: archivedQuery.data.length })}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {activeQuery.data.length === 0 ? (
            <Empty text={t("empty.active")}>
              <Button variant="outline" onClick={newGoal} className="mt-4 h-12 rounded-[10px] px-5 text-base">
                <Plus aria-hidden /> {t("newGoal")}
              </Button>
            </Empty>
          ) : (
            <ul className="grid gap-3">
              {activeQuery.data.map((goal) => (
                <li key={goal.id}>
                  <GoalCard goal={goal} onEdit={() => setEditing({ goal })} onDelete={() => setDeleting(goal)} />
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="archived">
          {archivedQuery.data.length === 0 ? (
            <Empty text={t("empty.archived")} />
          ) : (
            <ul className="grid gap-3">
              {archivedQuery.data.map((goal) => (
                <li key={goal.id}>
                  <GoalCard goal={goal} />
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      <GoalDialog goal={editing?.goal ?? null} open={editing !== null} onOpenChange={(open) => !open && setEditing(null)} />
      <DeleteGoalDialog goal={deleting} onOpenChange={(open) => !open && setDeleting(null)} />
    </div>
  );
}

function Empty({ text, children }: { text: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-[22px] border border-dashed border-input px-6 py-10 text-center">
      <p className="text-muted-foreground">{text}</p>
      {children}
    </div>
  );
}

/** A goal with its why. Active goals carry Edit, Archive and Delete; archived ones are read-only with Unarchive. */
function GoalCard({ goal, onEdit, onDelete }: { goal: Goal; onEdit?: () => void; onDelete?: () => void }) {
  const t = useTranslations("goals");
  const format = useFormatter();
  const user = useUser();
  const tAll = useTranslations();
  const queryClient = useQueryClient();
  const isArchived = goal.archivedAt !== null;

  // Archive and unarchive are rare, deliberate moves between tabs: no optimistic update, just refresh both lists.
  // A refusal (for example a session open under the goal) is said in a toast, in the API's own words for it.
  const move = useMutation({
    mutationFn: () => (isArchived ? goalsApi.unarchive(goal.id) : goalsApi.archive(goal.id)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: GOALS_KEY });
      toast.success(isArchived ? t("toast.unarchived") : t("toast.archived"));
    },
    onError: (e) => toast.error(tAll(errorMessageKey(e))),
  });

  // In the account's time zone, so the server render and the browser agree.
  const since = format.dateTime(new Date(goal.createdAt), { day: "numeric", month: "long", timeZone: user.timezone });

  return (
    <article className="rounded-[22px] bg-card p-5 ring-1 ring-border lg:p-6">
      <h2 dir="auto" className="text-xl leading-snug font-semibold tracking-tight text-balance">
        {goal.title}
      </h2>
      <p dir="auto" className="mt-2 line-clamp-3 text-muted-foreground">
        {goal.whyItMatters}
      </p>
      {(goal.obstacle || goal.firstOutcome) && (
        <dl className="mt-4 grid gap-2 text-sm">
          {goal.obstacle && <Line label={t("card.ifHard")} text={goal.obstacle} />}
          {goal.firstOutcome && <Line label={t("card.firstSign")} text={goal.firstOutcome} />}
        </dl>
      )}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-sm text-subtle">{t("card.since", { date: since })}</p>
        <div role="group" aria-label={t("card.actions", { title: goal.title })} className="-me-2 flex flex-wrap gap-1">
          {!isArchived && onEdit && <Action onClick={onEdit}>{t("card.edit")}</Action>}
          <Action onClick={() => move.mutate()} disabled={move.isPending}>
            {isArchived ? t("card.unarchive") : t("card.archive")}
          </Action>
          {!isArchived && onDelete && (
            <Action onClick={onDelete} className="text-destructive hover:text-destructive">
              {t("card.delete")}
            </Action>
          )}
        </div>
      </div>
    </article>
  );
}

function Line({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex flex-wrap gap-x-2">
      <dt className="text-subtle">{label}:</dt>
      <dd dir="auto" className="line-clamp-2 min-w-0 flex-1">
        {text}
      </dd>
    </div>
  );
}

function Action({ className, ...props }: React.ComponentProps<typeof Button>) {
  return <Button type="button" variant="ghost" className={`h-11 px-3 text-sm font-medium text-primary ${className ?? ""}`} {...props} />;
}
