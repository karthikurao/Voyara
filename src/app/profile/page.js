'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { updateProfile } from './actions';
import { UserCircle2, Edit3, Check, X, UploadCloud } from 'lucide-react';

import ReactCrop, { centerCrop, makeAspectCrop, Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

// Helper function to generate a centered crop
function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight,
  );
}

// Helper function to get the cropped image as a File object
async function getCroppedImg(image, crop, fileName) {
  if (!crop || !image) {
    throw new Error('Crop or image not available');
  }
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  
  // Ensure crop dimensions are valid numbers
  const cropX = typeof crop.x === 'number' ? crop.x : 0;
  const cropY = typeof crop.y === 'number' ? crop.y : 0;
  const cropWidth = typeof crop.width === 'number' ? crop.width : 0;
  const cropHeight = typeof crop.height === 'number' ? crop.height : 0;

  if (cropWidth === 0 || cropHeight === 0) {
    throw new Error('Crop dimensions cannot be zero');
  }

  canvas.width = Math.floor(cropWidth * scaleX);
  canvas.height = Math.floor(cropHeight * scaleY);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No 2d context');
  }

  ctx.drawImage(
    image,
    cropX * scaleX,
    cropY * scaleY,
    cropWidth * scaleX,
    cropHeight * scaleY,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      // Use a consistent name or derive from original, ensure unique if needed
      const newFileName = `cropped_${fileName}`; 
      const file = new File([blob], newFileName, { type: blob.type || 'image/png' });
      resolve(file);
    }, 'image/png', 0.9); // Use image/png or image/jpeg
  });
}


