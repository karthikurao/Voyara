
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@/lib/auth';
import { readJsonBody, rejectCrossOrigin } from '@/lib/request-security';
import { neonQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: List active share tokens for a user's itinerary
export async function GET(req) {
  const user = await authenticateRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = new URL(req.url);
  const itineraryId = url.searchParams.get('id');
  if (!itineraryId) return NextResponse.json({ error: 'Missing itineraryId' }, { status: 400 });
  // Query shares table for active tokens for this itinerary and user
  try {
    const shares = await neonQuery(
      'SELECT token, created_at, revoked FROM shares WHERE itinerary_id = $1 AND user_id = $2 AND revoked = false',
      [itineraryId, user.sub]
    );
    return NextResponse.json({ shares });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch shares', details: err?.message || err }, { status: 500 });
  }
}

// POST: Revoke a share token
export async function POST(req) {
  const originError = rejectCrossOrigin(req);
  if (originError) return originError;

  const user = await authenticateRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: parsedBody, error: bodyError } = await readJsonBody(req);
  if (bodyError) return bodyError;
  const Schema = z.object({ token: z.string().min(1) });
  const result = Schema.safeParse(parsedBody);
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid payload', details: result.error.flatten() }, { status: 400 });
  }
  const { token } = result.data;
  // Mark token as revoked in shares table
  try {
    await neonQuery('UPDATE shares SET revoked = true WHERE token = $1 AND user_id = $2', [token, user.sub]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to revoke share token', details: err?.message || err }, { status: 500 });
  }
}
