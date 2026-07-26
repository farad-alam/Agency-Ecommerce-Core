import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "./env";

// In-memory fallback if Redis is not configured yet
const memoryCache = new Map<string, { count: number; reset: number }>();

class FallbackRatelimit {
  constructor(private maxRequests: number, private windowInSeconds: number) {}

  async limit(identifier: string) {
    const now = Date.now();
    const windowMs = this.windowInSeconds * 1000;
    
    let record = memoryCache.get(identifier);
    
    if (!record || now > record.reset) {
      record = { count: 0, reset: now + windowMs };
    }
    
    record.count++;
    memoryCache.set(identifier, record);
    
    const success = record.count <= this.maxRequests;
    return {
      success,
      limit: this.maxRequests,
      remaining: Math.max(0, this.maxRequests - record.count),
      reset: record.reset,
    };
  }
}

// Global Redis instance wrapper to avoid recreating in development
const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

export const redis = process.env.UPSTASH_REDIS_REST_URL 
  ? globalForRedis.redis || new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
    })
  : undefined;

if (process.env.NODE_ENV !== "production" && redis) {
  globalForRedis.redis = redis;
}

// 1. Auth Rate Limiter (Stricter: 5 requests per 15s)
export const authRateLimit = redis 
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "15 s"),
      analytics: true,
    })
  : new FallbackRatelimit(5, 15);

// 2. Storefront API Rate Limiter (Looser: 100 requests per 10s)
export const apiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "10 s"),
      analytics: true,
    })
  : new FallbackRatelimit(100, 10);
