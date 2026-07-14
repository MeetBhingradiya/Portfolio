/**
 * Admin API — GET /api/admin/maintenance  (fetch status + get bypass cookie)
 *           — POST /api/admin/maintenance (toggle maintenance mode)
 * Requires admin authentication.
 *
 * The bypass cookie `x_admin_bypass` lets Edge middleware identify admins
 * without hitting the database on every request.
 */

import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import dbConnect from "@/Utils/dbConnect";
import { getSession } from "@Library/auth";
import { permissionError, requirePermission } from "@Library/adminApiMiddleware";
import { SiteSettings_Model, getSiteSettings } from "@Models/SiteSettings";

const SINGLETON_ID = "site_settings_singleton";
const BYPASS_COOKIE = "x_admin_bypass";
const BYPASS_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/** Create a signed bypass JWT for Edge middleware */
async function makeBypassToken(): Promise<string> {
    const secret = new TextEncoder().encode(process.env.ADMIN_SIGNATURE || process.env.BETTER_AUTH_SECRET || "fallback-secret-change-me");
    return new SignJWT({ isAdmin: true }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").setIssuedAt().sign(secret);
}

function setBypassCookie(response: NextResponse, token: string) {
    response.cookies.set(BYPASS_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: BYPASS_MAX_AGE
    });
}

function clearBypassCookie(response: NextResponse) {
    response.cookies.set(BYPASS_COOKIE, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0
    });
}

/** GET — return current status and refresh admin bypass cookie */
export async function GET(req: NextRequest) {
    try {
        const auth = await requirePermission(req, "admin.site.settings");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
        await dbConnect();

        const settings = await getSiteSettings();
        const bypassToken = await makeBypassToken();

        const response = NextResponse.json({
            success: true,
            maintenanceMode: settings.maintenanceMode,
            maintenanceMessage: settings.maintenanceMessage,
            updatedAt: settings.updatedAt
        });

        // Always refresh the admin bypass cookie on GET
        setBypassCookie(response, bypassToken);
        return response;
    } catch (err: any) {
        if (err?.message === "Forbidden: Admin only") {
            return NextResponse.json({ success: false, error: "Admin only" }, { status: 403 });
        }
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

/** POST — toggle or set maintenance mode */
export async function POST(req: NextRequest) {
    try {
        const auth = await requirePermission(req, "admin.site.settings");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
        await dbConnect();

        const body = await req.json();
        const { maintenanceMode, maintenanceMessage } = body as {
            maintenanceMode: boolean;
            maintenanceMessage?: string;
        };

        if (typeof maintenanceMode !== "boolean") {
            return NextResponse.json(
                {
                    success: false,
                    error: "maintenanceMode (boolean) is required"
                },
                { status: 400 }
            );
        }

        const session = await getSession(req.headers);
        const updatedBy = session?.user?.email || "admin";

        const updated = await SiteSettings_Model.findOneAndUpdate(
            { ConfigID: SINGLETON_ID },
            {
                $set: {
                    maintenanceMode,
                    ...(maintenanceMessage !== undefined ? { maintenanceMessage } : {}),
                    maintenanceUpdatedBy: updatedBy
                }
            },
            { upsert: true, new: true }
        );

        if (!updated) {
            return NextResponse.json({ success: false, error: "Failed to update settings" }, { status: 500 });
        }

        const response = NextResponse.json({
            success: true,
            maintenanceMode: updated.maintenanceMode,
            maintenanceMessage: updated.maintenanceMessage,
            message: maintenanceMode
                ? "Maintenance mode ENABLED — site is now in maintenance"
                : "Maintenance mode DISABLED — site is live again"
        });

        if (maintenanceMode) {
            // Give admin the bypass cookie so they can still browse
            const bypassToken = await makeBypassToken();
            setBypassCookie(response, bypassToken);
        } else {
            // Maintenance off — clear the bypass cookie (no longer needed)
            clearBypassCookie(response);
        }

        return response;
    } catch (err: any) {
        if (err?.message === "Forbidden: Admin only") {
            return NextResponse.json({ success: false, error: "Admin only" }, { status: 403 });
        }
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
