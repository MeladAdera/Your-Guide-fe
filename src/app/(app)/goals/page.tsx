import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { GoalsBoard } from "@/features/goals/components/goals-board";
import { serverApi } from "@/lib/api/server";
import type { Goal } from "@/lib/api/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("goals");
  return { title: t("title") };
}

/** Both lists load on the server, so both tabs and their counts are there on first paint. */
export default async function GoalsPage() {
  const [active, archived] = await Promise.all([serverApi<Goal[]>("/api/goals"), serverApi<Goal[]>("/api/goals", { query: { archived: true } })]);
  return <GoalsBoard active={active} archived={archived} />;
}
