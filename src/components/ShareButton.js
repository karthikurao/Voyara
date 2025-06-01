"use client";

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

export default function ShareButton({ itineraryId, destination }) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/share/${itineraryId}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
      })
      .catch(err => {
        console.error('Failed to copy itinerary link:', err);
        alert('Failed to copy link. Please try again.');
      });
  };

  return (
    <button
      onClick={handleShare}
      className={`flex items-center gap-2 text-sm py-2 px-3 rounded-md transition-colors
                  ${copied 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'}`}
      title="Copy shareable link"
    >
      {copied ? <Check size={16} /> : <Share2 size={16} />}
      {copied ? 'Link Copied!' : 'Share Trip'}
    </button>
  );
}