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

  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    AUTH_SECRET,
    { expiresIn: '7d' }
  );
}

export async function verifyStackAuthJWT(token) {
  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, AUTH_SECRET);
  } catch (err) {
    return null;
  }
}
