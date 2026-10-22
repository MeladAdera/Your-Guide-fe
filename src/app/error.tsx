"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * The general "something went wrong" screen, also used when the API cannot be
 * reached during server rendering. Server errors arrive without their code, so
 * the sentence is the general one and the action is to try again.
 */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("common");
  const te = useTranslations("errors");
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main id="content" className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">{t("errorTitle")}</h1>
      <p className="text-muted-foreground">{te("network")}</p>
      <div>
        <Button size="lg" onClick={reset}>
          {t("retry")}
        </Button>
      </div>
    </main>
  );
}
