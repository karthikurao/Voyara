import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createClient = () => {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          try {
            // This will work in Server Actions.
            // In Server Components, if Supabase client calls this (e.g., during token refresh attempt triggered by getUser),
            // it might attempt a write. The middleware should be the primary writer for session refresh.
            // This try-catch will prevent a crash if called in a non-writable RSC context.
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Errors in Server Components are expected if 'set' is called.
            // The middleware is responsible for actually setting the cookie on the response.
            // You can optionally log this error if it helps in debugging, but it shouldn't crash the app.
            // console.warn(`Attempt to set cookie '${name}' in a read-only context (server.js). Error: ${error.message}`);
          }
        },
        remove(name, options) {
          try {
            // Similar to 'set', this will work in Server Actions.
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // console.warn(`Attempt to remove cookie '${name}' in a read-only context (server.js). Error: ${error.message}`);
          }
        },
      },
    }
  );
};