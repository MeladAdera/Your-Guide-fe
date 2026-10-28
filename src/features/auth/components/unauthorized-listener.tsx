"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { UNAUTHORIZED_EVENT } from "@/lib/api/client";

/**
 * On any 401 from any route the person is logged out: go to login and keep
 * the return path (docs/handoff.md §4).
 */
export function UnauthorizedListener() {
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    const onUnauthorized = () => {
      if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) return;
      const next = encodeURIComponent(pathname);
      // `reason=expired` lets the login page say why the person is there.
      router.replace(`/sign-in?next=${next}&reason=expired`);
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [router, pathname]);
  return null;
}
