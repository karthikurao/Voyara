import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@/lib/auth';
import { mongoIdSchema, readJsonBody, rejectCrossOrigin } from '@/lib/request-security';
import { connectDB } from '@/lib/mongodb';
import { Itinerary } from '@/lib/schema';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const originError = rejectCrossOrigin(req);
  if (originError) return originError;

  const user = await authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'You must be logged in to change itinerary visibility.' }, { status: 401 });
  }

  const { data: parsedBody, error: bodyError } = await readJsonBody(req);
  if (bodyError) return bodyError;

  const Schema = z.object({
    id: z.string().regex(mongoIdSchema, 'Invalid itinerary id'),
    is_public: z.boolean(),
  });
  const result = Schema.safeParse(parsedBody);
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid payload', details: result.error.flatten() }, { status: 400 });
  }
  const { id, is_public } = result.data;

  // 3. Update the itinerary if owned by user
  try {
    await connectDB();
    const trip = await Itinerary.findById(id);
    if (!trip || trip.user_id.toString() !== user.sub) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    await Itinerary.findByIdAndUpdate(id, { is_public }, { new: true });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update itinerary visibility', details: err?.message || err }, { status: 500 });
  }
}
