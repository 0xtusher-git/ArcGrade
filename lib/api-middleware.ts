import { NextRequest, NextResponse } from 'next/server';

const WINDOW_SIZE_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 100;

interface RateLimitData {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
const ipRequests = new Map<string, RateLimitData>();

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Clean up expired rate limits occasionally to prevent memory leaks
 */
function cleanupRateLimits() {
  const now = Date.now();
  ipRequests.forEach((data, ip) => {
    if (now > data.resetTime) {
      ipRequests.delete(ip);
    }
  });
}

// Clean up every hour
setInterval(cleanupRateLimits, WINDOW_SIZE_MS);

export function checkRateLimit(req: NextRequest): { allowed: boolean; retryAfter?: number; headers: Record<string, string> } {
  // Extract IP from headers or default to a fallback
  const ip = req.headers.get('x-forwarded-for') || req.ip || '127.0.0.1';
  const now = Date.now();

  let data = ipRequests.get(ip);

  if (!data || now > data.resetTime) {
    // New window
    data = { count: 1, resetTime: now + WINDOW_SIZE_MS };
    ipRequests.set(ip, data);
  } else {
    data.count++;
  }

  const remaining = Math.max(0, MAX_REQUESTS - data.count);
  const resetTimeSec = Math.ceil(data.resetTime / 1000);

  const rateLimitHeaders = {
    'X-RateLimit-Limit': MAX_REQUESTS.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': resetTimeSec.toString(),
  };

  if (data.count > MAX_REQUESTS) {
    const retryAfter = Math.ceil((data.resetTime - now) / 1000);
    return { allowed: false, retryAfter, headers: rateLimitHeaders };
  }

  return { allowed: true, headers: rateLimitHeaders };
}

export function handleOptions() {
  return NextResponse.json({}, { headers: corsHeaders });
}
