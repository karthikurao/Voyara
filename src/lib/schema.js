import { neonQuery } from './db';

// Ensures the core tables/extensions exist before performing mutations.
export async function ensureCoreSchema() {
  // Extension for UUID generation.
  await neonQuery('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  // Users table stores auth credentials.
  await neonQuery(`CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`);

  // Itineraries authored by users with optional metadata for insights.
  await neonQuery(`CREATE TABLE IF NOT EXISTS itineraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    destination TEXT NOT NULL,
    itinerary_data JSONB NOT NULL,
    context JSONB,
    metadata JSONB,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`);

  // Share tokens for public access with expiry support.
  await neonQuery(`CREATE TABLE IF NOT EXISTS shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`);
}
