/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // If you have other external image sources, keep their patterns here
      // For example, if you had 'example.com':
      // {
      //   protocol: 'https',
      //   hostname: 'example.com',
      // },

      // ** THIS IS THE IMPORTANT PART FOR YOUR SUPABASE AVATARS **
      {
        protocol: 'https',
        hostname: 'lekmaawuvlkbvwmabrxk.supabase.co', // Your specific Supabase project hostname
        // You can optionally add a pathname if all your images are in a specific path:
        // pathname: '/storage/v1/object/public/avatars/**', 
      },
    ],
  },
};

export default nextConfig;