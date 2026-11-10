"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { isApiError } from "@/lib/api/errors";
import { placeFieldErrors } from "@/lib/api/field-errors";
import type { Goal, GoalInput } from "@/lib/api/types";
import { isGoalField, type GoalValues } from "./goal-form";

/**
 * Saving a goal (create or edit). Field errors from the API land under the
 * four questions and the first takes focus; anything else, or a field with
 * no place in the form, becomes the form's alert. `onError` sees every error
 * first and returns true when it handled it (the first goal's 409).
 */
export function useGoalSave({
  form,
  save,
  onSaved,
  onError,
}: {
  form: UseFormReturn<GoalValues>;
  save: (body: GoalInput) => Promise<Goal>;
  onSaved: (goal: Goal) => void;
  onError?: (e: unknown) => boolean;
}) {
  const [formError, setFormError] = useState<unknown>(null);
  const mutation = useMutation({
    mutationFn: save,
    onMutate: () => setFormError(null),
    onSuccess: onSaved,
    onError: (e) => {
      if (onError?.(e)) return;
      if (isApiError(e) && e.code === "validation.failed") {
        const { placed, allPlaced } = placeFieldErrors(e.fieldErrors(), isGoalField);
        placed.forEach(([field, rule]) => form.setError(field as keyof GoalValues, { type: "server", message: rule }));
        if (placed.length) requestAnimationFrame(() => form.setFocus(placed[0][0] as keyof GoalValues));
        if (allPlaced) return;
      }
      setFormError(e);
    },
  });
  return { submit: mutation.mutate, saving: mutation.isPending, formError, reset: () => setFormError(null) };
}
