/**
 * Admin — AI Provider Settings
 * Configure GitHub Models, Google Gemini, and Perplexity AI for the productivity system.
 */
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import {
    Psychology,
    Save,
    CheckCircle,
    Visibility,
    VisibilityOff,
    ExpandMore,
    ExpandLess,
    Refresh,
    Settings,
    ToggleOn,
    ToggleOff
} from "@mui/icons-material";
import { CustomSelect } from "@Components/Atoms/CustomSelect";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProviderConfig {
    enabled: boolean;
    apiKey: string; // Write-only (blank = don't overwrite)
    hasApiKey: boolean; // Read-only flag from server
    activeModel: string;
    customBaseUrl: string;
}

interface AISettings {
    ActiveProvider: "github" | "google" | "perplexity";
    Providers: {
        github: ProviderConfig;
        google: ProviderConfig;
        perplexity: ProviderConfig;
        openrouter: ProviderConfig;
    };
    Features: {
        taskCreation: boolean;
        intelligentSearch: boolean;
        habitSuggestion: boolean;
        goalBreakdown: boolean;
        ocrExtraction: boolean;
    };
    RateLimitPerUser: {
        dailyRequests: number;
        monthlyRequests: number;
    };
    availableProviders: Record<
        string,
        {
            label: string;
            models: readonly string[];
        }
    >;
}

// ─── Provider metadata ────────────────────────────────────────────────────────

const PROVIDER_META: Record<
    string,
    {
        label: string;
        color: string;
        emoji: string;
        apiKeyLabel: string;
        apiDocsUrl: string;
    }
> = {
    github: {
        label: "GitHub Models (Azure AI)",
        color: "#24292E",
        emoji: "🐙",
        apiKeyLabel: "GitHub Personal Access Token",
        apiDocsUrl: "https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens"
    },
    google: {
        label: "Google Gemini",
        color: "#4285F4",
        emoji: "✨",
        apiKeyLabel: "Google AI Studio API Key",
        apiDocsUrl: "https://aistudio.google.com/app/apikey"
    },
    perplexity: {
        label: "Perplexity AI",
        color: "#1F8EFA",
        emoji: "🔍",
        apiKeyLabel: "Perplexity API Key",
        apiDocsUrl: "https://www.perplexity.ai/settings/api"
    },
    openrouter: {
        label: "OpenRouter",
        color: "#6D28D9",
        emoji: "🌌",
        apiKeyLabel: "OpenRouter API Key",
        apiDocsUrl: "https://openrouter.ai/keys"
    }
};

const FEATURE_META: Record<string, { label: string; description: string }> = {
    taskCreation: {
        label: "AI Task Creation",
        description: "Create tasks from natural language descriptions"
    },
    intelligentSearch: {
        label: "Intelligent Search",
        description: "AI-powered semantic search across items"
    },
    habitSuggestion: {
        label: "Habit Suggestions",
        description: "Suggest habits based on goals"
    },
    goalBreakdown: {
        label: "Goal Breakdown",
        description: "Break down goals into milestones automatically"
    },
    ocrExtraction: {
        label: "OCR Text Extraction",
        description: "Extract task text from images using Tesseract.js"
    }
};

