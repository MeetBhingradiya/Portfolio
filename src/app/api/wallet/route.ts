/**
 * GET  /api/wallet   – list transactions (requires Tools.Private.WalletTracker.Access)
 * POST /api/wallet   – create transaction (auto-updates asset balances, UPI→Bank redirect)
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { getResolvedUser, hasPermission } from "@Utils/RolePermissions";
import { WalletTransaction, WalletTransactionType } from "@Models/WalletTransaction";
import { WalletAsset, WalletAssetType } from "@Models/WalletAsset";
import { WalletContact } from "@Models/WalletContact";

/** Resolve actual bank AssetID if the asset is a UPI_APP */
async function resolveAsset(assetId: string | undefined, userId: string): Promise<string | undefined> {
    if (!assetId) return undefined;
    const asset = (await WalletAsset.findOne({
        AssetID: assetId,
        UserID: userId
    }).lean()) as any;
    if (!asset) return assetId;
    if (asset.Type === WalletAssetType.UPI_APP && asset.LinkedAssetID) {
        return asset.LinkedAssetID;
    }
    return assetId;
}

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        // Check permission to access wallet tracker
        const canAccess = await hasPermission(req.headers, "Tools.Private.WalletTracker.Access");
        if (!canAccess) {
            return NextResponse.json(
                { success: false, error: "Forbidden: Permission required: Tools.Private.WalletTracker.Access" },
                { status: 403 }
            );
        }

        const q = req.nextUrl.searchParams;
        const page = Math.max(1, parseInt(q.get("page") || "1"));
        const limit = Math.min(50, parseInt(q.get("limit") || "20"));
        const type = q.get("type");
        const category = q.get("category");
        const assetId = q.get("assetId");
        const from = q.get("from");
        const to = q.get("to");
        const search = q.get("search");
        const showHidden = q.get("showHidden") === "1";
        const sortBy = q.get("sortBy") || "date";
        const sortDir = q.get("sortDir") === "asc" ? 1 : -1;

        const query: Record<string, any> = { UserID: user.userId };
        if (!showHidden) query.IsHidden = { $ne: true };
        if (type) query.Type = type;
        if (category) query.Category = category;
        if (assetId) {
            // Get the asset to check if it's a bank with linked UPI apps
            const asset = await WalletAsset.findOne({ AssetID: assetId, UserID: user.userId }).lean();
            let assetIds = [assetId];

            // If this is a BANK, also include all UPI_APP assets linked to it
            if (asset && asset.Type === WalletAssetType.BANK) {
                const linkedUpiApps = await WalletAsset.find({
                    UserID: user.userId,
                    Type: WalletAssetType.UPI_APP,
                    LinkedAssetID: assetId,
                    IsArchived: { $ne: true }
                }).lean();
                assetIds = [assetId, ...linkedUpiApps.map((app: any) => app.AssetID)];
            }

            query.$or = [
                { FromAssetID: { $in: assetIds } },
                { ToAssetID: { $in: assetIds } }
            ];
        }
        if (from || to) {
            query.Date = {};
            if (from) query.Date.$gte = new Date(from);
            if (to) query.Date.$lte = new Date(to);
        }
        if (search) {
            const searchOr = [{ Note: { $regex: search, $options: "i" } }, { Tags: { $in: [new RegExp(search, "i")] } }];
            if (query.$or) {
                query.$and = [{ $or: query.$or }, { $or: searchOr }];
                delete query.$or;
            } else {
                query.$or = searchOr;
            }
        }

        // Build sort object based on sortBy param
        const sortMap: Record<string, Record<string, 1 | -1>> = {
            date: { Date: sortDir, createdAt: sortDir },
            amount: { Amount: sortDir, Date: -1 },
            note: { Note: sortDir, Date: -1 }
        };
        const sortObj = sortMap[sortBy] || sortMap.date;

        const [total, transactions, summaryAgg] = await Promise.all([
            WalletTransaction.countDocuments(query),
            WalletTransaction.find(query)
                .sort(sortObj)
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            WalletTransaction.aggregate([
                { $match: { UserID: user.userId, IsHidden: { $ne: true } } },
                {
                    $group: {
                        _id: null,
                        totalCredit: {
                            $sum: {
                                $cond: [{ $eq: ["$Type", "CREDIT"] }, "$Amount", 0]
                            }
                        },
                        totalDebit: {
                            $sum: {
                                $cond: [{ $eq: ["$Type", "DEBIT"] }, "$Amount", 0]
                            }
                        },
                        totalTransfer: {
                            $sum: {
                                $cond: [{ $eq: ["$Type", "TRANSFER"] }, "$Amount", 0]
                            }
                        },
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);

        const sm = summaryAgg[0] ?? {
            totalCredit: 0,
            totalDebit: 0,
            totalTransfer: 0,
            count: 0
        };
        const summary = {
            totalCredit: parseFloat((sm.totalCredit ?? 0).toFixed(2)),
            totalDebit: parseFloat((sm.totalDebit ?? 0).toFixed(2)),
            totalTransfer: parseFloat((sm.totalTransfer ?? 0).toFixed(2)),
            netFlow: parseFloat(((sm.totalCredit ?? 0) - (sm.totalDebit ?? 0)).toFixed(2)),
            count: sm.count ?? 0
        };

        // Populate contact names for transactions that have ContactID
        const contactIds = [...new Set(
            (transactions as any[]).filter((t) => t.ContactID).map((t) => t.ContactID)
        )];
        let contactMap: Record<string, string> = {};
        if (contactIds.length > 0) {
            const contacts = await WalletContact.find(
                { ContactID: { $in: contactIds }, UserID: user.userId },
                { ContactID: 1, Name: 1 }
            ).lean();
            contactMap = Object.fromEntries(
                (contacts as any[]).map((c) => [c.ContactID, c.Name])
            );
        }

        const enrichedTransactions = (transactions as any[]).map((t) => ({
            ...t,
            ContactName: t.ContactID ? contactMap[t.ContactID] || null : null
        }));

        return NextResponse.json({
            success: true,
            data: {
                transactions: enrichedTransactions,
                summary,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (err) {
        console.error("GET /api/wallet:", err);
        return NextResponse.json({ success: false, error: "Failed to fetch transactions" }, { status: 500 });
    }
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        // Check permission to access wallet tracker
        const canAccess = await hasPermission(req.headers, "Tools.Private.WalletTracker.Access");
        if (!canAccess) {
            return NextResponse.json(
                { success: false, error: "Forbidden: Permission required: Tools.Private.WalletTracker.Access" },
                { status: 403 }
            );
        }

        const body = await req.json();

        const note = String(body.Note || "").trim();
        const amount = parseFloat(body.Amount);
        const type = String(body.Type || "").toUpperCase() as WalletTransactionType;

        if (!note) return NextResponse.json({ success: false, error: "Note is required" }, { status: 400 });
        if (!amount || amount <= 0) return NextResponse.json({ success: false, error: "Amount must be positive" }, { status: 400 });
        if (!Object.values(WalletTransactionType).includes(type)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Type must be CREDIT, DEBIT, or TRANSFER"
                },
                { status: 400 }
            );
        }

        const fromAssetId = body.FromAssetID || null;
        const toAssetId = body.ToAssetID || null;

        if (type === WalletTransactionType.DEBIT && !fromAssetId) {
            return NextResponse.json({ success: false, error: "FromAssetID required for DEBIT" }, { status: 400 });
        }
        if (type === WalletTransactionType.CREDIT && !toAssetId) {
            return NextResponse.json({ success: false, error: "ToAssetID required for CREDIT" }, { status: 400 });
        }
        if (type === WalletTransactionType.TRANSFER && (!fromAssetId || !toAssetId)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "FromAssetID and ToAssetID required for TRANSFER"
                },
                { status: 400 }
            );
        }

        // Create transaction
        const transaction = await WalletTransaction.create({
            UserID: user.userId,
            Note: note,
            Amount: amount,
            Currency: body.Currency || "INR",
            Type: type,
            Category: body.Category || "OTHER",
            FromAssetID: fromAssetId,
            ToAssetID: toAssetId,
            Date: body.Date ? new Date(body.Date) : new Date(),
            IsWalletTransfer: Boolean(body.IsWalletTransfer),
            IsHidden: Boolean(body.IsHidden),
            ContactID: body.ContactID || undefined,
            Tags: Array.isArray(body.Tags) ? body.Tags : []
        });

        // Update asset balances (UPI apps redirect to linked bank)
        const resolvedFrom = await resolveAsset(fromAssetId, user.userId);
        const resolvedTo = await resolveAsset(toAssetId, user.userId);

        if (type === WalletTransactionType.DEBIT && resolvedFrom) {
            await WalletAsset.updateOne({ AssetID: resolvedFrom, UserID: user.userId }, { $inc: { Balance: -amount } });
        } else if (type === WalletTransactionType.CREDIT && resolvedTo) {
            await WalletAsset.updateOne({ AssetID: resolvedTo, UserID: user.userId }, { $inc: { Balance: amount } });
        } else if (type === WalletTransactionType.TRANSFER) {
            await Promise.all([
                resolvedFrom
                    ? WalletAsset.updateOne({ AssetID: resolvedFrom, UserID: user.userId }, { $inc: { Balance: -amount } })
                    : Promise.resolve(),
                resolvedTo
                    ? WalletAsset.updateOne({ AssetID: resolvedTo, UserID: user.userId }, { $inc: { Balance: amount } })
                    : Promise.resolve()
            ]);
        }

        return NextResponse.json({ success: true, data: transaction }, { status: 201 });
    } catch (err) {
        console.error("POST /api/wallet:", err);
        return NextResponse.json({ success: false, error: "Failed to create transaction" }, { status: 500 });
    }
}
