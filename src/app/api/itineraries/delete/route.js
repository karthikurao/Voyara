import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyStackAuthJWT } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { Itinerary } from '@/lib/schema';

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
    return NextResponse.json({ error: 'You must be logged in to delete an itinerary.' }, { status: 401 });
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

  // 3. Delete the itinerary if owned by user
  try {
    await connectDB();
    // Check ownership
    const trip = await Itinerary.findById(id);
    if (!trip || trip.user_id.toString() !== user.sub) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }
    // Delete itinerary
    await Itinerary.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete itinerary', details: err?.message || err }, { status: 500 });
  }
}
