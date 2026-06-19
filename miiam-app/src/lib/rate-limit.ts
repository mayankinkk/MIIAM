import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let ratelimit: Ratelimit | null = null;

function getRatelimit(): Ratelimit | null {
  if (ratelimit) return ratelimit;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(30, "60 s"),
    analytics: true,
    prefix: "miiam:ratelimit",
  });
  return ratelimit;
}

export async function checkIpRateLimit(
  ip: string,
  maxRequests: number = 30,
  windowMs: number = 60 * 1000
): Promise<boolean> {
  const rl = getRatelimit();
  if (!rl) return true;

  const windowSec = Math.ceil(windowMs / 1000);
  const customRatelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(maxRequests, `${windowSec} s`),
    analytics: false,
    prefix: "miiam:ratelimit:custom",
  });

  const { success } = await customRatelimit.limit(ip);
  return success;
}
