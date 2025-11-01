'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const jwt = window.localStorage.getItem('voyaraAuthToken');
    if (!jwt) {
      router.push('/login');
      return;
    }

    try {
      const payload = JSON.parse(atob(jwt.split('.')[1] || ''));
      setUser({ email: payload.email || 'Unknown user' });
    } catch (err) {
      console.error('Failed to parse auth token', err);
      router.push('/login');
      return;
    }

    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white pt-24 pb-10 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xl">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white pt-24 pb-10 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Profile</h1>
        {user && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <p className="text-lg">Email: {user.email}</p>
            <p className="text-sm text-gray-400 mt-4">Profile management is handled by Stack Auth.</p>
            <Link href="/my-trips" className="mt-6 inline-block bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
              View My Trips
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
