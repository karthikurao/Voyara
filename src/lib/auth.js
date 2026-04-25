import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const MIN_SECRET_LENGTH = 32;

function getAuthSecret() {
  const authSecret = process.env.AUTH_SECRET;

  if (!authSecret) {
    throw new Error('AUTH_SECRET is not configured');
  }

  if (authSecret.length < MIN_SECRET_LENGTH) {
    throw new Error(`AUTH_SECRET must be at least ${MIN_SECRET_LENGTH} characters`);
  }

  return authSecret;
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function signAuthToken(user) {
  const secret = getAuthSecret();

  const payload = {
    sub: String(user._id || user.id),
    email: user.email,
  };

  return jwt.sign(payload, secret, {
    algorithm: 'HS256',
    expiresIn: '7d',
    issuer: process.env.AUTH_ISSUER || 'voyara',
    audience: process.env.AUTH_AUDIENCE || 'voyara-web',
  });
}

export function extractBearerToken(req) {
  const authHeader = req.headers.get('authorization') || '';
  const match = authHeader.match(/^Bearer\s+([A-Za-z0-9._~-]+)$/i);
  return match ? match[1] : null;
}

export async function verifyAuthJWT(token) {
  if (!token || typeof token !== 'string') {
    return null;
  }

  let secret;
  try {
    secret = getAuthSecret();
  } catch (err) {
    console.error('[Auth] Server auth configuration error:', err.message);
    return null;
  }

  try {
    const payload = jwt.verify(token, secret, {
      algorithms: ['HS256'],
      issuer: process.env.AUTH_ISSUER || 'voyara',
      audience: process.env.AUTH_AUDIENCE || 'voyara-web',
      clockTolerance: 5,
    });

    if (!payload?.sub || !payload?.email) {
      return null;
    }

    return payload;
  } catch (err) {
    console.warn('[Auth] JWT verification failed:', err.message);
    return null;
  }
}

export const verifyStackAuthJWT = verifyAuthJWT;

export async function authenticateRequest(req) {
  const token = extractBearerToken(req);
  if (!token) {
    return null;
  }

  return verifyAuthJWT(token);
}
