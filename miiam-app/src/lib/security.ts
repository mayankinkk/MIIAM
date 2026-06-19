import crypto from "crypto";
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const VERIFY_RATE_LIMIT_MAX = 5;
const VERIFY_RATE_LIMIT_WINDOW = 10 * 60 * 1000;

export async function checkVerifyRateLimit(
  supabase: ReturnType<typeof createAdminClient>,
  table: string,
  identifier: string,
  identifierColumn: string
): Promise<boolean> {
  const windowStart = new Date(Date.now() - VERIFY_RATE_LIMIT_WINDOW).toISOString();
  const { count } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq(identifierColumn, identifier)
    .gte("created_at", windowStart);
  return (count || 0) < VERIFY_RATE_LIMIT_MAX;
}

export async function incrementVerifyAttempts(
  supabase: ReturnType<typeof createAdminClient>,
  table: string,
  identifier: string,
  identifierColumn: string
): Promise<void> {
  await supabase.from(table).insert({
    [identifierColumn]: identifier,
    created_at: new Date().toISOString(),
  });
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) return { valid: false, error: "Password must be at least 8 characters" };
  if (!/[A-Z]/.test(password)) return { valid: false, error: "Password must contain an uppercase letter" };
  if (!/[a-z]/.test(password)) return { valid: false, error: "Password must contain a lowercase letter" };
  if (!/[0-9]/.test(password)) return { valid: false, error: "Password must contain a number" };
  if (!/[^A-Za-z0-9]/.test(password)) return { valid: false, error: "Password must contain a special character" };
  return { valid: true };
}

export async function requireCronAuth(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get("authorization") || request.headers.get("x-cron-secret");
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}

export function getHmacSecret(): string {
  const secret = process.env.HMAC_SECRET;
  if (!secret) throw new Error("HMAC_SECRET must be set — never fallback to other secrets");
  return secret;
}

export function signHmac(email: string, token: string): string {
  return crypto.createHmac("sha256", getHmacSecret()).update(`${email}:${token}`).digest("hex");
}

export function verifyHmac(email: string, token: string, providedHmac: string): boolean {
  const expected = signHmac(email, token);
  if (expected.length !== providedHmac.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(providedHmac));
}

export function checkCsrf(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host !== host) return false;
    } catch {
      return false;
    }
  }
  const referer = request.headers.get("referer");
  if (referer && host) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.host !== host) return false;
    } catch {
      return false;
    }
  }
  const hasCookies = request.cookies.getAll().length > 0;
  if (hasCookies && !origin && !referer) return false;
  return true;
}

// IP-based rate limiting backed by Upstash Redis (persistent across serverless cold starts).
export async function checkIpRateLimit(
  ip: string,
  maxRequests: number = 30,
  windowMs: number = 60 * 1000
): Promise<boolean> {
  const { checkIpRateLimit: checkUpstash } = await import(/* webpackIgnore: true */ "@/lib/rate-limit");
  return checkUpstash(ip, maxRequests, windowMs);
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}
