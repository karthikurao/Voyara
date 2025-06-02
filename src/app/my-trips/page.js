import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SavedItineraryList from '@/components/SavedItineraryList'; // Import the new client component

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
    // You could return a more user-friendly error message component here
    return (
        <div className="min-h-screen bg-gray-900 text-white pt-24 pb-10 px-4">
            <div className="max-w-3xl mx-auto text-center">
                <p className="text-red-400">Could not load your saved trips. Please try again later.</p>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white pt-24 pb-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">My Saved Trips</h1>
          <Link href="/" className="bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
            + Plan New Trip
          </Link>
        </div>

        {savedItineraries && savedItineraries.length > 0 ? (
          // Use the new SavedItineraryList component to render the trips
          <SavedItineraryList savedItineraries={savedItineraries} />
        ) : (
          <div className="text-center py-10 bg-gray-800 rounded-lg shadow-lg">
            <p className="text-xl text-gray-400">You haven&apos;t saved any trips yet.</p>
            <Link href="/" className="mt-4 inline-block bg-purple-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-purple-700 transition-colors">
              Plan Your First Trip!
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}