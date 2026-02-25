/**
 * POST /api/security/debugger-trap
 * ────────────────────────────────
 * Receives beacon payloads from AntiDebuggerShield when a threat is detected
 * client-side.  Logs them server-side for visibility and applies rate-limiting
 * so this endpoint cannot be used as a flood / enumeration vector.
 *
 * Payload (JSON):
 *   { _d: string (base64-encoded detail), _t: number (unix ms), _u: string (path) }
 */

import { type NextRequest, NextResponse } from "next/server";

/* ── Rate limit (per-IP, in-memory, resets on cold start) ─────────────── */

const WINDOW_MS = 60_000; // 1 minute
const MAX_PER_WINDOW = 5; // max 5 reports per IP per minute

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
        return false;
    }

    if (entry.count >= MAX_PER_WINDOW) return true;

    entry.count++;
    return false;
}

/* ── Handler ─────────────────────────────────────────────────────────── */

export async function POST(req: NextRequest): Promise<NextResponse> {
    // Derive IP (Vercel / standard headers)
    const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        req.headers.get("x-real-ip") ??
        "unknown";

    // Rate limit
    if (isRateLimited(ip)) {
        return NextResponse.json({ ok: false }, { status: 429 });
    }

    // Parse body
    let body: { _d?: string; _t?: number; _u?: string } = {};
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ ok: false }, { status: 400 });
    }

    // Decode the base64 detail
    let detail = "[decode error]";
    try {
        detail = atob(body._d ?? "");
    } catch {
        /* keep default */
    }

    // Sanitise path (no XSS in logs)
    const path = String(body._u ?? "").slice(0, 120).replace(/[^\w\-/?.=]/g, "");
    const ts = typeof body._t === "number" ? new Date(body._t).toISOString() : "?";

    // Server-side log (visible in Vercel function logs / your log aggregator)
    console.warn(
        `[AntiDebugger] THREAT DETECTED | ip=${ip} | path=${path} | ts=${ts} | detail=${detail}`
    );

    return NextResponse.json({ ok: true }, { status: 200 });
}

/* ── Disallow all other methods ──────────────────────────────────────── */

export async function GET(): Promise<NextResponse> {
    return NextResponse.json({ ok: false }, { status: 405 });
}
