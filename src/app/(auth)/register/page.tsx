import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/register-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.register");
  return { title: t("title") };
}

export default async function RegisterPage() {
  const t = await getTranslations("auth.register");
  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">{t("title")}</h1>
        <p className="text-muted-foreground">{t("intro")}</p>
      </div>
      <Suspense>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
