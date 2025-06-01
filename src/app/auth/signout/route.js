import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers'; // For reading request cookies
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) { // Renamed req to request for clarity
  const requestUrl = new URL(request.url);
  
  // Create a NextResponse object early. We will modify its cookies.
  const response = NextResponse.redirect(requestUrl.origin, {
    status: 303, // See Other: appropriate for POST -> GET redirect
  });

  const cookieStore = cookies(); // For reading incoming cookies if needed by Supabase

  // Configure the Supabase client with cookie handlers that modify the response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          // When Supabase client needs to set a cookie, set it on the response
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          // When Supabase client needs to remove a cookie, set an expired cookie on the response
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Perform the sign-out operation.
  // This will trigger the 'remove' cookie method above,
  // which will modify our 'response' object.
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Error signing out:', error);
    // You could potentially return a different response or redirect to an error page
    // For now, we will still redirect to home, but the error is logged.
  }

  // Return the modified response object which now has the Set-Cookie headers
  return response;
}