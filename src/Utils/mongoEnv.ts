const MONGO_ENV_KEY_PATTERN = /^MONGODB_(\d+)$/i;

function normalizeMongoUri(value: string | undefined): string | null {
    if (!value) return null;
    const normalized = value.trim().replace(/^['\"]|['\"]$/g, "");
    return normalized.length > 0 ? normalized : null;
}

export function getMongoUris(): string[] {
    const entries = Object.entries(process.env)
        .map(([key, rawValue]) => {
            const match = key.match(MONGO_ENV_KEY_PATTERN);
            if (!match) return null;

            const order = Number.parseInt(match[1], 10);
            const uri = normalizeMongoUri(rawValue);
            if (!uri) return null;

            return { order, uri };
        })
        .filter((entry): entry is { order: number; uri: string } => Boolean(entry))
        .sort((a, b) => a.order - b.order);

    return entries.map((entry) => entry.uri);
}

export function getPrimaryMongoUri(): string | null {
    const uris = getMongoUris();
    return uris[0] ?? null;
}

export function requirePrimaryMongoUri(): string {
    const uri = getPrimaryMongoUri();
    if (!uri) {
        throw new Error("Please define at least one MONGODB_<number> environment variable inside .env.local or .env");
    }
    return uri;
}

export function hasMongoUri(): boolean {
    return getPrimaryMongoUri() !== null;
}

export function isLocalMongoUri(uri: string): boolean {
    const normalized = uri.toLowerCase();
    return normalized.includes("localhost") || normalized.includes("127.0.0.1");
}
