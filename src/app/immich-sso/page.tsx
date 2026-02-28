/**
 * Immich SSO — Login Page
 * /immich-sso
 *
 * Security model:
 *  - Gate key + Origin/Referer validated server-side in /api/immich-sso/authorize
 *    which sets a signed `immich_sso_request` cookie.
 *  - This page calls /api/immich-sso/validate-gate on mount to verify:
 *      a) the signed cookie exists and is unexpired (proves legitimate OIDC flow)
 *      b) if the user is signed in, whether their email is on the whitelist
 *  - No valid cookie → immediate redirect to home with access-denied notice
 *  - Signed in + whitelisted → skip provider picker, go straight to oidc-done
 *  - Signed in + NOT whitelisted → redirect home with not-whitelisted notice
 *  - Not signed in → show provider picker
 */
"use client";

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { authClient } from "@Library/auth-client";
import Image from "next/image";

const IMMICH_LOGO_CDN = "https://meetbhingradiya.shop/api/cdn/74b7b2736908460fb8ea6b1bf5d2df8e";

interface Provider {
    id: "google" | "github" | "microsoft" | "apple";
    label: string;
    icon: string;
    bg: string;
    color: string;
}

const PROVIDERS: Provider[] = [
    {
        id: "google",
        label: "Continue with Google",
        icon: "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg",
        bg: "#fff",
        color: "#444",
    },
    {
        id: "github",
        label: "Continue with GitHub",
        icon: "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
        bg: "#24292e",
        color: "#fff",
    },
    {
        id: "microsoft",
        label: "Continue with Microsoft",
        icon: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg",
        bg: "#0078d4",
        color: "#fff",
    },
    {
        id: "apple",
        label: "Continue with Apple",
        icon: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
        bg: "#000",
        color: "#fff",
    },
];

type GateState = "checking" | "show_providers" | "redirecting";

