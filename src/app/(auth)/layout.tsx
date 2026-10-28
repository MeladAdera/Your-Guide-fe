import { AuthShell } from "@/features/auth/components/auth-shell";

/**
 * /sign-in and /sign-up share one mounted shell so switching between them is a
 * slide, not a page swap (docs/features/00-auth.md). The pages render nothing.
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return <AuthShell>{children}</AuthShell>;
}
