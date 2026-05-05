import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// -----------------------------------------------------------------------------
// Route guards
//
// Policy:
//   • /dashboard/**, /admin/**, /teacher/**, /onboarding require an
//     authenticated session. Unauthenticated visits bounce to
//     /login?from=<pathname>.
//
//   • /login and /signup are for signed-out users only. Signed-in visitors
//     bounce to their home (/admin for admins, /teacher for teachers,
//     /dashboard for parents).
//
//   • Parents hitting /dashboard/** must have at least one linked child.
//     Otherwise they bounce to /onboarding to complete intake.
//
//   • Parents visiting /onboarding after linking their first child bounce to
//     /dashboard — onboarding is a one-time flow.
//
// Cross-role access (a teacher hitting /dashboard, a parent hitting /admin,
// etc.) renders 404 at the layout level via requireParent / requireAdmin /
// requireTeacher in src/lib/auth.ts. The middleware keeps the authed-landing
// redirect simple and leaves 404-ing to the layouts.
// -----------------------------------------------------------------------------

const protectedPrefixes = ["/dashboard", "/admin", "/teacher", "/onboarding"];
const signedOutOnly = new Set(["/login", "/signup"]);

function homeForRole(role: string | null | undefined): string {
  if (role === "admin") return "/admin";
  if (role === "teacher") return "/teacher";
  return "/dashboard";
}

function isProtected(pathname: string): boolean {
  return protectedPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Supabase email links can land at the site root with `?code=<pkce>` when
  // the project's Site URL points at `/`. Forward those to our callback so
  // the code gets exchanged for a session before we touch auth state.
  if (pathname === "/" && searchParams.has("code")) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    if (!url.searchParams.get("next")) {
      url.searchParams.set("next", "/reset-password");
    }
    return NextResponse.redirect(url);
  }

  const { response, supabase, user } = await updateSession(request);

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
    url.pathname = homeForRole(profile?.role);
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
