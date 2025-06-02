"use client";

import React, { useState } from 'react';
import ItineraryCard from './ItineraryCard';
import { Clipboard, Save, CheckCircle } from 'lucide-react';

// Full SkeletonLoader Component
const SkeletonLoader = () => (
  <div className="space-y-6 animate-pulse">
    <div className="bg-white/10 p-6 rounded-lg">
      <div className="h-8 bg-gray-600 rounded w-1/3 mb-4"></div>
      <div className="space-y-4">
        <div className="h-4 bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-700 rounded w-5/6"></div>
        <div className="h-4 bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-700 rounded w-4/6"></div>
      </div>
    </div>
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
  const [numDays, setNumDays] = useState("2"); // Stores as string for input flexibility
  const [vibes, setVibes] = useState([]);
  const [transportMode, setTransportMode] = useState('Any');
  const [travelPeriod, setTravelPeriod] = useState('Any');

  const [loading, setLoading] = useState(false);
  const [finalItinerary, setFinalItinerary] = useState(null);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle'); 

  const transportOptions = ["Any", "Airways", "Train", "Bus", "Car"];
  const periodOptions = [
    "Any", "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December",
    "Spring (Mar-May)", "Summer (Jun-Aug)", "Autumn (Sep-Nov)", "Winter (Dec-Feb)"
  ];

  const handleVibeChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setVibes((prevVibes) => [...prevVibes, value]);
    } else {
      setVibes((prevVibes) => prevVibes.filter((vibe) => vibe !== value));
    }
  };

  const handleNumDaysChange = (e) => {
    const inputValue = e.target.value;
    if (inputValue === "" || /^[0-9]*$/.test(inputValue)) {
      setNumDays(inputValue);
    }
  };

  const handleNumDaysBlur = () => {
    let numericValue = parseInt(numDays, 10);
    if (isNaN(numericValue) || numericValue < 1) {
      numericValue = 1; 
    }
    numericValue = Math.min(numericValue, 10); 
    setNumDays(String(numericValue)); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (vibes.length === 0) {
      setError("Please select at least one vibe.");
      return;
    }

    let daysToSubmit = parseInt(numDays, 10);
    if (isNaN(daysToSubmit) || daysToSubmit < 1) {
      daysToSubmit = 2; 
      setNumDays("2"); 
    } else {
      daysToSubmit = Math.min(daysToSubmit, 10); 
      if (String(daysToSubmit) !== numDays) { 
        setNumDays(String(daysToSubmit));
      }
    }

    setLoading(true);
    setFinalItinerary(null);
    setSaveStatus('idle');
    setError('');

    let fullResponse = "";
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            destination, 
            vibes, 
            numDays: daysToSubmit,
            transportMode, 
            travelPeriod 
        }), 
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "An unknown error occurred from API.");
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullResponse += decoder.decode(value, { stream: true });
      }
      fullResponse += decoder.decode();

      const finalJson = JSON.parse(fullResponse);
      setFinalItinerary(finalJson);

    } catch (err) {
      setError("Failed to generate itinerary. The AI may be overloaded or the response was not valid JSON. Please try again.");
      console.error("Error during fetch or JSON parsing:", err, "Raw response was:", fullResponse);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCopyToClipboard = () => {
    if (finalItinerary && finalItinerary.itinerary) {
      const textToCopy = finalItinerary.itinerary.map(day => {
        let dayText = `${day.day}:\n`;
        day.timeline.forEach(item => {
          dayText += `  - ${item.time}: ${item.activity} - ${item.description}\n`;
        });
        if (day.food_suggestion) {
          dayText += `  - Food: ${day.food_suggestion.name} - ${day.food_suggestion.description}\n`;
        }
        return dayText;
      }).join('\n\n');
      navigator.clipboard.writeText(textToCopy)
        .then(() => alert('Itinerary copied to clipboard!'))
        .catch(err => {
            console.error('Failed to copy text: ', err);
            alert('Failed to copy. Your browser might not support this feature or requires permissions.');
        });
    }
  };
  
  const handleSaveItinerary = async () => {
    if (!finalItinerary || !user) return;
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
        throw new Error(errorData.error || 'Failed to save itinerary.');
      }
      
      setSaveStatus('saved');
    } catch (err) {
      console.error("Error saving itinerary:", err);
      alert(`Error saving itinerary: ${err.message}`);
      setSaveStatus('idle');
    }
  };

  const SaveButton = () => {
    if (saveStatus === 'saving') {
      return (
        <button disabled className="absolute top-4 right-16 flex items-center gap-2 bg-white/10 p-2 rounded-lg cursor-not-allowed text-sm">
          <Save className="w-4 h-4 animate-spin" /> Saving...
        </button>
      );
    }
    if (saveStatus === 'saved') {
      return (
        <button disabled className="absolute top-4 right-16 flex items-center gap-2 bg-green-500/20 text-green-400 p-2 rounded-lg text-sm">
          <CheckCircle className="w-4 h-4" /> Saved
        </button>
      );
    }
    return (
      <button 
        onClick={handleSaveItinerary}
        className="absolute top-4 right-16 bg-white/10 p-2 rounded-lg hover:bg-white/20"
        title="Save Itinerary"
      >
        <Save className="w-5 h-5" />
      </button>
    );
  };

  return (
    <div className="w-full flex flex-col items-center pb-10">
      <form
        onSubmit={handleSubmit}
        className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-white/20 w-full max-w-xl"
      >
        <div className="space-y-6">
          {/* Destination and Days Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="destination" className="block text-sm font-medium text-gray-200 mb-1">Destination</label>
              <input type="text" id="destination" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g., Mysuru, Goa" className="w-full bg-white/10 text-white p-3 rounded-lg border border-white/20 focus:ring-2 focus:ring-purple-500 outline-none" required />
            </div>
            <div>
              <label htmlFor="numDays" className="block text-sm font-medium text-gray-200 mb-1">Days</label>
              <input 
                type="text" 
                inputMode="numeric" 
                pattern="[0-9]*"
                id="numDays" 
                value={numDays} 
                onChange={handleNumDaysChange} 
                onBlur={handleNumDaysBlur} 
                placeholder="1-10"
                className="w-full bg-white/10 text-white p-3 rounded-lg border border-white/20 focus:ring-2 focus:ring-purple-500 outline-none" 
                required 
              />
            </div>
          </div>

          {/* Transport and Period Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="transportMode" className="block text-sm font-medium text-gray-200 mb-1">Transport Mode</label>
              <select id="transportMode" value={transportMode} onChange={(e) => setTransportMode(e.target.value)} className="w-full bg-gray-700 text-white p-3 rounded-lg border border-white/20 focus:ring-2 focus:ring-purple-500 outline-none appearance-none">
                {transportOptions.map(opt => <option key={opt} value={opt} className="bg-gray-800 text-white">{opt}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="travelPeriod" className="block text-sm font-medium text-gray-200 mb-1">Travel Period</label>
              <select id="travelPeriod" value={travelPeriod} onChange={(e) => setTravelPeriod(e.target.value)} className="w-full bg-gray-700 text-white p-3 rounded-lg border border-white/20 focus:ring-2 focus:ring-purple-500 outline-none appearance-none">
                {periodOptions.map(opt => <option key={opt} value={opt} className="bg-gray-800 text-white">{opt}</option>)}
              </select>
            </div>
          </div>
          
          {/* Vibe Selection */}
          <div>
             <label className="block text-sm font-medium text-gray-200 mb-1">Select Your Vibe (at least one)</label>
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
              {['Adventure', 'Relaxing', 'Foodie', 'Culture', 'Artsy', 'Party'].map((vibe) => (
                <div key={vibe}>
                  <input type="checkbox" id={vibe} name="vibe" value={vibe} onChange={handleVibeChange} className="hidden peer" />
                  <label htmlFor={vibe} className="block text-center cursor-pointer p-3 rounded-lg border border-white/20 peer-checked:bg-purple-600 peer-checked:border-purple-600 text-sm transition-all duration-200">{vibe}</label>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
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
                <button 
                  onClick={handleCopyToClipboard}
                  className="absolute top-4 right-4 bg-white/10 p-2 rounded-lg hover:bg-white/20"
                  title="Copy to Clipboard"
                >
                  <Clipboard className="w-5 h-5" />
                </button>
              </>
            )}
            {finalItinerary.itinerary && Array.isArray(finalItinerary.itinerary) &&
              finalItinerary.itinerary.map((dayData, index) => (
                <ItineraryCard key={index} dayData={dayData} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}