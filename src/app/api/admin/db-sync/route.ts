import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { permissionError, requirePermission } from "@Library/adminApiMiddleware";

type SyncMode = "upsert" | "replace";

interface SyncConfig {
    sourceUri: string;
    targetUri: string;
    sourceDbName: string;
    targetDbName: string;
}

function isDbSyncEnabled(): boolean {
    const override = (process.env.ADMIN_DB_SYNC_ENABLED || "").trim().toLowerCase();
    if (override === "true" || override === "1" || override === "yes") return true;
    if (process.env.NODE_ENV === "production") return false;
    return true;
}

function ensureDbSyncEnabled() {
    if (!isDbSyncEnabled()) {
        return NextResponse.json(
            {
                success: false,
                error: "DB sync is disabled in this environment.",
            },
            { status: 403 }
        );
    }
    return null;
}

function getSyncConfig(): SyncConfig {
    const sourceUri =
        process.env.MONGODB_ATLAS_URI?.trim() ||
        process.env.MONGODB_SOURCE_URI?.trim() ||
        process.env.MONGODB_01?.trim() ||
        "";

    const targetUri =
        process.env.MONGODB_LOCAL_URI?.trim() ||
        process.env.MONGODB_TARGET_URI?.trim() ||
        "mongodb://127.0.0.1:27017";

    const sourceDbName =
        process.env.MONGODB_ATLAS_DB?.trim() ||
        process.env.MONGODB_SOURCE_DB?.trim() ||
        "PRODUCTION_MeetBhingradiya";

    const targetDbName =
        process.env.MONGODB_LOCAL_DB?.trim() ||
        process.env.MONGODB_TARGET_DB?.trim() ||
        sourceDbName;

    if (!sourceUri) {
        throw new Error("Missing source Mongo URI. Set MONGODB_ATLAS_URI or MONGODB_SOURCE_URI.");
    }

    if (!targetUri) {
        throw new Error("Missing target Mongo URI. Set MONGODB_LOCAL_URI or MONGODB_TARGET_URI.");
    }

    if (sourceUri === targetUri && sourceDbName === targetDbName) {
        throw new Error("Source and target MongoDB are identical. Refusing to sync.");
    }

    return { sourceUri, targetUri, sourceDbName, targetDbName };
}

function isAllowedCollection(name: string): boolean {
    return !!name && !name.startsWith("system.");
}

export async function GET(req: NextRequest) {
    try {
        const blocked = ensureDbSyncEnabled();
        if (blocked) return blocked;

        const auth = await requirePermission(req, "admin.site.settings");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");

        const cfg = getSyncConfig();
        const sourceClient = new MongoClient(cfg.sourceUri);

        try {
            await sourceClient.connect();
            const sourceDb = sourceClient.db(cfg.sourceDbName);
            const collections = (await sourceDb.listCollections({}, { nameOnly: true }).toArray())
                .map((c) => c.name)
                .filter(isAllowedCollection)
                .sort((a, b) => a.localeCompare(b));

            return NextResponse.json({
                success: true,
                sourceDb: cfg.sourceDbName,
                targetDb: cfg.targetDbName,
                collections,
            });
        } finally {
            await sourceClient.close();
        }
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err?.message || "Failed to load collections" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const blocked = ensureDbSyncEnabled();
        if (blocked) return blocked;

        const auth = await requirePermission(req, "admin.site.settings");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");

        const body = await req.json();
        const requestedCollections = Array.isArray(body?.collections) ? body.collections.filter((c: unknown) => typeof c === "string") : [];
        const mode: SyncMode = body?.mode === "replace" ? "replace" : "upsert";
        const clearTarget = body?.clearTarget === true;
        const batchSize = Math.min(500, Math.max(50, Number(body?.batchSize) || 200));

        const cfg = getSyncConfig();
        const sourceClient = new MongoClient(cfg.sourceUri);
        const targetClient = new MongoClient(cfg.targetUri);

        try {
            await Promise.all([sourceClient.connect(), targetClient.connect()]);

            const sourceDb = sourceClient.db(cfg.sourceDbName);
            const targetDb = targetClient.db(cfg.targetDbName);

            const allCollections = (await sourceDb.listCollections({}, { nameOnly: true }).toArray())
                .map((c) => c.name)
                .filter(isAllowedCollection);

            const collections = requestedCollections.length
                ? allCollections.filter((name) => requestedCollections.includes(name))
                : allCollections;

            if (collections.length === 0) {
                return NextResponse.json({ success: false, error: "No valid collections selected" }, { status: 400 });
            }

            const results: Array<{
                collection: string;
                sourceCount: number;
                targetCountBefore: number;
                targetCountAfter: number;
                inserted: number;
                updated: number;
                durationMs: number;
                mode: SyncMode;
            }> = [];

            for (const name of collections) {
                const started = Date.now();
                const sourceCol = sourceDb.collection(name);
                const targetCol = targetDb.collection(name);

                const sourceCount = await sourceCol.countDocuments({});
                const targetCountBefore = await targetCol.countDocuments({});

                if (clearTarget || mode === "replace") {
                    await targetCol.deleteMany({});
                }

                let inserted = 0;
                let updated = 0;

                if (mode === "replace" || clearTarget) {
                    const cursor = sourceCol.find({}, { batchSize });
                    let docs: any[] = [];

                    for await (const doc of cursor) {
                        docs.push(doc);
                        if (docs.length >= batchSize) {
                            const writeRes = await targetCol.insertMany(docs, { ordered: false });
                            inserted += writeRes.insertedCount;
                            docs = [];
                        }
                    }

                    if (docs.length > 0) {
                        const writeRes = await targetCol.insertMany(docs, { ordered: false });
                        inserted += writeRes.insertedCount;
                    }
                } else {
                    const cursor = sourceCol.find({}, { batchSize });
                    let ops: any[] = [];

                    for await (const doc of cursor) {
                        const { _id, ...rest } = doc;
                        ops.push({
                            updateOne: {
                                filter: { _id },
                                update: { $set: rest, $setOnInsert: { _id } },
                                upsert: true,
                            },
                        });

                        if (ops.length >= batchSize) {
                            const writeRes = await targetCol.bulkWrite(ops, { ordered: false });
                            inserted += writeRes.upsertedCount ?? 0;
                            updated += writeRes.modifiedCount ?? 0;
                            ops = [];
                        }
                    }

                    if (ops.length > 0) {
                        const writeRes = await targetCol.bulkWrite(ops, { ordered: false });
                        inserted += writeRes.upsertedCount ?? 0;
                        updated += writeRes.modifiedCount ?? 0;
                    }
                }

                const targetCountAfter = await targetCol.countDocuments({});

                results.push({
                    collection: name,
                    sourceCount,
                    targetCountBefore,
                    targetCountAfter,
                    inserted,
                    updated,
                    durationMs: Date.now() - started,
                    mode,
                });
            }

            return NextResponse.json({
                success: true,
                sourceDb: cfg.sourceDbName,
                targetDb: cfg.targetDbName,
                syncedCollections: collections.length,
                results,
                requestedBy: auth.session?.user?.email || "unknown",
                syncedAt: new Date().toISOString(),
            });
        } finally {
            await Promise.all([sourceClient.close(), targetClient.close()]);
        }
    } catch (err: any) {
        console.error("[DB Sync]", err);
        return NextResponse.json({ success: false, error: err?.message || "DB sync failed" }, { status: 500 });
    }
}
