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

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  const target = next.startsWith("/") ? next : "/";
  return NextResponse.redirect(`${origin}${target}`);
}
