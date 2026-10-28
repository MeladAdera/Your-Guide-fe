import { AppShell } from "@/components/shared/app-shell";
import { UserProvider } from "@/components/shared/user-provider";
import { WeekRhythm } from "@/features/progress/components/week-rhythm";
import { requireUser } from "@/lib/api/server";

/** Every signed-in screen except the onboarding wizard sits under this layout. */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  return (
    <UserProvider user={user}>
      <AppShell homeTile={<WeekRhythm variant="tile" />}>{children}</AppShell>
    </UserProvider>
  );
}
