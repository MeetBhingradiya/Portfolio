function normalizeHeader(value: string | null): string {
    if (!value) return "";

    const normalized = value.trim();
    if (!normalized) return "";

    // Some mobile/webview flows send literal "null" / "undefined" values.
    const lowered = normalized.toLowerCase();
    if (lowered === "null" || lowered === "undefined") return "";

    return normalized;
}

export { normalizeHeader };
