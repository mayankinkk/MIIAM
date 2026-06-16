import { NextRequest, NextResponse } from "next/server";
import { checkIpRateLimit, getClientIp } from "@/lib/security";

type RouteHandler = (request: NextRequest, context?: any) => Promise<NextResponse>;

export function withRateLimit(handler: RouteHandler, maxRequests = 30, windowMs = 60 * 1000): RouteHandler {
  return async (request: NextRequest, context?: any) => {
    const ip = getClientIp(request);
    if (!checkIpRateLimit(ip, maxRequests, windowMs)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }
    return handler(request, context);
  };
}

export function withAuthRateLimit(handler: RouteHandler): RouteHandler {
  return withRateLimit(handler, 10, 60 * 1000);
}

export function withCronAuth(handler: RouteHandler): RouteHandler {
  return async (request: NextRequest, context?: any) => {
    const { requireCronAuth } = await import("@/lib/security");
    const authed = await requireCronAuth(request);
    if (!authed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return handler(request, context);
  };
}
