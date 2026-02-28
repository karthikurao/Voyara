// MongoDB database layer - replaces Neon REST API
import { connectDB } from './dbConnection';
import { User, Itinerary, Share } from './mongoModels';

// Generic query function that handles MongoDB operations
export async function mongoQuery(collection, operation, ...args) {
  try {
    await connectDB();

    switch (collection.toLowerCase()) {
      case 'users':
        return await handleUserOperation(operation, args);
      case 'itineraries':
        return await handleItineraryOperation(operation, args);
      case 'shares':
        return await handleShareOperation(operation, args);
      default:
        throw new Error(`Unknown collection: ${collection}`);
    }
  } catch (error) {
    console.error(`MongoDB operation failed (${collection}.${operation}):`, error);
    throw new Error(`Database operation failed: ${error.message}`);
  }
}

// User operations
async function handleUserOperation(operation, args) {
  switch (operation) {
    case 'findByEmail':
      return await User.findOne({ email: args[0].toLowerCase() });
    case 'findById':
      return await User.findById(args[0]);
    case 'create':
      return await User.create(args[0]);
    case 'update':
      return await User.findByIdAndUpdate(args[0], args[1], { new: true });
    case 'delete':
      return await User.findByIdAndDelete(args[0]);
    default:
      throw new Error(`Unknown user operation: ${operation}`);
  }
}

// Itinerary operations
async function handleItineraryOperation(operation, args) {
  switch (operation) {
    case 'findById':
      return await Itinerary.findById(args[0]);
    case 'findByUserId':
      return await Itinerary.find({ user_id: args[0] });
    case 'create':
      return await Itinerary.create(args[0]);
    case 'update':
      return await Itinerary.findByIdAndUpdate(args[0], args[1], { new: true });
    case 'delete':
      return await Itinerary.findByIdAndDelete(args[0]);
    case 'togglePublic':
      return await Itinerary.findByIdAndUpdate(
        args[0],
        { is_public: args[1] },
        { new: true }
      );
    default:
      throw new Error(`Unknown itinerary operation: ${operation}`);
  }
}

// Share operations
async function handleShareOperation(operation, args) {
  switch (operation) {
    case 'findByToken':
      return await Share.findOne({ token: args[0] });
    case 'findByItineraryId':
      return await Share.find({ itinerary_id: args[0] });
    case 'create':
      return await Share.create(args[0]);
    case 'revokeByToken':
      return await Share.findOneAndUpdate(
        { token: args[0] },
        { revoked: true },
        { new: true }
      );
    case 'deleteByItineraryId':
      return await Share.deleteMany({ itinerary_id: args[0] });
    default:
      throw new Error(`Unknown share operation: ${operation}`);
  }
}

// Legacy neonQuery wrapper for backward compatibility with existing code
// This maps SQL-like calls to MongoDB operations
export async function neonQuery(query, params = []) {
  await connectDB();

  if (typeof query === 'string') {
    return await parseSQLAndExecute(query, params);
  }

  throw new Error('Query object format not supported in MongoDB mode');
}

// Parse SQL and convert to MongoDB operations
async function parseSQLAndExecute(sql, params) {
  const upperSql = sql.toUpperCase().trim();

  // SELECT from users
  if (upperSql.includes('FROM users WHERE email')) {
    const email = params[0];
    const user = await User.findOne({ email: email.toLowerCase() });
    return user ? [{ id: user._id, email: user.email, password_hash: user.password_hash }] : [];
  }

  if (upperSql.includes('SELECT id, email, password_hash FROM users WHERE email')) {
    const email = params[0];
    const user = await User.findOne({ email: email.toLowerCase() });
    return user ? [{ id: user._id, email: user.email, password_hash: user.password_hash }] : [];
  }

  // INSERT into users
  if (upperSql.includes('INSERT INTO users')) {
    const [email, passwordHash] = params;
    const user = await User.create({ email: email.toLowerCase(), password_hash: passwordHash });
    return { id: user._id, email: user.email };
  }

  // SELECT from itineraries
  if (upperSql.includes('SELECT * FROM itineraries WHERE id')) {
    const itinerary = await Itinerary.findById(params[0]);
    return itinerary ? [itinerary.toObject()] : [];
  }

  if (upperSql.includes('SELECT id, user_id FROM itineraries WHERE id')) {
    const itinerary = await Itinerary.findById(params[0]);
    return itinerary ? [{ id: itinerary._id, user_id: itinerary.user_id }] : [];
  }

  // INSERT into itineraries
  if (upperSql.includes('INSERT INTO itineraries')) {
    const obj = createObjectFromInsertParams(params);
    const itinerary = await Itinerary.create(obj);
    return { id: itinerary._id };
  }

  // UPDATE itineraries
  if (upperSql.includes('UPDATE itineraries SET')) {
    const itineraryId = params[params.length - 1];
    const updateData = extractUpdateData(sql, params);
    const updated = await Itinerary.findByIdAndUpdate(itineraryId, updateData, { new: true });
    return updated ? [updated.toObject()] : [];
  }

  // DELETE from itineraries
  if (upperSql.includes('DELETE FROM itineraries WHERE id')) {
    await Itinerary.findByIdAndDelete(params[0]);
    return { success: true };
  }

  // SELECT from shares
  if (upperSql.includes('SELECT * FROM shares WHERE itinerary_id')) {
    const shares = await Share.find({ itinerary_id: params[0] });
    return shares.map(s => s.toObject());
  }

  if (upperSql.includes('SELECT token FROM shares WHERE itinerary_id')) {
    const shares = await Share.find({ itinerary_id: params[0], revoked: false });
    return shares.map(s => ({ token: s.token }));
  }

  // INSERT into shares
  if (upperSql.includes('INSERT INTO shares')) {
    const obj = createObjectFromInsertParams(params);
    const share = await Share.create(obj);
    return { token: share.token };
  }

  // UPDATE shares (revoke)
  if (upperSql.includes('UPDATE shares SET revoked')) {
    const updated = await Share.findOneAndUpdate(
      { token: params[0], user_id: params[1] },
      { revoked: true },
      { new: true }
    );
    return [];
  }

  // SELECT from itineraries for list
  if (upperSql.includes('SELECT * FROM itineraries WHERE user_id')) {
    const itineraries = await Itinerary.find({ user_id: params[0] });
    return itineraries.map(i => i.toObject());
  }

  // Handle CREATE TABLE statements (no-op in MongoDB)
  if (upperSql.includes('CREATE EXTENSION') || upperSql.includes('CREATE TABLE')) {
    return [];
  }

  throw new Error(`Unsupported SQL query: ${sql}`);
}

function createObjectFromInsertParams(params) {
  const obj = {};
  if (params.length >= 2 && typeof params[0] === 'string') {
    const keys = extractKeys(params[0]);
    keys.forEach((key, idx) => {
      obj[key] = params[idx + 1];
    });
  }
  return obj;
}

function extractKeys(str) {
  if (str && str.includes(',')) {
    return str.split(',').map(k => k.trim());
  }
  return [];
}

function extractUpdateData(sql, params) {
  const updateData = {};
  const setClause = sql.match(/SET\s+(.+?)\s+WHERE/i);
  if (setClause) {
    const fields = setClause[1].split(',').map(f => f.trim());
    fields.forEach((field, idx) => {
      const key = field.replace(/\s*=\s*\$\d+/, '').trim();
      updateData[key] = params[idx];
    });
  }
  return updateData;
}
