// Basic integration tests for Neon itinerary API routes with JWT auth
import { describe, it, expect } from 'vitest';

const jwt = process.env.TEST_AUTH_TOKEN;
if (!jwt) {
  throw new Error('TEST_AUTH_TOKEN env variable is required to run these tests.');
}
const headers = { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' };

const testItinerary = {
  destination: 'Testville',
  itinerary_data: {
    itinerary: [
      { day: 'Day 1', timeline: [{ time: '9:00 AM', activity: 'Test', description: 'Test desc' }], food_suggestion: { name: 'Test Food', description: 'Yum' } }
    ]
  }
};

let createdId = null;

describe('Itinerary CRUD API', () => {
  it('should save a new itinerary', async () => {
    const res = await fetch('http://localhost:3000/api/itineraries/save', {
      method: 'POST', headers, body: JSON.stringify(testItinerary)
    });
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.id).toBeDefined();
    createdId = data.id;
  });

  it('should list itineraries', async () => {
    const res = await fetch('http://localhost:3000/api/itineraries/list', { method: 'GET', headers });
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(Array.isArray(data.itineraries)).toBe(true);
  });

  it('should update an itinerary', async () => {
    const res = await fetch('http://localhost:3000/api/itineraries/update', {
      method: 'POST', headers, body: JSON.stringify({ id: createdId, destination: 'Testville Updated', itinerary_data: testItinerary.itinerary_data })
    });
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it('should duplicate an itinerary', async () => {
    const res = await fetch('http://localhost:3000/api/itineraries/duplicate', {
      method: 'POST', headers, body: JSON.stringify({ id: createdId })
    });
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.newId).toBeDefined();
  });

  it('should toggle public status', async () => {
    const res = await fetch('http://localhost:3000/api/itineraries/toggle-public', {
      method: 'POST', headers, body: JSON.stringify({ id: createdId, is_public: true })
    });
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it('should delete an itinerary', async () => {
    const res = await fetch('http://localhost:3000/api/itineraries/delete', {
      method: 'POST', headers, body: JSON.stringify({ id: createdId })
    });
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});
