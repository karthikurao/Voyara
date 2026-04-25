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
    return NextResponse.json({ error: 'You must be logged in to update an itinerary.' }, { status: 401 });
  }

  const { data: parsedBody, error: bodyError } = await readJsonBody(req);
  if (bodyError) return bodyError;

  const Schema = z.object({
    id: z.string().regex(mongoIdSchema, 'Invalid itinerary id'),
    destination: z.string().trim().min(1).optional(),
    itinerary_data: z.any().optional(),
    context: z.any().optional(),
    metadata: z.any().optional(),
    mode: z.enum(['replace', 'patch']).optional(),
  });
  const result = Schema.safeParse(parsedBody);
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid payload', details: result.error.flatten() }, { status: 400 });
  }
  const { id, destination, itinerary_data, context, metadata, mode } = result.data;

  // 3. Update the itinerary if owned by user
  try {
    await connectDB();
    // Check ownership
    const trip = await Itinerary.findById(id);
    if (!trip || trip.user_id.toString() !== user.sub) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }
    const nextDestination = destination ?? trip.destination;
    const nextItineraryData = itinerary_data ?? trip.itinerary_data;
    const providedContext = context ?? {};
    const combinedContext = {
      ...(trip.context || {}),
      ...providedContext,
      destination: nextDestination,
    };

    let nextMetadata = metadata;

    if (!nextMetadata) {
      const freshInsights = buildItineraryInsights(nextItineraryData, combinedContext);
      nextMetadata = mergeChecklistState(trip.metadata || {}, freshInsights);
    } else if (mode === 'patch' && trip.metadata) {
      // Merge booleans for packing/prep checklists while honouring explicit patch payload.
      const merged = mergeChecklistState(trip.metadata, nextMetadata);
      nextMetadata = { ...trip.metadata, ...nextMetadata, packingList: merged.packingList, prepChecklist: merged.prepChecklist };
    }

    const finalMetadata = nextMetadata ?? trip.metadata ?? {};

    await Itinerary.findByIdAndUpdate(
      id,
      {
        destination: nextDestination,
        itinerary_data: nextItineraryData,
        context: combinedContext,
        metadata: finalMetadata,
        updated_at: new Date(),
      },
      { new: true }
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update itinerary', details: err?.message || err }, { status: 500 });
  }
}

