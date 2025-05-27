import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// We are now using the 'flash' model, which is faster and has a generous free tier.
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash-latest", // THE ONLY CHANGE IS HERE
  generationConfig: {
    responseMimeType: "application/json",
  }
});

// A helper function to create a browser-compatible stream
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
    const { destination, vibes } = await req.json();

    const prompt = `
      You are Voyara, an expert travel planner creating a JSON itinerary.
      Do not include any introductory text, just the JSON object.
      The destination is ${destination}.
      The desired vibe is: ${vibes.join(", ")}.
      
      Generate a detailed 2-day weekend itinerary.
      The JSON structure must be:
      {
        "itinerary": [
          {
            "day": "Day 1",
            "timeline": [
              { "time": "Morning", "activity": "Activity Name", "description": "A 1-2 sentence description." },
              { "time": "Afternoon", "activity": "Activity Name", "description": "A 1-2 sentence description." },
              { "time": "Evening", "activity": "Activity Name", "description": "A 1-2 sentence description." }
            ],
            "food_suggestion": { "name": "Restaurant Name", "description": "A 1-2 sentence description of why it's a good choice." }
          },
          {
            "day": "Day 2",
            "timeline": [
              { "time": "Morning", "activity": "Activity Name", "description": "A 1-2 sentence description." },
              { "time": "Afternoon", "activity": "Activity Name", "description": "A 1-2 sentence description." },
              { "time": "Evening", "activity": "Activity Name", "description": "A 1-2 sentence description." }
            ],
            "food_suggestion": { "name": "Restaurant Name", "description": "A 1-2 sentence description of why it's a good choice." }
          }
        ]
      }
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