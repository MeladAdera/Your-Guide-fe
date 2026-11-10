"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { isApiError } from "@/lib/api/errors";
import { onboardingApi } from "./api";
import { placeFieldErrors } from "@/lib/api/field-errors";

/**
 * Saving one onboarding screen: PUT the whole screen, then go to the next one.
 * Field errors from the API land under the fields the screen shows (the first
 * one gets focus). Anything else, including a field error with no place on
 * the screen, also becomes one form-level error, with the answers kept.
 */
export function useSectionSave<TBody, TForm extends FieldValues>({
  slug,
  next,
  fieldErrors,
  onSaved,
}: {
  slug: string;
  next: string;
  /** Where API field errors can go; screens without fields leave it out. */
  fieldErrors?: { form: Pick<UseFormReturn<TForm>, "setError" | "setFocus">; shows: (field: string) => boolean };
  /** Runs before leaving the screen, e.g. to drop the draft. */
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<unknown>(null);

  const mutation = useMutation({
    mutationFn: (body: TBody) => onboardingApi.saveSection(slug, body),
    onMutate: () => setFormError(null),
    onSuccess: () => {
      onSaved?.();
      router.push(next);
    },
    onError: (e) => {
      if (fieldErrors && isApiError(e) && e.code === "validation.failed") {
        const { form } = fieldErrors;
        const { placed, allPlaced } = placeFieldErrors(e.fieldErrors(), fieldErrors.shows);
        placed.forEach(([field, rule]) => form.setError(field as Path<TForm>, { type: "server", message: rule }));
        // A frame later, so a field inside "Add more" has been revealed and can take focus.
        if (placed.length) requestAnimationFrame(() => form.setFocus(placed[0][0] as Path<TForm>));
        if (allPlaced) return;
      }
      setFormError(e);
    },
  });

  return { save: mutation.mutate, saving: mutation.isPending || mutation.isSuccess, formError };
}
