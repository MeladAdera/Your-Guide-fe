"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { validationMessageKey } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

interface FieldProps {
  id: string;
  label: string;
  /** One line under the label that says why the app asks. */
  why?: string;
  optional?: boolean;
  /** A validation rule code (from zod or the API); translated here. */
  error?: string;
  children: ReactNode;
  className?: string;
}

/** Label, optional "why" line, the control, and a translated error under it. */
export function Field({ id, label, why, optional, error, children, className }: FieldProps) {
  const t = useTranslations();
  const tc = useTranslations("common");
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {optional ? <span className="ms-1.5 text-xs font-normal text-muted-foreground">({tc("optional")})</span> : null}
      </Label>
      {why ? (
        <p id={`${id}-why`} className="text-sm text-muted-foreground">
          {why}
        </p>
      ) : null}
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {t(validationMessageKey(error))}
        </p>
      ) : null}
    </div>
  );
}
