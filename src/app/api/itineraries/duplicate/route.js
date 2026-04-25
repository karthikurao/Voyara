import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@/lib/auth';
import { mongoIdSchema, readJsonBody, rejectCrossOrigin } from '@/lib/request-security';
import { connectDB } from '@/lib/mongodb';
import { Itinerary } from '@/lib/schema';
import { buildItineraryInsights, mergeChecklistState } from '@/lib/insights';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const originError = rejectCrossOrigin(req);
  if (originError) return originError;

  const user = await authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'You must be logged in to duplicate an itinerary.' }, { status: 401 });
  }

  const { data: parsedBody, error: bodyError } = await readJsonBody(req);
  if (bodyError) return bodyError;

  const Schema = z.object({
    id: z.string().regex(mongoIdSchema, 'Invalid itinerary id'),
  });
  const result = Schema.safeParse(parsedBody);
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid payload', details: result.error.flatten() }, { status: 400 });
  }
  const { id } = result.data;

  // 3. Fetch and duplicate the itinerary if owned by user
  try {
    await connectDB();
    // Fetch itinerary
    const trip = await Itinerary.findById(id);
    if (!trip || trip.user_id.toString() !== user.sub) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }
    const context = trip.context || { destination: trip.destination };
    const insights = buildItineraryInsights(trip.itinerary_data, context);
    const metadata = mergeChecklistState({}, insights);

    const newTrip = await Itinerary.create({
      user_id: user.sub,
      destination: trip.destination,
      itinerary_data: trip.itinerary_data,
      context,
      metadata,
      is_public: false,
    });
    return NextResponse.json({ success: true, newId: newTrip._id });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to duplicate itinerary', details: err?.message || err }, { status: 500 });
  }
}
