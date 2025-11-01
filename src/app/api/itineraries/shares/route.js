
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyStackAuthJWT } from '@/lib/auth';
import { neonQuery } from '@/lib/db';
import { ensureCoreSchema } from '@/lib/schema';

export const dynamic = 'force-dynamic';

// GET: List active share tokens for a user's itinerary
export async function GET(req) {
  const authHeader = req.headers.get('authorization') || '';
  const jwt = authHeader.replace(/^Bearer /i, '');
  const user = await verifyStackAuthJWT(jwt);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = new URL(req.url);
  const itineraryId = url.searchParams.get('id');
  if (!itineraryId) return NextResponse.json({ error: 'Missing itineraryId' }, { status: 400 });
  // Query shares table for active tokens for this itinerary and user
  try {
    await ensureCoreSchema();
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
  const authHeader = req.headers.get('authorization') || '';
  const jwt = authHeader.replace(/^Bearer /i, '');
  const user = await verifyStackAuthJWT(jwt);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const bodyText = await req.text();
  let parsedBody;
  try { parsedBody = JSON.parse(bodyText); } catch { return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 }); }
  const Schema = z.object({ token: z.string().min(1) });
  const result = Schema.safeParse(parsedBody);
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid payload', details: result.error.flatten() }, { status: 400 });
  }
  const { token } = result.data;
  // Mark token as revoked in shares table
  try {
    await ensureCoreSchema();
    await neonQuery('UPDATE shares SET revoked = true WHERE token = $1 AND user_id = $2', [token, user.sub]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to revoke share token', details: err?.message || err }, { status: 500 });
  }
}
