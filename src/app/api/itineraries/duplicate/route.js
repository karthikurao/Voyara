import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyStackAuthJWT } from '@/lib/auth';
import { neonQuery } from '@/lib/db';
import { ensureCoreSchema } from '@/lib/schema';
import { buildItineraryInsights, mergeChecklistState } from '@/lib/insights';

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
    return NextResponse.json({ error: 'You must be logged in to duplicate an itinerary.' }, { status: 401 });
  }

  // 2. Get the itinerary id from the request
  const bodyText = await req.text();
  let parsedBody;
  try { parsedBody = JSON.parse(bodyText); } catch { return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 }); }

  const Schema = z.object({
    id: z.string().min(1),
  });
  const result = Schema.safeParse(parsedBody);
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid payload', details: result.error.flatten() }, { status: 400 });
  }
  const { id } = result.data;

  // 3. Fetch and duplicate the itinerary if owned by user
  try {
    await ensureCoreSchema();
    // Fetch itinerary
    const fetchRes = await neonQuery('SELECT * FROM itineraries WHERE id = $1', [id]);
    const trip = fetchRes[0];
    if (!trip || trip.user_id !== user.sub) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }
    const context = trip.context || { destination: trip.destination };
    const insights = buildItineraryInsights(trip.itinerary_data, context);
    const metadata = mergeChecklistState({}, insights);

    const insert = await neonQuery(
      `INSERT INTO itineraries (user_id, destination, itinerary_data, context, metadata, is_public)
       VALUES ($1, $2, $3::jsonb, $4::jsonb, $5::jsonb, $6)
       RETURNING id`,
      [
        user.sub,
        trip.destination,
        JSON.stringify(trip.itinerary_data),
        JSON.stringify(context),
        JSON.stringify(metadata),
        false,
      ],
    );
    const newTrip = insert[0];
    return NextResponse.json({ success: true, newId: newTrip?.id });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to duplicate itinerary', details: err?.message || err }, { status: 500 });
  }
}
