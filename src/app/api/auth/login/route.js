import { NextResponse } from 'next/server';
import { z } from 'zod';
import { neonQuery } from '@/lib/db';
import { verifyPassword, signAuthToken } from '@/lib/auth';

const LoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const users = await neonQuery('SELECT id, email, password_hash FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = users[0];
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const passwordMatches = await verifyPassword(password, user.password_hash);
    if (!passwordMatches) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = signAuthToken(user);
    return NextResponse.json({ success: true, token });
  } catch (error) {
    console.error('Login failed:', error);
    return NextResponse.json({ error: 'Failed to log in' }, { status: 500 });
  }
}
