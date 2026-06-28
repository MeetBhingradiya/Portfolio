import mongoose from "mongoose";
import { Config as SConfig } from "@Config/Server";
import { getMongoUris, requirePrimaryMongoUri } from "@Utils/mongoEnv";
import type { Collection, Db, Document } from "mongodb";

declare global {
    var mongoose: any;
}

const MONGODB_URIS = getMongoUris();
const MONGODB_URI = requirePrimaryMongoUri();

const cachedConnections: Record<string, { conn: mongoose.Connection | null; promise: Promise<mongoose.Connection> | null }> = {};

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function MultidbConnect(dbUri: string): Promise<mongoose.Connection> {
    if (cachedConnections[dbUri]?.conn) {
        return cachedConnections[dbUri].conn as mongoose.Connection;
    }

    if (!MONGODB_URIS.includes(dbUri)) {
        throw new Error(`Invalid database URI: ${dbUri}`);
    }

    if (!cachedConnections[dbUri]) {
        cachedConnections[dbUri] = { conn: null, promise: null };
    }

    if (!cachedConnections[dbUri].promise) {
        cachedConnections[dbUri].promise = mongoose.createConnection(dbUri, { bufferCommands: false }).asPromise();
    }

    try {
        cachedConnections[dbUri].conn = await cachedConnections[dbUri].promise;
    } catch (e) {
        cachedConnections[dbUri].promise = null;
        throw e;
    }

    return cachedConnections[dbUri].conn as mongoose.Connection;
}

async function dbConnect() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            dbName: SConfig.Database.Name,
            maxPoolSize: 2,
            maxIdleTimeMS: 10000,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };
        cached.promise = mongoose.connect(MONGODB_URI as string, opts).then((mongoose) => {
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

async function getMongoDatabase(): Promise<Db> {
    const connection = await dbConnect();
    const db = connection.connection.db;
    if (!db) {
        throw new Error("MongoDB database is unavailable");
    }
    return db;
}

async function getMongoCollection<TSchema extends Document = Document>(name: string): Promise<Collection<TSchema>> {
    const db = await getMongoDatabase();
    return db.collection<TSchema>(name);
}

function getMongoDbClient() {
    return cached.conn?.connection.getClient();
}

export { dbConnect, getMongoDbClient, getMongoCollection, getMongoDatabase, MultidbConnect, MONGODB_URIS };
export default dbConnect;
