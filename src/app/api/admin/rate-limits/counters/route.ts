/**
 * Admin Rate Limit Counters API — Dashboard Data
 *
 * Endpoints:
 *   GET    /api/admin/rate-limits/counters — List active counters
 *   DELETE /api/admin/rate-limits/counters — Clear counters for identity
 *
 * Protected by requireAdminEmail middleware.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminEmail } from "@Library/adminApiMiddleware";
import dbConnect from "@Utils/dbConnect";
import { RateLimitCounter } from "@Models/RateLimitCounter";

// ── GET: List active counters ────────────────────────────────────────────────

export async function GET(req: NextRequest) {
    const auth = await requireAdminEmail(req);
    if (auth.error) {
        return NextResponse.json(
            { Status: 0, StatusCode: auth.status, Message: auth.message },
            { status: auth.status }
        );
    }

    try {
        const { searchParams } = new URL(req.url);
        const blockedOnly = searchParams.get("blocked") === "true";
        const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 500);
        const identityFilter = searchParams.get("identity");

        await dbConnect();

        const filter: Record<string, unknown> = {
            expiresAt: { $gt: new Date() }
        };

        if (blockedOnly) {
            filter.blocked = true;
        }

        if (identityFilter) {
            filter.identity = { $regex: identityFilter, $options: "i" };
        }

        const counters = await RateLimitCounter.find(filter)
            .sort({ lastRequestAt: -1 })
            .limit(limit)
            .lean();

        // Aggregate stats
        const totalActive = await RateLimitCounter.countDocuments({
            expiresAt: { $gt: new Date() }
        });
        const totalBlocked = await RateLimitCounter.countDocuments({
            expiresAt: { $gt: new Date() },
            blocked: true
        });

        // Top offenders: identities with highest request counts
        const topOffenders = await RateLimitCounter.aggregate([
            { $match: { expiresAt: { $gt: new Date() } } },
            {
                $group: {
                    _id: { identity: "$identity", identityType: "$identityType" },
                    totalRequests: { $sum: "$count" },
                    blockedCount: {
                        $sum: { $cond: [{ $eq: ["$blocked", true] }, 1, 0] }
                    },
                    lastSeen: { $max: "$lastRequestAt" },
                    endpoints: { $addToSet: "$endpoint" }
                }
            },
            { $sort: { totalRequests: -1 } },
            { $limit: 20 }
        ]);

        return NextResponse.json({
            Status: 1,
            StatusCode: 200,
            Data: {
                counters,
                stats: {
                    totalActive,
                    totalBlocked,
                    topOffenders
                }
            }
        });
    } catch (error: any) {
        console.error("[admin/rate-limits/counters] GET error:", error);
        return NextResponse.json(
            {
                Status: 0,
                StatusCode: 500,
                Message: error.message || "Failed to load counters"
            },
            { status: 500 }
        );
    }
}

// ── DELETE: Clear counters for an identity ────────────────────────────────────

export async function DELETE(req: NextRequest) {
    const auth = await requireAdminEmail(req);
    if (auth.error) {
        return NextResponse.json(
            { Status: 0, StatusCode: auth.status, Message: auth.message },
            { status: auth.status }
        );
    }

    try {
        const body = await req.json();
        const { identity, identityType, clearAll } = body;

        await dbConnect();

        if (clearAll === true) {
            const result = await RateLimitCounter.deleteMany({});
            return NextResponse.json({
                Status: 1,
                StatusCode: 200,
                Message: `Cleared all ${result.deletedCount} counter(s)`,
                Data: { deletedCount: result.deletedCount }
            });
        }

        if (!identity) {
            return NextResponse.json(
                { Status: 0, StatusCode: 400, Message: "Missing identity or clearAll flag" },
                { status: 400 }
            );
        }

        const filter: Record<string, unknown> = { identity };
        if (identityType) filter.identityType = identityType;

        const result = await RateLimitCounter.deleteMany(filter);

        return NextResponse.json({
            Status: 1,
            StatusCode: 200,
            Message: `Cleared ${result.deletedCount} counter(s) for ${identity}`,
            Data: { deletedCount: result.deletedCount }
        });
    } catch (error: any) {
        console.error("[admin/rate-limits/counters] DELETE error:", error);
        return NextResponse.json(
            {
                Status: 0,
                StatusCode: 500,
                Message: error.message || "Failed to clear counters"
            },
            { status: 500 }
        );
    }
}
