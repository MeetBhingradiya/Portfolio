/**
 * GET /api/wallet/analytics – aggregated spending analytics
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { getResolvedUser } from "@Utils/RolePermissions";
import { WalletTransaction } from "@Models/WalletTransaction";
import { WalletAsset } from "@Models/WalletAsset";

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const q    = req.nextUrl.searchParams;
        const from = q.get("from");
        const to   = q.get("to");

        const dateFilter: Record<string, any> = {};
        if (from) dateFilter.$gte = new Date(from);
        if (to)   dateFilter.$lte = new Date(to);

        const baseMatch: Record<string, any> = {
            UserID: user.userId,
            IsHidden: { $ne: true },
        };
        if (Object.keys(dateFilter).length) baseMatch.Date = dateFilter;

        const [
            summaryAgg,
            byCategoryAgg,
            monthlyAgg,
            assets,
            recentTransactions,
        ] = await Promise.all([
            // Overall summary
            WalletTransaction.aggregate([
                { $match: baseMatch },
                { $group: {
                    _id: null,
                    totalCredit:  { $sum: { $cond: [{ $eq: ["$Type", "CREDIT"] },  "$Amount", 0] } },
                    totalDebit:   { $sum: { $cond: [{ $eq: ["$Type", "DEBIT"] },   "$Amount", 0] } },
                    totalTransfer:{ $sum: { $cond: [{ $eq: ["$Type", "TRANSFER"] },"$Amount", 0] } },
                    count:        { $sum: 1 },
                    avgTransaction: { $avg: "$Amount" },
                    maxTransaction: { $max: "$Amount" },
                } },
            ]),

            // Spending by category (debits only)
            WalletTransaction.aggregate([
                { $match: { ...baseMatch, Type: "DEBIT" } },
                { $group: {
                    _id: "$Category",
                    total: { $sum: "$Amount" },
                    count: { $sum: 1 },
                } },
                { $sort: { total: -1 } },
                { $limit: 15 },
            ]),

            // Monthly income vs expense
            WalletTransaction.aggregate([
                { $match: baseMatch },
                { $group: {
                    _id: {
                        year:  { $year: "$Date" },
                        month: { $month: "$Date" },
                    },
                    income:  { $sum: { $cond: [{ $eq: ["$Type", "CREDIT"] }, "$Amount", 0] } },
                    expense: { $sum: { $cond: [{ $eq: ["$Type", "DEBIT"] },  "$Amount", 0] } },
                    count:   { $sum: 1 },
                } },
                { $sort: { "_id.year": 1, "_id.month": 1 } },
            ]),

            // Asset totals
            WalletAsset.find({ UserID: user.userId, IsArchived: { $ne: true } })
                .sort({ Balance: -1 })
                .lean(),

            // Recent 5 transactions for quick glance
            WalletTransaction.find({ UserID: user.userId, IsHidden: { $ne: true } })
                .sort({ Date: -1 })
                .limit(5)
                .lean(),
        ]);

        const sm = summaryAgg[0] ?? {
            totalCredit: 0, totalDebit: 0, totalTransfer: 0,
            count: 0, avgTransaction: 0, maxTransaction: 0,
        };

        const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        const totalBalance = assets.reduce((s: number, a: any) => s + (a.Balance ?? 0), 0);

        return NextResponse.json({
            success: true,
            data: {
                summary: {
                    totalCredit:    parseFloat((sm.totalCredit ?? 0).toFixed(2)),
                    totalDebit:     parseFloat((sm.totalDebit ?? 0).toFixed(2)),
                    totalTransfer:  parseFloat((sm.totalTransfer ?? 0).toFixed(2)),
                    netFlow:        parseFloat(((sm.totalCredit - sm.totalDebit) ?? 0).toFixed(2)),
                    count:          sm.count ?? 0,
                    avgTransaction: parseFloat((sm.avgTransaction ?? 0).toFixed(2)),
                    maxTransaction: parseFloat((sm.maxTransaction ?? 0).toFixed(2)),
                    totalBalance:   parseFloat(totalBalance.toFixed(2)),
                    assetCount:     assets.length,
                },
                byCategory: byCategoryAgg.map((r: any) => ({
                    category: r._id || "OTHER",
                    total:    parseFloat((r.total ?? 0).toFixed(2)),
                    count:    r.count ?? 0,
                })),
                monthly: monthlyAgg.map((r: any) => ({
                    month:   `${MONTHS[r._id.month]} ${r._id.year}`,
                    income:  parseFloat((r.income ?? 0).toFixed(2)),
                    expense: parseFloat((r.expense ?? 0).toFixed(2)),
                    net:     parseFloat(((r.income - r.expense) ?? 0).toFixed(2)),
                })),
                assets,
                recentTransactions,
            },
        });
    } catch (err) {
        console.error("GET /api/wallet/analytics:", err);
        return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
    }
}
