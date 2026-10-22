import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { UserProvider } from "@/components/user-provider";
import { serverApiOrNull } from "@/lib/api/server";
import type { User } from "@/lib/api/types";

/**
 * Every signed-in screen sits under this layout. The app learns whether someone
 * is logged in by asking the API (docs/handoff.md §4): 200 is a user, 401 is not.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await serverApiOrNull<User>("/api/auth/me", ["auth.not_logged_in", "401"]);
  if (!user) redirect("/login");
  return (
    <UserProvider user={user}>
      <AppShell>{children}</AppShell>
    </UserProvider>
  );
}
