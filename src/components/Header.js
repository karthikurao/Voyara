import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';

// Simple SVG Logo Placeholder (You can replace this with your actual logo)
const VoyaraLogo = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 4L4 12L12 20L20 12L12 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="#7C3AED" fill-opacity="0.3"/>
  <path d="M12 4V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
);

export default async function Header() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="absolute top-0 left-0 w-full p-4 z-10">
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        {/* Entire logo and title area is now a link to homepage */}
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-white" aria-label="Voyara Homepage">
          <VoyaraLogo /> 
          <span>Voyara</span>
        </Link>
        
        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/my-trips" className="text-gray-300 hover:text-white transition-colors">
                My Trips
              </Link>
              <span className="text-gray-300 text-sm hidden sm:block">{user.email}</span>
              <form action="/auth/signout" method="post">
                <button type="submit" className="bg-red-500/20 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-500/40 transition-colors">
                  Logout
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className="bg-white/10 text-white font-semibold py-2 px-4 rounded-lg hover:bg-white/20 transition-colors">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}