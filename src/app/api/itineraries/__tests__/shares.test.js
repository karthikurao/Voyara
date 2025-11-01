// Basic integration tests for Neon shares API routes with JWT auth
import { describe, it, expect } from 'vitest';

const jwt = process.env.TEST_AUTH_TOKEN;
if (!jwt) {
  throw new Error('TEST_AUTH_TOKEN env variable is required to run these tests.');
}
const headers = { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' };

let testItineraryId = null;
let testToken = null;

describe('Itinerary Shares API', () => {
  it('should list shares for an itinerary', async () => {
    // You must set testItineraryId to a valid itinerary ID for your test user
    const res = await fetch(`http://localhost:3000/api/itineraries/shares?id=${testItineraryId}`, { method: 'GET', headers });
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(Array.isArray(data.shares)).toBe(true);
    if (data.shares.length > 0) testToken = data.shares[0].token;
  });

  it('should revoke a share token', async () => {
    if (!testToken) return;
    const res = await fetch('http://localhost:3000/api/itineraries/shares', {
      method: 'POST', headers, body: JSON.stringify({ token: testToken })
    });
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});
