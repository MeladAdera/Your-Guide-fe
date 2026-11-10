"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { FormError } from "@/components/shared/form-error";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { isApiError } from "@/lib/api/errors";
import type { Goal } from "@/lib/api/types";
import { GOALS_KEY, goalsApi } from "../api";

/**
 * Delete asks first. The UI cannot know whether a goal has work behind it
 * (docs/handoff.md §9), so it tries DELETE; on goal.has_work_history the
 * dialog turns into an offer to archive, which keeps everything.
 */
export function DeleteGoalDialog({ goal, onOpenChange }: { goal: Goal | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={goal !== null} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[22px] sm:max-w-[460px]">{goal && <DeleteBody key={goal.id} goal={goal} onDone={() => onOpenChange(false)} />}</DialogContent>
    </Dialog>
  );
}

function DeleteBody({ goal, onDone }: { goal: Goal; onDone: () => void }) {
  const t = useTranslations("goals");
  const tc = useTranslations("common");
  const queryClient = useQueryClient();
  const [hasHistory, setHasHistory] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const done = async (message: string) => {
    await queryClient.invalidateQueries({ queryKey: GOALS_KEY });
    toast.success(message);
    onDone();
  };
  const remove = useMutation({
    mutationFn: () => goalsApi.remove(goal.id),
    onMutate: () => setError(null),
    onSuccess: () => done(t("toast.deleted")),
    onError: (e) => (isApiError(e) && e.code === "goal.has_work_history" ? setHasHistory(true) : setError(e)),
  });
  const archive = useMutation({
    mutationFn: () => goalsApi.archive(goal.id),
    onMutate: () => setError(null),
    onSuccess: () => done(t("toast.archived")),
    onError: setError,
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl font-semibold tracking-tight">{hasHistory ? t("dialog.historyTitle") : t("dialog.deleteTitle")}</DialogTitle>
        <DialogDescription className="text-base">{hasHistory ? t("dialog.historyBody") : t("dialog.deleteBody", { title: goal.title })}</DialogDescription>
      </DialogHeader>
      <FormError error={error} />
      <DialogFooter className="gap-2">
        <Button type="button" variant="ghost" className="h-12 px-4 text-base" onClick={onDone}>
          {tc("cancel")}
        </Button>
        {hasHistory ? (
          <Button type="button" disabled={archive.isPending} className="h-12 rounded-[10px] px-6 text-base" onClick={() => archive.mutate()}>
            {t("dialog.archiveConfirm")}
          </Button>
        ) : (
          <Button type="button" variant="destructive" disabled={remove.isPending} className="h-12 rounded-[10px] px-6 text-base" onClick={() => remove.mutate()}>
            {t("dialog.deleteConfirm")}
          </Button>
        )}
      </DialogFooter>
    </>
  );
}
