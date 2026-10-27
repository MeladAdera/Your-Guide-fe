"use client";

import { useTranslations } from "next-intl";
import { useUser } from "@/components/shared/user-provider";

export function SignedInAs() {
  const t = useTranslations("home");
  const user = useUser();
  return (
    <p className="text-sm text-muted-foreground" dir="auto">
      {t("signedInAs", { email: user.email })}
    </p>
  );
}