export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [initialProfileData, setInitialProfileData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formMessage, setFormMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(''); // Stores the DB/public URL of the avatar
  
  const [imgSrcToCrop, setImgSrcToCrop] = useState(''); // Data URL of the image selected by user for cropping
  const [crop, setCrop] = useState(); 
  const [completedCrop, setCompletedCrop] = useState(null); // Stores PixelCrop data from onComplete
  const imgRef = useRef(null); // Ref for the image displayed in the cropper
  const [showCropperModal, setShowCropperModal] = useState(false);
  const aspect = 1 / 1;

  const [newAvatarFile, setNewAvatarFile] = useState(null); // This will store the cropped File/Blob
  const [formAvatarPreview, setFormAvatarPreview] = useState(null); // For displaying preview in edit form

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.push('/login'); return; }
      setUser(authUser);

      const { data: profileData, error } = await supabase
        .from('profiles').select('username, full_name, avatar_url').eq('id', authUser.id).single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error); setFormMessage('Error fetching profile data.');
      } else if (profileData) {
        setProfile(profileData); setInitialProfileData(profileData); 
        setUsername(profileData.username || ''); setFullName(profileData.full_name || '');
        setAvatarUrl(profileData.avatar_url || ''); 
        setFormAvatarPreview(profileData.avatar_url || null);
      } else {
        setInitialProfileData({ username: '', full_name: '', avatar_url: '' });
        setFormAvatarPreview(null);
      }
      setLoading(false);
    };
    fetchUserData();
  }, [supabase, router]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCrop(undefined); 
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrcToCrop(reader.result?.toString() || ''));
      reader.readAsDataURL(e.target.files[0]);
      setShowCropperModal(true);
      e.target.value = ""; 
    }
  };
  
  function onImageLoadInCropper(e) {
    if (aspect) {
      const { width, height } = e.currentTarget;
      const initialCrop = centerAspectCrop(width, height, aspect);
      setCrop(initialCrop);
      setCompletedCrop(initialCrop); // Initialize completedCrop as well
    }
  }

  const handleConfirmCrop = async () => {
    if (!completedCrop || !imgRef.current || !imgSrcToCrop) {
      setFormMessage("Error: Please select a crop area.");
      return;
    }
    try {
      const originalFile = imgSrcToCrop; // This is a data URL
      // Attempt to get a filename, fallback to a generic one
      // This is a bit tricky as data URLs don't have filenames.
      // If you store the original file object, you can use its name.
      const fileName = newAvatarFile?.name || 'avatar.png';

      const croppedImageBlob = await getCroppedImg(imgRef.current, completedCrop, fileName);
      setNewAvatarFile(croppedImageBlob); // This is the File/Blob to upload
      setFormAvatarPreview(URL.createObjectURL(croppedImageBlob)); // Update preview with cropped image
      setShowCropperModal(false);
      setImgSrcToCrop(''); // Clear the source for cropper
    } catch (e) {
      console.error("Error cropping image:", e);
      setFormMessage("Error: Could not crop image. Please try again.");
    }
  };

  const handleCancelCrop = () => {
    setShowCropperModal(false);
    setImgSrcToCrop('');
  };

  const handleCancelEdit = () => { /* ... unchanged from previous working version ... */ };

  const handleProfileUpdate = async (event) => {
    event.preventDefault();
    if (!user) { setFormMessage('Error: User not found.'); return; }
    setIsSaving(true); setFormMessage('');

    let newPublicAvatarUrl = avatarUrl; // Start with existing or previously set URL

    if (newAvatarFile) { // If a new (cropped) file is staged for upload
      const filePath = `${user.id}/${Date.now()}_${newAvatarFile.name}`; 
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, newAvatarFile, { cacheControl: '3600', upsert: true });

      if (uploadError) {
        setFormMessage(`Error uploading avatar: ${uploadError.message}`);
        setIsSaving(false); return;
      }
      
      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(uploadData.path);
      newPublicAvatarUrl = publicUrlData.publicUrl;
    }

    const formData = new FormData();
    formData.append('username', username);
    formData.append('full_name', fullName);
    formData.append('avatar_url', newPublicAvatarUrl); // Send the final URL to server action
    
    const result = await updateProfile(formData);

    if (result?.error) {
      setFormMessage(`Error: ${result.error}`);
    } else {
      setFormMessage('Profile updated successfully!');
      // Update all relevant states with the new data from the server if needed,
      // or rely on revalidatePath. For avatar, update immediately.
      setAvatarUrl(newPublicAvatarUrl); 
      setFormAvatarPreview(newPublicAvatarUrl);
      setInitialProfileData({ username, full_name: fullName, avatar_url: newPublicAvatarUrl });
      setProfile({ username, full_name: fullName, avatar_url: newPublicAvatarUrl });
      setNewAvatarFile(null); // Clear the staged file
      setIsEditing(false); 
    }
    setIsSaving(false);
  };
  
  if (loading) { return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white"><p>Loading profile...</p></div>; }
  if (!user) { return null; }
  
  const displayAvatarInViewMode = profile?.avatar_url || null;

  return (
    <>
      {showCropperModal && imgSrcToCrop && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-semibold text-white mb-4">Crop Your Avatar</h3>
            <div className="max-h-[50vh] sm:max-h-[60vh] overflow-auto mb-4 bg-black flex justify-center items-center">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)} // Capture pixel crop data
                aspect={aspect}
                minWidth={100} minHeight={100}
                circularCrop={true}
                className="max-w-full"
              >
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={imgSrcToCrop}
                  onLoad={onImageLoadInCropper} // Renamed to avoid conflict
                  style={{ display: 'block', maxWidth: '100%', maxHeight: '45vh', objectFit: 'contain' }}
                />
              </ReactCrop>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={handleCancelCrop} className="py-2 px-4 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors text-sm">Cancel</button>
              <button onClick={handleConfirmCrop} className="py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm">Use This Crop</button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-900 text-white pt-20 sm:pt-24 pb-10 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-2xl">
            {/* ... View/Edit Mode Toggle and Display Logic ... */}
            {/* Ensure this section uses displayAvatarInViewMode, profile?.full_name etc. */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {isEditing ? 'Edit Profile' : 'My Profile'}
              </h1>
              {!isEditing && user && (
                <button 
                  onClick={() => { setIsEditing(true); setFormMessage(''); 
                    setUsername(profile?.username || ''); setFullName(profile?.full_name || '');
                    setFormAvatarPreview(profile?.avatar_url || null); setNewAvatarFile(null); setImgSrcToCrop('');
                  }}
                  className="flex items-center gap-2 text-sm bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-3 rounded-lg transition-colors"
                >
                  <Edit3 size={16} /> Edit
                </button>
              )}
            </div>

            {formMessage && !isEditing && <p className={`mb-4 text-center text-sm ${formMessage.startsWith('Error:') ? 'text-red-400' : 'text-green-400'}`}>{formMessage}</p>}

            {!isEditing ? (
              // VIEW MODE (ensure this part is complete from previous version)
              <div className="space-y-6 text-center">
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto">
                  {displayAvatarInViewMode ? (
                    <Image src={displayAvatarInViewMode} alt="User Avatar" fill className="rounded-full object-cover ring-4 ring-purple-500/50" priority={true}/>
                  ) : (
                    <div className="w-full h-full bg-gray-700 rounded-full flex items-center justify-center text-purple-400 ring-4 ring-purple-500/50"><UserCircle2 size={64} /></div>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white">{(profile?.full_name || (profile?.username && profile.username !== user.email && profile.username) || 'Voyara User')}</h2>
                  {profile?.username && profile.username !== user.email && <p className="text-gray-400">@{profile.username}</p>}
                  <p className="text-gray-400 mt-1">{user.email}</p>
                </div>
              </div>
            ) : (
              // EDIT MODE FORM (ensure this part is complete from previous version)
              <form onSubmit={handleProfileUpdate} className="space-y-5">
                <div className="text-center mb-6">
                  {formAvatarPreview ? 
                    <img src={formAvatarPreview} alt="Avatar Preview" className="w-32 h-32 rounded-full object-cover inline-block ring-2 ring-purple-500"/>
                    : 
                    <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center text-purple-400 mx-auto ring-2 ring-purple-500/50"><UserCircle2 size={64} /></div>
                  }
                   <label htmlFor="avatarFile" className="mt-3 cursor-pointer text-sm text-purple-400 hover:text-purple-300 block flex items-center justify-center gap-2">
                       <UploadCloud size={18} /> Change Avatar
                   </label>
                   <input type="file" id="avatarFile" accept="image/*" onChange={handleFileChange} className="hidden"/>
                </div>
              
                <div><label htmlFor="username" className="block text-sm font-semibold text-gray-400 mb-1">Username</label><input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-gray-700 border-gray-600 rounded-md p-3 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"/></div>
                <div><label htmlFor="fullName" className="block text-sm font-semibold text-gray-400 mb-1">Full Name</label><input type="text" id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-gray-700 border-gray-600 rounded-md p-3 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"/></div>
                <div className="text-xs text-gray-500">Email: {user.email} (cannot be changed)</div>

                {formMessage && isEditing && (<p className={`text-sm ${formMessage.startsWith('Error:') ? 'text-red-400' : 'text-green-400'}`}>{formMessage}</p>)}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={handleCancelEdit} disabled={isSaving} className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors">Cancel</button>
                  <button type="submit" disabled={isSaving} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors disabled:bg-gray-500">{isSaving ? 'Saving...' : 'Save Changes'}</button>
                </div>
              </form>
            )}
          </div>
          
          <div className="mt-8 text-center">
            <Link href="/" className="text-purple-400 hover:text-purple-300 transition-colors text-sm">&larr; Back to Home</Link>
          </div>
        </div>
      </div>
    </>
  );
}