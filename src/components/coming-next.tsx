import { getTranslations } from "next-intl/server";

/** A placeholder for a screen that belongs to a later slice. */
export async function ComingNext({ title }: { title: string }) {
  const t = await getTranslations("home");
  return (
    <div className="grid max-w-2xl gap-3">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground">{t("placeholder")}</p>
    </div>
  );
}
