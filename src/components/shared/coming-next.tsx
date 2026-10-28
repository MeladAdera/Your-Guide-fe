import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";

/** A placeholder for a screen that belongs to a later slice. */
export async function ComingNext({ title }: { title: string }) {
  const t = await getTranslations("common");
  return <PageHeader title={title} intro={t("comingNext")} />;
}
