import { type CookieOptions, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv } from "./env";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/** Supabase client for server components, server actions and route handlers. */
export async function createClient() {
  // Read cookies first: this marks the caller as dynamically rendered, so a
  // production build never tries to prerender a page that needs a session.
  const cookieStore = await cookies();
  const { url, anonKey } = supabaseEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server components cannot set cookies. The middleware refreshes the
          // session instead, so this is safe to swallow.
        }
      },
    },
  });
}
