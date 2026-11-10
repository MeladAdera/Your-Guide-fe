"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TaskList } from "@/features/tasks/components/task-list";
import { errorMessageKey } from "@/lib/api/errors";
import type { Goal, Step, Task } from "@/lib/api/types";
import { GOALS_KEY, goalsApi } from "../api";
import { GoalDialog } from "./goal-dialog";

/** There is no GET /api/goals/:id (docs/handoff.md §9): the goal is found in the two lists. */
async function findGoal(id: string): Promise<Goal | null> {
  const [active, archived] = await Promise.all([goalsApi.list(false), goalsApi.list(true)]);
  return [...active, ...archived].find((g) => g.id === id) ?? null;
}

/**
 * /goals/[id] (docs/features/03-goal-detail.md): the goal, why it matters and
 * its if–then, Edit goal, then its tasks and steps. An archived goal is shown
 * whole but read-only, with Unarchive.
 */
export function GoalDetail({ goal: initial, tasks, steps }: { goal: Goal; tasks: Task[]; steps: Record<string, Step[]> }) {
  const t = useTranslations("goals");
  const tAll = useTranslations();
  const queryClient = useQueryClient();
  // Every goal write invalidates ["goals"], so edits and archiving show here too.
  const { data } = useQuery({ queryKey: [...GOALS_KEY, "detail", initial.id], queryFn: () => findGoal(initial.id), initialData: initial });
  const goal = data ?? initial;
  const archived = goal.archivedAt !== null;
  const [editing, setEditing] = useState(false);

  const unarchive = useMutation({
    mutationFn: () => goalsApi.unarchive(goal.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: GOALS_KEY });
      toast.success(t("toast.unarchived"));
    },
    onError: (e) => toast.error(tAll(errorMessageKey(e))),
  });

  return (
    <div className="grid max-w-[760px] gap-8 lg:gap-10">
      <div>
        <Link href="/goals" className="-ms-2 inline-flex h-10 items-center gap-1.5 rounded-full px-2 text-sm font-medium text-primary outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50">
          <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden /> {t("detail.back")}
        </Link>
        <p className="mt-4 text-sm text-muted-foreground">{t("detail.eyebrow")}</p>
        <h1 dir="auto" className="mt-1 text-3xl font-semibold tracking-tight text-balance lg:text-5xl lg:leading-tight">
          {goal.title}
        </h1>
        <p dir="auto" className="mt-3 max-w-[60ch] whitespace-pre-line text-muted-foreground lg:text-lg">
          {goal.whyItMatters}
        </p>
        {(goal.obstacle || goal.firstOutcome) && (
          <dl className="mt-5 grid gap-3">
            {goal.obstacle && <Detail label={t("card.ifHard")} text={goal.obstacle} />}
            {goal.firstOutcome && <Detail label={t("card.firstSign")} text={goal.firstOutcome} />}
          </dl>
        )}
        {archived ? (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[18px] bg-accent px-5 py-4 text-accent-foreground">
            <p>{t("detail.archivedNotice")}</p>
            <Button type="button" disabled={unarchive.isPending} onClick={() => unarchive.mutate()} className="h-11 rounded-[10px] px-5 text-[15px]">
              {t("detail.unarchive")}
            </Button>
          </div>
        ) : (
          <Button type="button" variant="outline" onClick={() => setEditing(true)} className="mt-6 h-11 rounded-[10px] px-4 text-[15px]">
            <Pencil aria-hidden /> {t("detail.edit")}
          </Button>
        )}
      </div>

      <TaskList goalId={goal.id} readOnly={archived} initialTasks={tasks} initialSteps={steps} />

      <GoalDialog goal={editing ? goal : null} open={editing} onOpenChange={setEditing} />
    </div>
  );
}

function Detail({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <dt className="text-sm text-subtle">{label}</dt>
      <dd dir="auto" className="mt-0.5 whitespace-pre-line">
        {text}
      </dd>
    </div>
  );
}
