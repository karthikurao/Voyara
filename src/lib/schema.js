import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

// ✅ USER SCHEMA (MISSING BEFORE → NOW FIXED)
const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password_hash: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// ✅ ITINERARY SCHEMA
const itinerarySchema = new Schema({
  user_id: {
    type: String,
    required: true,
  },
  destination: {
    type: String,
    required: true,
  },
  itinerary_data: {
    type: Schema.Types.Mixed,
    required: true,
  },
  context: {
    type: Schema.Types.Mixed,
  },
  metadata: {
    type: Schema.Types.Mixed,
  },
  is_public: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

// ✅ SHARE SCHEMA
const shareSchema = new Schema({
  itinerary_id: {
    type: Schema.Types.ObjectId,
    ref: "Itinerary",
    required: true,
  },
  user_id: {
    type: String,
    required: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  expires_at: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
  revoked: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// ✅ EXPORT MODELS (IMPORTANT)
export const User =
  models.User || model("User", userSchema);

export const Itinerary =
  models.Itinerary || model("Itinerary", itinerarySchema);

export const Share =
  models.Share || model("Share", shareSchema);

export default {
  User,
  Itinerary,
  Share,
};