"use client";

import React, { useState, useEffect } from 'react';
import ItineraryCard from './ItineraryCard';
import { Clipboard } from 'lucide-react';

export default function GeneratorForm() {
  const [isMounted, setIsMounted] = useState(false);
  const [destination, setDestination] = useState('');
  const [vibes, setVibes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [streamingResult, setStreamingResult] = useState(''); // For the raw text stream
  const [finalItinerary, setFinalItinerary] = useState(null); // For the parsed JSON
  const [error, setError] = useState('');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleVibeChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setVibes((prevVibes) => [...prevVibes, value]);
    } else {
      setVibes((prevVibes) => prevVibes.filter((vibe) => vibe !== value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (vibes.length === 0) {
      setError("Please select at least one vibe.");
      return;
    }
    setLoading(true);
    setStreamingResult('');
    setFinalItinerary(null);
    setError('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, vibes }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "An unknown error occurred.");
      }

      // Handle the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        fullResponse += chunk;
        setStreamingResult(fullResponse);
      }
      
      // Once streaming is done, parse the full response and set the final itinerary
      const finalJson = JSON.parse(fullResponse);
      setFinalItinerary(finalJson);
      setStreamingResult(''); // Clear the raw text

    } catch (err) {
      setError("Failed to generate itinerary. The AI may be overloaded. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (finalItinerary) {
      const textToCopy = finalItinerary.itinerary.map(day => {
        let dayText = `${day.day}:\n`;
        day.timeline.forEach(item => {
          dayText += `  - ${item.time}: ${item.activity} - ${item.description}\n`;
        });
        dayText += `  - Food: ${day.food_suggestion.name} - ${day.food_suggestion.description}\n`;
        return dayText;
      }).join('\n');
      navigator.clipboard.writeText(textToCopy);
      alert('Itinerary copied to clipboard!');
    }
  };
  
  if (!isMounted) {
    return null;
  }

  return (
    <div className="w-full flex flex-col items-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-white/20 w-full max-w-xl"
      >
        {/* Form content remains the same... */}
        <div className="space-y-6">
          <div>
            <label htmlFor="destination" className="block text-sm font-medium text-gray-200 mb-2">
              Destination
            </label>
            <input
              type="text"
              id="destination"
              name="destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g., Mysuru, Goa, Chikmagalur"
              className="w-full bg-white/10 text-white placeholder-gray-400 p-3 rounded-lg border border-white/20 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              required
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-200 mb-2">
              Select Your Vibe
            </label>
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {['Adventure', 'Relaxing', 'Foodie', 'Culture', 'Artsy', 'Party'].map((vibe) => (
                <div key={vibe}>
                  <input type="checkbox" id={vibe} name="vibe" value={vibe} onChange={handleVibeChange} className="hidden peer" />
                  <label htmlFor={vibe} className="block text-center cursor-pointer p-3 rounded-lg border border-white/20 peer-checked:bg-purple-600 peer-checked:border-purple-600 peer-checked:text-white transition-all duration-200">
                    {vibe}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white font-bold p-4 rounded-lg shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Generate My Itinerary'}
          </button>
        </div>
      </form>

      {/* Result Display Logic Updated */}
      <div className="mt-8 w-full max-w-xl text-white">
        {error && (
          <div className="bg-red-500/20 border border-red-500 p-4 rounded-lg">
            <p className="font-bold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Show streaming text while loading */}
        {loading && streamingResult && (
           <div className="bg-white/5 p-6 rounded-lg whitespace-pre-wrap animate-fade-in font-mono">
            <p>{streamingResult}</p>
          </div>
        )}

        {/* Show final formatted cards when done */}
        {finalItinerary && (
          <div className="relative">
            <button 
              onClick={handleCopyToClipboard}
              className="absolute top-4 right-4 bg-white/10 p-2 rounded-lg hover:bg-white/20"
              title="Copy to Clipboard"
            >
              <Clipboard className="w-5 h-5" />
            </button>
            {finalItinerary.itinerary.map((dayData, index) => (
              <ItineraryCard key={index} dayData={dayData} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}