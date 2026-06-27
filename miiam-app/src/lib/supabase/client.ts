import { createBrowserClient } from '@supabase/ssr'

type SupabaseClient = ReturnType<typeof createBrowserClient>;

function createStubClient(): SupabaseClient {
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop) {
      if (prop === "then") return undefined;
      return () => {
        console.error(`[MIIAM] Supabase stub called: ${String(prop)}. Ensure env vars are set at runtime.`);
        return { data: null, error: new Error("Supabase client not initialized. Environment variables missing.") };
      };
    },
  };
  return new Proxy({}, handler) as SupabaseClient;
}

export function createClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    if (typeof window === "undefined") {
      return createStubClient();
    }
    console.error("[MIIAM] Supabase credentials missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
    throw new Error("[MIIAM] Supabase credentials missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  }

  return createBrowserClient(url, key, {
    cookieOptions: {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  });
}
