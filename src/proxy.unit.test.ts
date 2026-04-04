/// <reference types="bun-types" />

import { beforeEach, describe, expect, it, mock } from "bun:test";
import { NextRequest } from "next/server";
import { proxy, __resetProxyTestState } from "./proxy";

function maintenanceFetchStub(enabled: boolean, message = ""): typeof fetch {
    return (async () =>
        new Response(
            JSON.stringify({
                maintenanceMode: enabled,
                maintenanceMessage: message
            }),
            {
                status: 200,
                headers: { "content-type": "application/json" }
            }
        )) as unknown as typeof fetch;
}

function makeRequest(input: {
    url: string;
    method?: string;
    headers?: Record<string, string>;
}): NextRequest {
    const req = new Request(input.url, {
        method: input.method ?? "GET",
        headers: input.headers
    });
    return new NextRequest(req);
}

describe("proxy unit security controls", () => {
    beforeEach(() => {
        __resetProxyTestState();
        process.env.TRUSTED_ORIGINS = "https://meetbhingradiya.in,https://www.meetbhingradiya.in";

        mock.restore();
        globalThis.fetch = maintenanceFetchStub(false);
    });

    it("blocks disallowed HTTP methods", async () => {
        const response = await proxy(
            makeRequest({
                url: "https://meetbhingradiya.in/api/blogs",
                method: "TRACE"
            })
        );

        expect(response.status).toBe(405);
        expect(response.headers.get("x-content-type-options")).toBe("nosniff");
        expect(response.headers.get("x-frame-options")).toBe("DENY");
    });

    it("rejects mutating cross-origin API requests", async () => {
        const response = await proxy(
            makeRequest({
                url: "https://meetbhingradiya.in/api/blogs",
                method: "POST",
                headers: {
                    origin: "https://evil.example"
                }
            })
        );

        expect(response.status).toBe(403);
        expect(response.headers.get("cache-control")).toBe("no-store");
    });

    it("allows same-origin mutating API requests", async () => {
        const response = await proxy(
            makeRequest({
                url: "https://meetbhingradiya.in/api/blogs",
                method: "POST",
                headers: {
                    origin: "https://meetbhingradiya.in"
                }
            })
        );

        expect(response.status).toBe(200);
        expect(response.headers.get("x-middleware-next")).toBe("1");
    });

    it("returns secure CORS preflight for trusted origins", async () => {
        const response = await proxy(
            makeRequest({
                url: "https://meetbhingradiya.in/api/blogs",
                method: "OPTIONS",
                headers: {
                    origin: "https://www.meetbhingradiya.in"
                }
            })
        );

        expect(response.status).toBe(204);
        expect(response.headers.get("access-control-allow-origin")).toBe("https://www.meetbhingradiya.in");
        expect(response.headers.get("access-control-allow-credentials")).toBe("true");
    });

    it("allows wildcard CORS preflight for external developer CDN APIs", async () => {
        const response = await proxy(
            makeRequest({
                url: "https://meetbhingradiya.in/api/cdn/external/upload",
                method: "OPTIONS",
                headers: {
                    origin: "https://third-party.app"
                }
            })
        );

        expect(response.status).toBe(204);
        expect(response.headers.get("access-control-allow-origin")).toBe("*");
        expect(response.headers.get("access-control-allow-headers")).toContain("X-CDN-Key");
    });

    it("does not block cross-origin developer upload flow for external CDN API", async () => {
        const response = await proxy(
            makeRequest({
                url: "https://meetbhingradiya.in/api/cdn/external/upload",
                method: "POST",
                headers: {
                    origin: "https://third-party.app"
                }
            })
        );

        expect(response.status).toBe(200);
        expect(response.headers.get("x-middleware-next")).toBe("1");
        expect(response.headers.get("access-control-allow-origin")).toBe("*");
    });
});
