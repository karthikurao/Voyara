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
    console.log('[Register] POST request received');
    
    const body = await req.json();
    console.log('[Register] Body parsed:', { email: body.email, password: body.password ? 'provided' : 'missing' });
    
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      console.error('[Register] Validation failed:', parsed.error.flatten());
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
    }

    const { email, password } = parsed.data;
    console.log('[Register] Validated email:', email);
    
    console.log('[Register] Hashing password...');
    const passwordHash = await hashPassword(password);
    console.log('[Register] Password hashed successfully');

    console.log('[Register] Connecting to database...');
    await connectDB();
    console.log('[Register] Database connected');

    console.log('[Register] Checking for existing user...');
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.warn('[Register] Email already registered:', email);
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }
    console.log('[Register] No existing user found, creating new user...');

    const user = await User.create({
      email: email.toLowerCase(),
      password_hash: passwordHash,
    });
    console.log('[Register] User created with ID:', user._id);

    console.log('[Register] Generating token...');
    const token = signAuthToken(user);
    console.log('[Register] Token generated successfully');

    console.log('[Register] Returning success response');
    return NextResponse.json({ success: true, token });
  } catch (error) {
    console.error('[Register] ERROR:', error.message);
    console.error('[Register] Stack:', error.stack);
    return NextResponse.json({ error: `Failed to register: ${error.message}` }, { status: 500 });
  }
}
