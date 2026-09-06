/**
 * SSO — OIDC Key Management & Utilities
 *
 * Key priority:
 *   1. SSO_PRIVATE_KEY_JWK env var (JSON string of an RSA JWK) → persistent RS256
 *   2. Ephemeral in-process keypair → re-generated on each server restart
 *      (tokens become invalid after restart; fine for local dev)
 *
 * To generate a persistent key and write it as an env var, run:
 *   node -e "const {generateKeyPair,exportJWK}=require('jose');(async()=>{const k=await generateKeyPair('RS256',{modulusLength:2048});const j=await exportJWK(k.privateKey);j.kid='sso-key-1';console.log(JSON.stringify(j));})()"
 */
import { generateKeyPair, exportJWK, importJWK } from "jose";
import { getPrimaryOrigin } from "@Utils/origin";

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

    // Support SSO_PRIVATE_KEY_JWK with fallback to legacy IMMICH_SSO_PRIVATE_KEY_JWK
    const rawEnvJwk = process.env.SSO_PRIVATE_KEY_JWK || process.env.IMMICH_SSO_PRIVATE_KEY_JWK;
    const envJwk = rawEnvJwk?.trim();
    const isConfiguredJwk = envJwk && envJwk.startsWith("{") && !envJwk.includes("placeholder");

    if (isConfiguredJwk) {
        // ----- Persistent key from env -----
        let privateJwk: Record<string, unknown> | null = null;
        try {
            privateJwk = JSON.parse(envJwk);
        } catch {
            console.warn("[SSO] SSO_PRIVATE_KEY_JWK is not valid JSON. Falling back to ephemeral key.");
        }

        if (privateJwk) {
            try {
                const kid = (privateJwk.kid as string) || "sso-key";
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
                return _cache;
            } catch (err) {
                console.warn("[SSO] Failed to import SSO_PRIVATE_KEY_JWK. Falling back to ephemeral key.", err);
            }
        }
    }

    // ----- Ephemeral key (dev only) -----
    console.warn(
        "[SSO] No valid SSO_PRIVATE_KEY_JWK set — using ephemeral RSA key. Tokens will be invalid after server restart."
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

    return _cache;
}

/** The OIDC issuer base URL (no trailing slash) */
export function getIssuer(): string {
    return `${getPrimaryOrigin()}/api/sso`;
}

/** Check if a redirect_uri is allowed by the application */
export function isRedirectUriAllowed(uri: string, allowedUris: string[]): boolean {
    if (!allowedUris || allowedUris.length === 0) return false;
    
    // Exact match
    if (allowedUris.includes(uri)) return true;

    // We can also allow prefix matching or regex if needed, but exact match is standard for OAuth.
    // To maintain compatibility with Immich which used to check origin + path logic,
    // we should just rely on exactly matching redirect_uris configured in the SSOApp model.
    return false;
}
