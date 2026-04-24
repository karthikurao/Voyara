"use client";

import React, { useState } from 'react';
import ItineraryCard from './ItineraryCard';
import { Clipboard, Save, CheckCircle, HelpCircle, Download, Wand2 } from 'lucide-react';

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

export default function GeneratorForm() {
  const [destination, setDestination] = useState('');
  const [sourceCity, setSourceCity] = useState(''); 
  const [numDays, setNumDays] = useState("2"); 
  const [vibes, setVibes] = useState([]);
  const [transportMode, setTransportMode] = useState('Any');
  const [travelPeriod, setTravelPeriod] = useState('Any');
  const [refineText, setRefineText] = useState('');

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

  const doGenerate = async (payload) => {
    setLoading(true);
    setFinalItinerary(null);
    setSaveStatus('idle');
    setError('');

    let fullResponse = "";
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), 
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

    await doGenerate({ 
      destination, 
      sourceCity,
      vibes, 
      numDays: daysToSubmit,
      transportMode, 
      travelPeriod 
    });
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
    if (!finalItinerary) return;
    
    // Get JWT from localStorage
    const jwt = typeof window !== 'undefined' ? localStorage.getItem('voyaraAuthToken') : null;
    console.log('[GeneratorForm] Retrieved token:', jwt ? `Token found (length: ${jwt.length})` : 'NO TOKEN FOUND');
    if (!jwt) {
      console.warn('[GeneratorForm] No token available - cannot save');
      alert('Please log in to save itineraries.');
      return;
    }
    
    console.log('[GeneratorForm] Token valid, proceeding with save');
    setSaveStatus('saving');
    try {
      console.log('[GeneratorForm] Sending save request with Authorization header');
      const response = await fetch('/api/itineraries/save', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({
          destination: destination, 
          itinerary_data: finalItinerary 
        }),
      });

      console.log('[GeneratorForm] Save response status:', response.status);
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error('[GeneratorForm] Invalid JSON response:', text);
        throw new Error('Server returned non-JSON response');
      }
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save itinerary.');
      }
      console.log('[GeneratorForm] Save successful');
      setSaveStatus('saved');
    } catch (err) {
      console.error('[GeneratorForm] Error saving itinerary:', err);
      alert(`Error saving itinerary: ${err.message}`);
      setSaveStatus('idle');
    }
  };

  const SaveButton = () => {
    if (saveStatus === 'saving') {
      return (
        <button disabled className="flex items-center gap-2 bg-white/10 p-2 rounded-lg cursor-not-allowed text-sm px-4 py-2">
          <Save className="w-4 h-4 animate-spin" /> 
          <span>Saving...</span>
        </button>
      );
    }
    if (saveStatus === 'saved') {
      return (
        <button disabled className="flex items-center gap-2 bg-green-500/20 text-green-400 p-2 rounded-lg text-sm px-4 py-2">
          <CheckCircle className="w-4 h-4" /> 
          <span>Saved</span>
        </button>
      );
    }
    return (
      <button 
        onClick={handleSaveItinerary}
        className="bg-white/10 p-2 rounded-lg hover:bg-white/20 flex items-center gap-2 px-4 py-2"
        title="Save Itinerary"
      >
        <Save className="w-5 h-5" />
        <span className="text-sm">Save</span>
      </button>
    );
  };

  const handleRefine = async () => {
    if (!finalItinerary || !refineText.trim()) return;
    await doGenerate({
      destination,
      sourceCity,
      vibes,
      numDays: parseInt(numDays, 10) || 2,
      transportMode,
      travelPeriod,
      refine: { instructions: refineText.trim(), previous: finalItinerary }
    });
  };

  // Build a very simple ICS export using current itinerary
  const handleExportICS = () => {
    if (!finalItinerary || !finalItinerary.itinerary) return;
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Voyara//Itinerary//EN',
    ];
    const startDate = new Date();
    finalItinerary.itinerary.forEach((day, i) => {
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + i);
      const y = dayDate.getUTCFullYear();
      const m = String(dayDate.getUTCMonth() + 1).padStart(2, '0');
      const d = String(dayDate.getUTCDate()).padStart(2, '0');
      (day.timeline || []).forEach((item) => {
        // Try to parse time in HH:MM AM/PM
        const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(item.time || '');
        let hh = 9, mm = 0; // default 9:00
        if (match) {
          hh = parseInt(match[1], 10);
          mm = parseInt(match[2], 10);
          const mer = match[3].toUpperCase();
          if (mer === 'PM' && hh !== 12) hh += 12; if (mer === 'AM' && hh === 12) hh = 0;
        }
        const dtStart = `${y}${m}${d}T${String(hh).padStart(2,'0')}${String(mm).padStart(2,'0')}00Z`;
        const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@voyara`; 
        lines.push('BEGIN:VEVENT');
        lines.push(`UID:${uid}`);
        lines.push(`DTSTAMP:${y}${m}${d}T000000Z`);
        lines.push(`DTSTART:${dtStart}`);
        lines.push(`SUMMARY:${(item.activity || 'Activity').replace(/\n/g,' ')}`);
        if (item.description) lines.push(`DESCRIPTION:${item.description.replace(/\n/g,' ')}`);
        lines.push('END:VEVENT');
      });
    });
    lines.push('END:VCALENDAR');
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `voyara-${destination || 'trip'}.ics`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    if (!finalItinerary) return;
    const blob = new Blob([JSON.stringify(finalItinerary, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url; a.download = `voyara-${destination || 'itinerary'}.json`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  const handlePrintPDF = () => {
    // Let the user use browser's print to PDF; keep UI minimal by printing only the results area
    window.print();
  };

  return (
    <div className="w-full flex flex-col items-center pb-10">
      <form
        onSubmit={handleSubmit}
        className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-white/20 w-full max-w-xl"
      >
        <div className="space-y-6">
          {/* Destination, Source City Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="destination" className="block text-sm font-medium text-gray-200 mb-1">Destination City</label>
              <input type="text" id="destination" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g., Mysuru, Goa" className="w-full bg-white/10 text-white p-3 rounded-lg border border-white/20 focus:ring-2 focus:ring-purple-500 outline-none" required />
            </div>
            <div>
              <label htmlFor="sourceCity" className="block text-sm font-medium text-gray-200 mb-1">Source City (Optional)</label>
              <input type="text" id="sourceCity" value={sourceCity} onChange={(e) => setSourceCity(e.target.value)} placeholder="e.g., Bengaluru" className="w-full bg-white/10 text-white p-3 rounded-lg border border-white/20 focus:ring-2 focus:ring-purple-500 outline-none" />
            </div>
          </div>
          
          {/* Days, Transport and Period Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

          {/* Submit Button */}
          <button type="submit" disabled={loading} className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Generating...' : 'Generate My Itinerary'}
          </button>
        </div>
      </form>

      {/* Result Display Area */}
      <div className="mt-8 w-full max-w-xl text-white">
        {error && ( <div className="bg-red-500/20 border border-red-500 p-4 rounded-lg"><p className="font-bold">Error:</p><p>{error}</p></div> )}
        
        {loading && <SkeletonLoader />}

        {!loading && finalItinerary && finalItinerary.itinerary && (
          <div className="relative">
            {/* Save and Copy buttons - top right corner */}
            <div className="flex gap-2 justify-end mb-4 print:hidden">
              <SaveButton />
              <button 
                onClick={handleCopyToClipboard}
                className="bg-white/10 p-2 rounded-lg hover:bg-white/20 flex items-center gap-2"
                title="Copy to Clipboard"
              >
                <Clipboard className="w-5 h-5" />
                <span className="text-sm">Copy</span>
              </button>
            </div>

            {/* Export & Refine Row */}
            <div className="flex flex-col gap-4 mb-6">
              {/* Refine Input */}
              <div className="w-full">
                <label className="block text-sm text-gray-300 mb-2">Refine itinerary</label>
                <div className="flex gap-2">
                  <input 
                    value={refineText} 
                    onChange={(e)=>setRefineText(e.target.value)} 
                    placeholder="e.g., add kid-friendly options"
                    className="flex-1 bg-white/10 text-white p-3 rounded-lg border border-white/20 focus:ring-2 focus:ring-purple-500 outline-none text-sm" 
                  />
                  <button 
                    onClick={handleRefine} 
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg flex items-center gap-2 whitespace-nowrap"
                  >
                    <Wand2 className="w-4 h-4"/>
                    <span className="hidden sm:inline">Refine</span>
                  </button>
                </div>
              </div>

              {/* Export Buttons Row */}
              <div className="flex flex-wrap gap-2 print:hidden">
                <button 
                  onClick={handleExportICS} 
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4"/>
                  <span>Export ICS</span>
                </button>
                <button 
                  onClick={handleDownloadJSON} 
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4"/>
                  <span>Download JSON</span>
                </button>
                <button 
                  onClick={handlePrintPDF} 
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4"/>
                  <span>Export PDF</span>
                </button>
              </div>
            </div>

            {finalItinerary.itinerary && Array.isArray(finalItinerary.itinerary) &&
              finalItinerary.itinerary.map((dayData, index) => (
                <ItineraryCard key={index} dayData={dayData} />
            ))}
          </div>
        )}

        {/* Display Best Time to Visit */}
        {!loading && finalItinerary && finalItinerary.bestTimeToVisit && (
          <div className="mt-8 bg-white/5 p-6 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="w-6 h-6 text-purple-400" />
              <h3 className="text-xl font-semibold text-white">Best Time to Visit {destination}</h3>
            </div>
            <p className="text-gray-300"><strong className="text-gray-100">Suggested Period:</strong> {finalItinerary.bestTimeToVisit.months}</p>
            <p className="text-gray-300"><strong className="text-gray-100">Reason:</strong> {finalItinerary.bestTimeToVisit.reason}</p>
          </div>
        )}
      </div>
    </div>
  );
}