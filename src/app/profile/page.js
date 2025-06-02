'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { updateProfile } from './actions'; // Your Server Action
import { UserCircle2, Edit3, XCircle, CheckCircle } from 'lucide-react'; // Icons

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // Stores the fetched profile data
  const [initialProfileData, setInitialProfileData] = useState(null); // For resetting form on cancel

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false); // State to toggle edit mode
  const [message, setMessage] = useState('');
  const [formMessage, setFormMessage] = useState(''); // Separate message for form success/error

  // Form state
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

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
        setInitialProfileData(profileData); // Store initial data for cancel
        // Pre-fill form states
        setUsername(profileData.username || '');
        setFullName(profileData.full_name || '');
        setAvatarUrl(profileData.avatar_url || '');
        setAvatarPreview(profileData.avatar_url || null);
      } else {
        // No profile row yet, set initialProfileData to empty defaults
        setInitialProfileData({ username: '', full_name: '', avatar_url: '' });
      }
      setLoading(false);
    };
    fetchUserData();
  }, [supabase, router]);

  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleProfileUpdate = async (event) => {
    event.preventDefault();
    if (!user) {
      setFormMessage('Error: User not found. Please log in again.');
      return;
    }
    setLoading(true);
    setFormMessage('');

    let uploadedAvatarUrl = avatarUrl; 

    if (avatarFile) {
      const filePath = `${user.id}/${Date.now()}_${avatarFile.name}`; 
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { cacheControl: '3600', upsert: true });

      if (uploadError) {
        setFormMessage(`Error uploading avatar: ${uploadError.message}`);
        setLoading(false);
        return;
      }
      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(uploadData.path);
      uploadedAvatarUrl = publicUrlData.publicUrl;
    }

    const formData = new FormData();
    formData.append('username', username);
    formData.append('full_name', fullName);
    formData.append('avatar_url', uploadedAvatarUrl); 
    
    const result = await updateProfile(formData);

    if (result?.error) {
      setFormMessage(`Error: ${result.error}`);
    } else {
      setFormMessage('Profile updated successfully!');
      setAvatarUrl(uploadedAvatarUrl);
      setAvatarPreview(uploadedAvatarUrl);
      setInitialProfileData({ username, full_name: fullName, avatar_url: uploadedAvatarUrl }); // Update initial data
      setProfile({ username, full_name: fullName, avatar_url: uploadedAvatarUrl }); // Update displayed profile
      setAvatarFile(null);
      setIsEditing(false); // Switch back to view mode on success
    }
    setLoading(false);
  };

  const handleCancelEdit = () => {
    // Reset form fields to initial data
    if (initialProfileData) {
      setUsername(initialProfileData.username || '');
      setFullName(initialProfileData.full_name || '');
      setAvatarUrl(initialProfileData.avatar_url || '');
      setAvatarPreview(initialProfileData.avatar_url || null);
    }
    setAvatarFile(null);
    setIsEditing(false);
    setFormMessage('');
  };
  
  if (loading && !profile && !user) { // More specific initial loading
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white"><p>Loading profile...</p></div>;
  }

  if (!user) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white"><p>Redirecting to login...</p></div>;
  }

  // Determine current display values (from state if editing, else from profile)
  const displayUsername = isEditing ? username : (profile?.username || 'Not set');
  const displayFullName = isEditing ? fullName : (profile?.full_name || 'Not set');
  const displayAvatar = isEditing ? avatarPreview : (profile?.avatar_url || null);

  return (
    <div className="min-h-screen bg-gray-900 text-white pt-20 sm:pt-24 pb-10 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              {isEditing ? 'Edit Profile' : 'My Profile'}
            </h1>
            {!isEditing && (
              <button 
                onClick={() => { setIsEditing(true); setFormMessage(''); }}
                className="flex items-center gap-2 text-sm bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-3 rounded-lg transition-colors"
              >
                <Edit3 size={16} /> Edit
              </button>
            )}
          </div>

          {message && <p className="mb-4 text-center text-red-400">{message}</p>}

          {!isEditing ? (
            // VIEW MODE
            <div className="space-y-6 text-center">
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto">
                {displayAvatar ? (
                  <Image 
                    src={displayAvatar} 
                    alt="User Avatar" 
                    fill // Use fill for responsive, parent-controlled size
                    className="rounded-full object-cover ring-4 ring-purple-500/50"
                    priority={true}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700 rounded-full flex items-center justify-center text-purple-400 ring-4 ring-purple-500/50">
                    <UserCircle2 size={64} /> {/* Larger placeholder */}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">{displayFullName !== 'Not set' ? displayFullName : (displayUsername !== 'Not set' ? displayUsername : 'Voyara User')}</h2>
                {displayFullName !== 'Not set' && displayUsername !== 'Not set' && <p className="text-gray-400">@{displayUsername}</p>}
                <p className="text-gray-400 mt-1">{user.email}</p>
              </div>
            </div>
          ) : (
            // EDIT MODE FORM
            <form onSubmit={handleProfileUpdate} className="space-y-5">
              <div className="text-center mb-6">
                {avatarPreview ? (
                  <Image src={avatarPreview} alt="Avatar Preview" width={128} height={128} className="rounded-full object-cover inline-block ring-2 ring-purple-500"/>
                ) : (
                  <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center text-purple-400 mx-auto ring-2 ring-purple-500/50">
                    <UserCircle2 size={64} />
                  </div>
                )}
                 <label htmlFor="avatar" className="mt-2 cursor-pointer text-sm text-purple-400 hover:text-purple-300 block">Change Avatar</label>
                 <input type="file" id="avatar" accept="image/*" onChange={handleAvatarChange} className="hidden"/>
              </div>
            
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-400 mb-1">Username</label>
                <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-gray-700 border-gray-600 rounded-md p-3 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"/>
              </div>
              <div>
                <label htmlFor="fullName" className="block text-sm font-semibold text-gray-400 mb-1">Full Name</label>
                <input type="text" id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-gray-700 border-gray-600 rounded-md p-3 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"/>
              </div>
              <div className="text-xs text-gray-500">Email: {user.email} (cannot be changed)</div>

              {formMessage && (
                <p className={`text-sm ${formMessage.startsWith('Error:') ? 'text-red-400' : 'text-green-400'}`}>
                  {formMessage}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={handleCancelEdit} disabled={loading} className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors disabled:bg-gray-500">
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
        
        {/* "Back to Home" link outside the main card, but within the centered content */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-purple-400 hover:text-purple-300 transition-colors text-sm">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}