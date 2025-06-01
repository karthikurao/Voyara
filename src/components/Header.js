import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';

export default async function Header() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="absolute top-0 left-0 w-full p-4 z-10">
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-white">
          Voyara
        </Link>
        <nav className="flex items-center gap-4">
          {user ? (
            <>
              {/* "My Trips" link added here */}
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