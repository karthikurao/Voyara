import React from 'react';
import { Sun, Cloud, Moon, Utensils } from 'lucide-react';

// A helper to pick an icon based on the time of day
const TimeIcon = ({ time }) => {
  if (time.toLowerCase() === 'morning') return <Sun className="w-6 h-6 text-yellow-400" />;
  if (time.toLowerCase() === 'afternoon') return <Cloud className="w-6 h-6 text-sky-400" />;
  if (time.toLowerCase() === 'evening') return <Moon className="w-6 h-6 text-indigo-400" />;
  return null;
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
              <div className="bg-purple-500/20 rounded-full p-2">
                <TimeIcon time={item.time} />
              </div>
              {/* Vertical line connector */}
              {index < timeline.length - 1 && <div className="w-0.5 h-full bg-purple-400/30"></div>}
            </div>
            <div>
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