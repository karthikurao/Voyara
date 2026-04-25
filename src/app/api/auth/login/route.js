import { z } from 'zod';
import { connectDB } from '@/lib/mongodb';
import { verifyPassword, signAuthToken } from '@/lib/auth';
import { noStoreResponse, rateLimit, rejectCrossOrigin } from '@/lib/request-security';
import { User } from '@/lib/schema';

const LoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req) {
  try {
    const originError = rejectCrossOrigin(req);
    if (originError) return originError;

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const limit = rateLimit(`login:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
    if (!limit.allowed) {
      return noStoreResponse(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      );
    }

    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return noStoreResponse({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    await connectDB();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      await verifyPassword(password, '$2a$12$XfcqTycIt.YeUiswlTFApedWd6JgXnTiySEMTkJyyPuT1NEm3xHtm');
      return noStoreResponse({ error: 'Invalid email or password' }, { status: 401 });
    }

    const passwordMatches = await verifyPassword(password, user.password_hash);
    if (!passwordMatches) {
      return noStoreResponse({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = signAuthToken(user);
    return noStoreResponse({ success: true, token });
  } catch (error) {
    console.error('[Login] ERROR:', error.message);
    return noStoreResponse({ error: 'Failed to log in' }, { status: 500 });
  }
}
