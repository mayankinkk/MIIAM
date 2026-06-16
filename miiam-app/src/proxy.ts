import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";

  // Subdomain routing: partner.miiam.in -> /partner/*
  if (host.startsWith("partner.") && !pathname.startsWith("/partner")) {
    const url = request.nextUrl.clone();
    url.pathname = `/partner${pathname === "/" ? "/dashboard" : pathname}`;
    return NextResponse.rewrite(url);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
