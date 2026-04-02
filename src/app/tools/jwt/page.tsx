/**
 * JWT Debugger — /tools/jwt
 * Decode, inspect and build JSON Web Tokens entirely client-side.
 * No external signing libraries — uses atob/btoa.
 */

"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme, useToolDefaults } from "@Hooks";
import { LiquidGlassCard } from "@Components/Atoms/LiquidGlass";
import { OneUICard, OneUIBadge } from "@Components/Atoms/OneUI";
import ToolPageWrapper from "@Components/Organisms/Tools/ToolPageWrapper";
import { VpnKey, ContentCopy, Check, Warning, Info } from "@mui/icons-material";

interface DecodedJWT {
    header: Record<string, any> | null;
    payload: Record<string, any> | null;
    signature: string;
    isExpired: boolean | null;
    expiresAt: string | null;
    issuedAt: string | null;
}

const SAMPLE_JWT =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

const ALGORITHMS = [
    { alg: "HS256", name: "HMAC SHA-256", type: "Symmetric" },
    { alg: "HS384", name: "HMAC SHA-384", type: "Symmetric" },
    { alg: "HS512", name: "HMAC SHA-512", type: "Symmetric" },
    { alg: "RS256", name: "RSA SHA-256", type: "Asymmetric" },
    { alg: "RS384", name: "RSA SHA-384", type: "Asymmetric" },
    { alg: "RS512", name: "RSA SHA-512", type: "Asymmetric" },
    { alg: "ES256", name: "ECDSA P-256", type: "Asymmetric" },
    { alg: "ES384", name: "ECDSA P-384", type: "Asymmetric" },
    { alg: "PS256", name: "RSA-PSS SHA-256", type: "Asymmetric" },
    { alg: "EdDSA", name: "Ed25519", type: "Asymmetric" }
];

const CLAIMS: Record<string, string> = {
    iss: "Issuer — who issued the token",
    sub: "Subject — who the token is about",
    aud: "Audience — intended recipient",
    exp: "Expiration — when the token expires (Unix timestamp)",
    nbf: "Not Before — token not valid before this time",
    iat: "Issued At — when the token was issued",
    jti: "JWT ID — unique identifier for this token",
    name: "Full name of the user",
    email: "Email address",
    role: "User role or permission level"
};

function b64UrlDecode(str: string): string {
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";
    try {
        return decodeURIComponent(escape(atob(base64)));
    } catch {
        return atob(base64);
    }
}

