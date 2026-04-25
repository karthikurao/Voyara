import mongoose from "mongoose";

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  const mongodbUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/voyara";

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(mongodbUri, {
      maxPoolSize: 10,
      minPoolSize: 5,
    }).then((conn) => {
      return conn;
    }).catch((err) => {
      console.error('[MongoDB] Connection failed:', err.message);
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    console.error('[MongoDB] Failed to establish connection:', err.message);
    cached.promise = null;
    throw err;
  }
}
