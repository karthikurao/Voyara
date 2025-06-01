import { createServerClient } from '@supabase/ssr'; // Use createServerClient
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Good practice for auth routes

export async function POST(req) {
  const cookieStore = cookies();

  // Use the full createServerClient configuration
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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

  // 1. Check if the user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'You must be logged in to save an itinerary.' }), { status: 401 });
  }

  // 2. Get the itinerary data from the request
  const { destination, itinerary_data } = await req.json();
  if (!destination || !itinerary_data) {
    return new NextResponse(JSON.stringify({ error: 'Missing destination or itinerary data.' }), { status: 400 });
  }

  try {
    // 3. Insert the data into the database, linked to the user's ID
    const { data, error } = await supabase
      .from('itineraries')
      .insert([
        { 
          user_id: user.id, 
          destination: destination,
          itinerary_data: itinerary_data 
        },
      ])
      .select(); // .select() is good to confirm the insert

    if (error) {
      console.error('Supabase insert error:', error); // Log the specific Supabase error
      throw error;
    }

    // 4. Return a success response
    return NextResponse.json({ success: true, data: data ? data[0] : null });

  } catch (error) {
    console.error("Error saving itinerary:", error.message);
    return new NextResponse(JSON.stringify({ error: `Failed to save itinerary. ${error.message}` }), { status: 500 });
  }
}