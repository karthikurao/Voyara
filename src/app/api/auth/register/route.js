import { NextResponse } from 'next/server';
import { z } from 'zod';
import { hashPassword, signAuthToken } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/lib/schema';

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

    await connectDB();

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const user = await User.create({
      email: email.toLowerCase(),
      password_hash: passwordHash,
    });

    const token = signAuthToken(user);

    return NextResponse.json({ success: true, token });
  } catch (error) {
    console.error('[Register] ERROR:', error.message);
    return NextResponse.json({ error: 'Failed to register' }, { status: 500 });
  }
}
