/**
 * POST /api/admin/sitemap/seed
 * Seeds all static pages from the sitemap.xml route into the SitemapEntry
 * collection so admins can manage priorities, frequencies, and visibility.
 * Existing entries are left untouched (upsert by Endpoint).
 */
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@Utils/dbConnect";
import { SitemapEntry_Model } from "@Models/Portfolio";
import { permissionError, requirePermission } from "@Library/adminApiMiddleware";

const STATIC_PAGES: {
    Endpoint: string;
    Frequency: string;
    Priority: number;
    Group: string;
}[] = [
    // ── Main ──────────────────────────────────────────────────────
    { Endpoint: "/", Frequency: "weekly", Priority: 1.0, Group: "main" },
    {
        Endpoint: "/projects",
        Frequency: "weekly",
        Priority: 0.9,
        Group: "main"
    },
    { Endpoint: "/blogs", Frequency: "daily", Priority: 0.9, Group: "main" },
    {
        Endpoint: "/timeline",
        Frequency: "monthly",
        Priority: 0.7,
        Group: "main"
    },
    {
        Endpoint: "/experience",
        Frequency: "monthly",
        Priority: 0.7,
        Group: "main"
    },
    { Endpoint: "/contact", Frequency: "yearly", Priority: 0.7, Group: "main" },
    {
        Endpoint: "/dashboard",
        Frequency: "weekly",
        Priority: 0.6,
        Group: "main"
    },
    {
        Endpoint: "/sitemap",
        Frequency: "monthly",
        Priority: 0.4,
        Group: "main"
    },
    // ── Tools ─────────────────────────────────────────────────────
    { Endpoint: "/tools", Frequency: "weekly", Priority: 0.8, Group: "tools" },
    {
        Endpoint: "/tools/colour",
        Frequency: "yearly",
        Priority: 0.5,
        Group: "tools"
    },
    {
        Endpoint: "/tools/encrypt",
        Frequency: "yearly",
        Priority: 0.5,
        Group: "tools"
    },
    {
        Endpoint: "/tools/image",
        Frequency: "yearly",
        Priority: 0.5,
        Group: "tools"
    },
    {
        Endpoint: "/tools/json",
        Frequency: "yearly",
        Priority: 0.5,
        Group: "tools"
    },
    {
        Endpoint: "/tools/jwt",
        Frequency: "yearly",
        Priority: 0.5,
        Group: "tools"
    },
    {
        Endpoint: "/tools/markdown",
        Frequency: "yearly",
        Priority: 0.5,
        Group: "tools"
    },
    {
        Endpoint: "/tools/password",
        Frequency: "yearly",
        Priority: 0.5,
        Group: "tools"
    },
    {
        Endpoint: "/tools/pdf",
        Frequency: "yearly",
        Priority: 0.5,
        Group: "tools"
    },
    {
        Endpoint: "/tools/qr",
        Frequency: "yearly",
        Priority: 0.5,
        Group: "tools"
    },
    {
        Endpoint: "/tools/regexp",
        Frequency: "yearly",
        Priority: 0.5,
        Group: "tools"
    },
    {
        Endpoint: "/tools/todo",
        Frequency: "yearly",
        Priority: 0.5,
        Group: "tools"
    },
    {
        Endpoint: "/tools/uuid",
        Frequency: "yearly",
        Priority: 0.5,
        Group: "tools"
    },
    {
        Endpoint: "/tools/instagram",
        Frequency: "yearly",
        Priority: 0.5,
        Group: "tools"
    },
    // ── Legal ─────────────────────────────────────────────────────
    {
        Endpoint: "/privacy",
        Frequency: "yearly",
        Priority: 0.3,
        Group: "legal"
    },
    { Endpoint: "/terms", Frequency: "yearly", Priority: 0.3, Group: "legal" },
    {
        Endpoint: "/agreements/security",
        Frequency: "yearly",
        Priority: 0.3,
        Group: "legal"
    },
    {
        Endpoint: "/agreements/covered-products-privacy",
        Frequency: "yearly",
        Priority: 0.3,
        Group: "legal"
    },
    {
        Endpoint: "/agreements/covered-products-terms",
        Frequency: "yearly",
        Priority: 0.3,
        Group: "legal"
    },
    // ── Auth ──────────────────────────────────────────────────────
    {
        Endpoint: "/auth/signin",
        Frequency: "yearly",
        Priority: 0.3,
        Group: "auth"
    },
    {
        Endpoint: "/auth/signup",
        Frequency: "yearly",
        Priority: 0.3,
        Group: "auth"
    },
    {
        Endpoint: "/auth/forgot-password",
        Frequency: "yearly",
        Priority: 0.3,
        Group: "auth"
    },
    {
        Endpoint: "/auth/error",
        Frequency: "yearly",
        Priority: 0.2,
        Group: "auth"
    },
    // ── Shop ──────────────────────────────────────────────────────
    { Endpoint: "/shop", Frequency: "daily", Priority: 0.9, Group: "shop" },
    { Endpoint: "/shop/cart", Frequency: "daily", Priority: 0.6, Group: "shop" },
    { Endpoint: "/shop/checkout", Frequency: "daily", Priority: 0.6, Group: "shop" },
    { Endpoint: "/shop/orders", Frequency: "weekly", Priority: 0.5, Group: "shop" },
    { Endpoint: "/shop/refunds", Frequency: "weekly", Priority: 0.4, Group: "shop" },
    { Endpoint: "/shop/refunds/new", Frequency: "monthly", Priority: 0.4, Group: "shop" },
    // ── Support & Tickets ─────────────────────────────────────────
    { Endpoint: "/support", Frequency: "weekly", Priority: 0.7, Group: "support" },
    { Endpoint: "/support/tickets", Frequency: "weekly", Priority: 0.5, Group: "support" },
    { Endpoint: "/support/tickets/new", Frequency: "monthly", Priority: 0.5, Group: "support" },
    // ── Trade Journal & Advanced ──────────────────────────────────
    { Endpoint: "/trade-journal", Frequency: "daily", Priority: 0.8, Group: "main" },
    { Endpoint: "/trade-journal/analytics", Frequency: "daily", Priority: 0.7, Group: "main" },
    { Endpoint: "/trade-journal/daily-capital", Frequency: "daily", Priority: 0.7, Group: "main" },
    { Endpoint: "/trade-journal/new", Frequency: "weekly", Priority: 0.6, Group: "main" },
    { Endpoint: "/paresh/tradingrules", Frequency: "monthly", Priority: 0.5, Group: "main" },
    { Endpoint: "/developer/cdn", Frequency: "monthly", Priority: 0.5, Group: "tools" },
    { Endpoint: "/employee", Frequency: "monthly", Priority: 0.5, Group: "main" },
    { Endpoint: "/immich-sso", Frequency: "monthly", Priority: 0.4, Group: "main" },
    // ── More Tools ────────────────────────────────────────────────
    { Endpoint: "/tools/paperknife", Frequency: "weekly", Priority: 0.8, Group: "tools" },
    { Endpoint: "/tools/productivity", Frequency: "weekly", Priority: 0.8, Group: "tools" },
    { Endpoint: "/tools/productivity/goals", Frequency: "weekly", Priority: 0.6, Group: "tools" },
    { Endpoint: "/tools/productivity/habits", Frequency: "weekly", Priority: 0.6, Group: "tools" },
    { Endpoint: "/tools/productivity/reminders", Frequency: "weekly", Priority: 0.6, Group: "tools" },
    { Endpoint: "/tools/productivity/tasks", Frequency: "weekly", Priority: 0.6, Group: "tools" },
    // ── Profile / Settings ────────────────────────────────────────
    {
        Endpoint: "/settings",
        Frequency: "yearly",
        Priority: 0.3,
        Group: "settings"
    },
    {
        Endpoint: "/profile",
        Frequency: "monthly",
        Priority: 0.5,
        Group: "settings"
    },
    {
        Endpoint: "/bookmarks",
        Frequency: "weekly",
        Priority: 0.4,
        Group: "settings"
    },
    {
        Endpoint: "/wallet",
        Frequency: "weekly",
        Priority: 0.4,
        Group: "settings"
    },
    {
        Endpoint: "/financial",
        Frequency: "weekly",
        Priority: 0.4,
        Group: "settings"
    },
    {
        Endpoint: "/tickets",
        Frequency: "weekly",
        Priority: 0.4,
        Group: "settings"
    },
    {
        Endpoint: "/timetable",
        Frequency: "monthly",
        Priority: 0.4,
        Group: "settings"
    }
];

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const auth = await requirePermission(req, "content.sitemap.manage");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");

        const Model = SitemapEntry_Model();

        const ops = STATIC_PAGES.map((page) => ({
            updateOne: {
                filter: { Endpoint: page.Endpoint },
                update: {
                    $setOnInsert: {
                        Endpoint: page.Endpoint,
                        Priority: page.Priority,
                        Frequency: page.Frequency,
                        Group: page.Group,
                        Enabled: true,
                        LastModified: new Date()
                    }
                },
                upsert: true
            }
        }));

        const result = await Model.bulkWrite(ops as any);

        return NextResponse.json({
            success: true,
            message: `Seeded ${STATIC_PAGES.length} pages. ${result.upsertedCount} new, ${result.matchedCount} already existed.`,
            upserted: result.upsertedCount,
            existing: result.matchedCount,
            total: STATIC_PAGES.length
        });
    } catch (err: any) {
        const status = err.message?.includes("Forbidden") ? 403 : err.message?.includes("Unauthorized") ? 401 : 500;
        return NextResponse.json({ success: false, error: err.message }, { status });
    }
}
