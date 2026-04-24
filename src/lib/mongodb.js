import mongoose from "mongoose";

// ===== MONGODB CONFIGURATION =====
console.log('═══════════════════════════════════════════════════════════');
console.log('🔗 MONGODB CONNECTION MODULE INITIALIZING');
console.log('═══════════════════════════════════════════════════════════');

const MONGODB_URI = process.env.MONGODB_URI;

console.log('[MongoDB] Initializing connection module');
console.log('[MongoDB] MONGODB_URI from env:', MONGODB_URI);
console.log('[MongoDB] Environment: NODE_ENV =', process.env.NODE_ENV || 'development');

if (!MONGODB_URI) {
  const errorMsg = "Please define MONGODB_URI in .env.local";
  console.error('[MongoDB] ERROR:', errorMsg);
  throw new Error(errorMsg);
}

console.log('[MongoDB] ✅ URI is set, proceeding with connection setup');
console.log('═══════════════════════════════════════════════════════════');

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
  console.log('[MongoDB] Initialized global mongoose cache');
}

export async function connectDB() {
  console.log('[MongoDB] connectDB() called');
  
  if (cached.conn) {
    console.log('[MongoDB] Using cached connection');
    return cached.conn;
  }

  if (!cached.promise) {
    console.log('[MongoDB] Creating new connection promise with URI:', MONGODB_URI);
    cached.promise = mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 5,
    }).then((conn) => {
      console.log('[MongoDB] Connection successful!');
      console.log('[MongoDB] Connected to:', conn.connection.host);
      return conn;
    }).catch((err) => {
      console.error('[MongoDB] Connection failed:', err.message);
      console.error('[MongoDB] Error code:', err.code);
      console.error('[MongoDB] Full error:', err);
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log('[MongoDB] Connection established and cached');
    return cached.conn;
  } catch (err) {
    console.error('[MongoDB] Failed to establish connection:', err.message);
    cached.promise = null;
    throw err;
  }
}