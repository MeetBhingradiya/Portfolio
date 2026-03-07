/**
 * Admin — Feature Flags & Payment Providers
 * Toggle site-wide features and configure payment integrations.
 */
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import {
    ToggleOn,
    ToggleOff,
    Payment,
    Store,
    PersonAdd,
    ExpandMore,
    Save,
    Visibility,
    VisibilityOff,
    CheckCircle,
    InfoOutlined,
} from "@mui/icons-material";

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface ProviderState {
    enabled: boolean;
    publicKey: string;
    secretKey: string;         // write-only (blank = don't overwrite)
    secretKeySet: boolean;     // read-only flag from server
    extra: Record<string, string>;
}

interface FeatureState {
    allowSignup: boolean;
    shopEnabled: boolean;
    productivityEnabled: boolean;
    paymentProviders: Record<string, ProviderState>;
}

/* ─── Provider Metadata ─────────────────────────────────────────────────── */
const PROVIDERS: {
    key: string;
    label: string;
    logo: string;
    color: string;
    publicKeyLabel: string;
    secretKeyLabel: string;
    docsUrl: string;
    extraFields?: { key: string; label: string; placeholder: string }[];
}[] = [
    {
        key: "stripe",
        label: "Stripe",
        logo: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg",
        color: "#635BFF",
        publicKeyLabel: "Publishable Key",
        secretKeyLabel: "Secret Key",
        docsUrl: "https://stripe.com/docs/keys",
    },
    {
        key: "razorpay",
        label: "Razorpay",
        logo: "https://razorpay.com/assets/razorpay-logo.svg",
        color: "#2D87FC",
        publicKeyLabel: "Key ID",
        secretKeyLabel: "Key Secret",
        docsUrl: "https://razorpay.com/docs/payments/dashboard/account-settings/api-keys/",
    },
    {
        key: "paypal",
        label: "PayPal",
        logo: "https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg",
        color: "#003087",
        publicKeyLabel: "Client ID",
        secretKeyLabel: "Client Secret",
        docsUrl: "https://developer.paypal.com/api/rest/",
    },
    {
        key: "lemonSqueezy",
        label: "Lemon Squeezy",
        logo: "https://www.lemonsqueezy.com/favicon.ico",
        color: "#FFC233",
        publicKeyLabel: "Store ID",
        secretKeyLabel: "API Key",
        docsUrl: "https://docs.lemonsqueezy.com/api",
    },
    {
        key: "paddle",
        label: "Paddle",
        logo: "https://paddle.com/favicon.ico",
        color: "#43B649",
        publicKeyLabel: "Vendor ID",
        secretKeyLabel: "Auth Code",
        docsUrl: "https://developer.paddle.com/",
    },
];

const defaultProvider = (): ProviderState => ({
    enabled: false,
    publicKey: "",
    secretKey: "",
    secretKeySet: false,
    extra: {},
});

const defaultState = (): FeatureState => ({
    allowSignup: true,
    shopEnabled: false,
    productivityEnabled: true,
    paymentProviders: Object.fromEntries(PROVIDERS.map(p => [p.key, defaultProvider()])),
});

