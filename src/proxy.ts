import { NextResponse, type NextRequest } from "next/server";

/** The API's session cookie (docs/handoff.md §4). Its presence is a hint, never proof. */
const SESSION_COOKIE = "your_guide_session";
const PUBLIC_PATHS = ["/sign-in", "/sign-up", "/signed-out"];

/**
 * Optimistic check only: a request with no session cookie cannot be logged in,
 * so send it to login and keep the return path. Real verification is the
 * `GET /api/auth/me` call in the (app) layout; a stale cookie passes here and
 * is caught there.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return NextResponse.next();
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  const login = request.nextUrl.clone();
  login.pathname = "/sign-in";
  login.search = "";
  if (pathname !== "/") login.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(login);
}

export const config = {
  // Everything except the API proxy, Next's own assets and static files.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|ico|jpg|jpeg|webp|txt|xml|json)$).*)"],
};
