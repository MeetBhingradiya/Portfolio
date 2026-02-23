/**
 * useToolDefaults — Client hook
 * Fetches admin-configured default settings for developer tools.
 * Caches in-memory; re-fetches every 5 minutes via SWR-style stale check.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ── Shape mirrors the API response ─────────────────────────────────────

export interface ToolDefaultsData {
    qr?: {
        size?: number;
        errorCorrection?: string;
        dotStyle?: string;
        cornerStyle?: string;
        foreground?: string;
        background?: string;
    };
    uuid?: {
        version?: string;
        uppercase?: boolean;
        noDashes?: boolean;
        braces?: boolean;
        bulkCount?: number;
    };
    password?: {
        mode?: string;
        length?: number;
        uppercase?: boolean;
        lowercase?: boolean;
        digits?: boolean;
        symbols?: boolean;
        excludeAmbiguous?: boolean;
        wordCount?: number;
        separator?: string;
        pinLength?: number;
    };
    json?: {
        direction?: string;
        autoFormat?: boolean;
    };
    jwt?: {
        defaultTab?: string;
        defaultAlgorithm?: string;
    };
    regexp?: {
        defaultFlags?: string;
        showPresets?: boolean;
        defaultTab?: string;
    };
    image?: {
        mode?: string;
        quality?: number;
        maxWidth?: number;
        outputFormat?: string;
        pdfOrientation?: string;
    };
    pdf?: {
        mode?: string;
    };
    encrypt?: {
        algorithm?: string;
        direction?: string;
    };
    markdown?: {
        viewMode?: string;
    };
    colour?: {
        defaultTab?: string;
        harmony?: string;
        defaultHue?: number;
        defaultSaturation?: number;
        defaultLightness?: number;
    };
    todo?: {
        defaultFilter?: string;
    };
}

// ── In-memory cache ────────────────────────────────────────────────────

let cachedData: ToolDefaultsData | null = null;
let lastFetched = 0;
const STALE_MS = 5 * 60 * 1000; // 5 minutes

// ── Hook ───────────────────────────────────────────────────────────────

export function useToolDefaults() {
    const [data, setData] = useState<ToolDefaultsData>(cachedData ?? {});
    const [loading, setLoading] = useState(!cachedData);
    const fetching = useRef(false);

    const fetchDefaults = useCallback(async () => {
        if (fetching.current) return;
        fetching.current = true;
        try {
            const res = await fetch("/api/tool-defaults");
            const json = await res.json();
            if (json.success && json.data) {
                cachedData = json.data;
                lastFetched = Date.now();
                setData(json.data);
            }
        } catch {
            // silently fail — tools fall back to their own hardcoded defaults
        }
        fetching.current = false;
        setLoading(false);
    }, []);

    useEffect(() => {
        const isStale = Date.now() - lastFetched > STALE_MS;
        if (!cachedData || isStale) {
            fetchDefaults();
        }
    }, [fetchDefaults]);

    return { defaults: data, loading };
}

/**
 * Get defaults for a specific tool by key.
 * Returns the narrowed sub-object, or undefined when not yet loaded.
 *
 * Usage:
 *   const { defaults, loading } = useToolDefaults();
 *   const qrDefaults = getToolDefault(defaults, "qr");
 */
export function getToolDefault<K extends keyof ToolDefaultsData>(
    data: ToolDefaultsData,
    key: K
): ToolDefaultsData[K] | undefined {
    return data[key];
}
