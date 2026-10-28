"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { isApiError } from "@/lib/api/errors";
import { onboardingApi } from "./api";

/**
 * Saving one onboarding screen: PUT the whole screen, then go to the next one.
 * Field errors from the API land under the field they name (the first one gets
 * focus); anything else, or any error on a screen without fields to point at,
 * becomes one form-level error, with the answers kept.
 */
export function useSectionSave<TBody, TForm extends FieldValues>({
  slug,
  next,
  setError,
}: {
  slug: string;
  next: string;
  setError?: UseFormSetError<TForm>;
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<unknown>(null);

  const mutation = useMutation({
    mutationFn: (body: TBody) => onboardingApi.saveSection(slug, body),
    onMutate: () => setFormError(null),
    onSuccess: () => router.push(next),
    onError: (e) => {
      if (setError && isApiError(e) && e.code === "validation.failed") {
        const fields = Object.entries(e.fieldErrors());
        fields.forEach(([field, rule], i) => setError(field as Path<TForm>, { type: "server", message: rule }, { shouldFocus: i === 0 }));
        if (fields.length) return;
      }
      setFormError(e);
    },
  });

  return { save: mutation.mutate, saving: mutation.isPending || mutation.isSuccess, formError };
}
