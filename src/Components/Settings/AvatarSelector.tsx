"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useDesignTheme } from "@Hooks";
import { useSession, authClient } from "@Library/auth-client";
import { UserAvatar } from "@Components/Common/UserAvatar";
import { Check, Google, GitHub } from "@mui/icons-material";
import { SiDiscord } from "react-icons/si";

interface LinkedAccount {
    id: string;
    providerId: string;
    accountId: string;
    image: string | null;
    name: string | null;
}

export function AvatarSelector() {
    const { palette, actualColorMode } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const session = useSession();
    const user = session.data?.user;

    const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
    const [selectedSource, setSelectedSource] = useState<string>("initials");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // Determine current selection based on whether user has image
        if (user?.image) {
            setSelectedSource("oauth");
        } else {
            setSelectedSource("initials");
        }
        setLoading(false);
    }, [user?.image]);

    const handleSelectAvatar = async (source: string) => {
        setSaving(true);
        setSelectedSource(source);

        try {
            const response = await fetch("/api/auth/update-avatar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ avatarSource: source }),
            });

            if (!response.ok) {
                throw new Error("Failed to update avatar");
            }

            // Refresh session to get updated image
            window.location.reload();
        } catch (error) {
            console.error("Failed to update avatar:", error);
            alert("Failed to update avatar. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const getProviderIcon = (providerId: string) => {
        switch (providerId) {
            case "google":
                return <Google />;
            case "github":
                return <GitHub />;
            case "discord":
                return <SiDiscord />;
            default:
                return null;
        }
    };

    const getProviderName = (providerId: string) => {
        return providerId.charAt(0).toUpperCase() + providerId.slice(1);
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

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: palette.textPrimary }}>
                Profile Avatar
            </h3>

            <p className="text-sm" style={{ color: palette.textSecondary }}>
                Choose your profile picture from your linked accounts or use your initials with a
                colorful gradient.
            </p>

            {/* Current Avatar Preview */}
            <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: palette.surface }}>
                <UserAvatar
                    userId={user?.id || ""}
                    name={user?.name}
                    email={user?.email}
                    image={user?.image}
                    size={64}
                />
                <div>
                    <p className="font-medium" style={{ color: palette.textPrimary }}>
                        Current Avatar
                    </p>
                    <p className="text-sm" style={{ color: palette.textSecondary }}>
                        {selectedSource === "initials"
                            ? "Gradient with initials"
                            : "From OAuth account"}
                    </p>
                </div>
            </div>

            {/* Avatar Options */}
            <div className="space-y-3">
                {/* OAuth Image Option (if available) */}
                {user?.image && (
                    <motion.button
                        onClick={() => handleSelectAvatar("oauth")}
                        disabled={saving}
                        className="w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left"
                        style={{
                            borderColor: selectedSource === "oauth" ? palette.accent : palette.border,
                            background: selectedSource === "oauth" ? palette.accentSubtle : "transparent",
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <UserAvatar
                            userId={user?.id || ""}
                            name={user?.name}
                            email={user?.email}
                            image={user?.image}
                            size={48}
                        />
                        <div className="flex-1">
                            <p className="font-medium" style={{ color: palette.textPrimary }}>
                                Use OAuth Profile Picture
                            </p>
                            <p className="text-sm" style={{ color: palette.textSecondary }}>
                                From your connected account
                            </p>
                        </div>
                        {selectedSource === "oauth" && (
                            <Check style={{ color: palette.accent }} />
                        )}
                    </motion.button>
                )}

                {/* Initials Option */}
                <motion.button
                    onClick={() => handleSelectAvatar("initials")}
                    disabled={saving}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left"
                    style={{
                        borderColor: selectedSource === "initials" ? palette.accent : palette.border,
                        background: selectedSource === "initials" ? palette.accentSubtle : "transparent",
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <UserAvatar
                        userId={user?.id || ""}
                        name={user?.name}
                        email={user?.email}
                        image={null}
                        size={48}
                    />
                    <div className="flex-1">
                        <p className="font-medium" style={{ color: palette.textPrimary }}>
                            Use Gradient with Initials
                        </p>
                        <p className="text-sm" style={{ color: palette.textSecondary }}>
                            Unique gradient generated from your ID
                        </p>
                    </div>
                    {selectedSource === "initials" && (
                        <Check style={{ color: palette.accent }} />
                    )}
                </motion.button>
            </div>

            {!user?.image && (
                <div className="p-4 rounded-xl text-center" style={{ background: `${palette.accent}10` }}>
                    <p className="text-sm mb-2" style={{ color: palette.textPrimary }}>
                        <strong>No profile picture yet?</strong>
                    </p>
                    <p className="text-sm" style={{ color: palette.textSecondary }}>
                        Go to <strong>Settings → Linked Accounts</strong> and click the <strong>"Sync Avatar"</strong> button next to your Google or GitHub account to fetch your profile picture.
                    </p>
                </div>
            )}
        </div>
    );
}
