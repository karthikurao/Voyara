import ItineraryCard from '@/components/ItineraryCard';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { jwtVerify } from 'jose';
import { neonQuery } from '../../../lib/db';

export const dynamic = 'force-dynamic';

async function getItineraryById(id) {
  try {
    const result = await neonQuery({
      sql: 'SELECT * FROM itineraries WHERE id = $1',
      params: [id],
      method: 'GET',
    });
    return result[0] || null;
  } catch (error) {
    console.error('Error fetching itinerary:', error);
    return null;
  }
}

export default async function SharePage({ params, searchParams }) {
  const itineraryId = params.itineraryId;
  const token = searchParams?.t;
  // Validate share token before exposing content
  try {
    if (!token) return notFound();
    const secret = process.env.SHARE_TOKEN_SECRET;
    if (!secret) return notFound();
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    if (!payload || String(payload.it) !== String(itineraryId)) return notFound();
  } catch {
    return notFound();
  }
  const trip = await getItineraryById(itineraryId);

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold mb-4">Trip Not Found</h1>
        <p className="text-xl text-gray-400 mb-8">
          Sorry, we couldn&apos;t find the itinerary you were looking for.
        </p>
        <Link href="/" className="bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors">
          Plan a New Trip
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white pt-24 pb-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <Link href="/" className="text-3xl font-bold text-white mb-2 inline-block">
            Voyara
          </Link>
          <p className="text-lg text-gray-300">Shared Itinerary: Trip to {trip.destination}</p>
        </div>
        
        {/* Display the itinerary using our existing card components */}
        {trip.itinerary_data && trip.itinerary_data.itinerary.map((dayData, index) => (
          <ItineraryCard key={index} dayData={dayData} />
        ))}

        <div className="text-center mt-10">
            <Link href="/" className="bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors">
                Plan Your Own Trip with Voyara!
            </Link>
        </div>
      </div>
    </div>
  );
}