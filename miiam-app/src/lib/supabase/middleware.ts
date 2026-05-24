import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Protected routes — require auth
  const protectedPaths = ["/app", "/admin", "/rider", "/partner"];
  const isProtected = protectedPaths.some((p) =>
    request.nextUrl.pathname.startsWith(p)
  );

  if (isProtected) {
    // First check if a session cookie exists (reads cookie locally, no network call)
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      const url = request.nextUrl.clone();
      if (request.nextUrl.pathname.startsWith("/rider")) {
        url.pathname = "/rider/login";
      } else {
        url.pathname = "/auth/login";
      }
      url.searchParams.set("redirect", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    // Call getUser() to refresh the session and verify the token on the server.
    // Do NOT redirect if getUser() returns null — that can happen due to a
    // refresh-token race condition (see @supabase/ssr README "Concurrent
    // requests with the same expired session"). The session cookie exists,
    // so the client will handle recovery.
    const { data: { user } } = await supabase.auth.getUser();

    // Role-only routes - check only if user is logged in
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      // Admin-only routes
      if (request.nextUrl.pathname.startsWith("/admin") && profile && profile.role !== "admin") {
        const url = request.nextUrl.clone();
        url.pathname = "/denied";
        return NextResponse.redirect(url);
      }

      // Partner/vendor routes - allow admin or vendor role, or registration page
      if (
        request.nextUrl.pathname.startsWith("/partner") &&
        !request.nextUrl.pathname.startsWith("/partner/register") &&
        profile &&
        profile.role !== "vendor" &&
        profile.role !== "admin"
      ) {
        const url = request.nextUrl.clone();
        url.pathname = "/denied";
        url.searchParams.set("from", "partner");
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
