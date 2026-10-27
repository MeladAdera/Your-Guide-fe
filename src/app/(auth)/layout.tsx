import { getTranslations } from "next-intl/server";
import { BrandMark } from "@/components/shared/brand-mark";
import { AuthArt } from "@/features/auth/components/auth-art";
import { LocaleSwitch } from "@/features/settings/components/locale-switch";
import { ThemeToggle } from "@/features/settings/components/theme-toggle";

/**
 * The sign-in frame (docs/features/00-auth.md): the page on the start side, the
 * path picture on the end side from laptop width, a band of it above the form
 * on a phone.
 */
export default async function AuthLayout({ children }: LayoutProps<"/">) {
  const t = await getTranslations("app");
  return (
    <div className="grid min-h-dvh bg-card lg:grid-cols-2">
      <div className="flex min-w-0 flex-col">
        <header className="flex items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <BrandMark name={t("name")} className="whitespace-nowrap" />
          <LocaleSwitch />
        </header>
        <div className="relative h-40 overflow-hidden bg-muted lg:hidden">
          <AuthArt priority />
        </div>
        <main id="content" className="mx-auto flex w-full max-w-sm flex-1 flex-col px-4 pt-8 pb-10 lg:justify-center lg:py-10">
          {children}
        </main>
        <footer className="flex items-center justify-between gap-4 px-4 pb-6 text-sm text-muted-foreground sm:px-8">
          <span>
            © {new Date().getFullYear()} {t("name")}
          </span>
          <ThemeToggle />
        </footer>
      </div>
      <aside aria-hidden className="relative hidden overflow-hidden bg-muted lg:block">
        <AuthArt />
      </aside>
    </div>
  );
}
