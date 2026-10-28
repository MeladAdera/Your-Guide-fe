import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.register");
  return { title: t("metaTitle") };
}

/** The form lives in the (auth) layout's shell, so it can slide; see auth-shell.tsx. */
export default function SignUpPage() {
  return null;
}
