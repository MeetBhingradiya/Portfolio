/**
 * Rate Limit Status API — Internal Proxy Helper
 *
 * Lightweight API endpoint called by the Edge proxy for cross-isolate
 * rate limit state. Provides atomic counter operations on MongoDB.
 *
 * Endpoints:
 *   POST /api/rate-limit-status — Get current counter state
 *   PATCH /api/rate-limit-status — Increment counter atomically
 *   DELETE /api/rate-limit-status — Clear counters for an identity
 *
 * This route is excluded from rate limiting itself (in BYPASS_PREFIXES).
 */

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@Utils/dbConnect";
import { RateLimitCounter } from "@Models/RateLimitCounter";

// ── POST: Get counter state ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { identity, identityType, endpoint, ruleId } = body;

        if (!identity || !identityType || !endpoint || !ruleId) {
            return NextResponse.json(
                { Status: 0, StatusCode: 400, Message: "Missing required fields" },
                { status: 400 }
            );
        }

        await dbConnect();

        const counter = await RateLimitCounter.findOne({
            identity,
            identityType,
            endpoint,
            ruleId,
            expiresAt: { $gt: new Date() }
        })
            .sort({ windowStart: -1 })
            .lean();

        return NextResponse.json({
            Status: 1,
            StatusCode: 200,
            Data: counter || { count: 0, blocked: false }
        });
    } catch (error) {
        console.error("[rate-limit-status] POST error:", error);
        return NextResponse.json(
            { Status: 0, StatusCode: 500, Message: "Internal error" },
            { status: 500 }
        );
    }
}

// ── PATCH: Increment counter atomically ──────────────────────────────────────

export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            identity,
            identityType,
            endpoint,
            ruleId,
            ruleName,
            windowMs,
            maxRequests,
            userAgent
        } = body;

        if (!identity || !identityType || !endpoint || !ruleId || !windowMs) {
            return NextResponse.json(
                { Status: 0, StatusCode: 400, Message: "Missing required fields" },
                { status: 400 }
            );
        }

        await dbConnect();

        const now = new Date();
        const windowStart = new Date(
            Math.floor(now.getTime() / windowMs) * windowMs
        );
        const expiresAt = new Date(windowStart.getTime() + windowMs * 2);

        const result = await RateLimitCounter.findOneAndUpdate(
            {
                identity,
                identityType,
                endpoint,
                ruleId,
                windowStart
            },
            {
                $inc: { count: 1 },
                $set: {
                    lastRequestAt: now,
                    ruleName: ruleName || "",
                    expiresAt,
                    "metadata.userAgent": userAgent || ""
                },
                $setOnInsert: {
                    blocked: false,
                    "metadata.firstSeenAt": now
                }
            },
            {
                upsert: true,
                new: true,
                lean: true
            }
        );

        // Check if now blocked
        const blocked = result.count >= (maxRequests || 100);
        if (blocked && !result.blocked) {
            await RateLimitCounter.updateOne(
                { _id: result._id },
                { $set: { blocked: true } }
            );
        }

        return NextResponse.json({
            Status: 1,
            StatusCode: 200,
            Data: {
                count: result.count,
                blocked,
                windowStart: result.windowStart,
                expiresAt: result.expiresAt
            }
        });
    } catch (error) {
        console.error("[rate-limit-status] PATCH error:", error);
        return NextResponse.json(
            { Status: 0, StatusCode: 500, Message: "Internal error" },
            { status: 500 }
        );
    }
}

// ── DELETE: Clear counters for an identity ────────────────────────────────────

export async function DELETE(req: NextRequest) {
    try {
        const body = await req.json();
        const { identity, identityType } = body;

        if (!identity) {
            return NextResponse.json(
                { Status: 0, StatusCode: 400, Message: "Missing identity" },
                { status: 400 }
            );
        }

        await dbConnect();

        const filter: Record<string, unknown> = { identity };
        if (identityType) filter.identityType = identityType;

        const result = await RateLimitCounter.deleteMany(filter);

        return NextResponse.json({
            Status: 1,
            StatusCode: 200,
            Message: `Cleared ${result.deletedCount} counter(s)`,
            Data: { deletedCount: result.deletedCount }
        });
    } catch (error) {
        console.error("[rate-limit-status] DELETE error:", error);
        return NextResponse.json(
            { Status: 0, StatusCode: 500, Message: "Internal error" },
            { status: 500 }
        );
    }
}
