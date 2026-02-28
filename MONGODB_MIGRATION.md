# MongoDB Migration Guide

This document describes the migration from Neon (PostgreSQL) to MongoDB.

## Changes Made

### 1. Database Layer Files
- **`src/lib/db.js`** - Completely rewritten to use MongoDB with Mongoose
- **`src/lib/schema.js`** - Updated to work with MongoDB (no table creation needed)
- **`src/lib/mongoModels.js`** - New file containing Mongoose schemas for Users, Itineraries, and Shares
- **`src/lib/dbConnection.js`** - New file for MongoDB connection management

### 2. Dependencies
- Added `mongoose@^8.0.0` to package.json for MongoDB ODM

### 3. Environment Configuration
- `.env.local` updated to use `MONGODB_URI` instead of `NEON_API_URL` and `NEON_API_KEY`
- `env.example` updated with MongoDB configuration template

## Setup Instructions

### Step 1: Get a MongoDB Connection String

Choose one of the following options:

#### Option A: MongoDB Atlas (Cloud - Recommended)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster
4. Click "Connect" and select "Drivers"
5. Copy the connection string (e.g., `mongodb+srv://username:password@cluster-name.mongodb.net/voyara?retryWrites=true&w=majority`)
6. Replace `<password>` with your database user password
7. Save this connection string

#### Option B: MongoDB Community Edition (Local)
1. Install MongoDB from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
2. Start the MongoDB service
3. Use connection string: `mongodb://localhost:27017/voyara`

### Step 2: Update Environment Variables
Edit `.env.local` and update:
```env
MONGODB_URI="your-mongodb-connection-string-here"
```

### Step 3: Start the Application
```bash
npm run dev
```

The application will automatically connect to MongoDB on first request.

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique, lowercase),
  password_hash: String,
  created_at: Date,
  updated_at: Date
}
```

### Itineraries Collection
```javascript
{
  _id: ObjectId,
  user_id: ObjectId (ref: User),
  destination: String,
  itinerary_data: {}, // JSON object
  context: {}, // Optional JSON
  metadata: {}, // Optional JSON
  is_public: Boolean,
  created_at: Date,
  updated_at: Date
}
```

### Shares Collection
```javascript
{
  _id: ObjectId,
  itinerary_id: ObjectId (ref: Itinerary),
  user_id: ObjectId (ref: User),
  token: String (unique),
  expires_at: Date,
  revoked: Boolean,
  created_at: Date
}
```

## Backward Compatibility

The `neonQuery()` function has been kept for backward compatibility. It now:
- Accepts SQL-like queries (as before)
- Automatically converts them to MongoDB operations
- Returns results in the same format as the original API

All existing API routes continue to work without modification.

## Important Notes

1. **MongoDB Atlas Restrictions**: If using MongoDB Atlas, you may need to:
   - Add your IP address to the IP whitelist
   - Use the correct connection string format
   - Ensure the database user has appropriate permissions

2. **Data Migration**: If you have existing data in Neon, you'll need to manually migrate it to MongoDB. Contact support if you need help with this.

3. **Testing**: All existing test files should continue to work, but they may need updates if they rely on specific PostgreSQL behavior.

## Troubleshooting

### Connection Error: "MONGODB_URI is not set"
- Ensure `.env.local` contains the `MONGODB_URI` variable
- Restart the development server after updating environment variables

### Connection Timeout
- Check your internet connection
- If using MongoDB Atlas, verify your IP is whitelisted
- Check that the connection string is correct

### "Cannot find module mongoose"
```bash
npm install mongoose
```

## Reverting to Neon

If you need to go back to Neon:
1. Switch back to the `main` branch: `git checkout main`
2. The original Neon configuration will be restored
