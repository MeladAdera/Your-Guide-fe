"use client";

import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { errorMessageKey } from "@/lib/api/errors";

/** A form-level error sentence, translated by error code. Renders nothing without an error. */
export function FormError({ error }: { error: unknown }) {
  const t = useTranslations();
  if (!error) return null;
  return (
    <Alert variant="destructive" role="alert">
      <AlertCircle aria-hidden />
      <AlertDescription>{t(errorMessageKey(error))}</AlertDescription>
    </Alert>
  );
}
