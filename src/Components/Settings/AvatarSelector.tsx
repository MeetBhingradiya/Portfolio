"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDesignTheme } from "@Hooks";
import { useSession } from "@Library/auth-client";
import { UserAvatar } from "@Components/Common/UserAvatar";
import { Check, Google, GitHub, Microsoft, CloudUpload } from "@mui/icons-material";
import Image from "next/image";
import { CDNAvatarUpload } from "./CDNAvatarUpload";

interface AvatarHistoryItem {
    assetId: string;
    url: string;
    altText?: string;
    createdAt: string;
}

interface LinkedAccountInfo {
    id: string;
    providerId: string;
    accountId: string;
    image: string | null;
}

interface AccountsInfoResponse {
    accounts: LinkedAccountInfo[];
    googleAvatar: string | null;
    githubAvatar: string | null;
    microsoftAvatar: string | null;
    currentImage: string | null;
}

type AvatarSource = "google" | "github" | "microsoft" | "initials" | "custom";

function providerIcon(providerId: string) {
    switch (providerId) {
        case "google":
            return <Google fontSize="small" />;
        case "github":
            return <GitHub fontSize="small" />;
        case "microsoft":
            return <Microsoft fontSize="small" />;
        default:
            return null;
    }
}

function providerLabel(providerId: string) {
    return providerId.charAt(0).toUpperCase() + providerId.slice(1);
}

