const DEFAULT_BETA_ORIGINS = [
    "https://beta.meetbhingradiya.in",
    "https://beta.meetbhingradiya.vercel.app"
];

const DEFAULT_PRODUCTION_ORIGINS = [
    "https://www.meetbhingradiya.in",
    "https://meetbhingradiya.in", // Currently redirects to www, but keep for legacy support.
    "https://meetbhingradiya.vercel.app", // Domain expire fallback, should not be used in production but keep for legacy support.
    ...DEFAULT_BETA_ORIGINS
];

const DEFAULT_LOCAL_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
];

const DEFAULT_IMMICH_ORIGINS = [
    "https://photos.meetbhingradiya.in",
    "https://home-desktop.tail1c91d0.ts.net",
    "http://bfamily.myftp.org:2283",
    "http://localhost:2283"
];

type CachedValue<T> = {
    key: string;
    value: T;
};

let trustedOriginsCache: CachedValue<string[]> | null = null;
let trustedOriginSetCache: CachedValue<Set<string>> | null = null;
let primaryOriginCache: CachedValue<string> | null = null;
let immichOriginsCache: CachedValue<string[]> | null = null;

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

function getPrimaryOriginCacheKey(): string {
    return process.env.VERCEL_ENV ?? "";
}

function getTrustedOriginsCacheKey(): string {
    return [process.env.NODE_ENV ?? "", process.env.VERCEL_ENV ?? "", process.env.TRUSTED_ORIGINS ?? ""].join("|");
}

function getImmichOriginsCacheKey(): string {
    return process.env.IMMICH_TRUSTED_ORIGINS ?? "";
}

function buildTrustedOrigins(): string[] {
    const envTrusted = parseOriginList(process.env.TRUSTED_ORIGINS);
    const defaults =
        process.env.NODE_ENV === "production"
            ? DEFAULT_PRODUCTION_ORIGINS
            : [...DEFAULT_LOCAL_ORIGINS, ...DEFAULT_PRODUCTION_ORIGINS];

    return toUnique([...envTrusted, getPrimaryOrigin(), ...defaults]);
}

function buildImmichOrigins(): string[] {
    const envOrigins = parseOriginList(process.env.IMMICH_TRUSTED_ORIGINS);
    return toUnique([...envOrigins, ...DEFAULT_IMMICH_ORIGINS]);
}

export function getTrustedOrigins(): string[] {
    const cacheKey = getTrustedOriginsCacheKey();
    if (trustedOriginsCache?.key === cacheKey) {
        return trustedOriginsCache.value;
    }

    const value = buildTrustedOrigins();
    trustedOriginsCache = { key: cacheKey, value };
    trustedOriginSetCache = null;
    return value;
}

export function getPrimaryOrigin(): string {
    const cacheKey = getPrimaryOriginCacheKey();
    if (primaryOriginCache?.key === cacheKey) {
        return primaryOriginCache.value;
    }

    let value = DEFAULT_PRODUCTION_ORIGINS[0];

    if (process.env.VERCEL_ENV === "preview" && process.env.NODE_ENV === "production") {
        value = DEFAULT_BETA_ORIGINS[0];
    }

    if (process.env.NODE_ENV === "development" && process.env.VERCEL_ENV === "development") {
        value = DEFAULT_LOCAL_ORIGINS[0];
    }

    const normalized: string = normalizeOrigin(value) as string;
    primaryOriginCache = { key: cacheKey, value: normalized };
    trustedOriginsCache = null;
    trustedOriginSetCache = null;
    return normalized;
}

export function isTrustedOrigin(origin: string): boolean {
    const normalized = normalizeOrigin(origin);
    if (!normalized) return false;

    const cacheKey = getTrustedOriginsCacheKey();
    if (trustedOriginSetCache?.key !== cacheKey) {
        trustedOriginSetCache = {
            key: cacheKey,
            value: new Set(getTrustedOrigins())
        };
    }

    return trustedOriginSetCache.value.has(normalized);
}

export function getImmichOrigins(): string[] {
    const cacheKey = getImmichOriginsCacheKey();
    if (immichOriginsCache?.key === cacheKey) {
        return immichOriginsCache.value;
    }

    const value = buildImmichOrigins();
    immichOriginsCache = { key: cacheKey, value };
    return value;
}
