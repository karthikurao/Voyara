import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { authenticateRequest } from '@/lib/auth';
import { mongoIdSchema, rejectCrossOrigin } from '@/lib/request-security';
import { connectDB } from '@/lib/mongodb';
import { Itinerary } from '@/lib/schema';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const originError = rejectCrossOrigin(req);
    if (originError) return originError;

    const user = await authenticateRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Simple per-user rate limit (30 req / 10 min)
    const key = `share:${user.sub}`;
    globalThis.__shareRate = globalThis.__shareRate || new Map();
    const rec = globalThis.__shareRate.get(key) || { count: 0, ts: Date.now() };
    const WINDOW = 10 * 60 * 1000; // 10 min
    const LIMIT = 30;
    const now = Date.now();
    if (now - rec.ts > WINDOW) { rec.count = 0; rec.ts = now; }
    rec.count++;
    globalThis.__shareRate.set(key, rec);
    if (rec.count > LIMIT) {
      return NextResponse.json({ error: 'Too many share links created. Please try later.' }, { status: 429 });
    }

    const { itineraryId } = await req.json();
    if (!mongoIdSchema.test(itineraryId || '')) {
      return NextResponse.json({ error: 'Invalid itineraryId' }, { status: 400 });
    }

    // Ensure the itinerary belongs to the requesting user
    await connectDB();
    const trip = await Itinerary.findById(itineraryId);
    if (!trip || trip.user_id.toString() !== user.sub) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const secret = process.env.SHARE_TOKEN_SECRET;
    if (!secret) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

    const token = await new SignJWT({ it: itineraryId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(new TextEncoder().encode(secret));

    return NextResponse.json({ token });
  } catch (e) {
    console.error('Error signing share token:', e);
    return NextResponse.json({ error: 'Failed to create share token' }, { status: 500 });
  }
}
