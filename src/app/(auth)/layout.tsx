import { getTranslations } from "next-intl/server";
import { LocaleSwitch } from "@/components/settings/locale-switch";
import { ThemeToggle } from "@/components/settings/theme-toggle";

export default async function AuthLayout({ children }: LayoutProps<"/">) {
  const t = await getTranslations("app");
  return (
    <div className="flex min-h-full flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <span className="flex items-center gap-2 font-semibold tracking-tight">
          <span aria-hidden className="size-4 rounded-[5px] bg-primary" />
          {t("name")}
        </span>
        <div className="flex items-center gap-2">
          <LocaleSwitch />
          <ThemeToggle />
        </div>
      </header>
      <main id="content" className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-8">
        {children}
      </main>
    </div>
  );
}
