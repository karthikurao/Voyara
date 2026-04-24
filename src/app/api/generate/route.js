import { z } from 'zod';

// Basic in-memory rate limit per IP (best-effort; for production, use a durable store)
const bucket = new Map();
const WINDOW_MS = 60_000; // 1 min
const MAX_REQ = 5; // 5 requests/min per IP

const RequestSchema = z.object({
  destination: z.string().trim().min(1),
  sourceCity: z.string().trim().optional().nullable(),
  vibes: z.array(z.string()).min(1).max(10),
  numDays: z.number().int().min(1).max(10).optional(),
  transportMode: z.enum(["Any","Airways","Train","Bus","Car"]).optional(),
  travelPeriod: z.string().trim().optional(),
  refine: z.object({ // optional refine mode with instructions and existing JSON
    instructions: z.string().trim().min(1),
    previous: z.any().optional(),
  }).optional(),
});

// DUMMY MODE: Gemini is disabled. This route will return a stable, hardcoded
// JSON itinerary derived from the user's `destination`, `vibes`, and `numDays`.
// This ensures the frontend always receives valid JSON and avoids any use of
// the Google Generative AI SDK or network calls to Gemini.

function makeDummyItinerary(destination, vibes, days) {
  const safeDestination = destination || 'your destination';
  const safeVibes = Array.isArray(vibes) && vibes.length ? vibes : ['relax'];
  const scheduleTimes = [
    ['9:00 AM', '12:30 PM', '3:30 PM', '7:00 PM'],
    ['8:30 AM', '12:00 PM', '4:00 PM', '8:00 PM'],
    ['9:30 AM', '1:00 PM', '3:00 PM', '6:30 PM'],
  ];

  const itinerary = Array.from({ length: days }, (_, i) => {
    const dayIndex = i + 1;
    const times = scheduleTimes[i % scheduleTimes.length];
    return {
      day: `Day ${dayIndex}`,
      timeline: [
        {
          time: times[0],
          activity: `Explore ${safeDestination} - Highlights`,
          description: `A ${safeVibes.join(', ')} morning exploring key sights in ${safeDestination}.`,
        },
        {
          time: times[1],
          activity: `Local lunch and market visit`,
          description: `Enjoy local flavors that match the ${safeVibes.join(', ')} vibe.`,
        },
        {
          time: times[2],
          activity: `Afternoon activity`,
          description: `A relaxed ${safeVibes[0]} activity suited for ${safeDestination}.`,
        },
        {
          time: times[3],
          activity: `Evening dining`,
          description: `Dinner at a recommended spot reflecting the ${safeVibes.join(', ')} vibe.`,
        },
      ],
      food_suggestion: {
        name: `${safeDestination} Local Cuisine`,
        description: `Try local specialties that fit a ${safeVibes.join(', ')} trip.`,
      },
    };
  });

  return {
    itinerary,
    bestTimeToVisit: {
      months: 'Spring to Fall',
      reason: `Generally pleasant weather for visiting ${destination}.`,
    },
  };
}

export async function POST(req) {
  try {

    // Enforce same-origin for browsers; allow SSR/local tools gracefully
    const origin = req.headers.get('origin') || '';
    const host = req.headers.get('host') || '';
    if (origin && !origin.includes(host)) {
      return new Response(JSON.stringify({ error: 'Invalid origin' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // Minimal IP-based rate limit
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
    const now = Date.now();
    const rec = bucket.get(ip) || { count: 0, ts: now };
    if (now - rec.ts > WINDOW_MS) { rec.count = 0; rec.ts = now; }
    rec.count++;
    bucket.set(ip, rec);
    if (rec.count > MAX_REQ) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a minute.' }), { status: 429, headers: { 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid request', details: parsed.error.flatten() }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    const { destination, sourceCity, vibes, numDays, transportMode, travelPeriod, refine } = parsed.data;
    
    const days = Math.max(1, Math.min(10, numDays ?? 2)); 

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

    // DUMMY MODE: Gemini calls are disabled. Return a deterministic dummy itinerary
    // derived from the provided fields so the frontend always receives valid JSON.
    try {
      const dummy = makeDummyItinerary(destination, vibes, days);
      return new Response(JSON.stringify(dummy), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.error('Failed to create dummy itinerary:', err);
      // Always return valid JSON with status 200 per requirement.
      return new Response(JSON.stringify({ itinerary: [], bestTimeToVisit: { months: '', reason: '' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error("Error in generate route:", error);
    return new Response(JSON.stringify({ error: "Failed to generate itinerary. " + error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}