function b64UrlEncode(str: string): string {
    return btoa(unescape(encodeURIComponent(str)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

function formatTimestamp(ts: number): string {
    const d = new Date(ts * 1000);
    return d.toLocaleString();
}

export default function JWTPage() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";
    const Card = isApple ? LiquidGlassCard : OneUICard;

    const [token, setToken] = useState(SAMPLE_JWT);
    const [copied, setCopied] = useState<string | null>(null);
    const [tab, setTab] = useState<"decode" | "build" | "reference">("decode");

    // Builder state
    const [builderAlg, setBuilderAlg] = useState("HS256");
    const [builderPayload, setBuilderPayload] = useState(
        JSON.stringify(
            {
                sub: "1234567890",
                name: "Meet Bhingradiya",
                iat: Math.floor(Date.now() / 1000)
            },
            null,
            2
        )
    );
    const { defaults: toolDefaults } = useToolDefaults();
    const defaultsApplied = useRef(false);

    useEffect(() => {
        if (defaultsApplied.current || !toolDefaults.jwt) return;
        defaultsApplied.current = true;
        const d = toolDefaults.jwt;
        if (d.defaultTab) setTab(d.defaultTab as "decode" | "build" | "reference");
        if (d.defaultAlgorithm) setBuilderAlg(d.defaultAlgorithm);
    }, [toolDefaults]);

    const copy = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 1200);
    };

    // ── Decode ────────────────────────────────────────────────────────────
    const decoded = useMemo<DecodedJWT>(() => {
        const parts = token.trim().split(".");
        if (parts.length !== 3)
            return {
                header: null,
                payload: null,
                signature: "",
                isExpired: null,
                expiresAt: null,
                issuedAt: null
            };

        let header: Record<string, any> | null = null;
        let payload: Record<string, any> | null = null;
        try {
            header = JSON.parse(b64UrlDecode(parts[0]));
        } catch {
            /* bad header */
        }
        try {
            payload = JSON.parse(b64UrlDecode(parts[1]));
        } catch {
            /* bad payload */
        }

        let isExpired: boolean | null = null;
        let expiresAt: string | null = null;
        let issuedAt: string | null = null;

        if (payload) {
            if (typeof payload.exp === "number") {
                isExpired = Date.now() / 1000 > payload.exp;
                expiresAt = formatTimestamp(payload.exp);
            }
            if (typeof payload.iat === "number") {
                issuedAt = formatTimestamp(payload.iat);
            }
        }

        return {
            header,
            payload,
            signature: parts[2],
            isExpired,
            expiresAt,
            issuedAt
        };
    }, [token]);

    // ── Build (unsigned, for demo) ───────────────────────────────────────
    const builtToken = useMemo(() => {
        try {
            const header = b64UrlEncode(JSON.stringify({ alg: builderAlg, typ: "JWT" }));
            const payload = b64UrlEncode(builderPayload);
            return `${header}.${payload}.<signature>`;
        } catch {
            return "Invalid payload JSON";
        }
    }, [builderAlg, builderPayload]);

    const inputStyle: React.CSSProperties = {
        background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
        color: palette.textPrimary,
        border: `1.5px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}`
    };

    return (
        <ToolPageWrapper
            title="JWT Debugger"
            description="Decode, inspect and build JSON Web Tokens"
            icon={<VpnKey sx={{ fontSize: 24 }} />}
            accentColor="#5856D6">
            <div className="space-y-6">
                {/* ── Tabs ── */}
                <div className="flex gap-1.5">
                    {(["decode", "build", "reference"] as const).map((t) => (
                        <motion.button
                            key={t}
                            onClick={() => setTab(t)}
                            className="px-5 py-2 rounded-full text-sm font-bold capitalize"
                            style={{
                                background: tab === t ? palette.accent : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                                color: tab === t ? "#fff" : palette.textSecondary
                            }}
                            whileTap={{ scale: 0.95 }}>
                            {t}
                        </motion.button>
                    ))}
                </div>

                {/* ═══ DECODE TAB ═══ */}
                {tab === "decode" && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6">
                        <Card>
                            <div className="space-y-3">
                                <label
                                    className="text-xs font-bold"
                                    style={{ color: palette.textSecondary }}>
                                    Paste JWT Token
                                </label>
                                <textarea
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-xl text-xs font-mono outline-none resize-none break-all"
                                    style={inputStyle}
                                    placeholder="eyJhbGciOiJI..."
                                />
                            </div>
                        </Card>

                        {/* Status badges */}
                        {decoded.header && (
                            <div className="flex flex-wrap gap-2">
                                <OneUIBadge variant={decoded.isExpired === false ? "success" : decoded.isExpired ? "error" : "neutral"}>
                                    {decoded.isExpired === false ? "Valid (not expired)" : decoded.isExpired ? "Expired" : "No exp claim"}
                                </OneUIBadge>
                                {decoded.header.alg && <OneUIBadge variant="info">{decoded.header.alg}</OneUIBadge>}
                                {decoded.expiresAt && <OneUIBadge variant="neutral">Expires: {decoded.expiresAt}</OneUIBadge>}
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Header */}
                            <Card>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3
                                            className={`${isApple ? "text-sm font-semibold" : "text-base font-black"}`}
                                            style={{ color: "#FF2D55" }}>
                                            Header
                                        </h3>
                                        {decoded.header && (
                                            <motion.button
                                                onClick={() => copy(JSON.stringify(decoded.header, null, 2), "header")}
                                                whileTap={{ scale: 0.9 }}>
                                                {copied === "header" ? (
                                                    <Check
                                                        sx={{
                                                            fontSize: 16,
                                                            color: "#34C759"
                                                        }}
                                                    />
                                                ) : (
                                                    <ContentCopy
                                                        sx={{
                                                            fontSize: 16,
                                                            color: palette.textTertiary
                                                        }}
                                                    />
                                                )}
                                            </motion.button>
                                        )}
                                    </div>
                                    <pre
                                        className="text-xs font-mono rounded-xl px-4 py-3 overflow-x-auto"
                                        style={{
                                            background: isDark ? "rgba(255,0,45,0.06)" : "rgba(255,45,85,0.06)",
                                            color: palette.textPrimary
                                        }}>
                                        {decoded.header ? JSON.stringify(decoded.header, null, 2) : "Invalid header"}
                                    </pre>
                                </div>
                            </Card>

                            {/* Payload */}
                            <Card>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3
                                            className={`${isApple ? "text-sm font-semibold" : "text-base font-black"}`}
                                            style={{ color: "#5856D6" }}>
                                            Payload
                                        </h3>
                                        {decoded.payload && (
                                            <motion.button
                                                onClick={() => copy(JSON.stringify(decoded.payload, null, 2), "payload")}
                                                whileTap={{ scale: 0.9 }}>
                                                {copied === "payload" ? (
                                                    <Check
                                                        sx={{
                                                            fontSize: 16,
                                                            color: "#34C759"
                                                        }}
                                                    />
                                                ) : (
                                                    <ContentCopy
                                                        sx={{
                                                            fontSize: 16,
                                                            color: palette.textTertiary
                                                        }}
                                                    />
                                                )}
                                            </motion.button>
                                        )}
                                    </div>
                                    {decoded.payload ? (
                                        <div className="space-y-2">
                                            {Object.entries(decoded.payload).map(([key, val]) => (
                                                <div
                                                    key={key}
                                                    className="flex items-start gap-3 px-3 py-2 rounded-xl"
                                                    style={{
                                                        background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)"
                                                    }}>
                                                    <code
                                                        className="text-xs font-mono font-bold shrink-0"
                                                        style={{
                                                            color: "#5856D6"
                                                        }}>
                                                        {key}
                                                    </code>
                                                    <span
                                                        className="text-xs font-mono"
                                                        style={{
                                                            color: palette.textPrimary
                                                        }}>
                                                        {typeof val === "object" ? JSON.stringify(val) : String(val)}
                                                    </span>
                                                    {CLAIMS[key] && (
                                                        <span
                                                            className="ml-auto text-[10px] shrink-0"
                                                            style={{
                                                                color: palette.textTertiary
                                                            }}
                                                            title={CLAIMS[key]}>
                                                            <Info
                                                                sx={{
                                                                    fontSize: 12
                                                                }}
                                                            />
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <pre
                                            className="text-xs font-mono px-4 py-3"
                                            style={{ color: "#FF3B30" }}>
                                            Invalid payload
                                        </pre>
                                    )}
                                </div>
                            </Card>
                        </div>

                        {/* Signature */}
                        <Card>
                            <div className="space-y-2">
                                <h3
                                    className={`${isApple ? "text-sm font-semibold" : "text-base font-black"}`}
                                    style={{ color: "#34C759" }}>
                                    Signature
                                </h3>
                                <div
                                    className="flex items-center gap-2 px-4 py-3 rounded-xl font-mono text-xs break-all"
                                    style={{
                                        background: isDark ? "rgba(52,199,89,0.06)" : "rgba(52,199,89,0.06)",
                                        color: palette.textSecondary
                                    }}>
                                    {decoded.signature || "—"}
                                    <Warning
                                        sx={{
                                            fontSize: 14,
                                            color: "#FF9500",
                                            marginLeft: "auto",
                                            flexShrink: 0
                                        }}
                                    />
                                    <span
                                        className="text-[10px] shrink-0"
                                        style={{ color: "#FF9500" }}>
                                        Signature not verified client-side
                                    </span>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* ═══ BUILD TAB ═══ */}
                {tab === "build" && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6">
                        <Card>
                            <div className="space-y-4">
                                <h3
                                    className={`${isApple ? "text-sm font-semibold" : "text-base font-black"}`}
                                    style={{ color: palette.textPrimary }}>
                                    Algorithm
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {ALGORITHMS.filter((a) => ["HS256", "RS256", "ES256", "EdDSA"].includes(a.alg)).map((a) => (
                                        <motion.button
                                            key={a.alg}
                                            onClick={() => setBuilderAlg(a.alg)}
                                            className="px-4 py-2 rounded-full text-xs font-bold"
                                            style={{
                                                background:
                                                    builderAlg === a.alg
                                                        ? palette.accent
                                                        : isDark
                                                          ? "rgba(255,255,255,0.07)"
                                                          : "rgba(0,0,0,0.04)",
                                                color: builderAlg === a.alg ? "#fff" : palette.textSecondary
                                            }}
                                            whileTap={{ scale: 0.95 }}>
                                            {a.alg}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        <Card>
                            <div className="space-y-3">
                                <h3
                                    className={`${isApple ? "text-sm font-semibold" : "text-base font-black"}`}
                                    style={{ color: palette.textPrimary }}>
                                    Payload
                                </h3>
                                <textarea
                                    value={builderPayload}
                                    onChange={(e) => setBuilderPayload(e.target.value)}
                                    rows={8}
                                    className="w-full px-4 py-3 rounded-xl text-xs font-mono outline-none resize-none"
                                    style={inputStyle}
                                />
                            </div>
                        </Card>

                        <Card>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3
                                        className={`${isApple ? "text-sm font-semibold" : "text-base font-black"}`}
                                        style={{ color: palette.textPrimary }}>
                                        Generated Token (unsigned)
                                    </h3>
                                    <motion.button
                                        onClick={() => copy(builtToken, "built")}
                                        whileTap={{ scale: 0.9 }}>
                                        {copied === "built" ? (
                                            <Check
                                                sx={{
                                                    fontSize: 16,
                                                    color: "#34C759"
                                                }}
                                            />
                                        ) : (
                                            <ContentCopy
                                                sx={{
                                                    fontSize: 16,
                                                    color: palette.textTertiary
                                                }}
                                            />
                                        )}
                                    </motion.button>
                                </div>
                                <div
                                    className="px-4 py-3 rounded-xl text-xs font-mono break-all"
                                    style={{
                                        background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
                                        color: palette.textSecondary
                                    }}>
                                    {builtToken}
                                </div>
                                <p
                                    className="flex items-center gap-1 text-[10px]"
                                    style={{ color: "#FF9500" }}>
                                    <Warning sx={{ fontSize: 12 }} /> Signature placeholder — sign server-side with your secret.
                                </p>
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* ═══ REFERENCE TAB ═══ */}
                {tab === "reference" && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6">
                        <Card>
                            <div className="space-y-4">
                                <h3
                                    className={`${isApple ? "text-sm font-semibold" : "text-base font-black"}`}
                                    style={{ color: palette.textPrimary }}>
                                    Supported Algorithms
                                </h3>
                                <div className="space-y-2">
                                    {ALGORITHMS.map((a) => (
                                        <div
                                            key={a.alg}
                                            className="flex items-center justify-between px-4 py-2.5 rounded-xl"
                                            style={{
                                                background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)"
                                            }}>
                                            <div>
                                                <code
                                                    className="text-sm font-bold font-mono"
                                                    style={{
                                                        color: palette.accent
                                                    }}>
                                                    {a.alg}
                                                </code>
                                                <span
                                                    className="ml-2 text-xs"
                                                    style={{
                                                        color: palette.textSecondary
                                                    }}>
                                                    {a.name}
                                                </span>
                                            </div>
                                            <OneUIBadge variant={a.type === "Symmetric" ? "info" : "success"}>{a.type}</OneUIBadge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        <Card>
                            <div className="space-y-4">
                                <h3
                                    className={`${isApple ? "text-sm font-semibold" : "text-base font-black"}`}
                                    style={{ color: palette.textPrimary }}>
                                    Registered Claims
                                </h3>
                                <div className="space-y-2">
                                    {Object.entries(CLAIMS).map(([key, desc]) => (
                                        <div
                                            key={key}
                                            className="flex gap-3 px-4 py-2.5 rounded-xl"
                                            style={{
                                                background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)"
                                            }}>
                                            <code
                                                className="text-xs font-bold font-mono shrink-0 w-12"
                                                style={{
                                                    color: "#5856D6"
                                                }}>
                                                {key}
                                            </code>
                                            <span
                                                className="text-xs"
                                                style={{
                                                    color: palette.textSecondary
                                                }}>
                                                {desc}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </div>
        </ToolPageWrapper>
    );
}
