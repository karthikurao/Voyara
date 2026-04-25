import { connectDB } from "@/lib/mongodb";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return new Response(null, { status: 404 });
  }
  await connectDB();

  return Response.json({
    message: "MongoDB Connected Successfully ✅"
  });
}