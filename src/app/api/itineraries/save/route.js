import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyStackAuthJWT } from "@/lib/auth";
import { Itinerary } from "@/lib/schema";

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid token' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const user = await verifyStackAuthJWT(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Parse request body safely
    const body = await req.json();

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
      user_id: user.sub,
      destination: body.destination,
      itinerary_data: body.itinerary_data,
      context: body.context || {},
      metadata: body.metadata || {},
      is_public: false,
      created_at: new Date(),
      updated_at: new Date(),
    });

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
        error: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}