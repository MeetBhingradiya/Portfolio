/**
 * GET   /api/admin/ai-providers   – get AI provider settings (redacted)
 * PATCH /api/admin/ai-providers   – update AI provider settings
 */
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@Utils/dbConnect";
import { permissionError, requirePermission } from "@Library/adminApiMiddleware";
import {
    AIProviderSettings_Model,
    getAIProviderSettings,
    AI_PROVIDERS,
    type AIProviderKey,
} from "@Models/AIProviderSettings";

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest) {
    try {
        await dbConnect();
        const auth = await requirePermission(_req, "admin.site.settings");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");

        const settings = await getAIProviderSettings();
        const obj = settings.toObject();

        // Redact API keys — never return to client
        const providers = { ...obj.Providers };
        for (const key of Object.keys(providers) as AIProviderKey[]) {
            if (providers[key]?.apiKey) {
                (providers[key] as Record<string, unknown>).apiKey = "••••••••";
                (providers[key] as Record<string, unknown>).hasApiKey = true;
            } else {
                (providers[key] as Record<string, unknown>).hasApiKey = false;
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                ...obj,
                Providers: providers,
                availableProviders: AI_PROVIDERS,
            },
        });
    } catch (err: unknown) {
        if (err instanceof Error && err.message === "Forbidden: requires role 'admin'") {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }
        if (err instanceof Error && err.message === "Unauthorized") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        console.error("GET /api/admin/ai-providers:", err);
        return NextResponse.json({ success: false, error: "Failed to fetch AI settings" }, { status: 500 });
    }
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
    try {
        await dbConnect();
        const auth = await requirePermission(req, "admin.site.settings");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
        const admin = auth.session?.user;
        if (!admin) return permissionError(401, "Unauthorized: Not authenticated");

        const body = await req.json();
        const { ActiveProvider, Providers, Features, RateLimitPerUser } = body as {
            ActiveProvider?: AIProviderKey;
            Providers?: Record<AIProviderKey, {
                enabled?: boolean;
                apiKey?: string;
                activeModel?: string;
                customBaseUrl?: string;
            }>;
            Features?: Record<string, boolean>;
            RateLimitPerUser?: { dailyRequests?: number; monthlyRequests?: number };
        };

        const settings = await getAIProviderSettings();
        const updateSet: Record<string, unknown> = { LastUpdatedBy: admin.email };

        if (ActiveProvider && Object.keys(AI_PROVIDERS).includes(ActiveProvider)) {
            updateSet.ActiveProvider = ActiveProvider;
        }

        if (Providers) {
            for (const providerKey of Object.keys(Providers) as AIProviderKey[]) {
                if (!Object.keys(AI_PROVIDERS).includes(providerKey)) continue;
                const incoming = Providers[providerKey];

                if (typeof incoming.enabled === "boolean") {
                    updateSet[`Providers.${providerKey}.enabled`] = incoming.enabled;
                }
                if (incoming.activeModel) {
                    updateSet[`Providers.${providerKey}.activeModel`] = incoming.activeModel;
                }
                if (incoming.customBaseUrl !== undefined) {
                    updateSet[`Providers.${providerKey}.customBaseUrl`] = incoming.customBaseUrl;
                }
                // Only update apiKey if a non-empty value is provided
                if (incoming.apiKey && incoming.apiKey.trim() && !incoming.apiKey.includes("•")) {
                    updateSet[`Providers.${providerKey}.apiKey`] = incoming.apiKey.trim();
                }
            }
        }

        if (Features) {
            for (const [feature, value] of Object.entries(Features)) {
                if (typeof value === "boolean") {
                    updateSet[`Features.${feature}`] = value;
                }
            }
        }

        if (RateLimitPerUser) {
            if (typeof RateLimitPerUser.dailyRequests === "number") {
                updateSet["RateLimitPerUser.dailyRequests"] = RateLimitPerUser.dailyRequests;
            }
            if (typeof RateLimitPerUser.monthlyRequests === "number") {
                updateSet["RateLimitPerUser.monthlyRequests"] = RateLimitPerUser.monthlyRequests;
            }
        }

        await AIProviderSettings_Model.updateOne(
            { ConfigID: "ai_provider_settings_singleton" },
            { $set: updateSet },
            { upsert: true }
        );

        return NextResponse.json({ success: true, message: "AI provider settings updated" });
    } catch (err: unknown) {
        if (err instanceof Error && err.message === "Forbidden: requires role 'admin'") {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }
        if (err instanceof Error && err.message === "Unauthorized") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        console.error("PATCH /api/admin/ai-providers:", err);
        return NextResponse.json({ success: false, error: "Failed to update AI settings" }, { status: 500 });
    }
}
