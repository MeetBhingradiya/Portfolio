/**
 * Admin — CDN API Keys
 *
 * GET  /api/admin/cdn/api-keys            — list all issued keys (paginated)
 * POST /api/admin/cdn/api-keys            — issue a new key for an approved application
 */
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { requireAdmin, getSession } from "@Library/auth";
import dbConnect from "@Utils/dbConnect";
import { CDNAPIKey, PLAN_DEFAULTS, IRateLimitPolicy } from "@Models/CDNAPIKey";
import { CDNApplication } from "@Models/CDNApplication";
import { hashAPIKey } from "@Utils/CDNKeyAuth";

// Generate a secure key:  cdn_<32-hex-chars>
function generateRawKey(): string {
    return `cdn_${randomBytes(24).toString("hex")}`;
}

// Opaque keyId  key_<16-hex>
function generateKeyId(): string {
    return `key_${randomBytes(8).toString("hex")}`;
}

export async function GET(req: NextRequest) {
    try {
        await requireAdmin(req.headers);
        await dbConnect();

        const q     = req.nextUrl.searchParams;
        const status = q.get("status") || "";
        const search = q.get("search") || "";
        const page   = Math.max(1, parseInt(q.get("page")  || "1",  10));
        const limit  = Math.min(100, Math.max(1, parseInt(q.get("limit") || "50", 10)));
        const skip   = (page - 1) * limit;

        const filter: Record<string, any> = {};
        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { appName:        { $regex: search, $options: "i" } },
                { applicantEmail: { $regex: search, $options: "i" } },
                { keyPrefix:      { $regex: search, $options: "i" } },
            ];
        }

        const [keys, total] = await Promise.all([
            CDNAPIKey.find(filter)
                .select("-keyHash")           // never expose the hash via this route
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            CDNAPIKey.countDocuments(filter),
        ]);

        return NextResponse.json({
            keys,
            pagination: { total, page, limit, pages: Math.ceil(total / limit) },
        });
    } catch (err: any) {
        console.error("[Admin CDN API Keys GET]", err);
        return NextResponse.json({ error: err?.message || "Failed." }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await requireAdmin(req.headers);
        const session = await getSession(req.headers);
        await dbConnect();

        const body = await req.json() as {
            applicationId: string;
            notes?: string;
            expiresAt?: string;               // ISO date string
            rateLimitOverride?: Partial<IRateLimitPolicy>;
        };

        const { applicationId, notes, expiresAt, rateLimitOverride } = body;

        if (!applicationId) {
            return NextResponse.json({ error: "applicationId is required." }, { status: 422 });
        }

        // Verify application exists and is approved
        const app = await CDNApplication.findById(applicationId).lean();
        if (!app) {
            return NextResponse.json({ error: "Application not found." }, { status: 404 });
        }
        if (app.status !== "approved") {
            return NextResponse.json(
                { error: `Application status is "${app.status}". Only approved applications can receive API keys.` },
                { status: 409 }
            );
        }

        // Check if the application already has an active key
        const existingActive = await CDNAPIKey.findOne({ applicationId, status: "active" }).lean();
        if (existingActive) {
            return NextResponse.json(
                { error: "This application already has an active API key. Revoke it first before issuing a new one." },
                { status: 409 }
            );
        }

        // Build rate limit policy: plan defaults + admin overrides
        const planDefaults = PLAN_DEFAULTS[app.requestedPlan] || PLAN_DEFAULTS.free;
        const rateLimit: IRateLimitPolicy = { ...planDefaults, ...(rateLimitOverride || {}) };

        // Generate key
        const rawKey = generateRawKey();
        const keyId  = generateKeyId();
        const keyHash   = hashAPIKey(rawKey);
        const keyPrefix = rawKey.slice(0, 12); // "cdn_a1b2c3d4"

        const keyDoc = await CDNAPIKey.create({
            keyId,
            keyHash,
            keyPrefix,
            applicationId: app._id.toString(),
            appName:        app.appName,
            applicantEmail: app.applicantEmail,
            plan:           app.requestedPlan,
            rateLimit,
            status:    "active",
            expiresAt: expiresAt ? new Date(expiresAt) : undefined,
            issuedBy:  session?.user?.email || "admin",
            notes:     notes?.trim() || undefined,
        });

        // Return the plaintext key ONCE — it is not stored, only the hash is
        return NextResponse.json(
            {
                keyId:   keyDoc.keyId,
                key:     rawKey,          // ⚠ Only returned here — store it securely
                keyPrefix: keyDoc.keyPrefix,
                plan:    keyDoc.plan,
                rateLimit: keyDoc.rateLimit,
                expiresAt: keyDoc.expiresAt ?? null,
                message: "API key issued. This is the ONLY time the full key is shown — copy it now.",
            },
            { status: 201 }
        );
    } catch (err: any) {
        console.error("[Admin CDN API Keys POST]", err);
        return NextResponse.json({ error: err?.message || "Failed." }, { status: 500 });
    }
}
