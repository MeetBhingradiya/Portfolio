/**
 * Immich SSO — OIDC Key Management
 *
 * Key priority:
 *   1. IMMICH_SSO_PRIVATE_KEY_JWK env var (JSON string of an RSA JWK) → persistent RS256
 *   2. Ephemeral in-process keypair → re-generated on each server restart
 *      (tokens become invalid after restart; fine for local dev)
 *
 * To generate a persistent key and write it as an env var, run:
 *   node -e "const {generateKeyPair,exportJWK}=require('jose');(async()=>{const k=await generateKeyPair('RS256',{modulusLength:2048});const j=await exportJWK(k.privateKey);j.kid='immich-sso-1';console.log(JSON.stringify(j));})()"
 */
import { generateKeyPair, exportJWK, importJWK } from "jose";
import { Config as CConfig } from "@Config/Client";
import { Config as SConfig } from "@Config/Server";

interface OIDCKeySet {
    privateKey: any;
    publicKey: any;
    kid: string;
    /** Public JWK (for JWKS endpoint) */
    publicJwk: Record<string, unknown>;
}

let _cache: OIDCKeySet | null = null;

export async function getOIDCKeys(): Promise<OIDCKeySet> {
    if (_cache) return _cache;

    const envJwk = process.env.IMMICH_SSO_PRIVATE_KEY_JWK;

    if (envJwk) {
        // ----- Persistent key from env -----
        let privateJwk: Record<string, unknown>;
        try {
            privateJwk = JSON.parse(envJwk);
        } catch {
            throw new Error("[ImmichSSO] IMMICH_SSO_PRIVATE_KEY_JWK is not valid JSON");
        }
        const kid = (privateJwk.kid as string) || "immich-sso-key";

        const privateKey = await importJWK(privateJwk, "RS256");

        // Build public JWK by stripping private key components
        const publicJwk: Record<string, unknown> = { ...privateJwk };
        for (const field of ["d", "p", "q", "dp", "dq", "qi"]) delete publicJwk[field];
        const publicKey = await importJWK(publicJwk, "RS256");

        _cache = {
            privateKey,
            publicKey,
            kid,
            publicJwk: { ...publicJwk, kid, use: "sig", alg: "RS256" }
        };
    } else {
        // ----- Ephemeral key (dev only) -----
        console.warn(
            "[ImmichSSO] No IMMICH_SSO_PRIVATE_KEY_JWK set — using ephemeral RSA key. " + "Tokens will be invalid after server restart."
        );
        const { privateKey, publicKey } = await generateKeyPair("RS256", {
            modulusLength: 2048
        });
        const exportedPub = await exportJWK(publicKey);
        const kid = `ephemeral-${Date.now()}`;
        _cache = {
            privateKey,
            publicKey,
            kid,
            publicJwk: { ...exportedPub, kid, use: "sig", alg: "RS256" }
        };
    }

    return _cache;
}

/** The OIDC issuer base URL (no trailing slash) */
export function getIssuer(): string {
    return `${CConfig.Origin}/api/immich-sso`;
}

/** Validate OIDC client credentials */
export function validateClient(clientId: string, clientSecret?: string): { valid: boolean; reason?: string } {
    const expectedId = process.env.IMMICH_SSO_CLIENT_ID || "immich";
    const expectedSecret = process.env.IMMICH_SSO_CLIENT_SECRET;

    if (clientId !== expectedId) {
        return { valid: false, reason: "unknown_client" };
    }
    if (expectedSecret && clientSecret && clientSecret !== expectedSecret) {
        return { valid: false, reason: "invalid_client_secret" };
    }
    return { valid: true };
}

/** Check if a redirect_uri is allowed */
export function isRedirectUriAllowed(uri: string): boolean {
    const normalizeOrigin = (value: string) => value.replace(/\/$/, "");
    const normalizePath = (value: string) => {
        if (value === "/") return value;
        return value.replace(/\/$/, "");
    };

    const allowedOrigins = new Set([CConfig.Origin, ...SConfig.Immich_Origins].map(normalizeOrigin));
    const allowedPaths = new Set(Object.values(SConfig.Immich_Endpoints).map(normalizePath));

    if (allowedOrigins.size === 0 || allowedPaths.size === 0) return true;

    try {
        const parsed = new URL(uri);
        const uriOrigin = normalizeOrigin(parsed.origin);
        const uriPath = normalizePath(parsed.pathname);

        if (!allowedOrigins.has(uriOrigin)) return false;

        return [...allowedPaths].some((allowedPath) => {
            return uriPath === allowedPath;
        });
    } catch {
        return false;
    }
}
