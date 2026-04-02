/**
 * GET    /api/wallet/assets           – list all assets (UPI gets virtual balance from linked bank)
 * POST   /api/wallet/assets           – create asset (validates UPI→Bank link)
 * PUT    /api/wallet/assets           – update asset (requires ?id=AssetID)
 * DELETE /api/wallet/assets?id=       – delete/archive asset
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { getResolvedUser } from "@Utils/RolePermissions";
import { WalletAsset, WalletAssetType } from "@Models/WalletAsset";
import { WalletTransaction } from "@Models/WalletTransaction";

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(_req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const assets = (await WalletAsset.find({
            UserID: user.userId,
            IsArchived: { $ne: true }
        })
            .sort({ createdAt: -1 })
            .lean()) as any[];

        // Build a map for quick bank lookup
        const bankMap = new Map<string, any>();
        for (const a of assets) {
            if (a.Type === WalletAssetType.BANK) bankMap.set(a.AssetID, a);
        }

        // For UPI_APP assets, inject the linked bank's balance
        const enriched = assets.map((a) => {
            if (a.Type === WalletAssetType.UPI_APP && a.LinkedAssetID) {
                const bank = bankMap.get(a.LinkedAssetID);
                return {
                    ...a,
                    Balance: bank?.Balance ?? 0,
                    LinkedBankName: bank?.Name ?? null
                };
            }
            return a;
        });

        // Total balance = only BANK + DIGITAL_WALLET + CASH (UPI mirrors bank, don't double-count)
        const totalBalance = enriched.filter((a) => a.Type !== WalletAssetType.UPI_APP).reduce((s, a) => s + (a.Balance ?? 0), 0);

        return NextResponse.json({
            success: true,
            data: {
                assets: enriched,
                totalBalance: parseFloat(totalBalance.toFixed(2)),
                count: enriched.length
            }
        });
    } catch (err) {
        console.error("GET /api/wallet/assets:", err);
        return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
    }
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const name = String(body.Name || "").trim();
        if (!name) return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });

        const type = body.Type || "CASH";

        // Validate UPI_APP requires a linked bank
        if (type === WalletAssetType.UPI_APP) {
            if (!body.LinkedAssetID) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "UPI App must be linked to a Bank account"
                    },
                    { status: 400 }
                );
            }
            const bank = await WalletAsset.findOne({
                AssetID: body.LinkedAssetID,
                UserID: user.userId,
                Type: WalletAssetType.BANK,
                IsArchived: { $ne: true }
            });
            if (!bank) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "Linked asset must be an active Bank account"
                    },
                    { status: 400 }
                );
            }
        }

        const initialBalance = type === WalletAssetType.UPI_APP ? 0 : parseFloat(body.InitialBalance) || 0;

        const toArr = (v: unknown): string[] => {
            if (Array.isArray(v)) return v.map(String).filter(Boolean);
            if (typeof v === "string")
                return v
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
            return [];
        };

        const asset = await WalletAsset.create({
            UserID: user.userId,
            Name: name,
            Icon: body.Icon || undefined,
            Type: type,
            Balance: initialBalance,
            InitialBalance: initialBalance,
            Currency: body.Currency || "INR",
            LinkedAssetID: body.LinkedAssetID || undefined,
            UPIIds: toArr(body.UPIIds),
            Color: body.Color || "",
            Notes: body.Notes || undefined
        });

        return NextResponse.json({ success: true, data: asset }, { status: 201 });
    } catch (err) {
        console.error("POST /api/wallet/assets:", err);
        return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
    }
}

// ─── PUT ──────────────────────────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const id = req.nextUrl.searchParams.get("id");
        if (!id) return NextResponse.json({ success: false, error: "Asset ID required" }, { status: 400 });

        const body = await req.json();

        // Process UPIIds if provided
        if (body.UPIIds !== undefined) {
            if (typeof body.UPIIds === "string") {
                body.UPIIds = body.UPIIds.split(",")
                    .map((s: string) => s.trim())
                    .filter(Boolean);
            }
        }

        const asset = await WalletAsset.findOneAndUpdate({ AssetID: id, UserID: user.userId }, { $set: body }, { new: true });
        if (!asset) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

        return NextResponse.json({ success: true, data: asset });
    } catch (err) {
        console.error("PUT /api/wallet/assets:", err);
        return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
    }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const id = req.nextUrl.searchParams.get("id");
        if (!id) return NextResponse.json({ success: false, error: "Asset ID required" }, { status: 400 });

        // Check for linked transactions
        const txnCount = await WalletTransaction.countDocuments({
            UserID: user.userId,
            $or: [{ FromAssetID: id }, { ToAssetID: id }]
        });

        if (txnCount > 0) {
            await WalletAsset.updateOne({ AssetID: id, UserID: user.userId }, { $set: { IsArchived: true } });
            return NextResponse.json({
                success: true,
                data: { archived: true, transactionCount: txnCount }
            });
        }

        await WalletAsset.deleteOne({ AssetID: id, UserID: user.userId });
        return NextResponse.json({ success: true, data: { deleted: true } });
    } catch (err) {
        console.error("DELETE /api/wallet/assets:", err);
        return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
    }
}
