import dns from "node:dns";
import { NextRequest, NextResponse } from "next/server";
import mongoose, { type Connection, Types } from "mongoose";
import { permissionError, requirePermission } from "@Library/adminApiMiddleware";

const TOOL_ENABLED = process.env.NODE_ENV !== "production";
const SOURCE_URI = process.env.MONGODB_SOURCE_URI ?? process.env.MONGODB_01;
const TARGET_URI = process.env.MONGODB_TARGET_URI;
const DNS_SERVERS = (process.env.DB_SYNC_DNS_SERVERS ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

type SyncMode = "copy" | "sync";

interface SyncPayload {
    mode?: SyncMode;
    collections?: string[];
    clearTargetCollection?: boolean;
}

interface DatabaseStatus {
    label: "source" | "target";
    uri: string;
    connected: boolean;
    collections: string[];
    error?: string;
    hint?: string;
}

function ensureToolEnabled() {
    if (!TOOL_ENABLED) {
        return NextResponse.json(
            {
                success: false,
                error: "DB Sync tool is disabled in production"
            },
            { status: 404 }
        );
    }
    return null;
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function getConnectionHint(uri: string, error: unknown): string | undefined {
    const message = getErrorMessage(error);

    if (uri.startsWith("mongodb+srv://") && /querySrv|ECONNREFUSED|ENOTFOUND/i.test(message)) {
        return "SRV DNS lookup failed. Set DB_SYNC_DNS_SERVERS=1.1.1.1,8.8.8.8 or use Atlas standard mongodb:// connection string.";
    }

    if (/Authentication failed|bad auth|auth failed/i.test(message)) {
        return "Atlas credentials or auth source may be invalid. Check username/password in MONGODB_SOURCE_URI.";
    }

    return undefined;
}

function applyDnsOverride() {
    if (DNS_SERVERS.length > 0) {
        dns.setServers(DNS_SERVERS);
    }
}

function validateUris() {
    if (!SOURCE_URI || !TARGET_URI) {
        return NextResponse.json(
            {
                success: false,
                error: "MONGODB_SOURCE_URI/MONGODB_01 and MONGODB_TARGET_URI are required"
            },
            { status: 500 }
        );
    }
    return null;
}

async function getCollections(conn: Connection): Promise<string[]> {
    if (!conn.db) {
        throw new Error("Connection database is unavailable");
    }

    const collections = await conn.db.listCollections().toArray();
    return collections
        .map((entry) => entry.name)
        .filter((name) => !name.startsWith("system."))
        .sort();
}

async function inspectDatabase(label: "source" | "target", uri: string): Promise<DatabaseStatus> {
    let conn: Connection | null = null;

    try {
        conn = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 8000 }).asPromise();

        return {
            label,
            uri,
            connected: true,
            collections: await getCollections(conn)
        };
    } catch (error) {
        return {
            label,
            uri,
            connected: false,
            collections: [],
            error: getErrorMessage(error),
            hint: getConnectionHint(uri, error)
        };
    } finally {
        if (conn) {
            await conn.close();
        }
    }
}

async function connectPair(sourceUri: string, targetUri: string) {
    const sourceConn = await mongoose.createConnection(sourceUri, { serverSelectionTimeoutMS: 8000 }).asPromise();
    const targetConn = await mongoose.createConnection(targetUri, { serverSelectionTimeoutMS: 8000 }).asPromise();
    return { sourceConn, targetConn };
}

async function closePair(sourceConn: Connection, targetConn: Connection) {
    await Promise.all([sourceConn.close(), targetConn.close()]);
}

function toUniqueCollectionList(input: string[] | undefined): string[] {
    if (!input?.length) return [];
    return [...new Set(input.map((x) => String(x).trim()).filter(Boolean))];
}

function cloneDocWithoutId(doc: Record<string, unknown>) {
    const copy = { ...doc };
    delete copy._id;
    return copy;
}

