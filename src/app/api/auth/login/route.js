import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/mongodb';
import { verifyPassword, signAuthToken } from '@/lib/auth';
import { User } from '@/lib/schema';

const LoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req) {
  try {
    console.log('[Login] POST request received');
    
    const body = await req.json();
    console.log('[Login] Body parsed:', { email: body.email, password: body.password ? 'provided' : 'missing' });
    
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      console.error('[Login] Validation failed:', parsed.error.flatten());
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
    }

    const { email, password } = parsed.data;
    console.log('[Login] Validated email:', email);
    
    console.log('[Login] Connecting to database...');
    await connectDB();
    console.log('[Login] Database connected');

    console.log('[Login] Searching for user...');
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.warn('[Login] User not found:', email);
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }
    console.log('[Login] User found with ID:', user._id);

    console.log('[Login] Verifying password...');
    const passwordMatches = await verifyPassword(password, user.password_hash);
    if (!passwordMatches) {
      console.warn('[Login] Password verification failed for user:', email);
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }
    console.log('[Login] Password verified successfully');

    console.log('[Login] Generating token...');
    const token = signAuthToken(user);
    console.log('[Login] Token generated successfully');
    
    console.log('[Login] Returning success response with token');
    return NextResponse.json({ success: true, token });
  } catch (error) {
    console.error('[Login] ERROR:', error.message);
    console.error('[Login] Stack:', error.stack);
    return NextResponse.json({ error: `Failed to log in: ${error.message}` }, { status: 500 });
  }
}
