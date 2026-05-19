type Bucket = { tokens: number; resetAt: number }

const buckets = new Map<string, Bucket>()
let callCount = 0

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now()

  if (++callCount % 100 === 0) {
    for (const [k, v] of buckets) {
      if (now > v.resetAt) buckets.delete(k)
    }
  }

  const b = buckets.get(key)
  if (!b || now > b.resetAt) {
    buckets.set(key, { tokens: limit - 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterSec: 0 }
  }

  if (b.tokens <= 0) {
    return { allowed: false, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) }
  }

  b.tokens--
  return { allowed: true, retryAfterSec: 0 }
}

export function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}
