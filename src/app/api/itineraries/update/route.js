import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyStackAuthJWT } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { Itinerary } from '@/lib/schema';
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
    return NextResponse.json({ error: 'You must be logged in to update an itinerary.' }, { status: 401 });
  }

  // 2. Get the itinerary data from the request with validation
  const bodyText = await req.text();
  if (bodyText.length > 500_000) {
    return NextResponse.json({ error: 'Payload too large.' }, { status: 413 });
  }
  let parsedBody;
  try { parsedBody = JSON.parse(bodyText); } catch { return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 }); }

  const Schema = z.object({
    id: z.string().min(1),
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

