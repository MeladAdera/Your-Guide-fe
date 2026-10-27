import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { RegisterForm } from "@/features/auth/components/register-form";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.register");
  return { title: t("title") };
}

export default async function RegisterPage() {
  const t = await getTranslations("auth.register");
  const road = [t("roadAccount"), t("roadAboutYou"), t("roadFirstGoal")];
  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h1 className="text-3xl font-medium tracking-tight text-balance">{t("title")}</h1>
        <p className="text-muted-foreground">{t("intro")}</p>
        <ol aria-label={t("roadLabel")} className="mt-1 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-subtle">
          {road.map((step, i) => (
            <li key={step} aria-current={i === 0 ? "step" : undefined} className={cn(i === 0 && "font-medium text-primary")}>
              <span className="num">{i + 1}</span> {step}
            </li>
          ))}
        </ol>
      </div>
      <Suspense>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
