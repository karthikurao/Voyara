'use client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '@/utils/supabase/client'; // Use your client-side utility
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [redirectToUrl, setRedirectToUrl] = useState(''); // State for the redirectTo URL

  // Set redirectToUrl only when window is available (client-side)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRedirectToUrl(`${window.location.origin}/auth/callback`);
    }
  }, []); // Empty dependency array means this runs once on mount

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        router.push('/'); // Redirect to home if already logged in
        router.refresh();
      }
    }
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        router.push('/'); // Redirect to home on successful login/auth state change
        router.refresh(); 
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);
  
  // If a session exists (e.g., user just logged in), redirect or show loading
  if (session) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <p>You are logged in. Redirecting...</p>
      </div>
    );
  }

  // Only render Auth component if redirectToUrl is set (ensuring it's client-side)
  if (!redirectToUrl) {
    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
            <p>Loading login form...</p> {/* Or a loading spinner */}
        </div>
    ); 
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="w-full max-w-md p-8 rounded-lg shadow-lg bg-gray-800">
        <h1 className="text-3xl font-bold text-center text-white mb-6">Welcome to Voyara</h1>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          theme="dark"
          providers={['google', 'github']}
          redirectTo={redirectToUrl} // Use the state variable here
        />
      </div>
    </div>
  );
}