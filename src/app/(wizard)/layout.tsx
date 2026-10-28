import { getTranslations } from "next-intl/server";
import { BrandMark } from "@/components/shared/brand-mark";
import { UserProvider } from "@/components/shared/user-provider";
import { LocaleSwitch } from "@/features/settings/components/locale-switch";
import { requireUser } from "@/lib/api/server";

/**
 * The onboarding wizard: signed in, but without the app's navigation, so the
 * person sees only the questions. Above the card the logo and EN / AR, as on
 * the sign-in screen.
 */
export default async function WizardLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const t = await getTranslations("app");
  return (
    <UserProvider user={user}>
      <div className="flex min-h-dvh flex-col bg-background lg:bg-muted">
        <header className="flex h-17 items-center justify-between px-5 lg:h-auto lg:px-10 lg:py-5">
          <BrandMark name={t("name")} />
          <LocaleSwitch compact />
        </header>
        {children}
      </div>
    </UserProvider>
  );
}
