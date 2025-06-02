/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'example.com', // Keep this if you had it for other images
        // pathname: '/**', // Optional: if you want to restrict paths
      },
      // ** ADD THIS SECTION FOR SUPABASE STORAGE **
      {
        protocol: 'https',
        // Replace <YOUR_PROJECT_REF> with your actual Supabase project reference ID
        // You can find this in your Supabase project URL (e.g., abcdefghijklmnop.supabase.co)
        hostname: '<YOUR_PROJECT_REF>.supabase.co', 
        // pathname: '/storage/v1/object/public/avatars/**', // Optional: Be more specific
      },
      // Add more patterns if avatars can come from other external domains
    ],
  },
};

export default nextConfig;