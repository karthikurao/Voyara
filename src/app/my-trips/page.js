import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ItineraryCard from '@/components/ItineraryCard';
import ShareButton from '@/components/ShareButton'; // Import the new button

export const dynamic = 'force-dynamic';

export default async function MyTripsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: savedItineraries, error } = await supabase
    .from('itineraries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching saved itineraries:', error);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white pt-24 pb-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">My Saved Trips</h1>
          <Link href="/" className="bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
            + New Trip
          </Link>
        </div>

        {savedItineraries && savedItineraries.length > 0 ? (
          <div className="space-y-8">
            {savedItineraries.map((trip) => (
              <div key={trip.id} className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h2 className="text-2xl font-semibold">Trip to: {trip.destination}</h2>
                    <p className="text-sm text-gray-400">
                      Saved on: {new Date(trip.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {/* Add the ShareButton here */}
                  <ShareButton itineraryId={trip.id} destination={trip.destination} />
                </div>
                
                {trip.itinerary_data && trip.itinerary_data.itinerary.map((dayData, index) => (
                  <ItineraryCard key={index} dayData={dayData} />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-gray-800 rounded-lg">
            <p className="text-xl text-gray-400">You haven't saved any trips yet.</p>
            <Link href="/" className="mt-4 inline-block bg-purple-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-purple-700 transition-colors">
              Plan Your First Trip!
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}