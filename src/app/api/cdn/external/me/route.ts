/**
 * External CDN — Key Info & Usage Stats
 *
 * GET /api/cdn/external/me
 *
 * Returns the authenticated key's metadata, plan, rate-limit policy,
 * and current window usage. Useful for external apps to display a
 * "CDN usage" dashboard to their own users.
 */
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@Utils/dbConnect";
import { CDNRateWindow } from "@Models/CDNRateWindow";
import { validateCDNKey } from "@Utils/CDNKeyAuth";

export async function GET(req: NextRequest) {
    const validation = await validateCDNKey(req);
    if (!validation.ok || !validation.key) {
        return NextResponse.json({ error: validation.error }, { status: validation.status ?? 401 });
    }

    await dbConnect();
    const key = validation.key;

    // Fetch current window usage
    const now = new Date();
    const minuteBucket = buildBucket("minute", now);
    const hourBucket   = buildBucket("hour",   now);
    const dayBucket    = buildBucket("day",    now);

    const [minWin, hourWin, dayWin] = await Promise.all([
        CDNRateWindow.findOne({ keyId: key.keyId, windowType: "minute", bucket: minuteBucket }).lean(),
        CDNRateWindow.findOne({ keyId: key.keyId, windowType: "hour",   bucket: hourBucket   }).lean(),
        CDNRateWindow.findOne({ keyId: key.keyId, windowType: "day",    bucket: dayBucket    }).lean(),
    ]);

    const used = {
        minute: (minWin as any)?.count  ?? 0,
        hour:   (hourWin as any)?.count ?? 0,
        day:    (dayWin  as any)?.count ?? 0,
    };

    return NextResponse.json({
        keyId:          key.keyId,
        keyPrefix:      key.keyPrefix,
        appName:        key.appName,
        plan:           key.plan,
        status:         key.status,
        expiresAt:      key.expiresAt ?? null,
        rateLimit:      key.rateLimit,
        usage: {
            totalRequests:  key.totalRequests,
            totalUploads:   key.totalUploads,
            totalDownloads: key.totalDownloads,
            lastUsedAt:     key.lastUsedAt ?? null,
            currentWindows: {
                minute: { used: used.minute, limit: key.rateLimit.requestsPerMinute, remaining: Math.max(0, key.rateLimit.requestsPerMinute - used.minute) },
                hour:   { used: used.hour,   limit: key.rateLimit.requestsPerHour,   remaining: Math.max(0, key.rateLimit.requestsPerHour   - used.hour)   },
                day:    { used: used.day,     limit: key.rateLimit.requestsPerDay,    remaining: Math.max(0, key.rateLimit.requestsPerDay    - used.day)    },
            },
        },
    });
}

function buildBucket(type: "minute" | "hour" | "day", d: Date): string {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const Y = d.getUTCFullYear(), M = pad(d.getUTCMonth() + 1), D = pad(d.getUTCDate());
    const H = pad(d.getUTCHours()), Min = pad(d.getUTCMinutes());
    if (type === "minute") return `${Y}-${M}-${D}T${H}:${Min}`;
    if (type === "hour")   return `${Y}-${M}-${D}T${H}`;
    return `${Y}-${M}-${D}`;
}
