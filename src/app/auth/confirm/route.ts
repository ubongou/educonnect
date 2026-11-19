import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Supabase email links that carry `?token_hash=…&type=…` land here. Unlike the
// PKCE `?code=` flow in /auth/callback, verifying a token hash needs no cookie
// from the browser that asked for the email, so the link works when it's opened
// on another device or in a mail app's built-in browser.
//
// The Supabase "Reset password" email template must point here:
//   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next");
  const isRecovery = type === "recovery";
  const next =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : isRecovery
        ? "/reset-password"
        : "/";

  if (!tokenHash || !type) {
    return NextResponse.redirect(
      `${origin}${isRecovery ? "/forgot-password?expired=1" : "/login?error=invalid_link"}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error) {
    return NextResponse.redirect(
      `${origin}${isRecovery ? "/forgot-password?expired=1" : "/login?error=invalid_link"}`,
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
