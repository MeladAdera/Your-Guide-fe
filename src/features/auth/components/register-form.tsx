"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Check, Circle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useSyncExternalStore } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Field } from "@/components/shared/field";
import { FormError } from "@/components/shared/form-error";
import { Input } from "@/components/ui/input";
import { authApi, browserTimezone } from "@/features/auth/api";
import { registerSchema, type RegisterValues } from "@/features/auth/schemas";
import { suggestEmail } from "@/features/auth/email-suggest";
import { cn } from "@/lib/utils";
import { LocaleSwitch } from "@/features/settings/components/locale-switch";
import { PasswordInput } from "./password-input";
import { SubmitButton } from "./submit-button";
import { TimezoneField } from "./timezone-field";
import { useAuthForm } from "./use-auth-form";

const noSubscribe = () => () => {};

export function RegisterForm() {
  const t = useTranslations("auth");
  const te = useTranslations("errors");
  const search = useSearchParams();
  const form = useForm<RegisterValues>({ resolver: zodResolver(registerSchema), defaultValues: { email: "", password: "" } });
  const { locale, formError, setFormError, onSuccess, onError, cooldownSeconds } = useAuthForm(form.setError);

  const register = useMutation({
    mutationFn: authApi.register,
    onSuccess,
    onError: (e) => onError(e, { "auth.email_taken": "email" }),
  });

  const next = search.get("next");
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";
  const { errors, touchedFields } = form.formState;
  const emailTaken = errors.email?.message === "auth.email_taken";
  const [email, password] = useWatch({ control: form.control, name: ["email", "password"] });
  // Offer the fix once the person has left the field, not while typing.
  const suggestion = touchedFields.email ? suggestEmail(email) : null;
  const passwordMet = password.length >= 8;
  // The browser's zone is only known on the client; null while rendering on the server.
  const detectedTimezone = useSyncExternalStore(noSubscribe, browserTimezone, () => null);
  const [chosenTimezone, setChosenTimezone] = useState<string | null>(null);
  const timezone = chosenTimezone ?? detectedTimezone;

  return (
    <form
      noValidate
      className="grid gap-5"
      onSubmit={form.handleSubmit((values) => {
        setFormError(null);
        register.mutate({ email: values.email, password: values.password, timezone: timezone ?? browserTimezone(), locale });
      })}
    >
      <FormError error={formError} />
      <Field id="email" label={t("email")} error={emailTaken ? undefined : errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          dir="ltr"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...form.register("email")}
        />
        {suggestion && !emailTaken ? (
          <p className="text-sm text-muted-foreground">
            <span dir="auto">{t("emailSuggest", { email: suggestion })}</span>{" "}
            <button
              type="button"
              onClick={() => form.setValue("email", suggestion, { shouldValidate: true, shouldDirty: true })}
              className="font-medium text-primary underline underline-offset-4"
            >
              {t("useSuggestion")}
            </button>
          </p>
        ) : null}
        {emailTaken ? (
          <p id="email-error" role="alert" className="text-sm text-destructive">
            {te("auth.email_taken")}{" "}
            <Link href={loginHref} className="font-medium underline underline-offset-4">
              {t("register.toLogin")}
            </Link>
          </p>
        ) : null}
      </Field>
      <Field id="password" label={t("password")} error={errors.password?.message}>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error password-rule" : "password-rule"}
          {...form.register("password")}
        />
        <p id="password-rule" aria-live="polite" className={cn("flex items-center gap-1.5 text-sm", passwordMet ? "text-success-ink" : "text-muted-foreground")}>
          {passwordMet ? <Check aria-hidden className="size-4" strokeWidth={2.5} /> : <Circle aria-hidden className="size-3.5" />}
          {passwordMet ? t("passwordMet") : t("passwordHint")}
        </p>
      </Field>
      <div className="grid gap-1.5">
        <p id="speaks-label" className="text-sm font-medium">
          {t("register.speaks")}
        </p>
        <LocaleSwitch block labelledBy="speaks-label" />
      </div>
      {timezone ? <TimezoneField value={timezone} onChange={setChosenTimezone} /> : null}
      <SubmitButton label={t("register.submit")} pending={register.isPending} cooldownSeconds={cooldownSeconds} />
      <p className="text-sm text-muted-foreground">{t("register.privacy")}</p>
      <p className="text-center text-sm text-muted-foreground">
        {t("register.hasAccount")}{" "}
        <Link href={loginHref} className="font-medium text-primary underline-offset-4 hover:underline">
          {t("register.toLogin")}
        </Link>
      </p>
    </form>
  );
}
