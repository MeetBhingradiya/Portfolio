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
            productivityEnabled: doc.productivityEnabled ?? true,
            emailPolicies: {
                verificationRateLimitWindowMinutes: doc.emailPolicies?.verificationRateLimitWindowMinutes ?? 720,
                verificationRateLimitMax: doc.emailPolicies?.verificationRateLimitMax ?? 3,
            },
            phonePolicies: {
                maxPhonesPerAccount: doc.phonePolicies?.maxPhonesPerAccount ?? 3,
                maxAccountsPerPhone: doc.phonePolicies?.maxAccountsPerPhone ?? 3,
                otpExpiryMinutes: doc.phonePolicies?.otpExpiryMinutes ?? 5,
                otpMaxAttempts: doc.phonePolicies?.otpMaxAttempts ?? 5,
            },
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
    if (typeof body.productivityEnabled === "boolean") update.productivityEnabled = body.productivityEnabled;

    if (body.emailPolicies && typeof body.emailPolicies === "object") {
        const p = body.emailPolicies;
        if (typeof p.verificationRateLimitWindowMinutes === "number") {
            update["emailPolicies.verificationRateLimitWindowMinutes"] = Math.max(1, Math.floor(p.verificationRateLimitWindowMinutes));
        }
        if (typeof p.verificationRateLimitMax === "number") {
            update["emailPolicies.verificationRateLimitMax"] = Math.max(1, Math.floor(p.verificationRateLimitMax));
        }
    }

    if (body.phonePolicies && typeof body.phonePolicies === "object") {
        const p = body.phonePolicies;
        if (typeof p.maxPhonesPerAccount === "number") {
            update["phonePolicies.maxPhonesPerAccount"] = Math.max(1, Math.floor(p.maxPhonesPerAccount));
        }
        if (typeof p.maxAccountsPerPhone === "number") {
            update["phonePolicies.maxAccountsPerPhone"] = Math.max(1, Math.floor(p.maxAccountsPerPhone));
        }
        if (typeof p.otpExpiryMinutes === "number") {
            update["phonePolicies.otpExpiryMinutes"] = Math.max(1, Math.floor(p.otpExpiryMinutes));
        }
        if (typeof p.otpMaxAttempts === "number") {
            update["phonePolicies.otpMaxAttempts"] = Math.max(1, Math.floor(p.otpMaxAttempts));
        }
    }

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
            productivityEnabled: doc.productivityEnabled,
            emailPolicies: {
                verificationRateLimitWindowMinutes: doc.emailPolicies?.verificationRateLimitWindowMinutes ?? 720,
                verificationRateLimitMax: doc.emailPolicies?.verificationRateLimitMax ?? 3,
            },
            phonePolicies: {
                maxPhonesPerAccount: doc.phonePolicies?.maxPhonesPerAccount ?? 3,
                maxAccountsPerPhone: doc.phonePolicies?.maxAccountsPerPhone ?? 3,
                otpExpiryMinutes: doc.phonePolicies?.otpExpiryMinutes ?? 5,
                otpMaxAttempts: doc.phonePolicies?.otpMaxAttempts ?? 5,
            },
            paymentProviders: redactProviders((doc as any).paymentProviders?.toObject?.() ?? doc.paymentProviders ?? {}),
        },
    });
}
