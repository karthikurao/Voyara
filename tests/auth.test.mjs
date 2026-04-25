import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

const STRONG_SECRET = 'test-secret-with-more-than-32-characters';
const auth = await import('../src/lib/auth.js');

function setAuthEnv(secret = STRONG_SECRET) {
  process.env.AUTH_SECRET = secret;
  process.env.AUTH_ISSUER = 'voyara';
  process.env.AUTH_AUDIENCE = 'voyara-web';
}

function requestWithAuthorization(value) {
  return {
    headers: new Headers(value ? { authorization: value } : {}),
  };
}

test('signAuthToken should issue a verifiable HS256 token with expected claims', async () => {
  setAuthEnv();

  const token = auth.signAuthToken({ _id: 123, email: 'user@example.com' });
  const payload = await auth.verifyAuthJWT(token);

  assert.equal(payload.sub, '123');
  assert.equal(payload.email, 'user@example.com');
  assert.equal(payload.iss, 'voyara');
  assert.equal(payload.aud, 'voyara-web');
});

test('verifyAuthJWT should reject missing, malformed, wrong-secret, and wrong-algorithm tokens', async () => {
  setAuthEnv();
  const wrongSecretToken = jwt.sign(
    { sub: '123', email: 'user@example.com' },
    'different-secret-with-more-than-32-chars',
    { algorithm: 'HS256', issuer: 'voyara', audience: 'voyara-web' }
  );
  const wrongAlgorithmToken = jwt.sign(
    { sub: '123', email: 'user@example.com' },
    STRONG_SECRET,
    { algorithm: 'HS384', issuer: 'voyara', audience: 'voyara-web' }
  );

  assert.equal(await auth.verifyAuthJWT(null), null);
  assert.equal(await auth.verifyAuthJWT(undefined), null);
  assert.equal(await auth.verifyAuthJWT({ token: 'not a string' }), null);
  assert.equal(await auth.verifyAuthJWT('not.a.jwt'), null);
  assert.equal(await auth.verifyAuthJWT(wrongSecretToken), null);
  assert.equal(await auth.verifyAuthJWT(wrongAlgorithmToken), null);
});

test('verifyAuthJWT should reject tokens missing required claims', async () => {
  setAuthEnv();
  const noEmailToken = jwt.sign(
    { sub: '123' },
    STRONG_SECRET,
    { algorithm: 'HS256', issuer: 'voyara', audience: 'voyara-web' }
  );

  assert.equal(await auth.verifyAuthJWT(noEmailToken), null);
});

test('signAuthToken should fail closed when AUTH_SECRET is weak', async () => {
  setAuthEnv('short-secret');

  assert.throws(
    () => auth.signAuthToken({ _id: '1', email: 'user@example.com' }),
    /AUTH_SECRET must be at least 32 characters/
  );
  assert.equal(await auth.verifyAuthJWT('anything'), null);
});

test('signAuthToken and verifyAuthJWT should fail closed when AUTH_SECRET is missing', async () => {
  delete process.env.AUTH_SECRET;
  process.env.AUTH_ISSUER = 'voyara';
  process.env.AUTH_AUDIENCE = 'voyara-web';

  assert.throws(
    () => auth.signAuthToken({ _id: '1', email: 'user@example.com' }),
    /AUTH_SECRET is not configured/
  );
  assert.equal(await auth.verifyAuthJWT('anything'), null);
});

test('hashPassword and verifyPassword should verify only the original password', async () => {
  setAuthEnv();
  const hash = await auth.hashPassword('Correct Horse Battery Staple!');

  assert.equal(await auth.verifyPassword('Correct Horse Battery Staple!', hash), true);
  assert.equal(await auth.verifyPassword('wrong password', hash), false);
});

test('extractBearerToken should only accept a strict Bearer token header', async () => {
  setAuthEnv();

  assert.equal(auth.extractBearerToken(requestWithAuthorization('Bearer abc.def.ghi')), 'abc.def.ghi');
  assert.equal(auth.extractBearerToken(requestWithAuthorization('bearer token_123')), 'token_123');
  assert.equal(auth.extractBearerToken(requestWithAuthorization('Basic abc.def.ghi')), null);
  assert.equal(auth.extractBearerToken(requestWithAuthorization('Bearer')), null);
  assert.equal(auth.extractBearerToken(requestWithAuthorization('Bearer abc def')), null);
  assert.equal(auth.extractBearerToken(requestWithAuthorization()), null);
});

test('authenticateRequest should verify the real bearer token and reject invalid requests', async () => {
  setAuthEnv();
  const token = auth.signAuthToken({ id: 'user-1', email: 'user@example.com' });

  const user = await auth.authenticateRequest(requestWithAuthorization(`Bearer ${token}`));

  assert.equal(user.sub, 'user-1');
  assert.equal(await auth.authenticateRequest(requestWithAuthorization('Bearer bad-token')), null);
  assert.equal(await auth.authenticateRequest(requestWithAuthorization()), null);
});
