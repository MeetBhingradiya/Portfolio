/**
 * GET /api/admin/ai-providers/models?provider=github|google|perplexity
 *
 * Fetches the live model list from the configured provider's API
 * using the stored (encrypted) API key.  Admin-only.
 *
 * Returns: { success: true, models: string[] }
 */
import { type NextRequest, NextResponse } from "next/server";
import dbConnect from "@Utils/dbConnect";
import { permissionError, requirePermission } from "@Library/adminApiMiddleware";
import { getAIProviderSettings, AI_PROVIDERS, type AIProviderKey } from "@Models/AIProviderSettings";
import { decryptStoredSecret } from "@Utils/SecretVault";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchGitHubModels(apiKey: string, baseUrl: string): Promise<string[]> {
    const url = `${baseUrl}/models`;
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}`, "api-version": "2024-05-01-preview" },
        cache: "no-store",
    });
    if (!res.ok) throw new Error(`GitHub Models API ${res.status}: ${await res.text()}`);
    const json = await res.json();

    // Azure AI inference returns { data: [{id,…}] } (OpenAI-compatible)
    const items: { id?: string; name?: string }[] =
        Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];

    return items
        .map((m) => (m.id ?? m.name ?? "").trim())
        .filter(Boolean)
        .sort();
}

async function fetchGoogleModels(apiKey: string): Promise<string[]> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=100`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Google AI API ${res.status}: ${await res.text()}`);
    const json = await res.json();

    const items: { name?: string; supportedGenerationMethods?: string[] }[] = json?.models ?? [];

    return items
        .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
        .map((m) => (m.name ?? "").replace(/^models\//, "").trim())
        .filter(Boolean)
        .sort();
}

async function fetchPerplexityModels(apiKey: string): Promise<string[]> {
    const url = "https://api.perplexity.ai/models";
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: "no-store",
    });
    if (!res.ok) throw new Error(`Perplexity API ${res.status}: ${await res.text()}`);
    const json = await res.json();

    const items: { id?: string }[] = Array.isArray(json?.data) ? json.data : [];
    return items
        .map((m) => (m.id ?? "").trim())
        .filter(Boolean)
        .sort();
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const auth = await requirePermission(req, "admin.site.settings");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");

        const provider = req.nextUrl.searchParams.get("provider") as AIProviderKey | null;
        if (!provider || !AI_PROVIDERS[provider]) {
            return NextResponse.json(
                { success: false, error: "Invalid or missing provider query param" },
                { status: 400 }
            );
        }

        const settings = await getAIProviderSettings();
        const config = settings.Providers[provider];
        const apiKey = decryptStoredSecret(config?.apiKey || "");

        if (!apiKey) {
            return NextResponse.json(
                { success: false, error: "No API key configured for this provider" },
                { status: 422 }
            );
        }

        const baseUrl = config.customBaseUrl?.trim() || AI_PROVIDERS[provider].baseUrl;
        let models: string[] = [];

        if (provider === "github") {
            models = await fetchGitHubModels(apiKey, baseUrl);
        } else if (provider === "google") {
            models = await fetchGoogleModels(apiKey);
        } else if (provider === "perplexity") {
            models = await fetchPerplexityModels(apiKey);
        }

        return NextResponse.json({ success: true, models });
    } catch (err: unknown) {
        if (err instanceof Error && err.message === "Forbidden: requires role 'admin'") {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }
        if (err instanceof Error && err.message === "Unauthorized") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error("GET /api/admin/ai-providers/models:", msg);
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}
