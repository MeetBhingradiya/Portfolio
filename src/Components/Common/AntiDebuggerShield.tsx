"use client";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║           ANTI-DEBUGGER SHIELD — React Integration Layer            ║
 * ║                                                                      ║
 * ║  Drop this component once at the root layout.  It activates the     ║
 * ║  AntiDebuggerEngine on the CLIENT only (never SSR) and reacts to    ║
 * ║  confirmed threats with configurable countermeasures.                ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * COUNTERMEASURES APPLIED ON DETECTION
 * ──────────────────────────────────────
 *  1. Emit an obfuscated beacon to /api/security/debugger-trap (server log).
 *  2. Clear sensitive values from localStorage / sessionStorage.
 *  3. Freeze the page (document.documentElement.innerHTML = "") so scrapers
 *     can't harvest content after bypassing the redirect.
 *  4. Check /api/security/site-status:
 *       • Maintenance ON  → redirect to /maintenance.
 *       • Maintenance OFF → redirect to the referrer (back page) or / (home).
 *
 * PRODUCTION ONLY
 * ───────────────
 * The shield is a no-op in development (NODE_ENV !== "production") so you
 * can develop normally.  Set NEXT_PUBLIC_ANTI_DEBUG=true in your .env to
 * force it on in any environment for testing.
 */

import { useEffect } from "react";
import { antiDebugger } from "@Utils/AntiDebugger";

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Helpers                                                                     */
/* ─────────────────────────────────────────────────────────────────────────── */

/** Wipe browser storage so session/auth tokens can't be harvested. */
function wipeClientStorage(): void {
    try {
        localStorage.clear();
        sessionStorage.clear();
    } catch {
        /* ignore — may be denied in third-party context */
    }
}

/** Fire a silent beacon to our own API for server-side logging. */
async function emitBeacon(detail: string): Promise<void> {
    try {
        // Use sendBeacon so it survives page navigation/redirect
        const body = JSON.stringify({
            // Encode the detail so naive log scrapers miss it
            _d: btoa(detail),
            _t: Date.now(),
            _u: location.pathname,
        });

        const sent = navigator.sendBeacon(
            "/api/security/debugger-trap",
            new Blob([body], { type: "application/json" })
        );

        if (!sent) {
            // sendBeacon failed — fall back to fetch (best-effort)
            fetch("/api/security/debugger-trap", {
                method: "POST",
                keepalive: true,
                body,
                headers: { "Content-Type": "application/json" },
            }).catch(() => { });
        }
    } catch {
        /* network failure — swallow silently */
    }
}

/**
 * Resolve where to send the user after a threat is confirmed.
 *  • Maintenance ON  → /maintenance
 *  • Maintenance OFF → referrer (the page they came from) or / (home)
 */
async function resolveRedirectTarget(): Promise<string> {
    try {
        const res = await fetch("/api/security/site-status", {
            method: "GET",
            cache: "no-store",
        });
        if (res.ok) {
            const data = (await res.json()) as { maintenanceMode: boolean };
            if (data.maintenanceMode) return "/maintenance";
        }
    } catch {
        /* network error — fall through to home */
    }

    // Not in maintenance — go back to the previous page or home
    const referrer = document.referrer;
    if (referrer) {
        try {
            const ref = new URL(referrer);
            // Only use the referrer if it is same-origin (security)
            if (ref.origin === location.origin) return ref.pathname + ref.search;
        } catch {
            /* malformed referrer */
        }
    }

    return "/";
}

/** React to a confirmed threat. */
function handleThreat(detail: string): void {
    // 1. Emit beacon FIRST (survives redirect)
    emitBeacon(detail).catch(() => { });

    // 2. Wipe sensitive client-side storage
    wipeClientStorage();

    // 3. Destroy page content immediately (defeats scrapers)
    try {
        document.documentElement.innerHTML =
            "<html><head><title>403</title></head><body></body></html>";
    } catch {
        /* already navigating */
    }

    // 4. Resolve target then navigate — small timeout so beacon can be sent
    resolveRedirectTarget().then((target) => {
        setTimeout(() => {
            try {
                location.replace(target);
            } catch {
                location.href = target;
            }
        }, 200);
    });
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Component                                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

export default function AntiDebuggerShield(): null {
    useEffect(() => {
        // ── Guard: only activate in production (or when forced) ──────────
        const forceOn = process.env.ANTI_DEBUG === "true";
        const isProd = process.env.NODE_ENV === "production";

        if (!isProd && !forceOn) return;

        // ── Start the engine ─────────────────────────────────────────────
        antiDebugger.start((report) => {
            handleThreat(
                `ch=${report.channel} | ${report.detail} | ts=${report.ts}`
            );
        });

        // ── Cleanup on unmount ───────────────────────────────────────────
        return () => {
            antiDebugger.stop();
        };
    }, []); // run once on mount

    // This component renders nothing — it is a pure side-effect hook
    return null;
}
