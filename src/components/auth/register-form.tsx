"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { Field } from "@/components/forms/field";
import { FormError } from "@/components/forms/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authApi, browserTimezone } from "@/lib/api/auth";
import { registerSchema, type RegisterValues } from "@/lib/schemas/auth";
import { useAuthForm } from "./use-auth-form";

export function RegisterForm() {
  const t = useTranslations("auth");
  const te = useTranslations("errors");
  const search = useSearchParams();
  const form = useForm<RegisterValues>({ resolver: zodResolver(registerSchema), defaultValues: { email: "", password: "" } });
  const { locale, formError, setFormError, onSuccess, onError } = useAuthForm(form.setError);

  const register = useMutation({
    mutationFn: authApi.register,
    onSuccess,
    onError: (e) => onError(e, { "auth.email_taken": "email" }),
  });

  const next = search.get("next");
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";
  const { errors } = form.formState;
  const emailTaken = errors.email?.message === "auth.email_taken";

  return (
    <form
      noValidate
      className="grid gap-5"
      onSubmit={form.handleSubmit((values) => {
        setFormError(null);
        register.mutate({ email: values.email, password: values.password, timezone: browserTimezone(), locale });
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
        {emailTaken ? (
          <p id="email-error" role="alert" className="text-sm text-destructive">
            {te("auth.email_taken")}{" "}
            <Link href={loginHref} className="font-medium underline underline-offset-4">
              {t("register.toLogin")}
            </Link>
          </p>
        ) : null}
      </Field>
      <Field id="password" label={t("password")} why={t("passwordHint")} error={errors.password?.message}>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          dir="ltr"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : "password-why"}
          {...form.register("password")}
        />
      </Field>
      <Button type="submit" size="lg" disabled={register.isPending}>
        {t("register.submit")}
      </Button>
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
