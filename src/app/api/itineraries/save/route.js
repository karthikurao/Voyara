import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Itinerary } from "@/lib/schema";

export async function POST(req) {
  try {
    // Parse request body safely
    const body = await req.json();
    console.log("Incoming body:", body);

    // Validate required fields
    if (!body.destination || !body.itinerary_data) {
      return NextResponse.json(
        { error: "Missing required fields: destination or itinerary_data" },
        { status: 400 }
      );
    }

    // Connect to DB
    await connectDB();

    // Create itinerary
    const newItinerary = await Itinerary.create({
      user_id: "test-user", // temporary (auth bypass)
      destination: body.destination,
      itinerary_data: body.itinerary_data,
      context: body.context || {},
      metadata: body.metadata || {},
      is_public: false,
      created_at: new Date(),
      updated_at: new Date(),
    });

    console.log("Saved itinerary:", newItinerary);

    // Always return JSON
    return NextResponse.json(
      {
        success: true,
        data: newItinerary,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("SAVE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}