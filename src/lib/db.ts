import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";

if (!MONGODB_URI) {
  // Do not throw at import time; routes will error if missing
  console.warn("MONGODB_URI is not set");
}

type MongooseCache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const globalForMongoose = global as unknown as { __mongooseCache?: MongooseCache };
const cached: MongooseCache = globalForMongoose.__mongooseCache ?? { conn: null, promise: null };
if (!globalForMongoose.__mongooseCache) {
  globalForMongoose.__mongooseCache = cached;
}

export async function connectToDatabase() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      dbName: process.env.MONGODB_DB || undefined,
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}