const defaultProvider = (): ProviderConfig => ({
    enabled: false,
    apiKey: "",
    hasApiKey: false,
    activeModel: "",
    customBaseUrl: ""
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function AIProvidersAdminPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const [settings, setSettings] = useState<AISettings>({
        ActiveProvider: "github",
        Providers: {
            github: defaultProvider(),
            google: defaultProvider(),
            perplexity: defaultProvider(),
            openrouter: defaultProvider()
        },
        Features: {
            taskCreation: true,
            intelligentSearch: true,
            habitSuggestion: true,
            goalBreakdown: true,
            ocrExtraction: true
        },
        RateLimitPerUser: {
            dailyRequests: 50,
            monthlyRequests: 500
        },
        availableProviders: {
            github: { label: "GitHub Models", models: [] },
            google: { label: "Google Gemini", models: [] },
            perplexity: { label: "Perplexity AI", models: [] },
            openrouter: { label: "OpenRouter", models: [] }
        }
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [expandedProvider, setExpandedProvider] = useState<string | null>("github");
    const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
    const [fetchedModels, setFetchedModels] = useState<Record<string, string[]>>({});
    const [fetchingModels, setFetchingModels] = useState<Record<string, boolean>>({});

    const fetchModels = useCallback(async (pk: string) => {
        setFetchingModels((prev) => ({ ...prev, [pk]: true }));
        try {
            const res = await fetch(`/api/admin/ai-providers/models?provider=${pk}`);
            const json = await res.json();
            if (json.success && Array.isArray(json.models)) {
                setFetchedModels((prev) => ({ ...prev, [pk]: json.models }));
            } else {
                setFetchedModels((prev) => ({ ...prev, [pk]: [] }));
            }
        } catch {
            setFetchedModels((prev) => ({ ...prev, [pk]: [] }));
        } finally {
            setFetchingModels((prev) => ({ ...prev, [pk]: false }));
        }
    }, []);

    const fetchSettings = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/ai-providers");
            if (res.ok) {
                const json = await res.json();
                setSettings((prev) => ({
                    ...prev,
                    ...json.data,
                    Providers: {
                        github: {
                            ...defaultProvider(),
                            ...json.data?.Providers?.github
                        },
                        google: {
                            ...defaultProvider(),
                            ...json.data?.Providers?.google
                        },
                        perplexity: {
                            ...defaultProvider(),
                            ...json.data?.Providers?.perplexity
                        },
                        openrouter: {
                            ...defaultProvider(),
                            ...json.data?.Providers?.openrouter
                        }
                    }
                }));
            }
        } catch {
            /* ignore */
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    // Auto-fetch live models when a provider card is expanded and has an API key.
    // Also re-runs when settings reload so the initially-expanded card gets fetched.
    useEffect(() => {
        if (!expandedProvider) return;
        const provConfig = settings.Providers[expandedProvider as keyof typeof settings.Providers];
        if (!provConfig?.hasApiKey) return;
        if (fetchedModels[expandedProvider] !== undefined) return;
        if (fetchingModels[expandedProvider]) return;
        fetchModels(expandedProvider);
    }, [expandedProvider, settings.Providers, fetchedModels, fetchingModels, fetchModels]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/admin/ai-providers", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ActiveProvider: settings.ActiveProvider,
                    Providers: settings.Providers,
                    Features: settings.Features,
                    RateLimitPerUser: settings.RateLimitPerUser
                })
            });
            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 2500);
                // Re-fetch settings to get updated hasApiKey flags, then refresh live models
                await fetchSettings();
                if (expandedProvider) {
                    setFetchedModels((prev) => {
                        const n = { ...prev };
                        delete n[expandedProvider];
                        return n;
                    });
                    fetchModels(expandedProvider);
                }
            }
        } finally {
            setSaving(false);
        }
    };

    const updateProvider = (key: string, field: keyof ProviderConfig, value: unknown) => {
        setSettings((prev) => ({
            ...prev,
            Providers: {
                ...prev.Providers,
                [key]: {
                    ...prev.Providers[key as keyof typeof prev.Providers],
                    [field]: value
                }
            }
        }));
    };

    const cardStyle = isApple
        ? {
              background: isDark ? "rgba(28,28,32,0.65)" : "rgba(255,255,255,0.72)",
              backdropFilter: "blur(24px) saturate(190%)",
              WebkitBackdropFilter: "blur(24px) saturate(190%)",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.8)"}`,
              boxShadow: isDark
                  ? "0 8px 32px rgba(0,0,0,0.37), inset 0 1px 1px rgba(255,255,255,0.12)"
                  : "0 8px 32px rgba(0,0,0,0.06), inset 0 1px 1px rgba(255,255,255,0.85)"
          }
        : {
              background: palette.surface,
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`
          };

    const inputStyle = isApple
        ? {
              background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"}`,
              color: palette.textPrimary
          }
        : {
              background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              color: palette.textPrimary,
              border: `1.5px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}`
          };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className={`p-2.5 ${isApple ? "rounded-full" : "rounded-xl"}`}
                        style={{
                            background: "rgba(94,151,246,0.15)",
                            boxShadow: isApple ? "inset 0 1px 1px rgba(255,255,255,0.2)" : undefined
                        }}>
                        <Psychology sx={{ fontSize: 26, color: "#5E97F6" }} />
                    </div>
                    <div>
                        <h1
                            className="text-xl font-bold tracking-tight"
                            style={{ color: palette.textPrimary }}>
                            AI Provider Settings
                        </h1>
                        <p
                            className="text-sm"
                            style={{ color: palette.textSecondary }}>
                            Configure AI providers for the Productivity Hub
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <motion.button
                        onClick={fetchSettings}
                        className={`p-2.5 ${isApple ? "rounded-full" : "rounded-lg"}`}
                        style={{
                            background: isApple ? (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)") : (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"),
                            border: isApple ? `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"}` : undefined,
                            color: palette.textSecondary
                        }}
                        whileTap={{ scale: 0.95 }}>
                        <Refresh sx={{ fontSize: 18 }} />
                    </motion.button>
                    <motion.button
                        onClick={handleSave}
                        disabled={saving}
                        className={`flex items-center gap-2 px-5 py-2.5 ${isApple ? "rounded-full" : "rounded-xl"} text-sm font-semibold`}
                        style={{
                            background: saved ? "#34C759" : "#5E97F6",
                            color: "#fff",
                            boxShadow: isApple ? "0 4px 14px rgba(94,151,246,0.35), inset 0 1px 1px rgba(255,255,255,0.3)" : undefined
                        }}
                        whileTap={{ scale: 0.95 }}>
                        {saved ? <CheckCircle sx={{ fontSize: 16 }} /> : <Save sx={{ fontSize: 16 }} />}
                        {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
                    </motion.button>
                </div>
            </div>

            {/* Active Provider Selector */}
            <div
                className={`p-5 ${isApple ? "rounded-[24px]" : "rounded-2xl"} space-y-3`}
                style={cardStyle}>
                <p
                    className="text-sm font-bold"
                    style={{ color: palette.textPrimary }}>
                    Active Provider
                </p>
                <div className="flex gap-2 flex-wrap">
                    {(["github", "google", "perplexity", "openrouter"] as const).map((pk) => {
                        const meta = PROVIDER_META[pk];
                        const provConfig = settings.Providers[pk];
                        const isActive = settings.ActiveProvider === pk;
                        return (
                            <motion.button
                                key={pk}
                                onClick={() =>
                                    setSettings((prev) => ({
                                        ...prev,
                                        ActiveProvider: pk
                                    }))
                                }
                                className={`flex items-center gap-2 px-4 py-2 ${isApple ? "rounded-full" : "rounded-xl"} text-sm font-semibold`}
                                style={{
                                    background: isActive ? meta.color : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
                                    border: isApple ? `1px solid ${isActive ? "rgba(255,255,255,0.3)" : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}` : undefined,
                                    boxShadow: isActive && isApple ? "0 4px 12px rgba(0,0,0,0.25), inset 0 1px 1px rgba(255,255,255,0.25)" : undefined,
                                    color: isActive ? "#fff" : palette.textSecondary,
                                    opacity: !provConfig.enabled || !provConfig.hasApiKey ? 0.6 : 1
                                }}
                                whileTap={{ scale: 0.95 }}>
                                {meta.emoji} {meta.label}
                                {!provConfig.enabled && <span className="text-xs opacity-60">(disabled)</span>}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Provider configs */}
            {(["github", "google", "perplexity", "openrouter"] as const).map((pk) => {
                const meta = PROVIDER_META[pk];
                const config = settings.Providers[pk];
                const available = settings.availableProviders[pk];
                const isExpanded = expandedProvider === pk;
                const showSecret = showSecrets[pk] ?? false;

                return (
                    <div
                        key={pk}
                        className={`${isApple ? "rounded-[24px]" : "rounded-2xl"} overflow-hidden transition-all duration-200`}
                        style={
                            isApple
                                ? {
                                      background: isDark ? "rgba(28,28,32,0.65)" : "rgba(255,255,255,0.72)",
                                      backdropFilter: "blur(24px) saturate(190%)",
                                      WebkitBackdropFilter: "blur(24px) saturate(190%)",
                                      border: config.enabled
                                          ? `1.5px solid ${meta.color}80`
                                          : `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.8)"}`,
                                      boxShadow: isDark
                                          ? "0 8px 32px rgba(0,0,0,0.37), inset 0 1px 1px rgba(255,255,255,0.12)"
                                          : "0 8px 32px rgba(0,0,0,0.06), inset 0 1px 1px rgba(255,255,255,0.85)"
                                  }
                                : {
                                      background: palette.surface,
                                      border: `1.5px solid ${config.enabled ? meta.color + "60" : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`
                                  }
                        }>
                        {/* Header row */}
                        <div
                            className="flex items-center gap-3 p-4 cursor-pointer"
                            onClick={() => setExpandedProvider(isExpanded ? null : pk)}
                            style={{
                                background: isApple
                                    ? (isDark ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.3)")
                                    : (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)")
                            }}>
                            <span className="text-xl">{meta.emoji}</span>
                            <div className="flex-1">
                                <p
                                    className="font-bold text-sm"
                                    style={{ color: palette.textPrimary }}>
                                    {meta.label}
                                </p>
                                <p
                                    className="text-xs"
                                    style={{ color: palette.textTertiary }}>
                                    {config.hasApiKey ? "API key configured" : "No API key"} ·
                                    {config.activeModel ? ` ${config.activeModel}` : " No model selected"}
                                </p>
                            </div>
                            {/* Toggle */}
                            <motion.button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    updateProvider(pk, "enabled", !config.enabled);
                                }}
                                className="flex-shrink-0"
                                style={{
                                    color: config.enabled ? meta.color : palette.textTertiary
                                }}
                                whileTap={{ scale: 0.9 }}>
                                {config.enabled ? <ToggleOn sx={{ fontSize: 32 }} /> : <ToggleOff sx={{ fontSize: 32 }} />}
                            </motion.button>
                            {isExpanded ? (
                                <ExpandLess
                                    sx={{
                                        fontSize: 20,
                                        color: palette.textTertiary
                                    }}
                                />
                            ) : (
                                <ExpandMore
                                    sx={{
                                        fontSize: 20,
                                        color: palette.textTertiary
                                    }}
                                />
                            )}
                        </div>

                        {/* Expanded config */}
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden">
                                    <div
                                        className="p-4 space-y-4"
                                        style={{
                                            borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`
                                        }}>
                                        {/* API Key */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <label
                                                    className="text-xs font-bold"
                                                    style={{
                                                        color: palette.textSecondary
                                                    }}>
                                                    {meta.apiKeyLabel}
                                                    {config.hasApiKey && (
                                                        <span className="ml-2 text-xs font-normal text-green-500">✓ Configured</span>
                                                    )}
                                                </label>
                                                <a
                                                    href={meta.apiDocsUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs"
                                                    style={{
                                                        color: "#5E97F6"
                                                    }}>
                                                    Get API Key →
                                                </a>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type={showSecret ? "text" : "password"}
                                                    value={config.apiKey}
                                                    onChange={(e) => updateProvider(pk, "apiKey", e.target.value)}
                                                    placeholder={config.hasApiKey ? "Leave blank to keep existing key" : "Enter API key…"}
                                                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none pr-10"
                                                    style={inputStyle}
                                                    autoComplete="off"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowSecrets((prev) => ({
                                                            ...prev,
                                                            [pk]: !showSecret
                                                        }))
                                                    }
                                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                                    style={{
                                                        color: palette.textTertiary
                                                    }}>
                                                    {showSecret ? (
                                                        <VisibilityOff
                                                            sx={{
                                                                fontSize: 16
                                                            }}
                                                        />
                                                    ) : (
                                                        <Visibility
                                                            sx={{
                                                                fontSize: 16
                                                            }}
                                                        />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Model selector */}
                                        {(() => {
                                            const liveModels = fetchedModels[pk];
                                            const modelList: string[] = liveModels ?? (available?.models ? [...available.models] : []);
                                            return (
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <label
                                                            className="text-xs font-bold"
                                                            style={{
                                                                color: palette.textSecondary
                                                            }}>
                                                            Active Model
                                                        </label>
                                                        <motion.button
                                                            onClick={() => fetchModels(pk)}
                                                            disabled={fetchingModels[pk] || !config.hasApiKey}
                                                            title={
                                                                !config.hasApiKey ? "Configure an API key first" : "Fetch live model list"
                                                            }
                                                            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg"
                                                            style={{
                                                                background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                                                                color:
                                                                    fetchingModels[pk] || !config.hasApiKey
                                                                        ? palette.textTertiary
                                                                        : palette.textSecondary,
                                                                opacity: fetchingModels[pk] || !config.hasApiKey ? 0.45 : 1,
                                                                cursor: !config.hasApiKey ? "not-allowed" : "pointer"
                                                            }}
                                                            whileTap={{
                                                                scale: 0.9
                                                            }}>
                                                            {fetchingModels[pk] ? (
                                                                <span className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin inline-block flex-shrink-0" />
                                                            ) : (
                                                                <Refresh
                                                                    sx={{
                                                                        fontSize: 12
                                                                    }}
                                                                />
                                                            )}
                                                            {fetchingModels[pk] ? "Fetching…" : "Refresh"}
                                                        </motion.button>
                                                    </div>
                                                    <CustomSelect
                                                        value={config.activeModel}
                                                        onChange={(v) => updateProvider(pk, "activeModel", v)}
                                                        options={[
                                                            {
                                                                value: "",
                                                                label: modelList.length ? `Default (${modelList[0]})` : "Default"
                                                            },
                                                            ...modelList.map((m) => ({
                                                                value: m,
                                                                label: m
                                                            }))
                                                        ]}
                                                    />
                                                    <p
                                                        className="text-xs"
                                                        style={{
                                                            color: palette.textTertiary
                                                        }}>
                                                        {fetchingModels[pk]
                                                            ? "Fetching live models…"
                                                            : liveModels
                                                              ? `${liveModels.length} models fetched live`
                                                              : config.hasApiKey
                                                                ? "Auto-fetching on expand, or click Refresh"
                                                                : `${modelList.length} built-in models — add an API key to fetch live`}
                                                    </p>
                                                </div>
                                            );
                                        })()}

                                        {/* Custom base URL */}
                                        <div className="space-y-1.5">
                                            <label
                                                className="text-xs font-bold"
                                                style={{
                                                    color: palette.textSecondary
                                                }}>
                                                Custom Base URL (optional)
                                            </label>
                                            <input
                                                type="url"
                                                value={config.customBaseUrl}
                                                onChange={(e) => updateProvider(pk, "customBaseUrl", e.target.value)}
                                                placeholder="https://your-proxy.example.com"
                                                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                                                style={inputStyle}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}

            {/* Features */}
            <div
                className={`p-5 ${isApple ? "rounded-[24px]" : "rounded-2xl"} space-y-4`}
                style={cardStyle}>
                <div className="flex items-center gap-2">
                    <Settings sx={{ fontSize: 18, color: "#AF52DE" }} />
                    <p
                        className="font-bold text-sm"
                        style={{ color: palette.textPrimary }}>
                        AI Feature Flags
                    </p>
                </div>
                <div className="space-y-3">
                    {Object.entries(settings.Features).map(([key, value]) => {
                        const meta = FEATURE_META[key];
                        return (
                            <div
                                key={key}
                                className="flex items-center justify-between gap-3">
                                <div>
                                    <p
                                        className="text-sm font-semibold"
                                        style={{ color: palette.textPrimary }}>
                                        {meta?.label ?? key}
                                    </p>
                                    <p
                                        className="text-xs"
                                        style={{ color: palette.textTertiary }}>
                                        {meta?.description}
                                    </p>
                                </div>
                                <motion.button
                                    onClick={() =>
                                        setSettings((prev) => ({
                                            ...prev,
                                            Features: {
                                                ...prev.Features,
                                                [key]: !value
                                            }
                                        }))
                                    }
                                    style={{
                                        color: value ? "#34C759" : palette.textTertiary
                                    }}
                                    whileTap={{ scale: 0.9 }}>
                                    {value ? <ToggleOn sx={{ fontSize: 32 }} /> : <ToggleOff sx={{ fontSize: 32 }} />}
                                </motion.button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Rate limits */}
            <div
                className={`p-5 ${isApple ? "rounded-[24px]" : "rounded-2xl"} space-y-4`}
                style={cardStyle}>
                <p
                    className="font-bold text-sm"
                    style={{ color: palette.textPrimary }}>
                    Per-User Rate Limits
                </p>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label
                            className="text-xs font-bold"
                            style={{ color: palette.textSecondary }}>
                            Daily Requests
                        </label>
                        <input
                            type="number"
                            value={settings.RateLimitPerUser.dailyRequests}
                            onChange={(e) =>
                                setSettings((prev) => ({
                                    ...prev,
                                    RateLimitPerUser: {
                                        ...prev.RateLimitPerUser,
                                        dailyRequests: parseInt(e.target.value) || 50
                                    }
                                }))
                            }
                            className={`w-full px-4 py-2.5 ${isApple ? "rounded-full" : "rounded-xl"} text-sm outline-none`}
                            style={inputStyle}
                            min={1}
                            max={1000}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label
                            className="text-xs font-bold"
                            style={{ color: palette.textSecondary }}>
                            Monthly Requests
                        </label>
                        <input
                            type="number"
                            value={settings.RateLimitPerUser.monthlyRequests}
                            onChange={(e) =>
                                setSettings((prev) => ({
                                    ...prev,
                                    RateLimitPerUser: {
                                        ...prev.RateLimitPerUser,
                                        monthlyRequests: parseInt(e.target.value) || 500
                                    }
                                }))
                            }
                            className={`w-full px-4 py-2.5 ${isApple ? "rounded-full" : "rounded-xl"} text-sm outline-none`}
                            style={inputStyle}
                            min={1}
                            max={10000}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
