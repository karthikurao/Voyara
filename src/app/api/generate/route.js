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
    const { destination, vibes, numDays } = await req.json();
    const days = Math.max(1, Math.min(10, numDays || 2));

    // ** PROMPT UPDATED FOR SPECIFIC TIMES **
    const prompt = `
      You are Voyara, an expert travel planner creating a JSON itinerary. Be specific with timings for each activity to create a realistic schedule.
      Do not include any introductory text, just the JSON object.
      The destination is ${destination}.
      The desired vibe is: ${vibes.join(", ")}.
      
      Generate a detailed itinerary for a trip lasting exactly ${days} days.
      The JSON structure must have a root key "itinerary" which is an array of day objects.
      Each day object in the array must contain:
      1. A "day" key with the string value (e.g., "Day 1", "Day 2").
      2. A "timeline" key which is an array of objects, where each object represents an activity and must contain:
          - "time": a specific time string (e.g., "9:00 AM", "1:30 PM", "7:00 PM"),
          - "activity": a string for the activity name,
          - "description": a string for the 1-2 sentence description.
      3. A "food_suggestion" key which is an object containing "name" (string) and "description" (string).

      Ensure the "itinerary" array has exactly ${days} elements.
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