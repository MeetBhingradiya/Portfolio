/**
 *  @FileID          Utils/dbConnect.ts
 *  @Description     Currently, there is no description available.
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------  
 *  @license
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, forks, or modification of this file,
 *  via any medium even in public/private repository, is strictly prohibited without
 *  prior written consent from the author, modifier, or the organization.
 *  
 *  -----------------------------------------------------------------------------  
 *  GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is hosted on GitHub, which is a repository hosting service provided by Microsoft. 
 *  This project is not officially affiliated with, endorsed by, or in any way associated 
 *  with GitHub or Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------  
 *  Last Updated on Version: 1.1.0
 *  -----------------------------------------------------------------------------  
 *  @created 13/05/25 12:05 PM IST (Kolkata +5:30 UTC)
 *  @modified 13/05/25 12:05 PM IST (Kolkata +5:30 UTC)
 */

import mongoose from "mongoose";
import { getEnvs } from "./getEnvs";

declare global {
    var mongoose: any;
    var mongooseConnections: any;
}

const MONGODB_URIs = getEnvs("MONGODB_");

if (!MONGODB_URIs.length) {
    throw new Error("Please define at least one `MONGODB_` environment variable inside .env.local or .env");
}

const cachedConnections: Record<string, {
    conn: mongoose.Connection | null
    promise: Promise<mongoose.Connection> | null
}> = {};

async function MultidbConnect(dbUri: string): Promise<mongoose.Connection> {
    if (cachedConnections[dbUri]?.conn) {
        return cachedConnections[dbUri].conn!;
    }

    if (!MONGODB_URIs.includes(dbUri)) {
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

// ? OLD Single Connection Setup
const MONGODB_URI = MONGODB_URIs[0];

if (!MONGODB_URI) {
    throw new Error(
        "Please define the `MONGODB_` environment variables inside .env.local or .env",
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

function getMongoDbClient() {
    return cached.conn?.connection.getClient();
}

export default dbConnect;
export {
    dbConnect,
    getMongoDbClient,
    MultidbConnect,
    MONGODB_URIs
}