export function AvatarSelector() {
    const { palette, actualColorMode } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const session = useSession();
    const user = session.data?.user;

    const [accountsInfo, setAccountsInfo] = useState<AccountsInfoResponse | null>(null);
    const [selectedSource, setSelectedSource] = useState<AvatarSource>("initials");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showCDNUpload, setShowCDNUpload] = useState(false);
    const [avatarHistory, setAvatarHistory] = useState<AvatarHistoryItem[]>([]);
    const [importUrl, setImportUrl] = useState("");
    const [importingUrl, setImportingUrl] = useState(false);
    const [importError, setImportError] = useState("");

    // Fetch linked accounts with per-provider images
    useEffect(() => {
        if (!user) return;
        fetch("/api/auth/linked-accounts-info")
            .then((r) => r.json())
            .then((data: AccountsInfoResponse) => {
                setAccountsInfo(data);
                // Determine currently selected source
                const cur = data.currentImage;
                if (!cur) {
                    setSelectedSource("initials");
                } else if (cur === data.googleAvatar) {
                    setSelectedSource("google");
                } else if (cur === data.githubAvatar) {
                    setSelectedSource("github");
                } else if (cur === data.microsoftAvatar) {
                    setSelectedSource("microsoft");
                } else {
                    setSelectedSource("custom");
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [user?.id]);

    useEffect(() => {
        if (!user?.id) return;
        fetch("/api/auth/avatar-history")
            .then((r) => r.json())
            .then((data) => {
                if (Array.isArray(data?.history)) {
                    setAvatarHistory(data.history);
                }
            })
            .catch((err) => {
                console.error("Failed to load avatar history", err);
            });
    }, [user?.id]);

    const applyCustomAvatar = async (customImageUrl: string) => {
        if (saving) return;
        setSaving(true);
        setSelectedSource("custom");

        try {
            const res = await fetch("/api/auth/update-avatar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ avatarSource: "custom", customImageUrl })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to update avatar");
            }
            window.location.reload();
        } catch (error: any) {
            console.error("Failed to update custom avatar", error);
            alert(error?.message || "Failed to update avatar. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleImportUrl = async () => {
        if (importingUrl || !importUrl.trim()) return;
        setImportError("");
        setImportingUrl(true);

        try {
            const importRes = await fetch("/api/auth/avatar-import-url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageUrl: importUrl.trim() })
            });
            const importData = await importRes.json();
            if (!importRes.ok) {
                throw new Error(importData?.error || "Failed to import image URL");
            }

            await applyCustomAvatar(importData.cdnUrl);
        } catch (error: any) {
            setImportError(error?.message || "Failed to import image URL");
        } finally {
            setImportingUrl(false);
        }
    };

    const handleSelect = async (source: AvatarSource) => {
        if (saving || source === selectedSource) return;
        setSaving(true);
        setSelectedSource(source);

        try {
            const res = await fetch("/api/auth/update-avatar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ avatarSource: source })
            });
            if (!res.ok) {
                const err = await res.json();
                alert(err.error || "Failed to update avatar");
                return;
            }
            // Refresh page so session image updates everywhere
            window.location.reload();
        } catch (error) {
            console.error("Failed to update avatar:", error);
            alert("Failed to update avatar. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <div
                    className="animate-spin rounded-full h-8 w-8 border-b-2"
                    style={{ borderColor: palette.accent }}
                />
            </div>
        );
    }

    // Build the list of available OAuth avatar sources from the top-level fields
    // (not from accounts[].image, which can be empty if listUserAccounts fails).
    const availableOAuthSources: { providerId: AvatarSource; image: string }[] = [];
    if (accountsInfo?.googleAvatar) {
        availableOAuthSources.push({
            providerId: "google",
            image: accountsInfo.googleAvatar
        });
    }
    if (accountsInfo?.githubAvatar) {
        availableOAuthSources.push({
            providerId: "github",
            image: accountsInfo.githubAvatar
        });
    }
    if (accountsInfo?.microsoftAvatar) {
        availableOAuthSources.push({
            providerId: "microsoft",
            image: accountsInfo.microsoftAvatar
        });
    }

    return (
        <div className="space-y-4">
            <h3
                className="text-lg font-semibold"
                style={{ color: palette.textPrimary }}>
                Profile Avatar
            </h3>
            <p
                className="text-sm"
                style={{ color: palette.textSecondary }}>
                Choose your profile picture from a connected account or use gradient initials.
            </p>

            {/* Current avatar preview */}
            <div
                className="flex items-center gap-4 p-4 rounded-xl"
                style={{ background: `${palette.accent}10` }}>
                <UserAvatar
                    userId={user?.id || ""}
                    name={user?.name}
                    email={user?.email}
                    image={user?.image}
                    size={64}
                />
                <div>
                    <p
                        className="font-medium"
                        style={{ color: palette.textPrimary }}>
                        Current Avatar
                    </p>
                    <p
                        className="text-sm"
                        style={{ color: palette.textSecondary }}>
                        {selectedSource === "initials"
                            ? "Gradient with initials"
                            : selectedSource === "custom"
                              ? "Custom avatar"
                              : `From ${providerLabel(selectedSource)}`}
                    </p>
                </div>
            </div>

            {/* Per-provider avatar options */}
            <div className="space-y-3">
                {availableOAuthSources.map(({ providerId, image }) => {
                    const src = providerId as AvatarSource;
                    const isActive = selectedSource === src;
                    return (
                        <motion.button
                            key={providerId}
                            onClick={() => handleSelect(src)}
                            disabled={saving}
                            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left"
                            style={{
                                borderColor: isActive ? palette.accent : palette.border,
                                background: isActive ? `${palette.accent}15` : "transparent",
                                opacity: saving ? 0.6 : 1
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}>
                            {/* Provider avatar preview */}
                            <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                                <Image
                                    src={image}
                                    alt={`${providerLabel(providerId)} avatar`}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span style={{ color: palette.accent }}>{providerIcon(providerId)}</span>
                                    <p
                                        className="font-medium"
                                        style={{ color: palette.textPrimary }}>
                                        {providerLabel(providerId)} Profile Picture
                                    </p>
                                </div>
                                <p
                                    className="text-sm truncate"
                                    style={{ color: palette.textSecondary }}>
                                    {image}
                                </p>
                            </div>

                            {isActive && <Check style={{ color: palette.accent }} />}
                        </motion.button>
                    );
                })}

                {/* Gradient initials option */}
                <motion.button
                    onClick={() => handleSelect("initials")}
                    disabled={saving}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left"
                    style={{
                        borderColor: selectedSource === "initials" ? palette.accent : palette.border,
                        background: selectedSource === "initials" ? `${palette.accent}15` : "transparent",
                        opacity: saving ? 0.6 : 1
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}>
                    <UserAvatar
                        userId={user?.id || ""}
                        name={user?.name}
                        email={user?.email}
                        image={null}
                        size={48}
                    />
                    <div className="flex-1">
                        <p
                            className="font-medium"
                            style={{ color: palette.textPrimary }}>
                            Gradient with Initials
                        </p>
                        <p
                            className="text-sm"
                            style={{ color: palette.textSecondary }}>
                            Unique gradient generated from your profile
                        </p>
                    </div>
                    {selectedSource === "initials" && <Check style={{ color: palette.accent }} />}
                </motion.button>
            </div>

            {/* Info: no OAuth avatars yet */}
            {availableOAuthSources.length === 0 && (
                <div
                    className="p-4 rounded-xl text-center"
                    style={{ background: `${palette.accent}10` }}>
                    <p
                        className="text-sm mb-1 font-semibold"
                        style={{ color: palette.textPrimary }}>
                        No provider avatars found yet
                    </p>
                    <p
                        className="text-sm"
                        style={{ color: palette.textSecondary }}>
                        Sign in or link a Google / GitHub account. Your avatar will be captured automatically and appear here.
                    </p>
                </div>
            )}

            {/* CDN Custom Upload */}
            <AnimatePresence>
                {showCDNUpload ? (
                    <motion.div
                        key="cdn-upload"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="p-4 rounded-xl border-2"
                        style={{
                            borderColor: palette.accent,
                            background: `${palette.accent}08`
                        }}>
                        <p
                            className="font-semibold text-sm mb-3"
                            style={{ color: palette.textPrimary }}>
                            Upload Custom Avatar
                        </p>
                        <CDNAvatarUpload
                            sessionUserId={user?.id || ""}
                            onSuccess={(cdnUrl) => {
                                setSelectedSource("custom");
                                setShowCDNUpload(false);
                                window.location.reload();
                            }}
                            onCancel={() => setShowCDNUpload(false)}
                        />
                    </motion.div>
                ) : (
                    <motion.button
                        key="cdn-btn"
                        onClick={() => setShowCDNUpload(true)}
                        className="w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left"
                        style={{
                            borderColor: selectedSource === "custom" ? palette.accent : palette.border,
                            background: selectedSource === "custom" ? `${palette.accent}15` : "transparent"
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}>
                        <div
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: "50%",
                                flexShrink: 0,
                                background: `${palette.accent}20`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}>
                            <CloudUpload style={{ color: palette.accent }} />
                        </div>
                        <div className="flex-1">
                            <p
                                className="font-medium"
                                style={{ color: palette.textPrimary }}>
                                Upload Custom Avatar
                            </p>
                            <p
                                className="text-sm"
                                style={{ color: palette.textSecondary }}>
                                Upload your own image with crop &amp; rotate
                            </p>
                        </div>
                        {selectedSource === "custom" && <Check style={{ color: palette.accent }} />}
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Import from image URL */}
            <div
                className="p-4 rounded-xl border"
                style={{
                    borderColor: palette.border,
                    background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)"
                }}>
                <p
                    className="font-semibold text-sm"
                    style={{ color: palette.textPrimary }}>
                    Import Avatar From URL
                </p>
                <p
                    className="text-xs mt-1 mb-3"
                    style={{ color: palette.textSecondary }}>
                    Paste a direct image URL. It will be fetched, uploaded to your CDN, and set as your profile avatar.
                </p>
                <div className="flex gap-2">
                    <input
                        type="url"
                        value={importUrl}
                        onChange={(e) => setImportUrl(e.target.value)}
                        placeholder="https://example.com/avatar.jpg"
                        className="w-full px-3 py-2 rounded-lg outline-none"
                        style={{
                            border: `1px solid ${palette.border}`,
                            background: isDark ? "rgba(255,255,255,0.04)" : "#ffffff",
                            color: palette.textPrimary
                        }}
                    />
                    <motion.button
                        onClick={handleImportUrl}
                        disabled={importingUrl || saving || !importUrl.trim()}
                        className="px-4 py-2 rounded-lg text-sm font-semibold"
                        style={{
                            background: importingUrl || saving || !importUrl.trim() ? palette.textTertiary : palette.accent,
                            color: "#fff",
                            cursor: importingUrl || saving || !importUrl.trim() ? "not-allowed" : "pointer"
                        }}
                        whileHover={{
                            scale: importingUrl || saving || !importUrl.trim() ? 1 : 1.02
                        }}
                        whileTap={{
                            scale: importingUrl || saving || !importUrl.trim() ? 1 : 0.98
                        }}>
                        {importingUrl ? "Importing..." : "Import"}
                    </motion.button>
                </div>
                {importError && (
                    <p
                        className="text-xs mt-2"
                        style={{ color: "#ef4444" }}>
                        {importError}
                    </p>
                )}
            </div>

            {/* Previous custom avatars */}
            {avatarHistory.length > 0 && (
                <div className="space-y-2">
                    <p
                        className="text-sm font-semibold"
                        style={{ color: palette.textPrimary }}>
                        Your Previous Avatars
                    </p>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                        {avatarHistory.map((item) => {
                            const isActive = Boolean(
                                accountsInfo?.currentImage && accountsInfo.currentImage.endsWith(`/api/cdn/${item.assetId}`)
                            );
                            return (
                                <button
                                    key={item.assetId}
                                    onClick={() => applyCustomAvatar(item.url)}
                                    disabled={saving || importingUrl}
                                    className="relative rounded-full overflow-hidden aspect-square border-2"
                                    style={{
                                        borderColor: isActive ? palette.accent : palette.border,
                                        opacity: saving || importingUrl ? 0.6 : 1
                                    }}
                                    title={item.altText || "Previous avatar"}>
                                    <Image
                                        src={item.url}
                                        alt={item.altText || "Previous avatar"}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                    {isActive && (
                                        <span
                                            className="absolute bottom-1 right-1 rounded-full p-0.5"
                                            style={{
                                                background: palette.accent,
                                                color: "#fff"
                                            }}>
                                            <Check style={{ fontSize: 14 }} />
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
