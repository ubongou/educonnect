import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/db";

/**
 * Server-side Supabase client for use in Server Components, Server Actions,
 * and Route Handlers. Reads and writes auth cookies via Next's cookie store.
 *
 * Throws silently when called in a Server Component render pass and mutating
 * cookies isn't permitted — that's expected.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (items) => {
          try {
            items.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Component render — cookie mutation not allowed.
          }
        },
      },
    },
  );
}

/**
 * Service-role client — **server-only**. Bypasses RLS. Use sparingly: only
 * from route handlers that have already verified the caller has access to
 * the requested resource.
 */
export function createServiceRoleClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    },
  );
}
