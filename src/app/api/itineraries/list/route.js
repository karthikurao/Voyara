import { NextResponse } from 'next/server';
import { verifyStackAuthJWT } from '@/lib/auth';
import { neonQuery } from '@/lib/db';
import { ensureCoreSchema } from '@/lib/schema';
import { buildItineraryInsights, mergeChecklistState } from '@/lib/insights';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  // Auth: Bearer token from header
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid token' }, { status: 401 });
  }
  const token = authHeader.replace('Bearer ', '');
  const user = await verifyStackAuthJWT(token);
  if (!user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  try {
    await ensureCoreSchema();
    const sql = `SELECT * FROM itineraries WHERE user_id = $1 ORDER BY created_at DESC`;
    const params = [user.sub];
    const data = await neonQuery(sql, params);

    const enriched = await Promise.all((data || []).map(async (trip) => {
      if (trip.metadata) {
        return trip;
      }
      const insights = buildItineraryInsights(trip.itinerary_data, trip.context || { destination: trip.destination });
      const merged = mergeChecklistState({}, insights);
      await neonQuery(
        'UPDATE itineraries SET metadata = $2::jsonb, updated_at = NOW() WHERE id = $1',
        [trip.id, JSON.stringify(merged)],
      );
      return { ...trip, metadata: merged };
    }));

    return NextResponse.json({ itineraries: enriched });
  } catch (error) {
    return NextResponse.json({ error: `Failed to fetch itineraries. ${error.message}` }, { status: 500 });
  }
}
