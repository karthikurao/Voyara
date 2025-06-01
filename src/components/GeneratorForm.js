"use client";

import React, { useState } from 'react';
import ItineraryCard from './ItineraryCard';
import { Clipboard, Save, CheckCircle } from 'lucide-react';

const SkeletonLoader = () => (
  <div className="space-y-6 animate-pulse">
    <div className="bg-white/10 p-6 rounded-lg">
      <div className="h-8 bg-gray-600 rounded w-1/3 mb-4"></div>
      <div className="space-y-4">
        <div className="h-4 bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-700 rounded w-5/6"></div>
      </div>
    </div>
  </div>
);


export default function GeneratorForm({ user }) {
  const [destination, setDestination] = useState('');
  const [numDays, setNumDays] = useState(2); // New state for number of days
  const [vibes, setVibes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [finalItinerary, setFinalItinerary] = useState(null);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle');

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
    setFinalItinerary(null);
    setSaveStatus('idle');
    setError('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Send the new numDays value to the backend
        body: JSON.stringify({ destination, vibes, numDays }), 
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "An unknown error occurred.");
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        fullResponse += chunk;
      }
      
      const finalJson = JSON.parse(fullResponse);
      setFinalItinerary(finalJson);

    } catch (err) {
      setError("Failed to generate itinerary. The AI may be overloaded. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ... (handleCopyToClipboard, handleSaveItinerary, and SaveButton functions remain unchanged) ...
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
  const handleSaveItinerary = async () => {
    setSaveStatus('saving');
    try {
      const response = await fetch('/api/itineraries/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: destination,
          itinerary_data: finalItinerary
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save.');
      }
      setSaveStatus('saved');
    } catch (err) {
      console.error(err);
      alert(err.message);
      setSaveStatus('idle');
    }
  };
  const SaveButton = () => {
    if (saveStatus === 'saving') return ( <button disabled className="absolute top-4 right-16 flex items-center gap-2 bg-white/10 p-2 rounded-lg cursor-not-allowed"><Save className="w-5 h-5 animate-spin" /> Saving...</button> );
    if (saveStatus === 'saved') return ( <button disabled className="absolute top-4 right-16 flex items-center gap-2 bg-green-500/20 text-green-400 p-2 rounded-lg"><CheckCircle className="w-5 h-5" /> Saved</button> );
    return ( <button onClick={handleSaveItinerary} className="absolute top-4 right-16 bg-white/10 p-2 rounded-lg hover:bg-white/20" title="Save Itinerary"><Save className="w-5 h-5" /></button> );
  };

  return (
    <div className="w-full flex flex-col items-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-white/20 w-full max-w-xl"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Destination Input */}
            <div className="sm:col-span-2">
              <label htmlFor="destination" className="block text-sm font-medium text-gray-200 mb-2">
                Destination
              </label>
              <input
                type="text"
                id="destination"
                name="destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g., Mysuru, Goa"
                className="w-full bg-white/10 text-white placeholder-gray-400 p-3 rounded-lg border border-white/20 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                required
              />
            </div>
            {/* ** NEW INPUT FIELD FOR NUMBER OF DAYS ** */}
            <div>
              <label htmlFor="numDays" className="block text-sm font-medium text-gray-200 mb-2">
                Days
              </label>
              <input
                type="number"
                id="numDays"
                name="numDays"
                value={numDays}
                onChange={(e) => setNumDays(Number(e.target.value))}
                min="1"
                max="10"
                className="w-full bg-white/10 text-white p-3 rounded-lg border border-white/20 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                required
              />
            </div>
          </div>
          
          {/* Vibe Selection */}
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

      {/* Result Display Area */}
      <div className="mt-8 w-full max-w-xl text-white">
        {error && ( <div className="bg-red-500/20 border border-red-500 p-4 rounded-lg"><p className="font-bold">Error:</p><p>{error}</p></div> )}
        {loading && <SkeletonLoader />}
        {!loading && finalItinerary && (
          <div className="relative">
            {user && (
              <>
                <SaveButton />
                <button onClick={handleCopyToClipboard} className="absolute top-4 right-4 bg-white/10 p-2 rounded-lg hover:bg-white/20" title="Copy to Clipboard"><Clipboard className="w-5 h-5" /></button>
              </>
            )}
            {finalItinerary.itinerary.map((dayData, index) => (
              <ItineraryCard key={index} dayData={dayData} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}