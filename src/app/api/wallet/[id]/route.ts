/**
 * GET    /api/wallet/[id]  – get single transaction
 * PUT    /api/wallet/[id]  – update transaction (with balance recalculation)
 * DELETE /api/wallet/[id]  – delete transaction (reverts asset balance)
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { getResolvedUser } from "@Utils/RolePermissions";
import { WalletTransaction, WalletTransactionType } from "@Models/WalletTransaction";
import { WalletAsset, WalletAssetType } from "@Models/WalletAsset";

type Ctx = { params: Promise<{ id: string }> };

/** Resolve actual bank AssetID if the asset is a UPI_APP */
async function resolveAsset(assetId: string | undefined, userId: string): Promise<string | undefined> {
    if (!assetId) return undefined;
    const asset = await WalletAsset.findOne({ AssetID: assetId, UserID: userId }).lean() as any;
    if (!asset) return assetId;
    if (asset.Type === WalletAssetType.UPI_APP && asset.LinkedAssetID) {
        return asset.LinkedAssetID; // use linked bank
    }
    return assetId;
}

/** Apply balance change for a transaction */
async function applyBalance(type: string, fromId: string | undefined, toId: string | undefined, amount: number, userId: string, reverse = false) {
    const mult = reverse ? -1 : 1;
    const resolvedFrom = await resolveAsset(fromId, userId);
    const resolvedTo = await resolveAsset(toId, userId);

    if (type === "DEBIT" && resolvedFrom) {
        await WalletAsset.updateOne(
            { AssetID: resolvedFrom, UserID: userId },
            { $inc: { Balance: -amount * mult } }
        );
    } else if (type === "CREDIT" && resolvedTo) {
        await WalletAsset.updateOne(
            { AssetID: resolvedTo, UserID: userId },
            { $inc: { Balance: amount * mult } }
        );
    } else if (type === "TRANSFER") {
        await Promise.all([
            resolvedFrom ? WalletAsset.updateOne(
                { AssetID: resolvedFrom, UserID: userId },
                { $inc: { Balance: -amount * mult } }
            ) : Promise.resolve(),
            resolvedTo ? WalletAsset.updateOne(
                { AssetID: resolvedTo, UserID: userId },
                { $inc: { Balance: amount * mult } }
            ) : Promise.resolve(),
        ]);
    }
}

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(_req: NextRequest, ctx: Ctx) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { id } = await ctx.params;
        const txn = await WalletTransaction.findOne({ TransactionID: id, UserID: user.userId }).lean();
        if (!txn) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

        return NextResponse.json({ success: true, data: txn });
    } catch (err) {
        console.error("GET /api/wallet/[id]:", err);
        return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
    }
}

// ─── PUT ──────────────────────────────────────────────────────────────────────
export async function PUT(req: NextRequest, ctx: Ctx) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { id } = await ctx.params;
        const body = await req.json();

        // Fetch old transaction to reverse its balance impact
        const oldTxn = await WalletTransaction.findOne({ TransactionID: id, UserID: user.userId }).lean() as any;
        if (!oldTxn) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

        // Reverse old balance
        await applyBalance(oldTxn.Type, oldTxn.FromAssetID, oldTxn.ToAssetID, oldTxn.Amount, user.userId, true);

        // Build update
        const update: Record<string, any> = {};
        if (body.Note !== undefined)      update.Note = body.Note;
        if (body.Amount !== undefined)    update.Amount = parseFloat(body.Amount);
        if (body.Type !== undefined)      update.Type = body.Type;
        if (body.Category !== undefined)  update.Category = body.Category;
        if (body.FromAssetID !== undefined) update.FromAssetID = body.FromAssetID;
        if (body.ToAssetID !== undefined)   update.ToAssetID = body.ToAssetID;
        if (body.Date !== undefined)      update.Date = new Date(body.Date);
        if (body.IsHidden !== undefined)  update.IsHidden = body.IsHidden;
        if (body.IsWalletTransfer !== undefined) update.IsWalletTransfer = body.IsWalletTransfer;
        if (body.Tags !== undefined)      update.Tags = body.Tags;
        if (body.ContactID !== undefined) update.ContactID = body.ContactID;

        const txn = await WalletTransaction.findOneAndUpdate(
            { TransactionID: id, UserID: user.userId },
            { $set: update },
            { new: true }
        ).lean() as any;

        // Apply new balance
        await applyBalance(
            txn.Type, txn.FromAssetID, txn.ToAssetID,
            txn.Amount, user.userId, false
        );

        return NextResponse.json({ success: true, data: txn });
    } catch (err) {
        console.error("PUT /api/wallet/[id]:", err);
        return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
    }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(_req: NextRequest, ctx: Ctx) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { id } = await ctx.params;
        const txn = await WalletTransaction.findOneAndDelete({ TransactionID: id, UserID: user.userId }).lean() as any;
        if (!txn) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

        // Reverse balance
        await applyBalance(txn.Type, txn.FromAssetID, txn.ToAssetID, txn.Amount, user.userId, true);

        return NextResponse.json({ success: true, data: { deleted: true } });
    } catch (err) {
        console.error("DELETE /api/wallet/[id]:", err);
        return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
    }
}
