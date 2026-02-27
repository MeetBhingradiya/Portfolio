/**
 * GET  /api/admin/features  — read site feature flags
 * PATCH /api/admin/features  — update feature flags (admin only)
 *
 * Never expose secretKey values in GET responses.
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdmin } from "@/Utils/RolePermissions";
import dbConnect from "@/Utils/dbConnect";
import { SiteSettings_Model, getSiteSettings } from "@/Models/SiteSettings";

function redactProviders(providers: Record<string, any>) {
    const out: Record<string, any> = {};
    for (const [key, val] of Object.entries(providers ?? {})) {
        out[key] = {
            enabled: val?.enabled ?? false,
            publicKey: val?.publicKey ?? "",
            // Never send secret key to client
            secretKeySet: !!(val?.secretKey),
            extra: val?.extra ?? {},
        };
    }
    return out;
}

export async function GET() {
    try {
        await requireAdmin(await headers());
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: e.message === "Unauthorized" ? 401 : 403 });
    }
    await dbConnect();
    const doc = await getSiteSettings();
    return NextResponse.json({
        success: true,
        data: {
            allowSignup: doc.allowSignup ?? true,
            shopEnabled: doc.shopEnabled ?? false,
            paymentProviders: redactProviders((doc as any).paymentProviders?.toObject?.() ?? doc.paymentProviders ?? {}),
        },
    });
}

export async function PATCH(req: NextRequest) {
    try {
        await requireAdmin(await headers());
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: e.message === "Unauthorized" ? 401 : 403 });
    }
    await dbConnect();

    const body = await req.json();
    const update: Record<string, any> = {};

    if (typeof body.allowSignup === "boolean")  update.allowSignup  = body.allowSignup;
    if (typeof body.shopEnabled === "boolean")   update.shopEnabled  = body.shopEnabled;

    // Partial payment provider updates — only update supplied fields, never overwrite all
    const PROVIDERS = ["stripe", "razorpay", "paypal", "lemonSqueezy", "paddle"];
    if (body.paymentProviders && typeof body.paymentProviders === "object") {
        for (const name of PROVIDERS) {
            const prov = body.paymentProviders[name];
            if (!prov) continue;
            if (typeof prov.enabled === "boolean")
                update[`paymentProviders.${name}.enabled`] = prov.enabled;
            if (typeof prov.publicKey === "string")
                update[`paymentProviders.${name}.publicKey`] = prov.publicKey;
            // Only overwrite secretKey if explicitly provided and non-empty
            if (typeof prov.secretKey === "string" && prov.secretKey.length > 0)
                update[`paymentProviders.${name}.secretKey`] = prov.secretKey;
            if (prov.extra && typeof prov.extra === "object")
                update[`paymentProviders.${name}.extra`] = prov.extra;
        }
    }

    const doc = await SiteSettings_Model.findOneAndUpdate(
        { ConfigID: "site_settings_singleton" },
        { $set: update },
        { upsert: true, new: true }
    );

    return NextResponse.json({
        success: true,
        data: {
            allowSignup: doc.allowSignup,
            shopEnabled: doc.shopEnabled,
            paymentProviders: redactProviders((doc as any).paymentProviders?.toObject?.() ?? doc.paymentProviders ?? {}),
        },
    });
}
