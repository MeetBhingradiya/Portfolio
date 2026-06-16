import { NextRequest, NextResponse } from "next/server";
import { randomUUID, createHash } from "crypto";
import path from "path";
import { auth } from "@Library/auth";
import dbConnect from "@Utils/dbConnect";
import { CDNAsset } from "@Models/CDNAsset";
import { githubUpload } from "@Utils/GitHubCDN";
import { Config } from "@Config/Client";
import { hasPermission } from "@Library/permissions";

const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

function isBlockedHostname(hostname: string): boolean {
    const lower = hostname.toLowerCase();
    if (lower === "localhost" || lower === "127.0.0.1" || lower === "::1") return true;
    if (lower.endsWith(".local") || lower.endsWith(".internal")) return true;

    const ipv4 = lower.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4) {
        const a = Number(ipv4[1]);
        const b = Number(ipv4[2]);
        if (a === 10) return true;
        if (a === 127) return true;
        if (a === 0) return true;
        if (a === 169 && b === 254) return true;
        if (a === 172 && b >= 16 && b <= 31) return true;
        if (a === 192 && b === 168) return true;
    }

    return false;
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!(await hasPermission(session.user.id, "Users.Avatars.Import"))) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json().catch(() => ({}));
        const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl.trim() : "";
        if (!imageUrl) {
            return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
        }

        let parsed: URL;
        try {
            parsed = new URL(imageUrl);
        } catch {
            return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
        }

        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
            return NextResponse.json({ error: "Only HTTP/HTTPS URLs are allowed" }, { status: 400 });
        }

        if (isBlockedHostname(parsed.hostname)) {
            return NextResponse.json({ error: "That host is not allowed" }, { status: 400 });
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);

        const remoteRes = await fetch(parsed.toString(), {
            method: "GET",
            redirect: "follow",
            signal: controller.signal,
            headers: {
                "User-Agent": "MeetBhingradiya-AvatarImporter/1.0"
            },
            cache: "no-store"
        }).finally(() => clearTimeout(timeout));

        if (!remoteRes.ok) {
            return NextResponse.json({ error: "Failed to fetch image URL" }, { status: 400 });
        }

        const contentType = (remoteRes.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
        if (!ALLOWED_TYPES.has(contentType)) {
            return NextResponse.json(
                {
                    error: `Unsupported image type: ${contentType || "unknown"}`
                },
                { status: 415 }
            );
        }

        const contentLengthRaw = remoteRes.headers.get("content-length");
        if (contentLengthRaw) {
            const declared = Number(contentLengthRaw);
            if (Number.isFinite(declared) && declared > MAX_BYTES) {
                return NextResponse.json({ error: "Remote image is too large" }, { status: 413 });
            }
        }

        const buffer = Buffer.from(await remoteRes.arrayBuffer());
        if (buffer.length === 0) {
            return NextResponse.json({ error: "Fetched image was empty" }, { status: 400 });
        }
        if (buffer.length > MAX_BYTES) {
            return NextResponse.json({ error: "Remote image is too large" }, { status: 413 });
        }

        const extByMime: Record<string, string> = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
            "image/gif": ".gif",
            "image/avif": ".avif"
        };
        const fromPathExt = path.extname(parsed.pathname || "");
        const ext = extByMime[contentType] || fromPathExt || ".jpg";

        const assetId = randomUUID().replace(/-/g, "");
        const githubPath = `uploads/avatars/${assetId}${ext}`;

        const checksumMd5 = createHash("md5").update(buffer).digest("hex");
        const checksumSha256 = createHash("sha256").update(buffer).digest("hex");

        const { sha, repo: githubRepo } = await githubUpload(githubPath, buffer, `cdn: avatar import-url ${session.user.id} [${assetId}]`);

        await dbConnect();
        await CDNAsset.create({
            assetId,
            filename: `avatar-import${ext}`,
            githubRepo,
            githubPath,
            sha,
            checksumMd5,
            checksumSha256,
            mimeType: contentType,
            size: buffer.length,
            type: "avatar",
            tags: ["avatar", "profile", "import-url"],
            context: `user:${session.user.id}`,
            uploadedBy: session.user.id,
            status: "active",
            lastChecked: new Date(),
            lastCheckOk: true,
            checksumVerified: true,
            altText: "Imported profile avatar"
        });

        const cdnUrl = `${Config.Origin}/api/cdn/${assetId}`;

        return NextResponse.json({
            success: true,
            assetId,
            cdnUrl
        });
    } catch (error: any) {
        console.error("[avatar-import-url]", error);
        const message = error?.name === "AbortError" ? "Image URL fetch timed out" : error?.message || "Failed to import image URL";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
