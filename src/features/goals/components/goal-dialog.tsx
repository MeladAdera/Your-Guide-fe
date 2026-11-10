"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormError } from "@/components/shared/form-error";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Goal } from "@/lib/api/types";
import { GOALS_KEY, goalsApi } from "../api";
import { goalDefaults, goalPayload, goalSchema, type GoalValues } from "../goal-form";
import { useGoalSave } from "../use-goal-save";
import { GoalQuestion } from "./goal-question";

/**
 * New goal and Edit goal: the same four questions as the first goal, all in
 * view, in a dialog over the list. Edit sends all four; an emptied optional
 * answer goes as null, which clears it.
 */
export function GoalDialog({ goal, open, onOpenChange }: { goal: Goal | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("goals");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-[22px] sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold tracking-tight">{goal ? t("dialog.editTitle") : t("dialog.newTitle")}</DialogTitle>
          <DialogDescription className="sr-only">{t("intro")}</DialogDescription>
        </DialogHeader>
        {/* Keyed so each opening starts from the goal as saved, not from an earlier, abandoned edit. */}
        {open && <GoalDialogForm key={goal?.id ?? "new"} goal={goal} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function GoalDialogForm({ goal, onDone }: { goal: Goal | null; onDone: () => void }) {
  const t = useTranslations("goals");
  const tc = useTranslations("common");
  const queryClient = useQueryClient();
  const form = useForm<GoalValues>({ resolver: zodResolver(goalSchema), defaultValues: goalDefaults(goal) });
  const { submit, saving, formError } = useGoalSave({
    form,
    save: goal ? (body) => goalsApi.update(goal.id, body) : goalsApi.create,
    onSaved: async () => {
      await queryClient.invalidateQueries({ queryKey: GOALS_KEY });
      toast.success(goal ? t("toast.saved") : t("toast.created"));
      onDone();
    },
  });
  const id = goal?.id ?? "new";

  return (
    <form noValidate onSubmit={form.handleSubmit((values) => submit(goalPayload(values)))} className="grid gap-5">
      <GoalQuestion form={form} name="title" id={`goal-${id}-title`} />
      <GoalQuestion form={form} name="whyItMatters" id={`goal-${id}-why`} starter={goal ? undefined : t("starters.why")} />
      <GoalQuestion form={form} name="obstacle" id={`goal-${id}-obstacle`} starter={goal ? undefined : t("starters.obstacle")} />
      <GoalQuestion form={form} name="firstOutcome" id={`goal-${id}-firstOutcome`} />
      <FormError error={formError} />
      <DialogFooter className="gap-2">
        <Button type="button" variant="ghost" className="h-12 px-4 text-base" onClick={onDone}>
          {tc("cancel")}
        </Button>
        <Button type="submit" disabled={saving} className="h-12 rounded-[10px] px-6 text-base">
          {t("dialog.save")}
        </Button>
      </DialogFooter>
    </form>
  );
}
