import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.login");
  return { title: t("metaTitle") };
}

/** The form lives in the (auth) layout's shell, so it can slide; see auth-shell.tsx. */
export default function SignInPage() {
  return null;
}
