const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

let warnedOnce = false;

const inMemoryCounts = new Map<string, { count: number; windowStart: number }>();

async function redisEval(script: string, keys: string[], args: string[]): Promise<string | null> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null;
  const res = await fetch(`${UPSTASH_URL}/eval`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ script, keys, args }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return String(data.result ?? "");
}

export async function checkIpRateLimit(
  ip: string,
  maxRequests: number = 30,
  windowMs: number = 60 * 1000
): Promise<boolean> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    if (!warnedOnce) {
      console.warn("[MIIAM] Rate limiting degraded: UPSTASH not configured. Using in-memory fallback (not effective in serverless).");
      warnedOnce = true;
    }

    const now = Date.now();
    const windowStart = now - windowMs;
    const entry = inMemoryCounts.get(ip);

    if (!entry || entry.windowStart < windowStart) {
      inMemoryCounts.set(ip, { count: 1, windowStart: now });
      return true;
    }

    entry.count++;
    return entry.count <= maxRequests;
  }

  const key = `miiam:rl:${ip}`;
  const windowSec = Math.ceil(windowMs / 1000);

  const script = `
    local key = KEYS[1]
    local window = tonumber(ARGV[1])
    local limit = tonumber(ARGV[2])
    local now = tonumber(ARGV[3])
    local window_start = now - window
    redis.call('ZREMRANGEBYSCORE', key, '-inf', window_start)
    local count = redis.call('ZCARD', key)
    if count < limit then
      redis.call('ZADD', key, now, now .. '-' .. math.random(1000000))
      redis.call('EXPIRE', key, window)
      return 1
    end
    return 0
  `;

  const now = Date.now();
  const result = await redisEval(script, [key], [String(windowSec), String(maxRequests), String(now)]);
  return result === "1";
}