export default function ImmichSSOPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const router = useRouter();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const [gateState, setGateState] = useState<GateState>("checking");
    const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [statusMsg, setStatusMsg] = useState("Verifying access…");

    useEffect(() => {
        // Surface any upstream OIDC error from Immich (e.g. error=access_denied)
        const params = new URLSearchParams(window.location.search);
        const oidcErr = params.get("error");
        const oidcDesc = params.get("error_description");
        if (oidcErr) setError(oidcDesc || oidcErr);

        // Call the server-side gate validator — it reads the signed cookie and
        // the active session, so the client never has to trust URL params or
        // referrer strings for security decisions.
        (async () => {
            try {
                const res = await fetch("/api/immich-sso/validate-gate", {
                    method: "POST",
                    credentials: "include",
                });
                const data = await res.json();

                // ── Gate invalid (no cookie / expired / tampered) ────────────
                if (!data.gateValid) {
                    setGateState("redirecting");
                    router.replace("/?notice=immich_access_denied");
                    return;
                }

                // ── Signed-in user, already whitelisted ─────────────────────
                if (data.hasAccess && data.email) {
                    setStatusMsg(`Welcome back, ${data.email}. Redirecting…`);
                    setGateState("redirecting");
                    const qs = params.toString();
                    window.location.href = `/api/immich-sso/oidc-done${qs ? `?${qs}` : ""}`;
                    return;
                }

                // ── Signed-in but NOT on whitelist ──────────────────────────
                if (!data.needsAuth && !data.hasAccess && data.reason === "not_whitelisted") {
                    setGateState("redirecting");
                    router.replace("/?notice=immich_not_whitelisted");
                    return;
                }

                // ── Not signed in — show provider picker ────────────────────
                setGateState("show_providers");
            } catch {
                // Network error — show provider picker so user can try signing in
                setGateState("show_providers");
            }
        })();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleProvider = async (provider: Provider) => {
        setLoadingProvider(provider.id);
        setError(null);
        try {
            await authClient.signIn.social({
                provider: provider.id,
                callbackURL: "/api/immich-sso/oidc-done",
            });
        } catch (e: any) {
            setError(e?.message || "Sign-in failed. Please try again.");
            setLoadingProvider(null);
        }
    };

    const cardBg = isApple
        ? isDark ? "rgba(28,28,32,0.82)" : "rgba(255,255,255,0.82)"
        : isDark ? "rgba(24,24,28,0.98)" : "#fff";

    const borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";

    // ── Loading / redirecting ───────────────────────────────────────────────
    if (gateState !== "show_providers") {
        return (
            <div
                className="min-h-screen flex flex-col items-center justify-center gap-4 p-4"
                style={{ background: palette.background }}
            >
                <div
                    className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
                    style={{
                        borderColor: `${palette.accent} transparent transparent transparent`,
                    }}
                />
                <p className="text-sm font-medium" style={{ color: palette.textSecondary }}>
                    {statusMsg}
                </p>
            </div>
        );
    }

    // ── Provider picker ─────────────────────────────────────────────────────
    return (
        <div
            className="min-h-screen flex items-center justify-center p-4"
            style={{
                background: palette.background,
                backgroundImage: isApple
                    ? `radial-gradient(ellipse at 30% 20%, ${palette.accent}22 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, ${palette.accentLight}18 0%, transparent 60%)`
                    : undefined,
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="w-full max-w-sm"
            >
                {/* Card */}
                <div
                    className="rounded-3xl p-8"
                    style={{
                        background: cardBg,
                        backdropFilter: isApple ? "blur(24px) saturate(180%)" : "none",
                        border: `1px solid ${borderColor}`,
                        boxShadow: isDark
                            ? "0 24px 80px rgba(0,0,0,0.5)"
                            : "0 24px 80px rgba(0,0,0,0.12)",
                    }}
                >
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div
                            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                            style={{ background: `${palette.accent}18` }}
                        >
                            <Image
                                src={IMMICH_LOGO_CDN}
                                alt="Immich"
                                width={36}
                                height={36}
                                className="rounded-lg"
                                unoptimized
                            />
                        </div>
                        <h1
                            className={`${isApple ? "text-2xl font-bold" : "text-3xl font-black"} mb-1`}
                            style={{ color: palette.textPrimary }}
                        >
                            Immich Access
                        </h1>
                        <p className="text-sm" style={{ color: palette.textSecondary }}>
                            Sign in with your account to access photos
                        </p>
                    </div>

                    {/* OIDC error */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mb-5 rounded-xl px-4 py-3 text-sm"
                            style={{
                                background: "#ff3b3018",
                                border: "1px solid #ff3b3040",
                                color: "#ff3b30",
                            }}
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Provider buttons */}
                    <div className="flex flex-col gap-3">
                        {PROVIDERS.map((provider, i) => (
                            <motion.button
                                key={provider.id}
                                initial={{ opacity: 0, x: -16 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.06, duration: 0.4 }}
                                onClick={() => handleProvider(provider)}
                                disabled={!!loadingProvider}
                                className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl font-semibold text-sm transition-all"
                                style={{
                                    background:
                                        loadingProvider === provider.id
                                            ? `${provider.bg}cc`
                                            : provider.bg,
                                    color: provider.color,
                                    border:
                                        provider.id === "google"
                                            ? "1px solid rgba(0,0,0,0.12)"
                                            : undefined,
                                    opacity:
                                        loadingProvider && loadingProvider !== provider.id
                                            ? 0.5
                                            : 1,
                                    cursor: loadingProvider ? "not-allowed" : "pointer",
                                    minHeight: 48,
                                }}
                            >
                                {loadingProvider === provider.id ? (
                                    <div
                                        className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin"
                                        style={{ flexShrink: 0 }}
                                    />
                                ) : (
                                    <Image
                                        src={provider.icon}
                                        alt={provider.label}
                                        width={20}
                                        height={20}
                                        className="rounded"
                                        style={{ flexShrink: 0 }}
                                    />
                                )}
                                <span className="flex-1 text-left">
                                    {loadingProvider === provider.id
                                        ? "Signing in…"
                                        : provider.label}
                                </span>
                            </motion.button>
                        ))}
                    </div>

                    {/* Footer note */}
                    <p
                        className="text-xs text-center mt-6"
                        style={{ color: palette.textTertiary }}
                    >
                        Access is restricted to whitelisted accounts.
                        <br />
                        Contact the administrator if you need access.
                    </p>
                </div>

                {/* Branding */}
                <p
                    className="text-center text-xs mt-4"
                    style={{ color: palette.textTertiary }}
                >
                    Secured by{" "}
                    <span style={{ color: palette.accent }}>meetbhingradiya.shop</span>
                </p>
            </motion.div>
        </div>
    );
}
