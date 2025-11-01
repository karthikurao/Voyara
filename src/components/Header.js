'use client';

import Link from 'next/link';
import { UserCircle2 } from 'lucide-react'; // Generic user icon
import { useEffect, useState } from 'react';

// This is our SVG logo placeholder, keep it or replace with your actual logo
const VoyaraLogo = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M6 7L12 19L18 7" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <circle cx="12" cy="4" r="1.5" fill="#FFFFFF"/>
</svg>
);

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user has JWT in localStorage
    const jwt = localStorage.getItem('voyaraAuthToken');
    setIsLoggedIn(!!jwt);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('voyaraAuthToken');
    window.location.href = '/';
  };

  return (
    <header className="absolute top-0 left-0 w-full p-4 z-10">
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-white" aria-label="Voyara Homepage">
          <VoyaraLogo /> 
          <span>Voyara</span>
        </Link>
        
        <nav className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <Link href="/my-trips" className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base">
                My Trips
              </Link>
              
              {/* Profile Avatar Link */}
              <Link href="/profile" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors" aria-label="View Profile">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold ring-1 ring-gray-500 hover:ring-purple-500 transition-all">
                  <UserCircle2 size={20} />
                </div>
              </Link>
              
              {/* Logout Button */}
              <button 
                onClick={handleLogout}
                className="bg-red-500/20 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-500/40 transition-colors text-sm sm:text-base"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="bg-white/10 text-white font-semibold py-2 px-4 rounded-lg hover:bg-white/20 transition-colors text-sm sm:text-base"
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}