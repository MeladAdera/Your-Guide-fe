import { getTranslations } from "next-intl/server";
import { ComingNext } from "@/components/shared/coming-next";

export default async function ProgressPage() {
  const t = await getTranslations("nav");
  return <ComingNext title={t("progress")} />;
}
