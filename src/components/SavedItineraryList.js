"use client";

import { useState } from 'react';
import ItineraryCard from '@/components/ItineraryCard';
import ShareButton from '@/components/ShareButton';
import { ChevronDown, ChevronUp } from 'lucide-react'; // Icons for expand/collapse

export default function SavedItineraryList({ savedItineraries }) {
  const [expandedTripId, setExpandedTripId] = useState(null); // Stores the ID of the currently expanded trip

  const handleToggleExpand = (tripId) => {
    setExpandedTripId(prevId => (prevId === tripId ? null : tripId));
  };

  return (
    <div className="space-y-6">
      {savedItineraries.map((trip) => (
        <div key={trip.id} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Clickable Summary Section */}
          <button
            onClick={() => handleToggleExpand(trip.id)}
            className="w-full p-4 sm:p-6 text-left bg-gray-700/50 hover:bg-gray-700/80 transition-colors focus:outline-none"
            aria-expanded={expandedTripId === trip.id}
            aria-controls={`trip-details-${trip.id}`}
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-white">
                  Trip to: {trip.destination}
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">
                  Saved on: {new Date(trip.created_at).toLocaleDateString()}
                  {trip.itinerary_data?.itinerary?.length > 0 && 
                    ` | ${trip.itinerary_data.itinerary.length} Day${trip.itinerary_data.itinerary.length > 1 ? 's' : ''}`
                  }
                </p>
              </div>
              <div className="flex items-center gap-3">
                <ShareButton itineraryId={trip.id} destination={trip.destination} />
                {expandedTripId === trip.id ? (
                  <ChevronUp className="w-5 h-5 text-gray-300" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-300" />
                )}
              </div>
            </div>
          </button>

          {/* Expandable Full Itinerary Details */}
          {expandedTripId === trip.id && (
            <div id={`trip-details-${trip.id}`} className="p-4 sm:p-6 border-t border-gray-700">
              {trip.itinerary_data && trip.itinerary_data.itinerary.map((dayData, index) => (
                <ItineraryCard key={index} dayData={dayData} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}