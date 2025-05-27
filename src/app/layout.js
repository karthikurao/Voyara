import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Voyara - AI Weekend Itinerary Generator",
  description: "Generate your perfect weekend getaway plan in seconds.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-900 bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900`}>
        {children}
      </body>
    </html>
  );
}