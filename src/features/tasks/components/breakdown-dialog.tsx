"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormError } from "@/components/shared/form-error";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { isApiError } from "@/lib/api/errors";
import type { Task } from "@/lib/api/types";
import { stepsApi, stepsKey, tasksApi, tasksKey } from "../api";
import { TITLE_MAX } from "./add-line";

interface Suggestion {
  key: number;
  title: string;
  keep: boolean;
}

type Phase = { name: "loading" } | { name: "ready" } | { name: "failed"; error: unknown };

/**
 * "Break into steps" (docs/features/03-goal-detail.md §3): ask the model for
 * 3–7 step titles, show them as editable rows, all kept by default, and add
 * the kept ones one by one, in order. Nothing is saved until "Add n steps".
 */
export function BreakdownDialog({
  task,
  open,
  onOpenChange,
  onLimit,
}: {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called on ai.daily_limit, so every AI button rests until tomorrow. */
  onLimit: () => void;
}) {
  const t = useTranslations("tasks.breakdown");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-[22px] sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle dir="auto" className="text-2xl font-semibold tracking-tight text-balance">
            {t("title", { task: task.title })}
          </DialogTitle>
          <DialogDescription>{t("intro")}</DialogDescription>
        </DialogHeader>
        {open && <BreakdownBody task={task} onClose={() => onOpenChange(false)} onLimit={onLimit} />}
      </DialogContent>
    </Dialog>
  );
}

function BreakdownBody({ task, onClose, onLimit }: { task: Task; onClose: () => void; onLimit: () => void }) {
  const t = useTranslations("tasks.breakdown");
  const tc = useTranslations("common");
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<Phase>({ name: "loading" });
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<{ error: unknown; added: number; total: number } | null>(null);
  const request = useRef<AbortController | null>(null);

  const ask = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setPhase({ name: "loading" });
    try {
      const { steps } = await tasksApi.breakdown(task.id, controller.signal);
      setSuggestions(steps.map((title, key) => ({ key, title, keep: true })));
      setPhase({ name: "ready" });
    } catch (e) {
      if (controller.signal.aborted) return;
      if (isApiError(e) && e.code === "ai.daily_limit") onLimit();
      setPhase({ name: "failed", error: e });
    }
  }, [task.id, onLimit]);

  // Ask once per opening: every call counts against the person's ten a day, so React's development
  // double mount must not send a second one. Closing the dialog (Cancel, Escape, the X) stops the wait;
  // the abort is deferred a tick so the development remount can call it off.
  const started = useRef(false);
  const abortTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    window.clearTimeout(abortTimer.current);
    if (!started.current) {
      started.current = true;
      void ask();
    }
    return () => {
      abortTimer.current = window.setTimeout(() => request.current?.abort(), 0);
    };
  }, [ask]);

  const kept = suggestions.filter((s) => s.keep && s.title.trim());
  const update = (key: number, change: Partial<Suggestion>) => setSuggestions((list) => list.map((s) => (s.key === key ? { ...s, ...change } : s)));

  // One by one, in order, so the steps keep the order the person sees. Each one added leaves the list,
  // so after a failure pressing again adds only the rest.
  const addKept = async () => {
    setAdding(true);
    setAddError(null);
    let added = 0;
    try {
      for (const s of kept) {
        await stepsApi.create(task.id, s.title.trim());
        added++;
        setSuggestions((list) => list.filter((x) => x.key !== s.key));
      }
      await Promise.all([queryClient.invalidateQueries({ queryKey: stepsKey(task.id) }), queryClient.invalidateQueries({ queryKey: tasksKey(task.goalId) })]);
      onClose();
    } catch (e) {
      setAddError({ error: e, added, total: kept.length });
      await queryClient.invalidateQueries({ queryKey: stepsKey(task.id) });
      setAdding(false);
    }
  };

  if (phase.name === "loading") {
    return (
      <div className="grid gap-5">
        <div role="status" className="flex items-center gap-3 rounded-[18px] bg-accent px-5 py-6 text-accent-foreground">
          <Loader2 className="size-5 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden />
          <div>
            <p className="font-medium">{t("loading")}</p>
            <p className="text-sm opacity-80">{t("wait")}</p>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" className="h-12 px-4 text-base" onClick={onClose}>
            {tc("cancel")}
          </Button>
        </DialogFooter>
      </div>
    );
  }

  if (phase.name === "failed") {
    const limit = isApiError(phase.error) && phase.error.code === "ai.daily_limit";
    return (
      <div className="grid gap-5">
        {limit ? <p className="rounded-[18px] bg-accent px-5 py-4 text-accent-foreground">{t("limit")}</p> : <FormError error={phase.error} />}
        <DialogFooter className="gap-2">
          <Button type="button" variant="ghost" className="h-12 px-4 text-base" onClick={onClose}>
            {tc("cancel")}
          </Button>
          {!limit && (
            <Button type="button" className="h-12 rounded-[10px] px-6 text-base" onClick={() => void ask()}>
              {t("retry")}
            </Button>
          )}
        </DialogFooter>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void addKept();
      }}
      className="grid gap-5"
    >
      <ol className="grid gap-2.5">
        {suggestions.map((s, i) => (
          <li key={s.key} className="flex items-center gap-3 rounded-[14px] bg-card px-3 py-2 ring-1 ring-border">
            <Checkbox
              checked={s.keep}
              onCheckedChange={(checked) => update(s.key, { keep: checked === true })}
              aria-label={t("keep", { n: i + 1 })}
              className="size-5"
            />
            <Input
              dir="auto"
              value={s.title}
              maxLength={TITLE_MAX}
              onChange={(e) => update(s.key, { title: e.target.value })}
              aria-label={t("field", { n: i + 1 })}
              className={`h-11 flex-1 rounded-[10px] border-transparent bg-transparent px-2 text-base shadow-none md:text-base ${s.keep ? "" : "text-muted-foreground line-through"}`}
            />
          </li>
        ))}
      </ol>
      {addError && (
        <div className="grid gap-2">
          {addError.added > 0 && <p className="text-sm text-muted-foreground">{t("partial", { added: addError.added, total: addError.total })}</p>}
          <FormError error={addError.error} />
        </div>
      )}
      <DialogFooter className="gap-2">
        <Button type="button" variant="ghost" className="h-12 px-4 text-base" onClick={onClose}>
          {tc("cancel")}
        </Button>
        <Button type="submit" disabled={adding || kept.length === 0} className="h-12 rounded-[10px] px-6 text-base">
          {t("add", { count: kept.length })}
        </Button>
      </DialogFooter>
    </form>
  );
}
