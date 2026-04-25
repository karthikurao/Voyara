import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mongoIdSchema,
  noStoreResponse,
  rateLimit,
  readJsonBody,
  rejectCrossOrigin,
} from '../src/lib/request-security.js';

function request(headers = {}, body = '') {
  return new Request('http://example.com/api/test', {
    method: body ? 'POST' : 'GET',
    headers,
    body: body || undefined,
  });
}

test('rejectCrossOrigin should allow missing or matching origin and reject hostile origins', async () => {
  assert.equal(rejectCrossOrigin(request()), null);
  assert.equal(rejectCrossOrigin(request({ origin: 'https://example.com', host: 'example.com' })), null);

  const suffixAttack = rejectCrossOrigin(request({ origin: 'https://evil-example.com', host: 'example.com' }));
  assert.equal(suffixAttack.status, 403);

  const malformed = rejectCrossOrigin(request({ origin: 'not a url', host: 'example.com' }));
  assert.equal(malformed.status, 403);

  const missingHost = rejectCrossOrigin(request({ origin: 'https://example.com' }));
  assert.equal(missingHost.status, 400);
});

test('readJsonBody should parse valid JSON and reject invalid or oversized payloads', async () => {
  const valid = await readJsonBody(request({ 'content-type': 'application/json' }, '{"ok":true}'));
  assert.deepEqual(valid.data, { ok: true });

  const invalid = await readJsonBody(request({ 'content-type': 'application/json' }, '{bad json'));
  assert.equal(invalid.error.status, 400);

  const oversized = await readJsonBody(request({}, '{"long":true}'), 4);
  assert.equal(oversized.error.status, 413);
});

test('noStoreResponse should disable caching for sensitive responses', () => {
  const response = noStoreResponse({ token: 'secret' });

  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('rateLimit should allow requests until the configured limit is exceeded', () => {
  const key = `test:${Date.now()}:${Math.random()}`;

  assert.equal(rateLimit(key, { limit: 2, windowMs: 60_000 }).allowed, true);
  assert.equal(rateLimit(key, { limit: 2, windowMs: 60_000 }).allowed, true);
  const blocked = rateLimit(key, { limit: 2, windowMs: 60_000 });

  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSeconds > 0);
});

test('mongoIdSchema should validate only 24-character hex ids', () => {
  assert.equal(mongoIdSchema.test('507f1f77bcf86cd799439011'), true);
  assert.equal(mongoIdSchema.test('507f1f77bcf86cd79943901z'), false);
  assert.equal(mongoIdSchema.test('short'), false);
});
