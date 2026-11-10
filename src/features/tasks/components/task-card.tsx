"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ChevronDown, MoreHorizontal, Pencil, Sparkles, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { errorMessageKey } from "@/lib/api/errors";
import type { Step, Task, TaskStatus } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { stepsApi, stepsKey, tasksApi, tasksKey, useSteps } from "../api";
import { moveBy } from "../order";
import { deriveStatus } from "../status";
import { AddLine } from "./add-line";
import { RenameLine } from "./rename-line";

const CHIP: Record<TaskStatus, string> = {
  todo: "bg-muted text-muted-foreground",
  in_progress: "bg-accent text-accent-foreground",
  done: "bg-success-ink/12 text-success-ink",
};

/**
 * One task: a header that opens and closes it (title, status chip, step
 * count, a ⋯ menu), then its steps, Add a step and, while nothing is left to
 * do, Break into steps. The checkbox and moving a step are optimistic.
 */
export function TaskCard({
  task,
  initialSteps,
  readOnly,
  defaultOpen,
  announce,
  aiResting,
  onBreakdown,
  onDelete,
}: {
  task: Task;
  initialSteps: Step[] | undefined;
  readOnly: boolean;
  defaultOpen: boolean;
  /** Says something quietly to screen readers ("Step done."). */
  announce: (message: string) => void;
  /** The AI's daily limit was reached: suggestions rest until tomorrow. */
  aiResting: boolean;
  onBreakdown: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("tasks");
  const tAll = useTranslations();
  const queryClient = useQueryClient();
  const panel = useId();
  const [open, setOpen] = useState(defaultOpen);
  const [renaming, setRenaming] = useState(false);
  const { data: steps } = useSteps(task.id, initialSteps);
  const key = stepsKey(task.id);

  const status = deriveStatus(steps);
  const done = steps.filter((s) => s.doneAt !== null).length;
  const showBreakdown = !readOnly && done === steps.length;

  const refresh = () => Promise.all([queryClient.invalidateQueries({ queryKey: key }), queryClient.invalidateQueries({ queryKey: tasksKey(task.goalId) })]);
  const fail = (e: unknown) => toast.error(tAll(errorMessageKey(e)));

  // Optimistic: the tick shows at once and rolls back if the API says no.
  const toggle = useMutation({
    mutationFn: ({ step, isDone }: { step: Step; isDone: boolean }) => stepsApi.update(step.id, { done: isDone }),
    onMutate: async ({ step, isDone }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const before = queryClient.getQueryData<Step[]>(key);
      const after = steps.map((s) => (s.id === step.id ? { ...s, doneAt: isDone ? new Date().toISOString() : null } : s));
      queryClient.setQueryData<Step[]>(key, after);
      announce(isDone ? (deriveStatus(after) === "done" ? t("taskDone") : t("stepDone")) : t("stepUndone"));
      return { before };
    },
    onError: (e, _vars, ctx) => {
      queryClient.setQueryData(key, ctx?.before);
      fail(e);
    },
    onSettled: refresh,
  });

  // Optimistic too; on step.order_mismatch the list is reloaded and the toast says it changed.
  const move = useMutation({
    mutationFn: (order: Step[]) => stepsApi.reorder(task.id, order.map((s) => s.id)),
    onMutate: async (order) => {
      await queryClient.cancelQueries({ queryKey: key });
      const before = queryClient.getQueryData<Step[]>(key);
      queryClient.setQueryData<Step[]>(key, order);
      return { before };
    },
    onError: (e, _order, ctx) => {
      queryClient.setQueryData(key, ctx?.before);
      fail(e);
    },
    onSettled: refresh,
  });

  const remove = useMutation({
    mutationFn: (step: Step) => stepsApi.remove(step.id),
    onSuccess: async () => {
      await refresh();
      toast.success(t("toast.stepDeleted"));
    },
    onError: fail,
  });

  const addStep = async (title: string) => {
    await stepsApi.create(task.id, title);
    await refresh();
  };
  const renameStep = async (step: Step, title: string) => {
    await stepsApi.update(step.id, { title });
    await queryClient.invalidateQueries({ queryKey: key });
  };
  const renameTask = async (title: string) => {
    await tasksApi.rename(task.id, title);
    await queryClient.invalidateQueries({ queryKey: tasksKey(task.goalId) });
  };

  return (
    <article className="rounded-[22px] bg-card ring-1 ring-border">
      <div className="flex items-start gap-2 p-4 lg:p-5">
        {renaming ? (
          <RenameLine title={task.title} label={t("renameLabel", { title: task.title })} onSave={renameTask} onDone={() => setRenaming(false)} />
        ) : (
          <h3 className="min-w-0 flex-1">
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panel}
              onClick={() => setOpen((o) => !o)}
              className="-m-1 flex w-full min-w-0 items-start gap-3 rounded-[12px] p-1 text-start outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <ChevronDown className={cn("mt-1 size-5 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none", !open && "-rotate-90 rtl:rotate-90")} aria-hidden />
              <span className="grid min-w-0 gap-1.5">
                <span dir="auto" className="text-lg leading-snug font-semibold tracking-tight text-balance">
                  {task.title}
                </span>
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className={cn("rounded-full px-2.5 py-0.5 font-medium", CHIP[status])}>{t(`status.${status}`)}</span>
                  <span className="text-subtle">{steps.length ? t("stepsOf", { done, total: steps.length }) : t("noSteps")}</span>
                </span>
              </span>
            </button>
          </h3>
        )}
        {!readOnly && !renaming && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-11 shrink-0 rounded-full" aria-label={t("menu", { title: task.title })}>
                <MoreHorizontal aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setRenaming(true)}>
                <Pencil aria-hidden /> {t("rename")}
              </DropdownMenuItem>
              <DropdownMenuItem disabled={aiResting} onSelect={onBreakdown}>
                <Sparkles aria-hidden /> {t("breakdown.button")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                <Trash2 aria-hidden /> {t("delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div id={panel} hidden={!open} className="grid gap-4 px-4 pb-5 lg:px-5">
        {steps.length > 0 && (
          <ol className="grid gap-1">
            {steps.map((step, i) => (
              <StepRow
                key={step.id}
                step={step}
                readOnly={readOnly}
                canMoveUp={i > 0}
                canMoveDown={i < steps.length - 1}
                onToggle={(isDone) => toggle.mutate({ step, isDone })}
                onMove={(delta) => move.mutate(moveBy(steps, i, delta))}
                onRename={(title) => renameStep(step, title)}
                onDelete={() => remove.mutate(step)}
              />
            ))}
          </ol>
        )}
        {!readOnly && <AddLine label={t("addStepLabel", { task: task.title })} placeholder={t("addStep")} onAdd={addStep} />}
        {showBreakdown && (
          <div>
            <Button type="button" variant="outline" disabled={aiResting} onClick={onBreakdown} className="h-11 rounded-full px-4 text-[15px]">
              <Sparkles aria-hidden /> {t("breakdown.button")}
            </Button>
            {aiResting && <p className="mt-2 text-sm text-muted-foreground">{t("breakdown.limit")}</p>}
          </div>
        )}
      </div>
    </article>
  );
}

function StepRow({
  step,
  readOnly,
  canMoveUp,
  canMoveDown,
  onToggle,
  onMove,
  onRename,
  onDelete,
}: {
  step: Step;
  readOnly: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onToggle: (done: boolean) => void;
  onMove: (delta: -1 | 1) => void;
  onRename: (title: string) => Promise<unknown>;
  onDelete: () => void;
}) {
  const t = useTranslations("tasks");
  const id = useId();
  const [renaming, setRenaming] = useState(false);
  const isDone = step.doneAt !== null;

  if (renaming) {
    return (
      <li className="py-1">
        <RenameLine title={step.title} label={t("renameLabel", { title: step.title })} onSave={onRename} onDone={() => setRenaming(false)} />
      </li>
    );
  }

  return (
    <li className="flex min-h-12 items-center gap-3 rounded-[12px] px-1 hover:bg-accent/40">
      <Checkbox id={id} checked={isDone} disabled={readOnly} onCheckedChange={(checked) => onToggle(checked === true)} className="size-5" />
      <label htmlFor={id} dir="auto" className={cn("min-w-0 flex-1 cursor-pointer py-2 text-base leading-snug", isDone && "text-muted-foreground line-through")}>
        {step.title}
      </label>
      {!readOnly && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-11 shrink-0 rounded-full text-muted-foreground" aria-label={t("menu", { title: step.title })}>
              <MoreHorizontal aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setRenaming(true)}>
              <Pencil aria-hidden /> {t("rename")}
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!canMoveUp} onSelect={() => onMove(-1)}>
              <ArrowUp aria-hidden /> {t("moveUp")}
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!canMoveDown} onSelect={() => onMove(1)}>
              <ArrowDown aria-hidden /> {t("moveDown")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2 aria-hidden /> {t("delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </li>
  );
}
