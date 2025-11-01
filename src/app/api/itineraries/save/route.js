import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyStackAuthJWT } from '@/lib/auth';
import { neonQuery } from '@/lib/db';
import { ensureCoreSchema } from '@/lib/schema';
import { buildItineraryInsights } from '@/lib/insights';

export const dynamic = 'force-dynamic';

export async function POST(req) {
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

  // Validate payload
  const bodyText = await req.text();
  if (bodyText.length > 500_000) {
    return NextResponse.json({ error: 'Payload too large.' }, { status: 413 });
  }
  let parsedBody;
  try { parsedBody = JSON.parse(bodyText); } catch { return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 }); }

  const Schema = z.object({
    destination: z.string().trim().min(1),
    itinerary_data: z.any(),
    context: z.any().optional(),
  });
  const result = Schema.safeParse(parsedBody);
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid payload', details: result.error.flatten() }, { status: 400 });
  }
  const { destination, itinerary_data, context } = result.data;

  await ensureCoreSchema();

  const baseContext = context || itinerary_data?.context || {};
  const insights = buildItineraryInsights(itinerary_data, {
    ...baseContext,
    destination,
  });

  // Insert into Neon
  try {
  const sql = `INSERT INTO itineraries (user_id, destination, itinerary_data, context, metadata)
         VALUES ($1, $2, $3::jsonb, $4::jsonb, $5::jsonb)
                 RETURNING *`;
    const params = [
      user.sub,
      destination,
      JSON.stringify(itinerary_data),
      JSON.stringify({ ...baseContext, destination }),
      JSON.stringify(insights),
    ];
  const data = await neonQuery(sql, params);
  const created = data[0];
    return NextResponse.json({ success: true, id: created?.id, itinerary: created });
  } catch (error) {
    return NextResponse.json({ error: `Failed to save itinerary. ${error.message}` }, { status: 500 });
  }
}