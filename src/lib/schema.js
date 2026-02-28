import { connectDB } from './db';

// Ensures MongoDB connection is established
export async function ensureCoreSchema() {
  try {
    await connectDB();
    console.log('MongoDB connection established and ready');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}
