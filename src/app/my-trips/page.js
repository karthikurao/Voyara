
"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SavedItineraryList from '@/components/SavedItineraryList';

export default function MyTripsPage() {
  const router = useRouter();
  const [savedItineraries, setSavedItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrips = async () => {
    setLoading(true);
    setError(null);
    try {
      const jwt = window.localStorage.getItem('voyaraAuthToken');
      console.log('[Frontend] Token from localStorage:', jwt ? 'Token found (length: ' + jwt.length + ')' : 'NO TOKEN FOUND');
      if (!jwt) {
        console.warn('[Frontend] No token - redirecting to login');
        router.push('/login');
        return;
      }
      console.log('[Frontend] Sending authorization header:', `Bearer ${jwt.substring(0, 20)}...`);
      const res = await fetch('/api/itineraries/list', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwt}`,
        },
      });
      console.log('[Frontend] Response status:', res.status);
      if (!res.ok) throw new Error((await res.json())?.error || 'Failed to fetch trips');
      const data = await res.json();
      console.log('[Frontend] Successfully fetched itineraries:', data.itineraries?.length || 0);
      setSavedItineraries(data.itineraries || []);
    } catch (err) {
      setError(err.message);
      setSavedItineraries([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white pt-24 pb-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">My Saved Trips</h1>
          <Link href="/" className="bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
            + Plan New Trip
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-10 bg-gray-800 rounded-lg shadow-lg">
            <p className="text-xl text-gray-400">Loading your trips...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10 bg-gray-800 rounded-lg shadow-lg">
            <p className="text-xl text-red-400">Could not load your saved trips. {error}</p>
            {error.includes('log in') && (
              <Link href="/login" className="mt-4 inline-block bg-purple-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-purple-700 transition-colors">
                Log In
              </Link>
            )}
          </div>
        ) : savedItineraries.length > 0 ? (
          <SavedItineraryList savedItineraries={savedItineraries} onReload={fetchTrips} />
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