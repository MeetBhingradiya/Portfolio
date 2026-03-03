/**
 * User CDN Key Rotation
 *
 * POST /api/cdn/my-keys/[keyId]/rotate
 *
 * Revokes the existing key and issues a fresh one with the same plan & rate limits.
 * The NEW raw key is returned **once** — the user must save it immediately.
 */
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getSession } from "@/Library/auth";
import dbConnect from "@Utils/dbConnect";
import { CDNAPIKey } from "@Models/CDNAPIKey";
import { CDNRateWindow } from "@Models/CDNRateWindow";
import { hashAPIKey } from "@Utils/CDNKeyAuth";
import { sendEmail, cdnKeyIssuedEmail } from "@Utils/Email";

type Params = { params: Promise<{ keyId: string }> };

function generateRawKey(): string { return `cdn_${randomBytes(24).toString("hex")}`; }
function generateKeyId(): string  { return `key_${randomBytes(8).toString("hex")}`; }

export async function POST(req: NextRequest, { params }: Params) {
    try {
        const session = await getSession(req.headers);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Authentication required." }, { status: 401 });
        }
        const email = session.user.email.toLowerCase();

        await dbConnect();
        const { keyId } = await params;

        // Verify ownership
        const existingKey = await CDNAPIKey.findOne({ keyId, applicantEmail: email });
        if (!existingKey) {
            return NextResponse.json({ error: "Key not found or not owned by your account." }, { status: 404 });
        }
        if (existingKey.status !== "active") {
            return NextResponse.json({ error: `Key is ${existingKey.status} and cannot be rotated.` }, { status: 409 });
        }

        // Revoke old key
        existingKey.status     = "revoked";
        existingKey.revokedAt  = new Date();
        existingKey.revokeReason = "User-initiated rotation";
        await existingKey.save();

        // Purge old rate windows
        await CDNRateWindow.deleteMany({ keyId });

        // Issue new key
        const rawKey    = generateRawKey();
        const newKeyId  = generateKeyId();
        const keyHash   = hashAPIKey(rawKey);
        const keyPrefix = rawKey.slice(0, 12);

        const newKey = await CDNAPIKey.create({
            keyId          : newKeyId,
            keyHash,
            keyPrefix,
            applicationId  : existingKey.applicationId,
            appName        : existingKey.appName,
            applicantEmail : email,
            plan           : existingKey.plan,
            rateLimit      : existingKey.rateLimit,
            issuedBy       : `user:${email}`,
            notes          : `Rotated from ${keyId}`,
        });

        // Email new key — fire & forget
        sendEmail({
            to     : email,
            subject: `CDN API Key Rotated — ${existingKey.appName}`,
            html   : cdnKeyIssuedEmail({
                appName      : existingKey.appName,
                applicantName: session.user.name || email,
                plan         : existingKey.plan,
                rawKey,
                keyPrefix,
            }),
        }).catch(err => console.error("[CDN rotate email]", err));

        return NextResponse.json({
            message  : "Key rotated successfully. Store the new key — it cannot be retrieved again.",
            newKeyId : newKey.keyId,
            keyPrefix,
            rawKey,
        });
    } catch (err: any) {
        console.error("[CDN my-keys rotate POST]", err);
        return NextResponse.json({ error: err?.message || "Failed." }, { status: 500 });
    }
}
