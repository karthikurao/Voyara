import "./globals.css";

// Updated metadata object
export const metadata = {
  title: "Voyara - AI Weekend Itinerary Generator",
  description: "Generate your perfect weekend getaway plan in seconds.",
  icons: {
    icon: '/icon.svg', // Path to your icon if served from 'public' or recognized by Next.js from 'app'
    // You could also specify other icon types here if needed:
    // apple: '/apple-icon.png',
    // shortcut: '/shortcut-icon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans bg-gray-900 bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900">
        {children}
      </body>
    </html>
  );
}
