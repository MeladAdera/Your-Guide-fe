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
      if (pathname.startsWith("/login") || pathname.startsWith("/register")) return;
      const next = encodeURIComponent(pathname);
      router.replace(`/login?next=${next}`);
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [router, pathname]);
  return null;
}
