'use server'; // This directive marks all exported functions in this file as Server Actions

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers'; // Required if createClient needs it for server-side auth context

export async function updateProfile(formData) {
  const cookieStore = cookies(); // Ensure cookie context is available for Supabase client
  const supabase = createClient(cookieStore); // Pass cookieStore if your server client setup expects it

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to update your profile.' };
  }

  const username = formData.get('username');
  const fullName = formData.get('full_name');
  const avatarUrl = formData.get('avatar_url');

  const profileData = {
    username: username,
    full_name: fullName,
    avatar_url: avatarUrl,
    updated_at: new Date().toISOString(), // Set the updated_at timestamp
  };

  // Remove any empty fields so they don't overwrite existing data with null
  for (const key in profileData) {
    if (profileData[key] === '' || profileData[key] === null) {
      // If you want to allow unsetting a field, send null. Otherwise, delete the key.
      // For simplicity, we'll update with empty strings if provided, 
      // or you can choose to not send them if you want to keep old values.
      // Let's assume for now we update with whatever is submitted (including empty strings).
    }
  }
  
  try {
    const { error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', user.id);

    if (error) {
      // Check for unique constraint violation on username
      if (error.code === '23505' && error.message.includes('profiles_username_key')) {
        return { error: 'This username is already taken. Please choose another.' };
      }
      console.error('Supabase profile update error:', error);
      throw error; // Rethrow for generic error handling
    }

    revalidatePath('/profile'); // Tell Next.js to refresh the profile page data
    return { success: true, message: 'Profile updated successfully!' };

  } catch (err) {
    return { error: err.message || 'An unexpected error occurred.' };
  }
}