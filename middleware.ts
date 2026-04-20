import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// -----------------------------------------------------------------------------
// Route guards
//
// Policy:
//   • /dashboard/**, /admin/**, /onboarding require an authenticated session.
//     Unauthenticated visits bounce to /login?from=<pathname>.
//
//   • /login and /signup are for signed-out users only. Signed-in visitors
//     bounce to their home (/admin for admins, /dashboard for parents).
//
//   • Parents hitting /dashboard/** must have at least one linked child.
//     Otherwise they bounce to /onboarding to complete intake.
//
//   • Parents visiting /onboarding after linking their first child bounce to
//     /dashboard — onboarding is a one-time flow.
//
// Admin access to /dashboard (and vice-versa) renders 404 at the layout level
// (see src/lib/auth.ts::requireParent/requireAdmin). The middleware does not
// 404 here so the authed-landing redirect stays simple.
// -----------------------------------------------------------------------------

const protectedPrefixes = ["/dashboard", "/admin", "/onboarding"];
const signedOutOnly = new Set(["/login", "/signup"]);

function isProtected(pathname: string): boolean {
  return protectedPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  const { response, supabase, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Unauthenticated visitor hitting a protected area.
  if (!user && isProtected(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated visitor hitting /login or /signup.
  if (user && signedOutOnly.has(pathname)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const url = request.nextUrl.clone();
    url.pathname = profile?.role === "admin" ? "/admin" : "/dashboard";
    return NextResponse.redirect(url);
  }

  // Onboarding gate for parents.
  if (user && (pathname === "/onboarding" || pathname.startsWith("/dashboard"))) {
    const [{ data: profile }, { count }] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).single(),
      supabase
        .from("parent_students")
        .select("*", { count: "exact", head: true })
        .eq("parent_id", user.id),
    ]);

    // Admins bypass the onboarding gate entirely; they shouldn't be on
    // /dashboard or /onboarding, but if they land there the layout's
    // requireAdmin/requireParent will 404 them.
    if (profile?.role === "parent") {
      const hasChild = (count ?? 0) > 0;
      const url = request.nextUrl.clone();

      if (pathname.startsWith("/dashboard") && !hasChild) {
        url.pathname = "/onboarding";
        return NextResponse.redirect(url);
      }

      if (pathname === "/onboarding" && hasChild) {
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
    }
  }

  return response;
}

export const config = {
  // Run middleware for every request except Next internals and static assets.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
