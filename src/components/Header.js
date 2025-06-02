import Link from 'next/link';
import Image from 'next/image'; // Import Next.js Image component
import { createClient } from '@/utils/supabase/server';
import { UserCircle2 } from 'lucide-react'; // Generic user icon

// This is our SVG logo placeholder, keep it or replace with your actual logo
const VoyaraLogo = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M6 4L12 16L18 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="20" r="1.5" fill="currentColor"/>
  </svg>
);

export default async function Header() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let userProfile = null;
  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('avatar_url, username') // You can also fetch username if needed for alt text or initials
      .eq('id', user.id)
      .single();
    userProfile = profileData;
  }

  return (
    <header className="absolute top-0 left-0 w-full p-4 z-10">
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-white" aria-label="Voyara Homepage">
          <VoyaraLogo /> 
          <span>Voyara</span>
        </Link>
        
        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/my-trips" className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base">
                My Trips
              </Link>
              
              {/* Profile Avatar Link */}
              <Link href="/profile" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors" aria-label="View Profile">
                {userProfile?.avatar_url ? (
                  <Image
                    src={userProfile.avatar_url}
                    alt={userProfile.username || user.email || 'User Avatar'}
                    width={32} // h-8 w-8
                    height={32}
                    className="rounded-full object-cover ring-1 ring-gray-500 hover:ring-purple-500 transition-all"
                  />
                ) : (
                  // Default placeholder if no avatar_url
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold ring-1 ring-gray-500 hover:ring-purple-500 transition-all">
                    {user.email ? user.email.charAt(0).toUpperCase() : <UserCircle2 size={20} />}
                  </div>
                )}
              </Link>
              
              {/* Logout Form */}
              <form action="/auth/signout" method="post">
                <button type="submit" className="bg-red-500/20 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-500/40 transition-colors text-sm sm:text-base">
                  Logout
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className="bg-white/10 text-white font-semibold py-2 px-4 rounded-lg hover:bg-white/20 transition-colors text-sm sm:text-base">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}