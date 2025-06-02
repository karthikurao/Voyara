'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { updateProfile } from './actions'; // Our Server Action

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Form state
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState(null); // For the selected file
  const [avatarPreview, setAvatarPreview] = useState(null); // For showing a preview

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/login');
        return;
      }
      setUser(authUser);

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('username, full_name, avatar_url')
        .eq('id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        setMessage('Error fetching profile data.');
      } else if (profileData) {
        setProfile(profileData);
        setUsername(profileData.username || '');
        setFullName(profileData.full_name || '');
        setAvatarUrl(profileData.avatar_url || '');
        setAvatarPreview(profileData.avatar_url || null); // Set initial preview
      }
      setLoading(false);
    };
    fetchUserData();
  }, [supabase, router]);

  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file)); // Create a temporary URL for preview
    }
  };

  const handleProfileUpdate = async (event) => {
    event.preventDefault();
    if (!user) {
      setMessage('Error: User not found. Please log in again.');
      return;
    }
    setLoading(true);
    setMessage('');

    let uploadedAvatarUrl = avatarUrl; // Keep existing URL if no new file

    if (avatarFile) {
      // Upload new avatar to Supabase Storage
      const filePath = `${user.id}/${avatarFile.name}`; // Unique path per user
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars') // Your bucket name
        .upload(filePath, avatarFile, {
          cacheControl: '3600',
          upsert: true, // Overwrite if file with same path exists
        });

      if (uploadError) {
        setMessage(`Error uploading avatar: ${uploadError.message}`);
        setLoading(false);
        return;
      }
      
      // Get the public URL of the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(uploadData.path);
      
      uploadedAvatarUrl = publicUrlData.publicUrl;
    }

    // Prepare form data for the server action
    const formData = new FormData();
    formData.append('username', username);
    formData.append('full_name', fullName);
    formData.append('avatar_url', uploadedAvatarUrl); // Send the new or existing URL
    
    const result = await updateProfile(formData); // Call Server Action

    if (result?.error) {
      setMessage(`Error: ${result.error}`);
    } else {
      setMessage('Profile updated successfully!');
      setAvatarUrl(uploadedAvatarUrl); // Update local state with new URL
      setAvatarPreview(uploadedAvatarUrl);
      setAvatarFile(null); // Clear the selected file
    }
    setLoading(false);
  };

  if (loading && !profile) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white"><p>Loading profile...</p></div>;
  }

  if (!user) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white"><p>Redirecting to login...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white pt-24 pb-10 px-4">
      <div className="max-w-2xl mx-auto bg-gray-800 p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center">Edit Your Profile</h1>
        
        <form onSubmit={handleProfileUpdate} className="space-y-6">
          {/* Email (disabled) */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-400">Email</label>
            <input type="email" id="email" value={user.email || ''} disabled className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm p-3 text-gray-400 cursor-not-allowed" />
          </div>
          
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-semibold text-gray-400">Username</label>
            <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm p-3 focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50" />
          </div>

          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-semibold text-gray-400">Full Name</label>
            <input type="text" id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm p-3 focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50" />
          </div>

          {/* Avatar Upload */}
          <div>
            <label htmlFor="avatar" className="block text-sm font-semibold text-gray-400">Avatar</label>
            <input
              type="file"
              id="avatar"
              accept="image/*" // Accept only image files
              onChange={handleAvatarChange}
              className="mt-1 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
            />
            {avatarPreview && (
                <div className="mt-4 text-center">
                    <Image 
                        src={avatarPreview} 
                        alt="Avatar Preview" 
                        width={128} // Larger preview
                        height={128}
                        className="rounded-full object-cover inline-block ring-2 ring-purple-500"
                        priority={true}
                    />
                </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors disabled:bg-gray-500">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        {message && ( <p className={`mt-4 text-center ${message.startsWith('Error:') ? 'text-red-400' : 'text-green-400'}`}>{message}</p> )}
        <div className="mt-8 text-center">
          <Link href="/" className="text-purple-400 hover:text-purple-300 transition-colors">&larr; Back to Home</Link>
        </div>
      </div>
    </div>
  );
}