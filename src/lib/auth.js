import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const AUTH_SECRET = process.env.AUTH_SECRET;

if (!AUTH_SECRET) {
  console.warn('AUTH_SECRET is not set. Authentication routes will fail until it is configured.');
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function signAuthToken(user) {
  if (!AUTH_SECRET) {
    throw new Error('AUTH_SECRET is not configured');
  }

  const payload = {
    sub: user._id || user.id,
    email: user.email,
  };

  return jwt.sign(payload, AUTH_SECRET, { expiresIn: '7d' });
}

export async function verifyStackAuthJWT(token) {
  if (!token) {
    return null;
  }

  const allowDevAuthBypass =
    process.env.NODE_ENV === 'development' &&
    process.env.ALLOW_DEV_AUTH_BYPASS === 'true';

  if (allowDevAuthBypass) {
    console.warn('[Auth] Development auth bypass enabled - returning test user');
    return { sub: 'test-user-id', email: 'test@example.com' };
  }

  if (!AUTH_SECRET) {
    console.warn('[Auth] AUTH_SECRET is not configured - returning null');
    return null;
  }

  try {
    return jwt.verify(token, AUTH_SECRET);
  } catch (err) {
    console.warn('[Auth] JWT verification failed:', err.message);
    return null;
  }
}
