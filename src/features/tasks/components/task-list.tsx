"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { FormError } from "@/components/shared/form-error";
import { useUser } from "@/components/shared/user-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Step, Task } from "@/lib/api/types";
import { useAiLimit } from "@/lib/use-ai-limit";
import { tasksApi, tasksKey, useTasks } from "../api";
import { AddLine } from "./add-line";
import { BreakdownDialog } from "./breakdown-dialog";
import { TaskCard } from "./task-card";

/**
 * The tasks of one goal (docs/features/03-goal-detail.md §3). Read-only for
 * an archived goal. Which tasks start open: all of them when there are three
 * or fewer, otherwise the first one not done.
 */
export function TaskList({
  goalId,
  readOnly,
  initialTasks,
  initialSteps,
}: {
  goalId: string;
  readOnly: boolean;
  initialTasks: Task[];
  initialSteps: Record<string, Step[]>;
}) {
  const t = useTranslations("tasks");
  const queryClient = useQueryClient();
  const user = useUser();
  const ai = useAiLimit(user.timezone);
  const { data: tasks } = useTasks(goalId, initialTasks);
  const [announcement, setAnnouncement] = useState("");
  const [breakdownFor, setBreakdownFor] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  // Decided once, from what the page opened with, so tasks do not jump open or shut as they change.
  const [openOnArrival] = useState(() => {
    if (initialTasks.length <= 3) return new Set(initialTasks.map((task) => task.id));
    const first = initialTasks.find((task) => task.status !== "done");
    return new Set(first ? [first.id] : []);
  });

  const done = tasks.filter((task) => task.status === "done").length;
  const addTask = async (title: string) => {
    await tasksApi.create(goalId, title);
    await queryClient.invalidateQueries({ queryKey: tasksKey(goalId) });
  };

  return (
    <section aria-labelledby="tasks-heading" className="grid gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="tasks-heading" className="text-2xl font-semibold tracking-tight">
          {t("title")}
        </h2>
        {tasks.length > 0 && <p className="text-sm text-muted-foreground">{t("doneOf", { done, total: tasks.length })}</p>}
      </div>

      {tasks.length === 0 && <p className="rounded-[22px] border border-dashed border-input px-6 py-8 text-center text-muted-foreground">{t("empty")}</p>}

      {tasks.length > 0 && (
        <ul className="grid gap-3">
          {tasks.map((task) => (
            <li key={task.id}>
              <TaskCard
                task={task}
                initialSteps={initialSteps[task.id]}
                readOnly={readOnly}
                // A task added on this page opens at once, ready for its steps.
                defaultOpen={openOnArrival.has(task.id) || !(task.id in initialSteps)}
                announce={setAnnouncement}
                aiResting={ai.reached}
                onBreakdown={() => setBreakdownFor(task)}
                onDelete={() => setDeleting(task)}
              />
            </li>
          ))}
        </ul>
      )}

      {!readOnly && <AddLine label={t("addTask")} placeholder={t("addTask")} onAdd={addTask} />}

      {/* Ticks are announced here, quietly: no toast for the most frequent action on the page. */}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {breakdownFor && (
        <BreakdownDialog task={breakdownFor} open onOpenChange={(open) => !open && setBreakdownFor(null)} onLimit={ai.mark} />
      )}
      <DeleteTaskDialog task={deleting} onOpenChange={(open) => !open && setDeleting(null)} />
    </section>
  );
}

/** Delete asks first; a task with sessions behind it cannot be deleted, and the dialog says why in the API's words. */
function DeleteTaskDialog({ task, onOpenChange }: { task: Task | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={task !== null} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[22px] sm:max-w-[460px]">{task && <DeleteTaskBody key={task.id} task={task} onDone={() => onOpenChange(false)} />}</DialogContent>
    </Dialog>
  );
}

function DeleteTaskBody({ task, onDone }: { task: Task; onDone: () => void }) {
  const t = useTranslations("tasks");
  const tc = useTranslations("common");
  const queryClient = useQueryClient();
  const remove = useMutation({
    mutationFn: () => tasksApi.remove(task.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tasksKey(task.goalId) });
      toast.success(t("toast.taskDeleted"));
      onDone();
    },
  });
  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl font-semibold tracking-tight">{t("deleteTask.title")}</DialogTitle>
        <DialogDescription className="text-base">{t("deleteTask.body", { title: task.title })}</DialogDescription>
      </DialogHeader>
      <FormError error={remove.error} />
      <DialogFooter className="gap-2">
        <Button type="button" variant="ghost" className="h-12 px-4 text-base" onClick={onDone}>
          {tc("cancel")}
        </Button>
        <Button type="button" variant="destructive" disabled={remove.isPending} className="h-12 rounded-[10px] px-6 text-base" onClick={() => remove.mutate()}>
          {t("deleteTask.confirm")}
        </Button>
      </DialogFooter>
    </>
  );
}