async function syncCollection(options: {
    sourceConn: Connection;
    targetConn: Connection;
    collectionName: string;
    mode: SyncMode;
    clearTargetCollection: boolean;
}) {
    const { sourceConn, targetConn, collectionName, mode, clearTargetCollection } = options;

    if (!sourceConn.db || !targetConn.db) {
        throw new Error("Database connection is unavailable");
    }

    const source = sourceConn.db.collection(collectionName);
    const target = targetConn.db.collection(collectionName);
    const docs = await source.find({}).toArray();

    if (mode === "copy") {
        await target.deleteMany({});
        if (docs.length > 0) {
            await target.insertMany(docs, { ordered: false });
        }

        return {
            collection: collectionName,
            mode,
            sourceCount: docs.length,
            inserted: docs.length,
            upserted: 0,
            cleared: true
        };
    }

    if (clearTargetCollection) {
        await target.deleteMany({});
    }

    const operations = docs
        .filter((doc) => Boolean(doc._id))
        .map((doc) => {
            const record = doc as Record<string, unknown> & { _id: unknown };

            return {
                updateOne: {
                    filter: {
                        _id: record._id instanceof Types.ObjectId ? record._id : (record._id as any)
                    },
                    update: { $set: cloneDocWithoutId(record) },
                    upsert: true
                }
            };
        });

    if (operations.length === 0) {
        return {
            collection: collectionName,
            mode,
            sourceCount: docs.length,
            inserted: 0,
            upserted: 0,
            modified: 0,
            matched: 0,
            cleared: clearTargetCollection
        };
    }

    const result = await target.bulkWrite(operations, { ordered: false });

    return {
        collection: collectionName,
        mode,
        sourceCount: docs.length,
        inserted: result.insertedCount,
        upserted: result.upsertedCount,
        modified: result.modifiedCount,
        matched: result.matchedCount,
        cleared: clearTargetCollection
    };
}

export async function GET(req: NextRequest) {
    const disabled = ensureToolEnabled();
    if (disabled) return disabled;

    const auth = await requirePermission(req, "admin.site.settings");
    if (auth.error) {
        return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
    }

    const invalidUris = validateUris();
    if (invalidUris) return invalidUris;

    applyDnsOverride();

    const [source, target] = await Promise.all([
        inspectDatabase("source", SOURCE_URI as string),
        inspectDatabase("target", TARGET_URI as string)
    ]);

    const success = source.connected && target.connected;
    return NextResponse.json(
        {
            success,
            toolEnabled: true,
            source,
            target,
            sourceCollections: source.collections,
            targetCollections: target.collections
        },
        { status: success ? 200 : 503 }
    );
}

export async function POST(req: NextRequest) {
    const disabled = ensureToolEnabled();
    if (disabled) return disabled;

    const auth = await requirePermission(req, "admin.site.settings");
    if (auth.error) {
        return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
    }

    const invalidUris = validateUris();
    if (invalidUris) return invalidUris;

    let payload: SyncPayload;
    try {
        payload = (await req.json()) as SyncPayload;
    } catch {
        return NextResponse.json({ success: false, error: "Invalid JSON payload" }, { status: 400 });
    }

    const mode: SyncMode = payload.mode === "sync" ? "sync" : "copy";
    const requestedCollections = toUniqueCollectionList(payload.collections);
    const clearTargetCollection = Boolean(payload.clearTargetCollection);

    applyDnsOverride();

    let sourceConn: Connection | null = null;
    let targetConn: Connection | null = null;

    try {
        const pair = await connectPair(SOURCE_URI as string, TARGET_URI as string);
        sourceConn = pair.sourceConn;
        targetConn = pair.targetConn;

        const sourceCollections = await getCollections(sourceConn);
        const selectedCollections =
            requestedCollections.length > 0 ? sourceCollections.filter((name) => requestedCollections.includes(name)) : sourceCollections;

        const startedAt = Date.now();
        const results = [];

        for (const collectionName of selectedCollections) {
            const result = await syncCollection({
                sourceConn,
                targetConn,
                collectionName,
                mode,
                clearTargetCollection
            });
            results.push(result);
        }

        return NextResponse.json({
            success: true,
            mode,
            totalCollections: selectedCollections.length,
            durationMs: Date.now() - startedAt,
            results
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: getErrorMessage(error),
                hint: getConnectionHint(SOURCE_URI as string, error)
            },
            { status: 500 }
        );
    } finally {
        if (sourceConn && targetConn) {
            await closePair(sourceConn, targetConn);
        }
    }
}
