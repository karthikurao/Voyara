import { NextResponse } from 'next/server';
import { z } from 'zod';
import { hashPassword, signAuthToken } from '@/lib/auth';
import { neonQuery } from '@/lib/db';
import { ensureCoreSchema } from '@/lib/schema';

const RegisterSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(req) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const passwordHash = await hashPassword(password);

    await ensureCoreSchema();

    const insertRows = await neonQuery(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email.toLowerCase(), passwordHash]
    );

    const user = insertRows[0];
    const token = signAuthToken(user);

    return NextResponse.json({ success: true, token });
  } catch (error) {
    if (error?.message?.includes('duplicate key value')) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    console.error('Registration failed:', error);
    return NextResponse.json({ error: 'Failed to register' }, { status: 500 });
  }
}