/* ─── Toggle Component ───────────────────────────────────────────────────── */
function Toggle({
    value,
    onChange,
    accent,
    isDark,
}: { value: boolean; onChange: (v: boolean) => void; accent: string; isDark: boolean }) {
    return (
        <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => onChange(!value)}
            className="relative w-14 h-7 rounded-full flex-shrink-0 transition-colors"
            style={{ background: value ? accent : isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)" }}
        >
            <motion.div
                animate={{ x: value ? 28 : 4 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
            />
        </motion.button>
    );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function AdminFeaturesPage() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";

    const [state, setState] = useState<FeatureState>(defaultState());
    const [ui, setUi] = useState({
        loading: true,
        saving: false,
        saved: false,
        openProvider: null as string | null,
        showSecret: {} as Record<string, boolean>,
    });
    const patchUi = useCallback((p: Partial<typeof ui>) => setUi(s => ({ ...s, ...p })), []);

    /* ── styles ── */
    const cardBg = isApple
        ? isDark ? "rgba(28,28,32,0.80)" : "rgba(255,255,255,0.80)"
        : isDark ? "rgba(24,24,28,0.98)" : "#fff";
    const border = `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`;
    const inputStyle = {
        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
        color: palette.textPrimary,
        border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)"}`,
    };

    /* ── fetch ── */
    const fetchFeatures = useCallback(async () => {
        patchUi({ loading: true });
        const res = await fetch("/api/admin/features");
        const json = await res.json();
        if (json.success) {
            const providers = { ...Object.fromEntries(PROVIDERS.map(p => [p.key, defaultProvider()])) };
            for (const [k, v] of Object.entries(json.data.paymentProviders ?? {})) {
                const vv = v as any;
                providers[k] = {
                    enabled: vv.enabled ?? false,
                    publicKey: vv.publicKey ?? "",
                    secretKey: "",           // never pre-fill
                    secretKeySet: vv.secretKeySet ?? false,
                    extra: vv.extra ?? {},
                };
            }
            setState({
                allowSignup: json.data.allowSignup ?? true,
                shopEnabled: json.data.shopEnabled ?? false,
                productivityEnabled: json.data.productivityEnabled ?? true,
                paymentProviders: providers,
            });
        }
        patchUi({ loading: false });
    }, []);

    useEffect(() => { fetchFeatures(); }, [fetchFeatures]);

    /* ── save ── */
    const save = async () => {
        patchUi({ saving: true, saved: false });
        await fetch("/api/admin/features", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                allowSignup: state.allowSignup,
                shopEnabled: state.shopEnabled,
                productivityEnabled: state.productivityEnabled,
                paymentProviders: Object.fromEntries(
                    Object.entries(state.paymentProviders).map(([k, v]) => [k, {
                        enabled: v.enabled,
                        publicKey: v.publicKey,
                        // only send secretKey if user typed something
                        ...(v.secretKey ? { secretKey: v.secretKey } : {}),
                    }])
                ),
            }),
        });
        patchUi({ saving: false, saved: true });
        setTimeout(() => patchUi({ saved: false }), 2500);
        // re-fetch so secretKeySet flags update
        fetchFeatures();
    };

    const setProviderField = (key: string, field: keyof ProviderState, value: any) => {
        setState(s => ({
            ...s,
            paymentProviders: {
                ...s.paymentProviders,
                [key]: { ...s.paymentProviders[key], [field]: value },
            },
        }));
    };

    /* ── Feature flag row ── */
    const FeatureRow = ({
        icon,
        label,
        description,
        value,
        onChange,
        tag,
        tagColor,
    }: {
        icon: React.ReactNode;
        label: string;
        description: string;
        value: boolean;
        onChange: (v: boolean) => void;
        tag?: string;
        tagColor?: string;
    }) => (
        <div
            className="flex items-center gap-4 px-5 py-4 rounded-2xl"
            style={{ background: cardBg, border }}
        >
            <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: value ? `${palette.accent}18` : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}
            >
                <span style={{ color: value ? palette.accent : palette.textTertiary }}>{icon}</span>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="font-bold text-sm" style={{ color: palette.textPrimary }}>{label}</p>
                    {tag && (
                        <span
                            className="text-xs px-2 py-0.5 rounded-full font-bold"
                            style={{ background: `${tagColor ?? palette.accent}18`, color: tagColor ?? palette.accent }}
                        >
                            {tag}
                        </span>
                    )}
                </div>
                <p className="text-xs mt-0.5" style={{ color: palette.textSecondary }}>{description}</p>
            </div>
            <Toggle value={value} onChange={onChange} accent={palette.accent} isDark={isDark} />
        </div>
    );

    return (
        <div className="p-6 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1
                        className={`${isApple ? "text-2xl font-semibold" : "text-3xl font-black"}`}
                        style={{ color: palette.textPrimary }}
                    >
                        Features
                    </h1>
                    <p className="text-sm mt-1" style={{ color: palette.textSecondary }}>
                        Enable or disable platform features and payment integrations.
                    </p>
                </div>
                <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={save}
                    disabled={ui.saving || ui.loading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm"
                    style={{ background: ui.saved ? "#34C759" : palette.accent, color: "#fff" }}
                >
                    {ui.saved
                        ? <><CheckCircle fontSize="small" /> Saved</>
                        : ui.saving
                        ? "Saving…"
                        : <><Save fontSize="small" /> Save Changes</>}
                </motion.button>
            </div>

            {ui.loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-18 rounded-2xl animate-pulse" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />
                    ))}
                </div>
            ) : (
                <div className="space-y-8">
                    {/* ── Section: General ── */}
                    <section>
                        <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: palette.textTertiary }}>
                            General
                        </p>
                        <div className="space-y-2">
                            <FeatureRow
                                icon={<PersonAdd fontSize="small" />}
                                label="Allow User Signup"
                                description="When disabled, new account registration is blocked. Existing users can still sign in."
                                value={state.allowSignup}
                                onChange={v => setState(s => ({ ...s, allowSignup: v }))}
                                tag={state.allowSignup ? "Open" : "Invite Only"}
                                tagColor={state.allowSignup ? "#34C759" : "#FF9500"}
                            />
                            <FeatureRow
                                icon={<Store fontSize="small" />}
                                label="Activate Shop"
                                description="Show the shop, products, and checkout to visitors. Requires at least one active product."
                                value={state.shopEnabled}
                                onChange={v => setState(s => ({ ...s, shopEnabled: v }))}
                                tag={state.shopEnabled ? "Live" : "Hidden"}
                                tagColor={state.shopEnabled ? "#34C759" : "#8E8E93"}
                            />
                            <FeatureRow
                                icon={<CheckCircle fontSize="small" />}
                                label="Productivity Hub"
                                description="Enable the gamified task manager, habit tracker, goals, and reminders system for signed-in users."
                                value={state.productivityEnabled}
                                onChange={v => setState(s => ({ ...s, productivityEnabled: v }))}
                                tag={state.productivityEnabled ? "Enabled" : "Disabled"}
                                tagColor={state.productivityEnabled ? "#AF52DE" : "#8E8E93"}
                            />
                        </div>
                    </section>

                    {/* ── Section: Payment Providers ── */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <p className="text-xs font-black uppercase tracking-widest" style={{ color: palette.textTertiary }}>
                                Payment Providers
                            </p>
                            <div
                                className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                                style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: palette.textTertiary }}
                            >
                                <InfoOutlined style={{ fontSize: 11 }} />
                                Keys are encrypted at rest
                            </div>
                        </div>

                        <div className="space-y-2">
                            {PROVIDERS.map(prov => {
                                const ps = state.paymentProviders[prov.key] ?? defaultProvider();
                                const isOpen = ui.openProvider === prov.key;

                                return (
                                    <div
                                        key={prov.key}
                                        className="rounded-2xl overflow-hidden"
                                        style={{ background: cardBg, border }}
                                    >
                                        {/* Row header */}
                                        <div className="flex items-center gap-4 px-5 py-4">
                                            {/* Color dot / logo fallback */}
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm"
                                                style={{ background: `${prov.color}18`, color: prov.color }}
                                            >
                                                <Payment fontSize="small" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-sm" style={{ color: palette.textPrimary }}>
                                                        {prov.label}
                                                    </p>
                                                    {ps.enabled && (
                                                        <span
                                                            className="text-xs px-2 py-0.5 rounded-full font-bold"
                                                            style={{ background: "rgba(52,199,89,0.12)", color: "#34C759" }}
                                                        >
                                                            Active
                                                        </span>
                                                    )}
                                                    {ps.secretKeySet && (
                                                        <span
                                                            className="text-xs px-2 py-0.5 rounded-full font-bold"
                                                            style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)", color: palette.textTertiary }}
                                                        >
                                                            Key set ✓
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs" style={{ color: palette.textSecondary }}>
                                                    {ps.enabled ? "Accepting payments" : "Disabled"}
                                                </p>
                                            </div>

                                            {/* Enable toggle */}
                                            <Toggle
                                                value={ps.enabled}
                                                onChange={v => setProviderField(prov.key, "enabled", v)}
                                                accent={prov.color}
                                                isDark={isDark}
                                            />

                                            {/* Expand */}
                                            <motion.button
                                                animate={{ rotate: isOpen ? 180 : 0 }}
                                                transition={{ duration: 0.2 }}
                                                onClick={() => patchUi({ openProvider: isOpen ? null : prov.key })}
                                                className="p-1.5 rounded-lg"
                                                style={{ color: palette.textTertiary, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }}
                                            >
                                                <ExpandMore fontSize="small" />
                                            </motion.button>
                                        </div>

                                        {/* Expand body — API keys */}
                                        <AnimatePresence>
                                            {isOpen && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.22 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div
                                                        className="px-5 pb-5 pt-1 space-y-3"
                                                        style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }}
                                                    >
                                                        {/* Public key */}
                                                        <div>
                                                            <label
                                                                className="text-xs font-black uppercase tracking-wider block mb-1.5"
                                                                style={{ color: palette.textTertiary }}
                                                            >
                                                                {prov.publicKeyLabel}
                                                            </label>
                                                            <input
                                                                value={ps.publicKey}
                                                                onChange={e => setProviderField(prov.key, "publicKey", e.target.value)}
                                                                placeholder={`${prov.label} ${prov.publicKeyLabel}`}
                                                                className="w-full text-sm px-4 py-2.5 rounded-xl outline-none font-mono"
                                                                style={inputStyle}
                                                            />
                                                        </div>

                                                        {/* Secret key */}
                                                        <div>
                                                            <label
                                                                className="text-xs font-black uppercase tracking-wider block mb-1.5"
                                                                style={{ color: palette.textTertiary }}
                                                            >
                                                                {prov.secretKeyLabel}
                                                                {ps.secretKeySet && (
                                                                    <span className="ml-2 normal-case font-normal" style={{ color: "#34C759" }}>
                                                                        (already set — leave blank to keep)
                                                                    </span>
                                                                )}
                                                            </label>
                                                            <div className="relative">
                                                                <input
                                                                    type={ui.showSecret[prov.key] ? "text" : "password"}
                                                                    value={ps.secretKey}
                                                                    onChange={e => setProviderField(prov.key, "secretKey", e.target.value)}
                                                                    placeholder={ps.secretKeySet ? "••••••••••••  (hidden)" : `${prov.label} ${prov.secretKeyLabel}`}
                                                                    className="w-full text-sm px-4 py-2.5 pr-12 rounded-xl outline-none font-mono"
                                                                    style={inputStyle}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                                                    style={{ color: palette.textTertiary }}
                                                                    onClick={() => patchUi({ showSecret: { ...ui.showSecret, [prov.key]: !ui.showSecret[prov.key] } })}
                                                                >
                                                                    {ui.showSecret[prov.key]
                                                                        ? <VisibilityOff fontSize="small" />
                                                                        : <Visibility fontSize="small" />}
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <a
                                                            href={prov.docsUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-xs font-bold inline-flex items-center gap-1"
                                                            style={{ color: prov.color }}
                                                        >
                                                            View {prov.label} API Docs →
                                                        </a>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}
