import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyStackAuthJWT } from '@/lib/auth';
import { neonQuery } from '@/lib/db';
import { ensureCoreSchema } from '@/lib/schema';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  // Enforce same-origin to mitigate CSRF for browsers
  const origin = req.headers.get('origin') || '';
  const host = req.headers.get('host') || '';
  if (origin && !origin.includes(host)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  // 1. Check if the user is authenticated via Voyara JWT
  const authHeader = req.headers.get('authorization') || '';
  const jwt = authHeader.replace(/^Bearer /i, '');
  const user = await verifyStackAuthJWT(jwt);
  if (!user) {
    return NextResponse.json({ error: 'You must be logged in to change itinerary visibility.' }, { status: 401 });
  }

  // 2. Get the itinerary id and new status from the request
  const bodyText = await req.text();
  let parsedBody;
  try { parsedBody = JSON.parse(bodyText); } catch { return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 }); }

  const Schema = z.object({
    id: z.string().min(1),
    is_public: z.boolean(),
  });
  const result = Schema.safeParse(parsedBody);
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid payload', details: result.error.flatten() }, { status: 400 });
  }
  const { id, is_public } = result.data;

  // 3. Update the itinerary if owned by user
  try {
    await ensureCoreSchema();
    const checkRes = await neonQuery('SELECT id, user_id FROM itineraries WHERE id = $1', [id]);
    const trip = checkRes[0];
    if (!trip || trip.user_id !== user.sub) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    await neonQuery('UPDATE itineraries SET is_public = $2 WHERE id = $1', [id, is_public]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update itinerary visibility', details: err?.message || err }, { status: 500 });
  }
}
