import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash-latest",
  generationConfig: {
    responseMimeType: "application/json",
  }
});

function AIStream(stream) {
  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      for await (const chunk of stream) {
        const text = chunk.text();
        controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });
}

export async function POST(req) {
  try {
    const { destination, sourceCity, vibes, numDays, transportMode, travelPeriod } = await req.json();
    
    const days = Math.max(1, Math.min(10, numDays || 2)); 

    let sourceCityInstruction = "";
    if (sourceCity && sourceCity.trim() !== "") {
      sourceCityInstruction = `\n- The user is starting their journey from **${sourceCity}**. If suggesting initial travel to ${destination}, consider this starting point.`;
    }

    let transportPreamble = "";
    let transportExclusion = "";
    if (transportMode && transportMode !== "Any") {
        transportPreamble = `The user's EXCLUSIVE mode of transport for reaching the destination and for all significant travel during the trip is **${transportMode}**. All travel logistics, arrival/departure plans, activity accessibility, and inter-activity travel suggestions MUST be based SOLELY on using ${transportMode}.`;
        if (transportMode === "Car") {
            transportPreamble += " Focus on driving routes, estimated driving times between locations, parking availability, and car-accessible locations. Assume the user has their own or a rental car for the entire duration.";
            transportExclusion = "ABSOLUTELY NO FLIGHTS, AIRPORTS, OR AIR TRAVEL should be mentioned, planned for, or assumed for any part of this itinerary, including arrival at the destination.";
        } else if (transportMode === "Train") {
            transportPreamble += " Focus on train routes, travel to/from central train stations, and activities accessible from there using local transport (like taxis or local buses, specify if needed). Assume arrival/departure at the destination by train.";
            transportExclusion = "ABSOLUTELY NO FLIGHTS, AIRPORTS, OR AIR TRAVEL should be mentioned, planned for, or assumed for any part of this itinerary, including arrival at the destination.";
        } else if (transportMode === "Bus") {
            transportPreamble += " Focus on inter-city bus routes, travel to/from bus terminals, and activities accessible from there. Assume arrival/departure at the destination by bus.";
            transportExclusion = "ABSOLUTELY NO FLIGHTS, AIRPORTS, OR AIR TRAVEL should be mentioned, planned for, or assumed for any part of this itinerary, including arrival at the destination.";
        } else if (transportMode === "Airways") {
            transportPreamble += " Assume the user will primarily arrive and depart via AIRPORT for the main destination. Include reasonable travel to/from the airport. Local transport within the destination can then be varied (taxi, local bus, rental car as appropriate and suggest these).";
        }
    }

    let periodInstruction = "";
    if (travelPeriod && travelPeriod !== "Any") {
        periodInstruction = `The trip is planned for **${travelPeriod}**. All suggested activities, their feasibility, opening hours, and alternative suggestions MUST be suitable and relevant for this specific month or season, explicitly considering typical weather, local events, or peak/off-peak conditions. Descriptions should reflect this.`;
    }

    const prompt = `
You are Voyara, an extremely detailed and highly obedient AI travel planner. You MUST create a JSON itinerary. Adherence to ALL user constraints below is MANDATORY and CRITICAL.
Output ONLY the JSON object. Do not include any introductory or concluding text, comments, or markdown formatting outside the JSON structure.

**User's Non-Negotiable Constraints:**
- Destination: ${destination}
${sourceCityInstruction}
- Desired Vibe: ${vibes.join(", ")}
- Trip Duration: Exactly ${days} days.
${transportPreamble ? `- Transport Mode Constraint: ${transportPreamble}` : '- Transport Mode: Not specified; assume general multi-modal accessibility for arrival but prioritize local transport for activities.'}
${transportExclusion ? `- Explicit Transport Exclusion: ${transportExclusion}` : ''}
${periodInstruction ? `- Travel Period Constraint: ${periodInstruction}` : ''}

**Task & Output Instructions:**
Generate a detailed itinerary based *strictly and exclusively* on ALL the user's constraints above.
The itinerary must feature specific timings (e.g., "9:00 AM", "1:30 PM") for each activity.

**Required JSON Structure:**
{
  "itinerary": [ 
    {
      "day": "Day X", 
      "timeline": [ 
        {
          "time": "HH:MM AM/PM", 
          "activity": "Name of the activity",
          "description": "1-3 sentences. This description MUST incorporate and reflect how the specified Transport Mode and Travel Period constraints influence this activity or its logistics, IF those constraints were provided."
        }
      ],
      "food_suggestion": {
        "name": "Restaurant Name or Type of Cuisine",
        "description": "1-2 sentences. This description should also consider the Travel Period if specified."
      }
    }
  ],
  "bestTimeToVisit": {
    "months": "e.g., October to March or April, May",
    "reason": "A brief 1-2 sentence explanation why these are good times to visit ${destination} (e.g., pleasant weather, festivals, fewer crowds)."
  }
}

**Critical Reminders:**
- If a non-'Airways' transport mode is specified, the ENTIRE itinerary, including initial arrival at ${destination} (possibly from ${sourceCity ? sourceCity : 'their starting point'}), must be planned without any flights or airport mentions.
- All activity and food descriptions must align with the specified Vibe, Transport Mode, and Travel Period.
- The "itinerary" array must contain exactly ${days} day objects.
- The "bestTimeToVisit" object MUST be populated with relevant information for ${destination}.
    `;

    const result = await model.generateContentStream(prompt);
    const stream = AIStream(result.stream);
    return new Response(stream);

  } catch (error) {
    console.error("Error in generate route:", error);
    return new Response(JSON.stringify({ error: "Failed to generate itinerary. " + error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}