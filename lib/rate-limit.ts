const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 20;

type Bucket = { count: number; windowStart: number };

// Single-instance in-memory store — acceptable for the current Lightsail
// deployment (no horizontal scaling, no need for Redis/Upstash at this scale).
const buckets = new Map<string, Bucket>();

export function checkRateLimit(ip: string): { allowed: boolean } {
  const now = Date.now();
  const bucket = buckets.get(ip);

  if (!bucket || now - bucket.windowStart >= WINDOW_MS) {
    buckets.set(ip, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (bucket.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false };
  }

  bucket.count += 1;
  return { allowed: true };
}
