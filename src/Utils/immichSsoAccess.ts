import { NextRequest, NextResponse } from "next/server";
import { getImmichOrigins, getTrustedOrigins } from "@Utils/origin";
import { normalizeHeader } from "@Utils/NormalizeHeader";

function parseOriginLikeHeader(value: string | null): string {
    const normalized = normalizeHeader(value);
    if (!normalized) return "";

    try {
        return new URL(normalized).origin;
    } catch {
        return "";
    }
}

function getAllowedOrigins(): Set<string> {
    return new Set([...getTrustedOrigins(), ...getImmichOrigins()]);
}

export function getImmichRequestOrigin(request: NextRequest): string {
    const origin = parseOriginLikeHeader(request.headers.get("origin"));
    if (origin) return origin;

    const referer = parseOriginLikeHeader(request.headers.get("referer"));
    if (referer) return referer;

    return "";
}

export function isImmichSsoRequestAllowed(request: NextRequest): boolean {
    const requestOrigin = getImmichRequestOrigin(request);
    if (!requestOrigin) return false;

    return getAllowedOrigins().has(requestOrigin);
}

export function createImmichSsoForbiddenResponse(): NextResponse {
    return NextResponse.json(
        {
            error: "forbidden",
            error_description: "This endpoint is only available to approved Immich or site origins."
        },
        {
            status: 403,
            headers: {
                "Cache-Control": "no-store"
            }
        }
    );
}

export function getImmichCorsOrigin(request: NextRequest): string {
    const requestOrigin = parseOriginLikeHeader(request.headers.get("origin"));
    if (!requestOrigin) return "";

    return getAllowedOrigins().has(requestOrigin) ? requestOrigin : "";
}