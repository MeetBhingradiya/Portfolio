/// <reference types="bun-types" />

import { beforeEach, describe, expect, it, mock } from "bun:test";
import { SignJWT } from "jose";
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

async function makeAdminBypassToken(secret: string): Promise<string> {
    const key = new TextEncoder().encode(secret);
    return await new SignJWT({ isAdmin: true })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("15m")
        .sign(key);
}

describe("proxy flow testing", () => {
    beforeEach(() => {
        __resetProxyTestState();
        process.env.TRUSTED_ORIGINS = "https://meetbhingradiya.in";
        process.env.ADMIN_SIGNATURE = "test-admin-signature";
        mock.restore();
    });

    it("redirects page traffic to maintenance page when maintenance is enabled", async () => {
        globalThis.fetch = maintenanceFetchStub(true, "Scheduled maintenance");

        const response = await proxy(
            makeRequest({
                url: "https://meetbhingradiya.in/projects"
            })
        );

        expect(response.status).toBe(307);
        const location = response.headers.get("location");
        expect(location).toContain("/maintenance");
        expect(location).toContain("message=Scheduled+maintenance");
    });

    it("returns 503 JSON for API calls when maintenance is enabled", async () => {
        globalThis.fetch = maintenanceFetchStub(true, "System update");

        const response = await proxy(
            makeRequest({
                url: "https://meetbhingradiya.in/api/shop/orders"
            })
        );

        expect(response.status).toBe(503);
        const data = await response.json();
        expect(data.Message).toContain("System update");
    });

    it("allows admin bypass cookie even in maintenance mode", async () => {
        const token = await makeAdminBypassToken("test-admin-signature");

        globalThis.fetch = maintenanceFetchStub(true, "Locked");

        const response = await proxy(
            makeRequest({
                url: "https://meetbhingradiya.in/admin",
                headers: {
                    cookie: `x_admin_bypass=${token}`
                }
            })
        );

        expect(response.status).toBe(200);
        expect(response.headers.get("x-middleware-next")).toBe("1");
    });

    it("allows live traffic when maintenance mode is disabled", async () => {
        globalThis.fetch = maintenanceFetchStub(false);

        const response = await proxy(
            makeRequest({
                url: "https://meetbhingradiya.in/contact"
            })
        );

        expect(response.status).toBe(200);
        expect(response.headers.get("x-middleware-next")).toBe("1");
    });
});
