type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitRule = {
  windowMs: number;
  maxRequests: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) {
    return;
  }
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now >= entry.resetAt) {
      store.delete(key);
    }
  }
}

export function checkRateLimit(
  key: string,
  rule: RateLimitRule,
  now = Date.now(),
): RateLimitResult {
  cleanup(now);

  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + rule.windowMs });
    return { allowed: true, remaining: rule.maxRequests - 1, retryAfterSeconds: 0 };
  }

  if (entry.count < rule.maxRequests) {
    entry.count += 1;
    const remaining = rule.maxRequests - entry.count;
    return { allowed: true, remaining, retryAfterSeconds: 0 };
  }

  const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
  return { allowed: false, remaining: 0, retryAfterSeconds };
}

export function resetStore() {
  store.clear();
}

type RateLimitGroup = "auth" | "upload" | "admin" | "read" | "default";

const RULES: Record<RateLimitGroup, RateLimitRule> = {
  auth: { windowMs: 60_000, maxRequests: 10 },
  upload: { windowMs: 300_000, maxRequests: 5 },
  admin: { windowMs: 60_000, maxRequests: 30 },
  read: { windowMs: 60_000, maxRequests: 60 },
  default: { windowMs: 60_000, maxRequests: 100 },
};

export function resolveRateLimitGroup(pathname: string, method: string): RateLimitGroup {
  if (pathname.startsWith("/login") || pathname === "/login/callback") {
    return "auth";
  }

  if (pathname === "/api/exams" && method === "POST") {
    return "upload";
  }

  if (pathname.startsWith("/api/admin")) {
    return "admin";
  }

  if (method === "GET") {
    return "read";
  }

  return "default";
}

export function getRateLimitRule(group: RateLimitGroup): RateLimitRule {
  return RULES[group];
}
