/**
 * Admin — CDN Application Detail & Actions
 *
 * GET    /api/admin/cdn/applications/[id]          — get single application
 * PATCH  /api/admin/cdn/applications/[id]          — approve | reject | suspend | reopen
 *
 * On "approve", an API key is automatically generated, stored, and emailed to the applicant.
 */
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getSession } from "@Library/auth";
import { permissionError, requirePermission } from "@Library/adminApiMiddleware";
import dbConnect from "@Utils/dbConnect";
import { CDNApplication, ApplicationStatus } from "@Models/CDNApplication";
import { CDNAPIKey, PLAN_DEFAULTS } from "@Models/CDNAPIKey";
import { hashAPIKey } from "@Utils/CDNKeyAuth";
import { sendEmail, cdnKeyIssuedEmail } from "@Utils/Email";

function generateRawKey(): string { return `cdn_${randomBytes(24).toString("hex")}`; }
function generateKeyId(): string  { return `key_${randomBytes(8).toString("hex")}`; }

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
    try {
        const auth = await requirePermission(_req, "cdn.applications.view");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
        await dbConnect();
        const { id } = await params;

        const app = await CDNApplication.findById(id).lean();
        if (!app) return NextResponse.json({ error: "Application not found." }, { status: 404 });

        return NextResponse.json({ application: app });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || "Failed." }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: Params) {
    try {
        const auth = await requirePermission(req, "cdn.applications.review");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
        const session = await getSession(req.headers);
        await dbConnect();
        const { id } = await params;

        const body = await req.json() as {
            action: "approve" | "reject" | "suspend" | "reopen";
            adminNotes?: string;
            rejectionReason?: string;
        };

        const { action, adminNotes, rejectionReason } = body;
        const validActions = ["approve", "reject", "suspend", "reopen"];
        if (!validActions.includes(action)) {
            return NextResponse.json({ error: `action must be one of: ${validActions.join(", ")}.` }, { status: 422 });
        }

        const app = await CDNApplication.findById(id);
        if (!app) return NextResponse.json({ error: "Application not found." }, { status: 404 });

        const statusMap: Record<string, ApplicationStatus> = {
            approve:  "approved",
            reject:   "rejected",
            suspend:  "suspended",
            reopen:   "pending",
        };

        app.status       = statusMap[action];
        app.reviewedBy   = session?.user?.email || "admin";
        app.reviewedAt   = new Date();
        if (adminNotes)      app.adminNotes      = adminNotes.trim();
        if (rejectionReason) app.rejectionReason = rejectionReason.trim();

        await app.save();

        // ── Auto-issue API key on approval ────────────────────────────────
        let issuedKey: { rawKey: string; keyId: string; keyPrefix: string } | null = null;

        if (action === "approve") {
            // Only issue if no active key already exists
            const existing = await CDNAPIKey.findOne({ applicationId: app._id.toString(), status: "active" }).lean();
            if (!existing) {
                const rawKey   = generateRawKey();
                const keyId    = generateKeyId();
                const keyHash  = hashAPIKey(rawKey);
                const keyPrefix = rawKey.slice(0, 12);
                const planDefaults = PLAN_DEFAULTS[app.requestedPlan] || PLAN_DEFAULTS.free;

                await CDNAPIKey.create({
                    keyId,
                    keyHash,
                    keyPrefix,
                    applicationId : app._id.toString(),
                    appName       : app.appName,
                    applicantEmail: app.applicantEmail,
                    plan          : app.requestedPlan,
                    rateLimit     : planDefaults,
                    issuedBy      : session?.user?.email || "admin",
                });

                issuedKey = { rawKey, keyId, keyPrefix };

                // Email the key to the applicant — fire & forget
                sendEmail({
                    to     : app.applicantEmail,
                    subject: `Your CDN API Key for ${app.appName} — Meet Bhingradiya`,
                    html   : cdnKeyIssuedEmail({
                        appName      : app.appName,
                        applicantName: app.applicantName,
                        plan         : app.requestedPlan,
                        rawKey,
                        keyPrefix,
                    }),
                }).catch(err => console.error("[CDN key email]", err));
            }
        }

        return NextResponse.json({
            applicationId: app._id.toString(),
            status       : app.status,
            message      : `Application ${action}d successfully.`,
            ...(issuedKey ? { apiKey: issuedKey } : {}),
        });
    } catch (err: any) {
        console.error("[Admin CDN Application PATCH]", err);
        return NextResponse.json({ error: err?.message || "Failed." }, { status: 500 });
    }
}
