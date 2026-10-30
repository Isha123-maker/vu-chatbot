import { createHmac } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const PER_MINUTE_LIMIT = 5;
const PER_DAY_LIMIT = 40;
const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

type LocalWindow = {
  minuteStart: number;
  minuteCount: number;
  dayStart: number;
  dayCount: number;
};
type RateLimitResult = { success: boolean; retryAfterSeconds: number };

const localWindows = new Map<string, LocalWindow>();

let upstashLimiters:
  | { perMinute: Ratelimit; perDay: Ratelimit; token: string }
  | undefined;

function getUpstashLimiters() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  if (!upstashLimiters) {
    const redis = new Redis({ url, token });
    upstashLimiters = {
      token,
      perMinute: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(PER_MINUTE_LIMIT, "1 m"),
        prefix: "vu-chat:minute",
        timeout: 3000,
      }),
      perDay: new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(PER_DAY_LIMIT, "1 d"),
        prefix: "vu-chat:day",
        timeout: 3000,
      }),
    };
  }

  return upstashLimiters;
}

function pruneLocalWindows(now: number) {
  for (const [key, value] of localWindows) {
    if (value.dayStart + DAY_MS <= now) localWindows.delete(key);
  }
}

function consumeLocalWindow(identifier: string, now: number): RateLimitResult {
  const minuteStart = Math.floor(now / MINUTE_MS) * MINUTE_MS;
  const dayStart = Math.floor(now / DAY_MS) * DAY_MS;
  let window = localWindows.get(identifier);

  if (!window) {
    if (localWindows.size >= 10_000) pruneLocalWindows(now);
    if (localWindows.size >= 10_000) {
      throw new Error("Local chat rate limiter is at capacity.");
    }
    window = { minuteStart, minuteCount: 0, dayStart, dayCount: 0 };
  }

  if (window.minuteStart !== minuteStart) {
    window.minuteStart = minuteStart;
    window.minuteCount = 0;
  }
  if (window.dayStart !== dayStart) {
    window.dayStart = dayStart;
    window.dayCount = 0;
  }

  window.minuteCount += 1;
  window.dayCount += 1;
  localWindows.set(identifier, window);

  if (window.minuteCount > PER_MINUTE_LIMIT) {
    return {
      success: false,
      retryAfterSeconds: Math.max(1, Math.ceil((minuteStart + MINUTE_MS - now) / 1000)),
    };
  }
  if (window.dayCount > PER_DAY_LIMIT) {
    return {
      success: false,
      retryAfterSeconds: Math.max(1, Math.ceil((dayStart + DAY_MS - now) / 1000)),
    };
  }
  return { success: true, retryAfterSeconds: 0 };
}

export async function checkChatRateLimit(clientIp: string): Promise<RateLimitResult> {
  const upstash = getUpstashLimiters();

  if (!upstash) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Chat rate limiter is not configured.");
    }

    return consumeLocalWindow(`dev:${clientIp}`, Date.now());
  }

  // Hash the IP before it is used as a Redis key; the secret salt stays server-side.
  const identifier = createHmac("sha256", upstash.token).update(clientIp).digest("hex");
  const minute = await upstash.perMinute.limit(identifier);
  if (minute.reason === "timeout") {
    throw new Error("Chat rate limiter timed out.");
  }
  if (!minute.success) {
    return {
      success: false,
      retryAfterSeconds: Math.max(1, Math.ceil((minute.reset - Date.now()) / 1000)),
    };
  }

  const day = await upstash.perDay.limit(identifier);
  if (day.reason === "timeout") {
    throw new Error("Chat daily rate limiter timed out.");
  }
  if (!day.success) {
    return {
      success: false,
      retryAfterSeconds: Math.max(1, Math.ceil((day.reset - Date.now()) / 1000)),
    };
  }

  return { success: true, retryAfterSeconds: 0 };
}
