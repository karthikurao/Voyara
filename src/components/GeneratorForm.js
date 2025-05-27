"use client"; // This is a client component

import React, { useState, useEffect } from 'react';

export default function GeneratorForm() {
  const [isMounted, setIsMounted] = useState(false);

  // This useEffect runs only on the client, after the component has mounted.
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // We will add functionality here later
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form Submitted!");
  };

  // Until the component is mounted on the client, we'll render nothing.
  // This prevents the hydration mismatch.
  if (!isMounted) {
    return null;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-white/20 w-full max-w-xl"
    >
      <div className="space-y-6">
        {/* Destination Input */}
        <div>
          <label htmlFor="destination" className="block text-sm font-medium text-gray-200 mb-2">
            Destination
          </label>
          <input
            type="text"
            id="destination"
            name="destination"
            placeholder="e.g., Mysuru, Goa, Chikmagalur"
            className="w-full bg-white/10 text-white placeholder-gray-400 p-3 rounded-lg border border-white/20 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            required
          />
        </div>

        {/* Vibe Selection */}
        <div>
           <label className="block text-sm font-medium text-gray-200 mb-2">
            Select Your Vibe
          </label>
           <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {['Adventure', 'Relaxing', 'Foodie', 'Culture', 'Artsy', 'Party'].map((vibe) => (
              <div key={vibe}>
                <input type="checkbox" id={vibe} name="vibe" value={vibe} className="hidden peer" />
                <label htmlFor={vibe} className="block text-center cursor-pointer p-3 rounded-lg border border-white/20 peer-checked:bg-purple-600 peer-checked:border-purple-600 peer-checked:text-white transition-all duration-200">
                  {vibe}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button
          type="submit"
          className="w-full bg-purple-600 text-white font-bold p-4 rounded-lg shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200"
        >
          Generate My Itinerary
        </button>
      </div>
    </form>
  );
}