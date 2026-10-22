import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations();
  return (
    <main id="content" className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">{t("errors.not_found")}</h1>
      <div>
        <Button asChild size="lg">
          <Link href="/">{t("nav.home")}</Link>
        </Button>
      </div>
    </main>
  );
}
