/**
 * Profile Settings Page
 * Manage user profile, name, email, and avatar
 */

"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useDesignTheme } from "@Hooks";
import { useSession, authClient } from "@Library/auth-client";
import { useRouter } from "next/navigation";
import { AvatarSelector } from "@Components/Settings/AvatarSelector";
import {
    ArrowBack,
    Save,
    AccountCircle,
} from "@mui/icons-material";
import Link from "next/link";

export default function ProfileSettingsPage() {
    const { palette, actualColorMode } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const router = useRouter();
    const session = useSession();
    const user = session.data?.user;

    const [formData, setFormData] = useState({
        name: user?.name || "",
        username: (user as any)?.username || "",
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            await authClient.updateUser({
                name: formData.name || undefined,
            });

            alert("Profile updated successfully!");
        } catch (error) {
            console.error("Failed to update profile:", error);
            alert("Failed to update profile. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen" style={{ background: palette.background }}>
            <div className="max-w-4xl mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/settings">
                        <motion.button
                            className="p-2 rounded-lg"
                            style={{ color: palette.textSecondary }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <ArrowBack />
                        </motion.button>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl" style={{ background: `${palette.accent}20` }}>
                            <AccountCircle className="text-3xl" style={{ color: palette.accent }} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold" style={{ color: palette.textPrimary }}>
                                Profile Settings
                            </h1>
                            <p style={{ color: palette.textSecondary }}>
                                Manage your personal information and avatar
                            </p>
                        </div>
                    </div>
                </div>

                {/* Avatar Selector */}
                <motion.div
                    className="p-6 rounded-2xl"
                    style={{ background: palette.surface }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <AvatarSelector />
                </motion.div>

                {/* Profile Form */}
                <motion.div
                    className="p-6 rounded-2xl"
                    style={{ background: palette.surface }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <h3 className="text-lg font-semibold mb-4" style={{ color: palette.textPrimary }}>
                        Personal Information
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email (Read-only) */}
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: palette.textSecondary }}>
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={user?.email || ""}
                                disabled
                                className="w-full px-4 py-3 rounded-xl opacity-60 cursor-not-allowed"
                                style={{
                                    background: palette.background,
                                    color: palette.textPrimary,
                                    border: `1px solid ${palette.border}`,
                                }}
                            />
                            <p className="text-xs mt-1" style={{ color: palette.textTertiary }}>
                                Email cannot be changed directly. Contact support if needed.
                            </p>
                        </div>

                        {/* Username (Read-only if exists) */}
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: palette.textSecondary }}>
                                Username
                            </label>
                            <input
                                type="text"
                                value={formData.username}
                                disabled
                                className="w-full px-4 py-3 rounded-xl opacity-60 cursor-not-allowed"
                                style={{
                                    background: palette.background,
                                    color: palette.textPrimary,
                                    border: `1px solid ${palette.border}`,
                                }}
                            />
                            <p className="text-xs mt-1" style={{ color: palette.textTertiary }}>
                                Username is set during signup and cannot be changed
                            </p>
                        </div>

                        {/* Display Name */}
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: palette.textSecondary }}>
                                Display Name
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Enter your display name"
                                className="w-full px-4 py-3 rounded-xl"
                                style={{
                                    background: palette.background,
                                    color: palette.textPrimary,
                                    border: `1px solid ${palette.border}`,
                                }}
                            />
                        </div>

                        {/* Save Button */}
                        <motion.button
                            type="submit"
                            disabled={saving}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold"
                            style={{
                                background: palette.accent,
                                color: "#fff",
                                opacity: saving ? 0.6 : 1,
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Save />
                            {saving ? "Saving..." : "Save Changes"}
                        </motion.button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
