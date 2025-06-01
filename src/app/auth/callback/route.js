import { createServerClient } from '@supabase/ssr'; // Changed to createServerClient
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const cookieStore = cookies();
    // Using createServerClient, which is more fundamental and should exist
    // It's common for older versions to use this for route handlers too.
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL, // Needs URL and Key directly
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, // Needs URL and Key directly
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
          set(name, value, options) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name, options) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    await supabase.auth.exchangeCodeForSession(code);
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin); 
}