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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes — require auth
  const protectedPaths = ["/app", "/admin", "/rider"];
  const isProtected = protectedPaths.some((p) =>
    request.nextUrl.pathname.startsWith(p)
  );

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    // Redirect riders to their login page, customers to the general login
    if (request.nextUrl.pathname.startsWith("/rider")) {
      url.pathname = "/rider/login";
    } else {
      url.pathname = "/auth/login";
    }
    // Preserve the intended destination so we can redirect back after login
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Admin-only routes - check only if user is logged in
  if (request.nextUrl.pathname.startsWith("/admin") && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    // Allow access if role is admin or if profile doesn't exist yet (new user)
    if (profile && profile.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/denied";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
