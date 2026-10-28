"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Info, Mail } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { Field } from "@/components/shared/field";
import { FormError } from "@/components/shared/form-error";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { authApi } from "@/features/auth/api";
import { loginSchema, type LoginValues } from "@/features/auth/schemas";
import { PasswordInput } from "./password-input";
import { SubmitButton } from "./submit-button";
import { useAuthForm } from "./use-auth-form";

/**
 * Sign in (docs/features/00-auth.md). Sits in the auth shell next to the
 * sign-up form; ids carry a `signin-` prefix because both forms are in the
 * page at once.
 */
export function SignInForm() {
  const t = useTranslations("auth");
  const search = useSearchParams();
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  const { formError, setFormError, onSuccess, onError, cooldownSeconds } = useAuthForm(form.setError);

  const login = useMutation({
    mutationFn: authApi.login,
    onSuccess,
    onError: (e) => onError(e),
  });

  const next = search.get("next");
  const signUpHref = next ? `/sign-up?next=${encodeURIComponent(next)}` : "/sign-up";
  const expired = search.get("reason") === "expired";
  const { errors } = form.formState;

  return (
    <form
      noValidate
      aria-labelledby="signin-heading"
      className="grid gap-5 lg:gap-4"
      onSubmit={form.handleSubmit((values) => {
        setFormError(null);
        login.mutate({ email: values.email, password: values.password });
      })}
    >
      {expired ? (
        <Alert role="status" className="border-transparent bg-accent text-foreground">
          <Info aria-hidden className="text-accent-foreground" />
          <AlertDescription className="text-foreground">{t("login.expired")}</AlertDescription>
        </Alert>
      ) : null}
      <FormError error={formError} />
      <Field id="signin-email" label={t("email")} error={errors.email?.message}>
        <div className="relative" dir="ltr">
          <Mail aria-hidden className="pointer-events-none absolute start-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="signin-email"
            type="email"
            placeholder={t("emailPlaceholder")}
            required
            autoComplete="email"
            inputMode="email"
            dir="ltr"
            className="h-12 ps-11"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "signin-email-error" : undefined}
            {...form.register("email")}
          />
        </div>
      </Field>
      <Field id="signin-password" label={t("password")} error={errors.password?.message}>
        <PasswordInput
          id="signin-password"
          required
          placeholder={t("passwordPlaceholder")}
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "signin-password-error" : undefined}
          {...form.register("password")}
        />
      </Field>
      <SubmitButton label={t("login.submit")} pending={login.isPending} cooldownSeconds={cooldownSeconds} arrow />
      <p className="text-center text-sm text-muted-foreground">
        {t("login.noAccount")}{" "}
        <Link href={signUpHref} className="font-medium text-primary underline-offset-4 hover:underline">
          {t("login.toRegister")}
        </Link>
      </p>
    </form>
  );
}
