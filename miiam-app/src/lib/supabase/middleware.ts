import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const protectedPaths = ["/app", "/admin", "/rider", "/partner"];
  const isProtected = protectedPaths.some((p) =>
    request.nextUrl.pathname.startsWith(p)
  );

  if (isProtected) {
    // Check for Firebase session cookie (set by client-side Firebase Auth)
    const sessionCookie = request.cookies.get("__session")?.value;
    const idToken = request.cookies.get("fb_id_token")?.value;

    if (!sessionCookie && !idToken) {
      const url = request.nextUrl.clone();
      if (request.nextUrl.pathname.startsWith("/rider")) {
        url.pathname = "/rider/login";
      } else {
        url.pathname = "/auth/login";
      }
      url.searchParams.set("redirect", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }

  return response;
}
