/**
 * GET /api/vault/storage
 * Returns the authenticated user's vault storage usage and quota.
 * Reads from the VaultAccess whitelist to check quota, and
 * aggregates VaultDocument sizes for actual usage.
 */
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@Utils/dbConnect";
import { getSession } from "@Library/auth";
import { VaultAccess } from "@Models/VaultAccess";
import { VaultDocument } from "@Models/VaultDocument";

export async function GET(req: NextRequest) {
    try {
        const session = await getSession(req.headers);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = session.user.id;

        await dbConnect();

        const access = await VaultAccess.findOne({ userId, enabled: true }).lean();
        if (!access) {
            return NextResponse.json({ error: "Vault access not granted" }, { status: 403 });
        }

        // Aggregate current usage from active documents
        const [agg] = await VaultDocument.aggregate([
            { $match: { userId, status: "active" } },
            { $group: { _id: null, total: { $sum: "$size" }, count: { $sum: 1 } } }
        ]);

        const usedBytes = agg?.total ?? 0;
        const fileCount = agg?.count ?? 0;

        // Keep cached values in sync (fire-and-forget — actual usage recalculated on every call)
        VaultAccess.updateOne({ userId }, { $set: { usedBytes, fileCount } }).catch((e) =>
            console.error("[Vault Storage] cache sync failed", e)
        );

        return NextResponse.json({
            usedBytes,
            fileCount,
            limitBytes: access.storageLimitBytes,
            enabled: access.enabled
        });
    } catch (err: any) {
        console.error("[Vault Storage]", err);
        return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
    }
}
