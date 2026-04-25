import { z } from 'zod';
import { hashPassword, signAuthToken } from '@/lib/auth';
import { noStoreResponse, rateLimit, rejectCrossOrigin } from '@/lib/request-security';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/lib/schema';

const RegisterSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[a-z]/, 'Password must include a lowercase letter')
    .regex(/[A-Z]/, 'Password must include an uppercase letter')
    .regex(/\d/, 'Password must include a number')
    .regex(/[^A-Za-z0-9]/, 'Password must include a symbol'),
});

export async function POST(req) {
  try {
    const originError = rejectCrossOrigin(req);
    if (originError) return originError;

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const limit = rateLimit(`register:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 });
    if (!limit.allowed) {
      return noStoreResponse(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      );
    }

    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return noStoreResponse({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();
    const passwordHash = await hashPassword(password);

    await connectDB();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return noStoreResponse({ error: 'Email already registered' }, { status: 409 });
    }

    const user = await User.create({
      email: normalizedEmail,
      password_hash: passwordHash,
    });

    const token = signAuthToken(user);

    return noStoreResponse({ success: true, token });
  } catch (error) {
    console.error('[Register] ERROR:', error.message);
    return noStoreResponse({ error: 'Failed to register' }, { status: 500 });
  }
}
