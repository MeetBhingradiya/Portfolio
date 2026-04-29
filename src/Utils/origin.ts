const DEFAULT_PRODUCTION_ORIGINS = [
    "https://meetbhingradiya.in",
    "https://www.meetbhingradiya.in",
    "https://beta.meetbhingradiya.in",
    "https://beta.meetbhingradiya.in"
];

const DEFAULT_LOCAL_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"];

const DEFAULT_IMMICH_ORIGINS = [
    "https://photos.meetbhingradiya.in",
    "https://photos.meetbhingradiya.shop",
    "https://home-desktop.tail1c91d0.ts.net",
    "http://bfamily.myftp.org:2283"
];

function normalizeOrigin(value: string): string | null {
    const trimmed = value.trim().replace(/^['\"]|['\"]$/g, "");
    if (!trimmed) return null;

    try {
        const parsed = new URL(trimmed);
        return parsed.origin;
    } catch {
        return null;
    }
}

function normalizeOriginMaybeHost(value: string): string | null {
    const normalized = normalizeOrigin(value);
    if (normalized) return normalized;

    const trimmed = value.trim().replace(/^['\"]|['\"]$/g, "");
    if (!trimmed) return null;

    // Accept hostname-style env values by assuming https.
    return normalizeOrigin(`https://${trimmed}`);
}

function parseOriginList(raw: string | undefined): string[] {
    if (!raw) return [];

    return raw
        .split(",")
        .map((entry) => normalizeOrigin(entry))
        .filter((entry): entry is string => Boolean(entry));
}

function toUnique(items: string[]): string[] {
    return [...new Set(items)];
}

function getEnvOriginCandidates(): string[] {
    const direct = [
        // Use the runtime Vercel host first (preview/branch deployments set VERCEL_URL).
        process.env.VERCEL_URL ? `https://${String(process.env.VERCEL_URL).trim()}` : undefined,
        process.env.APP_ORIGIN,
        process.env.NEXT_PUBLIC_APP_URL,
        // Fallback to the project production URL only after runtime and explicit app values.
        process.env.VERCEL_PROJECT_PRODUCTION_URL
    ]
        .map((value) => normalizeOriginMaybeHost(value ?? ""))
        .filter((value): value is string => Boolean(value));

    return toUnique(direct);
}

export function getTrustedOrigins(): string[] {
    const envTrusted = parseOriginList(process.env.TRUSTED_ORIGINS);
    const envApp = getEnvOriginCandidates();

    const defaults = process.env.NODE_ENV === "production" ? DEFAULT_PRODUCTION_ORIGINS : [...DEFAULT_LOCAL_ORIGINS, ...DEFAULT_PRODUCTION_ORIGINS];

    return toUnique([...envTrusted, ...envApp, ...defaults]);
}

export function getPrimaryOrigin(): string {
    const envCandidates = getEnvOriginCandidates();
    if (envCandidates.length > 0) return envCandidates[0];

    const trusted = getTrustedOrigins();
    return trusted[0] ?? DEFAULT_LOCAL_ORIGINS[0];
}

export function getTrustedOriginSet(): Set<string> {
    return new Set(getTrustedOrigins());
}

export function isTrustedOrigin(origin: string): boolean {
    const normalized = normalizeOrigin(origin);
    if (!normalized) return false;
    return getTrustedOriginSet().has(normalized);
}

export function getImmichOrigins(): string[] {
    const envOrigins = parseOriginList(process.env.IMMICH_TRUSTED_ORIGINS);
    return toUnique([...envOrigins, ...DEFAULT_IMMICH_ORIGINS]);
}
