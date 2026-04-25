import test from 'node:test';
import assert from 'node:assert/strict';

process.env.GOOGLE_API_KEY = 'test-gemini-key';

const { handleGenerateRequest } = await import('../src/app/api/generate/route.js');

function makeGenerateRequest(body, headers = {}) {
  return new Request('http://localhost:3000/api/generate', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'http://localhost:3000',
      host: 'localhost:3000',
      'x-forwarded-for': `127.0.0.${Math.floor(Math.random() * 200) + 1}`,
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

async function readResponseText(response) {
  return response.text();
}

test('handleGenerateRequest should call Gemini and stream the generated JSON response', async () => {
  const prompts = [];
  const chunks = [
    { text: () => '{"itinerary":[' },
    { text: () => '{"day":"Day 1","timeline":[]}' },
    { text: () => ']}' },
  ];

  const response = await handleGenerateRequest(makeGenerateRequest({
    destination: 'Goa',
    sourceCity: 'Mumbai',
    vibes: ['beach', 'food'],
    numDays: 1,
    transportMode: 'Train',
    travelPeriod: 'December',
  }), {
    getModelImpl: () => ({
      generateContentStream: async (prompt) => {
        prompts.push(prompt);
        return { stream: chunks };
      },
    }),
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'application/json');
  assert.equal(await readResponseText(response), '{"itinerary":[{"day":"Day 1","timeline":[]}]}');
  assert.equal(prompts.length, 1);
  assert.match(prompts[0], /Destination: Goa/);
  assert.match(prompts[0], /ABSOLUTELY NO FLIGHTS/);
});

test('handleGenerateRequest should reject missing Gemini API key before calling Gemini', async () => {
  const originalKey = process.env.GOOGLE_API_KEY;
  delete process.env.GOOGLE_API_KEY;
  let called = false;

  const response = await handleGenerateRequest(makeGenerateRequest({
    destination: 'Goa',
    vibes: ['beach'],
    numDays: 1,
  }), {
    getModelImpl: () => {
      called = true;
      return {};
    },
  });

  process.env.GOOGLE_API_KEY = originalKey;

  assert.equal(response.status, 500);
  assert.equal(called, false);
  assert.deepEqual(await response.json(), { error: 'GOOGLE_API_KEY is not configured' });
});

test('handleGenerateRequest should reject invalid payloads and hostile origins', async () => {
  const invalidPayload = await handleGenerateRequest(makeGenerateRequest({
    destination: '',
    vibes: [],
  }));

  const hostileOrigin = await handleGenerateRequest(makeGenerateRequest({
    destination: 'Goa',
    vibes: ['beach'],
  }, {
    origin: 'http://attacker.local',
    host: 'localhost:3000',
  }));

  assert.equal(invalidPayload.status, 400);
  assert.equal(hostileOrigin.status, 403);
});

test('handleGenerateRequest should return 500 when Gemini generation fails', async () => {
  const response = await handleGenerateRequest(makeGenerateRequest({
    destination: 'Goa',
    vibes: ['beach'],
  }), {
    getModelImpl: () => ({
      generateContentStream: async () => {
        throw new Error('Gemini unavailable');
      },
    }),
  });
  const body = await response.json();

  assert.equal(response.status, 500);
  assert.match(body.error, /Gemini unavailable/);
});
