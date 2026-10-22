import { getTranslations } from "next-intl/server";
import { ComingNext } from "@/components/coming-next";

export default async function GoalsPage() {
  const t = await getTranslations("nav");
  return <ComingNext title={t("goals")} />;
}
