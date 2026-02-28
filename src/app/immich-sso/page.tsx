/**
 * Immich SSO — Login Page
 * /immich-sso
 *
 * Shown after Immich redirects the user to this OIDC provider.
 * User picks a social provider → better-auth handles the OAuth flow
 * → better-auth redirects to /api/immich-sso/oidc-done
 *
 * Security:
 *  - Must originate from https://photos.meetbhingradiya.shop with OIDC params.
 *  - If the user is already authenticated, their immich whitelist access is
 *    checked directly — if granted they are forwarded without re-auth.
 *  - Otherwise the page shows provider buttons.
 */
"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { authClient } from "@Library/auth-client";
import Image from "next/image";

const IMMICH_ORIGIN = "https://photos.meetbhingradiya.shop";
const REQUIRED_PARAMS = ["client_id", "redirect_uri", "response_type"];
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

export default function ImmichSSOPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const router = useRouter();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";
    const [loading, setLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [authorized, setAuthorized] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);

        // Grab any upstream OIDC errors first
        const err = params.get("error");
        const desc = params.get("error_description");
        if (err) {
            setError(desc || err);
        }

        // ── Security gate ────────────────────────────────────────────────────
        // 1. Must come from the Immich origin (referrer or explicit ref param)
        const ref = params.get("ref");
        const referrer = document.referrer;
        const fromImmich =
            ref === IMMICH_ORIGIN ||
            referrer.startsWith(IMMICH_ORIGIN);

        // 2. Must carry at least one OIDC parameter
        const hasOidcParams = REQUIRED_PARAMS.some((p) => params.has(p));

        if (!fromImmich && !hasOidcParams) {
            // Not a legitimate OIDC redirect — bounce to home with denial message
            router.replace("/?notice=immich_access_denied");
            return;
        }

        // ── Fast path for already-authenticated users ─────────────────────────
        // If they are signed in, check their whitelist access server-side.
        (async () => {
            try {
                const session = await authClient.getSession();
                if (session?.data?.user?.email) {
                    const res = await fetch("/api/immich-sso/check-access", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: session.data.user.email }),
                    });
                    const json = await res.json();
                    if (json.granted) {
                        // Rebuild the OIDC redirect — pass params along to the done handler
                        const qs = params.toString();
                        window.location.href = `/api/immich-sso/oidc-done${qs ? `?${qs}` : ""}`;
                        return;
                    }
                }
            } catch {
                // ignore — fall through to provider picker
            }
            setAuthorized(true);
            setChecking(false);
        })();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleProvider = async (provider: Provider) => {
        setLoading(provider.id);
        setError(null);
        try {
            await authClient.signIn.social({
                provider: provider.id,
                callbackURL: "/api/immich-sso/oidc-done",
            });
        } catch (e: any) {
            setError(e?.message || "Sign-in failed. Please try again.");
            setLoading(null);
        }
    };

    const cardBg = isApple
        ? isDark
            ? "rgba(28,28,32,0.82)"
            : "rgba(255,255,255,0.82)"
        : isDark
            ? "rgba(24,24,28,0.98)"
            : "#fff";

    const borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";

    // While we're performing the security/session check, show a neutral spinner
    if (checking) {
        return (
            <div
                className="min-h-screen flex items-center justify-center p-4"
                style={{ background: palette.background }}
            >
                <div
                    className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
                    style={{ borderColor: `${palette.accent} transparent transparent transparent` }}
                />
            </div>
        );
    }

    if (!authorized) return null;

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
                    {/* Immich logo + header */}
                    <div className="text-center mb-8">
                        <div
                            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                            style={{ background: `${palette.accent}18` }}
                        >
                            {/* Immich logo from CDN */}
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
                        <p
                            className="text-sm"
                            style={{ color: palette.textSecondary }}
                        >
                            Sign in with your account to access photos
                        </p>
                    </div>

                    {/* Error */}
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
                                disabled={!!loading}
                                className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl font-semibold text-sm transition-all"
                                style={{
                                    background: loading === provider.id
                                        ? `${provider.bg}cc`
                                        : provider.bg,
                                    color: provider.color,
                                    border: provider.id === "google"
                                        ? "1px solid rgba(0,0,0,0.12)"
                                        : undefined,
                                    opacity: loading && loading !== provider.id ? 0.5 : 1,
                                    cursor: loading ? "not-allowed" : "pointer",
                                    minHeight: 48,
                                }}
                            >
                                {loading === provider.id ? (
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
                                    {loading === provider.id ? "Signing in…" : provider.label}
                                </span>
                            </motion.button>
                        ))}
                    </div>

                    {/* Footer note */}
                    <p
                        className="text-xs text-center mt-6"
                        style={{ color: palette.textTertiary }}
                    >
                        Access is restricted to whitelisted accounts.{" "}
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
                    <span style={{ color: palette.accent }}>
                        meetbhingradiya.shop
                    </span>
                </p>
            </motion.div>
        </div>
    );
}
