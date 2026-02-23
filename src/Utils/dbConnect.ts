import mongoose from "mongoose";

declare global {
    var mongoose: any;
}

const MONGODB_URI = process.env.MONGODB_01;

if (!MONGODB_URI) {
    throw new Error(
        "Please define the MONGODB_01 environment variable inside .env.local or .env"
    );
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            dbName: "PRODUCTION_MeetBhingradiya"
        };
        cached.promise = mongoose
            .connect(MONGODB_URI as string, opts)
            .then((mongoose) => {
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

function getMongoDbClient() {
    return cached.conn?.connection.getClient();
}

export { dbConnect, getMongoDbClient };
export default dbConnect;
