import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Supabase email links (password recovery, magic links, email confirmation)
// land here with `?code=<pkce-code>`. We exchange the code for a session, then
// forward the user to `next` — defaulting to `/` for normal sign-in flows and
// `/reset-password` for recovery.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  // A failed password-reset link should say so and offer a fresh one, not
  // drop the parent on the sign-in page with no explanation.
  const isRecovery = next === "/reset-password";
  const failTo = isRecovery ? "/forgot-password?expired=1" : "/login?error=invalid_link";

  if (!code) {
    return NextResponse.redirect(`${origin}${failTo}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    // Usually the link was opened in a different browser or device from the
    // one that requested it (the PKCE verifier cookie is missing), or it was
    // already used or expired.
    return NextResponse.redirect(`${origin}${failTo}`);
  }

  const target = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return NextResponse.redirect(`${origin}${target}`);
}
