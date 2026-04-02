import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_ALLOWLIST = ["api.ipdata.co"];

function getAllowedHosts(): string[] {
    const envValue = process.env.CORS_PROXY_ALLOWLIST;
    if (!envValue) return DEFAULT_ALLOWLIST;
    return envValue
        .split(",")
        .map((host) => host.trim().toLowerCase())
        .filter(Boolean);
}

function isHostAllowed(url: URL): boolean {
    const host = url.hostname.toLowerCase();
    return getAllowedHosts().includes(host);
}

function isProxyAuthorized(req: NextRequest): boolean {
    const configuredKey = process.env.CORS_PROXY_KEY;
    if (!configuredKey) return true;

    const provided = req.headers.get("x-proxy-key") || req.nextUrl.searchParams.get("proxyKey");
    return provided === configuredKey;
}

function parseEndpoint(raw: string): URL | null {
    try {
        const decoded = decodeURIComponent(raw);
        const url = new URL(decoded);
        if (!isHostAllowed(url)) return null;
        return url;
    } catch {
        return null;
    }
}

export async function GET(req: NextRequest) {
    try {
        if (!isProxyAuthorized(req)) {
            return NextResponse.json({ error: "Unauthorized proxy request" }, { status: 401 });
        }

        const endpoint = req.nextUrl.searchParams.get("endpoint");
        if (!endpoint) {
            return NextResponse.json({ error: "endpoint parameter is required" }, { status: 400 });
        }

        const parsed = parseEndpoint(endpoint);
        if (!parsed) {
            return NextResponse.json({ error: "Endpoint is invalid or not allowed" }, { status: 400 });
        }

        const response = await axios.get(parsed.toString(), {
            timeout: 10000,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "Accept": "application/json, text/plain, */*",
                "Accept-Language": "en-US,en;q=0.9"
            }
        });

        return NextResponse.json({
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            data: response.data
        });
    } catch (error: any) {
        return NextResponse.json(
            {
                error: error.message,
                details: error.response?.data || null
            },
            { status: error.response?.status || 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        if (!isProxyAuthorized(req)) {
            return NextResponse.json({ error: "Unauthorized proxy request" }, { status: 401 });
        }

        const body = await req.json();
        if (!body?.endpoint) {
            return NextResponse.json({ error: "Endpoint is required" }, { status: 400 });
        }

        const parsed = parseEndpoint(body.endpoint);
        if (!parsed) {
            return NextResponse.json({ error: "Endpoint is invalid or not allowed" }, { status: 400 });
        }

        const response = await axios({
            url: parsed.toString(),
            method: body.method || "GET",
            headers: body.headers || {},
            data: body.body,
            timeout: 10000
        });

        return NextResponse.json({
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            data: response.data
        });
    } catch (error: any) {
        return NextResponse.json(
            {
                error: error.message,
                details: error.response?.data || null
            },
            { status: error.response?.status || 500 }
        );
    }
}
