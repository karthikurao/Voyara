import test from 'node:test';
import assert from 'node:assert/strict';

process.env.AUTH_SECRET = 'test-secret-with-more-than-32-characters';
process.env.AUTH_ISSUER = 'voyara';
process.env.AUTH_AUDIENCE = 'voyara-web';

const auth = await import('../src/lib/auth.js');
const { POST, deleteOwnedItinerary, handleDeleteRequest } = await import('../src/app/api/itineraries/delete/route.js?test');

function makeRequest({ token, body, origin = 'http://localhost:3000', host = 'localhost:3000' } = {}) {
  const headers = {
    'content-type': 'application/json',
    origin,
    host,
  };

  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  return new Request('http://localhost:3000/api/itineraries/delete', {
    method: 'POST',
    headers,
    body: body === undefined ? JSON.stringify({ id: '507f1f77bcf86cd799439011' }) : body,
  });
}

test('POST delete should reject missing or invalid JWT before touching the database', async () => {
  const missing = await POST(makeRequest());
  const invalid = await POST(makeRequest({ token: 'invalid-token' }));

  assert.equal(missing.status, 401);
  assert.equal(invalid.status, 401);
});

test('POST delete should reject cross-origin requests before authentication work', async () => {
  const token = auth.signAuthToken({ id: 'user-1', email: 'user@example.com' });

  const response = await POST(makeRequest({
    token,
    origin: 'http://evil.localhost:3000',
    host: 'localhost:3000',
  }));

  assert.equal(response.status, 403);
});

test('POST delete should validate JSON and itinerary id before deleting', async () => {
  const token = auth.signAuthToken({ id: 'user-1', email: 'user@example.com' });

  const invalidJson = await POST(makeRequest({ token, body: '{bad json' }));
  const invalidId = await POST(makeRequest({ token, body: JSON.stringify({ id: 'not-a-mongo-id' }) }));

  assert.equal(invalidJson.status, 400);
  assert.equal(invalidId.status, 400);
});

test('deleteOwnedItinerary should delete only by itinerary id and authenticated owner id', async () => {
  const calls = [];
  const deleted = await deleteOwnedItinerary({
    id: '507f1f77bcf86cd799439011',
    userId: 'user-1',
    connect: async () => calls.push(['connect']),
    itineraryModel: {
      findOneAndDelete: async (query) => {
        calls.push(['findOneAndDelete', query]);
        return { _id: query._id, user_id: query.user_id };
      },
    },
  });

  assert.equal(deleted, true);
  assert.deepEqual(calls, [
    ['connect'],
    ['findOneAndDelete', { _id: '507f1f77bcf86cd799439011', user_id: 'user-1' }],
  ]);
});

test('deleteOwnedItinerary should report false when no owned itinerary is deleted', async () => {
  const deleted = await deleteOwnedItinerary({
    id: '507f1f77bcf86cd799439011',
    userId: 'user-1',
    connect: async () => {},
    itineraryModel: {
      findOneAndDelete: async () => null,
    },
  });

  assert.equal(deleted, false);
});

test('deleteOwnedItinerary should bubble database errors to the route handler', async () => {
  await assert.rejects(
    deleteOwnedItinerary({
      id: '507f1f77bcf86cd799439011',
      userId: 'user-1',
      connect: async () => {},
      itineraryModel: {
        findOneAndDelete: async () => {
          throw new Error('database unavailable');
        },
      },
    }),
    /database unavailable/
  );
});

test('handleDeleteRequest should return success when the authenticated delete succeeds', async () => {
  const token = auth.signAuthToken({ id: 'user-1', email: 'user@example.com' });
  const calls = [];

  const response = await handleDeleteRequest(makeRequest({ token }), {
    deleteItinerary: async (input) => {
      calls.push(input);
      return true;
    },
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, { success: true });
  assert.deepEqual(calls, [{ id: '507f1f77bcf86cd799439011', userId: 'user-1' }]);
});

test('handleDeleteRequest should return 404 when the delete function reports no owned trip', async () => {
  const token = auth.signAuthToken({ id: 'user-1', email: 'user@example.com' });

  const response = await handleDeleteRequest(makeRequest({ token }), {
    deleteItinerary: async () => false,
  });

  assert.equal(response.status, 404);
});

test('handleDeleteRequest should return 500 when the delete function throws', async () => {
  const token = auth.signAuthToken({ id: 'user-1', email: 'user@example.com' });

  const response = await handleDeleteRequest(makeRequest({ token }), {
    deleteItinerary: async () => {
      throw new Error('database unavailable');
    },
  });
  const body = await response.json();

  assert.equal(response.status, 500);
  assert.equal(body.details, 'database unavailable');
});
