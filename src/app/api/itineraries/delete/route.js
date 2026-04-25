import { NextResponse } from 'next/server.js';
import { z } from 'zod';
import { authenticateRequest } from '../../../../lib/auth.js';
import { mongoIdSchema, readJsonBody, rejectCrossOrigin } from '../../../../lib/request-security.js';

export const dynamic = 'force-dynamic';

async function getDeleteDependencies() {
  const [{ connectDB }, { Itinerary }] = await Promise.all([
    import('../../../../lib/mongodb.js'),
    import('../../../../lib/schema.js'),
  ]);

  return { connect: connectDB, itineraryModel: Itinerary };
}

export async function deleteOwnedItinerary({ id, userId, connect, itineraryModel }) {
  if (!connect || !itineraryModel) {
    const deps = await getDeleteDependencies();
    connect = connect || deps.connect;
    itineraryModel = itineraryModel || deps.itineraryModel;
  }

  await connect();
  const trip = await itineraryModel.findOneAndDelete({ _id: id, user_id: userId });
  return Boolean(trip);
}

export async function handleDeleteRequest(req, { deleteItinerary = deleteOwnedItinerary } = {}) {
  const originError = rejectCrossOrigin(req);
  if (originError) return originError;

  const user = await authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'You must be logged in to delete an itinerary.' }, { status: 401 });
  }

  const { data: parsedBody, error: bodyError } = await readJsonBody(req);
  if (bodyError) return bodyError;

  const Schema = z.object({
    id: z.string().regex(mongoIdSchema, 'Invalid itinerary id'),
  });
  const result = Schema.safeParse(parsedBody);
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid payload', details: result.error.flatten() }, { status: 400 });
  }
  const { id } = result.data;

  try {
    const deleted = await deleteItinerary({ id, userId: user.sub });
    if (!deleted) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete itinerary', details: err?.message || err }, { status: 500 });
  }
}

export async function POST(req) {
  return handleDeleteRequest(req);
}
