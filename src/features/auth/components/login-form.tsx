"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { Field } from "@/components/shared/field";
import { FormError } from "@/components/shared/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authApi } from "@/features/auth/api";
import { loginSchema, type LoginValues } from "@/features/auth/schemas";
import { PasswordInput } from "./password-input";
import { useAuthForm } from "./use-auth-form";

export function LoginForm() {
  const t = useTranslations("auth");
  const search = useSearchParams();
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  const { formError, setFormError, onSuccess, onError } = useAuthForm(form.setError);

  const login = useMutation({
    mutationFn: authApi.login,
    onSuccess,
    onError: (e) => onError(e),
  });

  const next = search.get("next");
  const registerHref = next ? `/register?next=${encodeURIComponent(next)}` : "/register";
  const { errors } = form.formState;

  return (
    <form
      noValidate
      className="grid gap-5"
      onSubmit={form.handleSubmit((values) => {
        setFormError(null);
        login.mutate({ email: values.email, password: values.password });
      })}
    >
      <FormError error={formError} />
      <Field id="email" label={t("email")} error={errors.email?.message}>
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
      </Field>
      <Field id="password" label={t("password")} error={errors.password?.message}>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
          {...form.register("password")}
        />
      </Field>
      <Button type="submit" size="lg" disabled={login.isPending}>
        {t("login.submit")}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {t("login.noAccount")}{" "}
        <Link href={registerHref} className="font-medium text-primary underline-offset-4 hover:underline">
          {t("login.toRegister")}
        </Link>
      </p>
    </form>
  );
}
