import { NextResponse } from 'next/server.js';

const DEFAULT_MAX_BODY_BYTES = 500_000;

export const mongoIdSchema = /^[a-f\d]{24}$/i;

export function rejectCrossOrigin(req) {
  const origin = req.headers.get('origin');
  if (!origin) {
    return null;
  }

  const host = req.headers.get('host');
  if (!host) {
    return NextResponse.json({ error: 'Invalid host' }, { status: 400 });
  }

  try {
    const originUrl = new URL(origin);
    if (originUrl.host !== host) {
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  return null;
}

export function noStoreResponse(body, init = {}) {
  const response = NextResponse.json(body, init);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export function rateLimit(key, { limit, windowMs }) {
  globalThis.__voyaraRateLimits = globalThis.__voyaraRateLimits || new Map();

  const now = Date.now();
  const record = globalThis.__voyaraRateLimits.get(key) || { count: 0, resetAt: now + windowMs };

  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + windowMs;
  }

  record.count += 1;
  globalThis.__voyaraRateLimits.set(key, record);

  return {
    allowed: record.count <= limit,
    retryAfterSeconds: Math.ceil(Math.max(record.resetAt - now, 0) / 1000),
  };
}

export async function readJsonBody(req, maxBytes = DEFAULT_MAX_BODY_BYTES) {
  const bodyText = await req.text();
  if (bodyText.length > maxBytes) {
    return { error: NextResponse.json({ error: 'Payload too large.' }, { status: 413 }) };
  }

  try {
    return { data: JSON.parse(bodyText) };
  } catch {
    return { error: NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 }) };
  }
}
