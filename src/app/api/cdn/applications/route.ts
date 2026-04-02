/**
 * CDN Application Submission API
 *
 * POST /api/cdn/applications
 *   Submit a new CDN access application.
 *   No authentication required — anyone may apply.
 *   Rate-limited via IP to 3 submissions per 24 h (basic, in-memory per instance).
 *
 * GET /api/cdn/applications/status?email=<email>
 *   Users can poll the status of their own application by email.
 */
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@Utils/dbConnect";
import { CDNApplication, ApplicationPlan } from "@Models/CDNApplication";

// Very lightweight submit-abuse guard (per serverless instance)
const _submits = new Map<string, { count: number; resetAt: number }>();

function checkSubmitAbuse(ip: string): boolean {
    const now = Date.now();
    const rec = _submits.get(ip);
    if (!rec || now > rec.resetAt) {
        _submits.set(ip, { count: 1, resetAt: now + 24 * 60 * 60 * 1000 });
        return true;
    }
    if (rec.count >= 3) return false;
    rec.count++;
    return true;
}

export async function POST(req: NextRequest) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkSubmitAbuse(ip)) {
        return NextResponse.json(
            {
                error: "You have submitted too many applications. Please wait 24 hours."
            },
            { status: 429 }
        );
    }

    try {
        const body = await req.json();

        const {
            applicantName,
            applicantEmail,
            applicantUserId,
            appName,
            appDescription,
            appWebsite,
            appGithub,
            appOrganisation,
            requestedPlan,
            expectedMonthlyRequests,
            useCaseDetails
        } = body as Record<string, any>;

        // ── Validation ────────────────────────────────────────────────────
        const errors: string[] = [];
        if (!applicantName?.trim()) errors.push("applicantName is required.");
        if (!applicantEmail?.trim()) errors.push("applicantEmail is required.");
        if (!appName?.trim()) errors.push("appName is required.");
        if (!appDescription?.trim()) errors.push("appDescription is required.");
        if (!useCaseDetails?.trim()) errors.push("useCaseDetails is required.");

        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (applicantEmail && !emailRe.test(applicantEmail)) {
            errors.push("applicantEmail is not valid.");
        }

        const validPlans: ApplicationPlan[] = ["free", "basic", "pro", "enterprise"];
        const plan: ApplicationPlan = validPlans.includes(requestedPlan) ? requestedPlan : "free";

        if (errors.length) {
            return NextResponse.json({ error: errors.join(" ") }, { status: 422 });
        }

        await dbConnect();

        // Check for duplicate pending/approved application by the same email + appName
        const duplicate = await CDNApplication.findOne({
            applicantEmail: applicantEmail.trim().toLowerCase(),
            appName: appName.trim(),
            status: { $in: ["pending", "approved"] }
        }).lean();

        if (duplicate) {
            return NextResponse.json(
                {
                    error: "An active application for this app name already exists under your email."
                },
                { status: 409 }
            );
        }

        const doc = await CDNApplication.create({
            applicantName: applicantName.trim(),
            applicantEmail: applicantEmail.trim().toLowerCase(),
            applicantUserId: applicantUserId?.trim() || undefined,
            appName: appName.trim(),
            appDescription: appDescription.trim(),
            appWebsite: appWebsite?.trim() || undefined,
            appGithub: appGithub?.trim() || undefined,
            appOrganisation: appOrganisation?.trim() || undefined,
            requestedPlan: plan,
            expectedMonthlyRequests: expectedMonthlyRequests ? Number(expectedMonthlyRequests) : undefined,
            useCaseDetails: useCaseDetails.trim(),
            status: "pending"
        });

        return NextResponse.json(
            {
                applicationId: doc._id.toString(),
                status: doc.status,
                message: "Application submitted. You will be notified by email once reviewed."
            },
            { status: 201 }
        );
    } catch (err: any) {
        console.error("[CDN Application POST]", err);
        return NextResponse.json({ error: err?.message || "Submission failed." }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();
    if (!email) {
        return NextResponse.json({ error: "?email= parameter is required." }, { status: 400 });
    }

    try {
        await dbConnect();
        const apps = await CDNApplication.find({ applicantEmail: email })
            .select("appName status requestedPlan createdAt rejectionReason")
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({ applications: apps });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || "Query failed." }, { status: 500 });
    }
}
