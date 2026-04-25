import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { Itinerary } from '@/lib/schema';
import { buildItineraryInsights, mergeChecklistState } from '@/lib/insights';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const user = await authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  try {
    await connectDB();

    // Fetch all itineraries for the user, sorted by creation date
    const data = await Itinerary.find({ user_id: user.sub }).sort({ created_at: -1 }).lean();

    const enriched = await Promise.all((data || []).map(async (trip) => {
      if (trip.metadata) {
        return trip;
      }
      const insights = buildItineraryInsights(trip.itinerary_data, trip.context || { destination: trip.destination });
      const merged = mergeChecklistState({}, insights);
      
      // Update the itinerary with new metadata
      await Itinerary.findByIdAndUpdate(
        trip._id,
        { metadata: merged, updated_at: new Date() },
        { new: true }
      );
      
      return { ...trip, metadata: merged };
    }));

    return NextResponse.json({ itineraries: enriched });
  } catch (error) {
    console.error('Failed to fetch itineraries:', error);
    return NextResponse.json({ error: `Failed to fetch itineraries. ${error.message}` }, { status: 500 });
  }
}
