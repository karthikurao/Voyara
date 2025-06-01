import React from 'react';
import { Sun, Cloud, Moon, Utensils, Clock } from 'lucide-react';

// This component now has a fallback and includes specific time checks
const TimeIcon = ({ time }) => {
  // Convert time to a comparable format, e.g., 2:00 PM -> 14
  const timeString = time.toLowerCase();
  let hour = 0;
  if (timeString.includes(':')) {
    const [hourPart, minutePart] = timeString.split(':');
    hour = parseInt(hourPart, 10);
    if (timeString.includes('pm') && hour !== 12) {
      hour += 12;
    }
    if (timeString.includes('am') && hour === 12) {
      hour = 0;
    }
  }

  if (hour >= 5 && hour < 12) return <Sun className="w-6 h-6 text-yellow-400" />;
  if (hour >= 12 && hour < 18) return <Cloud className="w-6 h-6 text-sky-400" />;
  if (hour >= 18 || hour < 5) return <Moon className="w-6 h-6 text-indigo-400" />;
  return <Clock className="w-6 h-6 text-gray-400" />; // Fallback icon
};

export default function ItineraryCard({ dayData }) {
  const { day, timeline, food_suggestion } = dayData;

  return (
    <div className="bg-white/10 p-6 rounded-lg mb-6 animate-fade-in">
      <h2 className="text-3xl font-bold mb-4 text-white border-b-2 border-purple-400 pb-2">{day}</h2>
      
      <div className="space-y-6">
        {timeline.map((item, index) => (
          <div key={index} className="flex gap-4">
            <div className="flex flex-col items-center">
              {/* This div now contains both the icon and the specific time text */}
              <div className="flex flex-col items-center gap-1">
                <div className="bg-purple-500/20 rounded-full p-2">
                  <TimeIcon time={item.time} />
                </div>
                <span className="text-xs font-semibold text-gray-300">{item.time}</span>
              </div>
              {/* Vertical line connector */}
              {index < timeline.length - 1 && <div className="w-0.5 flex-grow bg-purple-400/30 mt-2"></div>}
            </div>
            <div className="pt-2"> {/* Added padding top to align with icon */}
              <h3 className="font-semibold text-lg text-white">{item.activity}</h3>
              <p className="text-gray-300">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
      
      {food_suggestion && (
        <div className="mt-6 pt-4 border-t border-white/20">
           <div className="flex items-center gap-3">
            <Utensils className="w-5 h-5 text-green-400" />
            <h3 className="text-xl font-semibold text-white">Food Suggestion</h3>
           </div>
          <div className="mt-2 pl-8">
            <p className="font-semibold text-gray-200">{food_suggestion.name}</p>
            <p className="text-gray-400">{food_suggestion.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}