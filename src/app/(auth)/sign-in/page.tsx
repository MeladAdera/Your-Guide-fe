import { Info } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoginForm } from "@/features/auth/components/login-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.login");
  return { title: t("title") };
}

export default async function LoginPage({ searchParams }: PageProps<"/sign-in">) {
  const t = await getTranslations("auth.login");
  const { reason } = await searchParams;
  return (
    <div className="grid gap-6">
      {reason === "expired" ? (
        <Alert role="status" className="border-transparent bg-accent text-foreground">
          <Info aria-hidden className="text-accent-foreground" />
          <AlertDescription className="text-foreground">{t("expired")}</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-2">
        <h1 className="text-3xl font-medium tracking-tight text-balance">{t("title")}</h1>
        <p className="text-muted-foreground">{t("intro")}</p>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
