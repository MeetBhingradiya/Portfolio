/**
 * Profile Settings Page
 * Merged from /profile and /settings/profile
 * Manage user profile, name, username, email, and avatar (CDN upload + URL)
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useDesignTheme } from "@Hooks";
import { useAuth, updateUser, isUsernameAvailable } from "@Library/auth-client";
import { useRouter } from "next/navigation";
import { AvatarSelector } from "@Components/Settings/AvatarSelector";
import Link from "next/link";
import {
    ArrowBack,
    Save,
    AccountCircle,
    Edit,
    Cancel,
    CheckCircle,
    Error as ErrorIcon,
    Email,
    Badge,
    Person,
    Security,
    Check,
    Close,
} from "@mui/icons-material";

export default function ProfileSettingsPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";
    const router = useRouter();
    const { user, isAuthenticated, isLoading } = useAuth();

    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        username: "",
        email: "",
    });

    // Username availability state
    const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
    const [usernameError, setUsernameError] = useState("");

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || "",
                username: (user as any).username || "",
                email: user.email || "",
            });
        }
    }, [user]);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/auth/signin");
        }
    }, [isLoading, isAuthenticated, router]);

    const checkUsernameAvailability = async (username: string) => {
        if (!username || username === (user as any)?.username) {
            setUsernameStatus("idle");
            setUsernameError("");
            return;
        }
        if (username.length < 3) {
            setUsernameStatus("idle");
            setUsernameError("Username must be at least 3 characters");
            return;
        }
        if (username.length > 30) {
            setUsernameStatus("idle");
            setUsernameError("Username must be 30 characters or less");
            return;
        }
        if (!/^[a-zA-Z0-9_.]+$/.test(username)) {
            setUsernameStatus("idle");
            setUsernameError("Username can only contain letters, numbers, underscores, and dots");
            return;
        }
        setUsernameStatus("checking");
        setUsernameError("");
        try {
            const result = await isUsernameAvailable({ username });
            if (result.data?.available) {
                setUsernameStatus("available");
            } else {
                setUsernameStatus("taken");
                setUsernameError("Username is already taken");
            }
        } catch {
            setUsernameStatus("idle");
            setUsernameError("Failed to check username availability");
        }
    };

    useEffect(() => {
        if (editing && formData.username) {
            const timer = setTimeout(() => checkUsernameAvailability(formData.username), 500);
            return () => clearTimeout(timer);
        }
    }, [formData.username, editing]);

    const handleSave = async () => {
        if (usernameStatus === "taken" || usernameError) {
            setMessage({ type: "error", text: usernameError || "Please fix errors before saving" });
            return;
        }
        setSaving(true);
        setMessage(null);
        try {
            const updates: any = {};
            if (formData.name !== user?.name) updates.name = formData.name;
            if (formData.username !== (user as any)?.username) updates.username = formData.username;

            if (Object.keys(updates).length === 0) {
                setMessage({ type: "error", text: "No changes to save" });
                setSaving(false);
                return;
            }
            await updateUser(updates);
            setMessage({ type: "success", text: "Profile updated successfully!" });
            setEditing(false);
        } catch (error: any) {
            setMessage({ type: "error", text: error.message || "Failed to update profile" });
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (user) {
            setFormData({
                name: user.name || "",
                username: (user as any).username || "",
                email: user.email || "",
            });
        }
        setEditing(false);
        setMessage(null);
        setUsernameStatus("idle");
        setUsernameError("");
    };

    const cardStyle = {
        background: isApple
            ? isDark ? "rgba(38, 38, 42, 0.6)" : "rgba(255, 255, 255, 0.6)"
            : palette.surface,
        backdropFilter: isApple ? "blur(20px)" : undefined,
        border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"}`,
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: palette.background }}>
                <div className="text-center">
                    <div
                        className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mx-auto mb-4"
                        style={{ borderColor: `${palette.accent} transparent transparent transparent` }}
                    />
                    <p style={{ color: palette.textSecondary }}>Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || !user) return null;

    return (
        <div className="min-h-screen" style={{ background: palette.background }}>
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

                {/* Header */}
                <div>
                    <Link href="/settings">
                        <motion.button
                            className="flex items-center gap-2 mb-4 px-4 py-2 rounded-xl"
                            style={{ color: palette.textSecondary }}
                            whileHover={{
                                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                                color: palette.textPrimary,
                            }}
                        >
                            <ArrowBack />
                            <span>Back to Settings</span>
                        </motion.button>
                    </Link>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
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
                        {!editing && (
                            <motion.button
                                className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold"
                                style={{ background: palette.accent, color: "#ffffff" }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setEditing(true)}
                            >
                                <Edit />
                                Edit Profile
                            </motion.button>
                        )}
                    </div>
                </div>

                {/* Message Banner */}
                {message && (
                    <motion.div
                        className="p-4 rounded-2xl flex items-center gap-3"
                        style={{
                            background: message.type === "success"
                                ? isDark ? "rgba(34,197,94,0.1)" : "rgba(34,197,94,0.08)"
                                : isDark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.08)",
                            border: `1px solid ${message.type === "success" ? "#22c55e" : "#ef4444"}`,
                        }}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {message.type === "success"
                            ? <CheckCircle style={{ color: "#22c55e" }} />
                            : <ErrorIcon style={{ color: "#ef4444" }} />}
                        <p style={{ color: palette.textPrimary }}>{message.text}</p>
                    </motion.div>
                )}

                {/* Avatar Selector (CDN-powered upload) */}
                <motion.div
                    className="p-6 rounded-2xl"
                    style={cardStyle}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h3 className="text-lg font-semibold mb-4" style={{ color: palette.textPrimary }}>
                        Profile Picture
                    </h3>
                    <AvatarSelector />
                </motion.div>

                {/* Personal Information */}
                <motion.div
                    className="p-8 rounded-3xl"
                    style={cardStyle}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                >
                    <h3 className="text-lg font-semibold mb-6" style={{ color: palette.textPrimary }}>
                        Personal Information
                    </h3>

                    <div className="space-y-6">
                        {/* Display Name */}
                        <div>
                            <label className="flex items-center gap-2 mb-2 font-semibold" style={{ color: palette.textPrimary }}>
                                <Person fontSize="small" />
                                Display Name
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                disabled={!editing}
                                className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                                style={{
                                    background: editing
                                        ? isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)"
                                        : isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                                    border: editing
                                        ? `2px solid ${palette.accent}`
                                        : `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                                    color: palette.textPrimary,
                                    cursor: editing ? "text" : "not-allowed",
                                }}
                                placeholder="Enter your display name"
                            />
                        </div>

                        {/* Username */}
                        <div>
                            <label className="flex items-center gap-2 mb-2 font-semibold" style={{ color: palette.textPrimary }}>
                                <Badge fontSize="small" />
                                Username
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                                    disabled={!editing}
                                    className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                                    style={{
                                        background: editing
                                            ? isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)"
                                            : isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                                        border: editing
                                            ? `2px solid ${usernameError ? "#ef4444" : usernameStatus === "available" ? "#22c55e" : palette.accent}`
                                            : `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                                        color: palette.textPrimary,
                                        cursor: editing ? "text" : "not-allowed",
                                    }}
                                    placeholder="Enter your username"
                                />
                                {editing && formData.username && formData.username !== (user as any)?.username && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {usernameStatus === "checking" && (
                                            <div
                                                className="animate-spin rounded-full h-5 w-5 border-2 border-t-transparent"
                                                style={{ borderColor: `${palette.accent} transparent transparent transparent` }}
                                            />
                                        )}
                                        {usernameStatus === "available" && <Check style={{ color: "#22c55e" }} />}
                                        {usernameStatus === "taken" && <Close style={{ color: "#ef4444" }} />}
                                    </div>
                                )}
                            </div>
                            {editing && usernameError && (
                                <p className="text-sm mt-1" style={{ color: "#ef4444" }}>{usernameError}</p>
                            )}
                            {editing && usernameStatus === "available" && (
                                <p className="text-sm mt-1" style={{ color: "#22c55e" }}>Username is available!</p>
                            )}
                            {!editing && (
                                <p className="text-sm mt-1" style={{ color: palette.textTertiary }}>
                                    Your unique identifier on the platform
                                </p>
                            )}
                        </div>

                        {/* Email (read-only) */}
                        <div>
                            <label className="flex items-center gap-2 mb-2 font-semibold" style={{ color: palette.textPrimary }}>
                                <Email fontSize="small" />
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                disabled
                                className="w-full px-4 py-3 rounded-xl outline-none cursor-not-allowed"
                                style={{
                                    background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                                    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                                    color: palette.textSecondary,
                                }}
                            />
                            <p className="text-sm mt-1" style={{ color: palette.textTertiary }}>
                                Email cannot be changed. Contact support if needed.
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {editing && (
                        <div
                            className="flex gap-3 mt-8 pt-6"
                            style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}` }}
                        >
                            <motion.button
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold"
                                style={{ background: palette.accent, color: "#ffffff" }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSave}
                                disabled={saving || usernameStatus === "checking"}
                            >
                                {saving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save />
                                        Save Changes
                                    </>
                                )}
                            </motion.button>
                            <motion.button
                                className="px-6 py-3 rounded-xl font-semibold flex items-center gap-2"
                                style={{
                                    background: "transparent",
                                    border: `2px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                                    color: palette.textPrimary,
                                }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleCancel}
                                disabled={saving}
                            >
                                <Cancel />
                                Cancel
                            </motion.button>
                        </div>
                    )}
                </motion.div>

                {/* Security Note */}
                <motion.div
                    className="p-4 rounded-2xl flex gap-3"
                    style={{
                        background: isDark ? "rgba(59,130,246,0.1)" : "rgba(59,130,246,0.08)",
                        border: `1px solid ${isDark ? "rgba(59,130,246,0.2)" : "rgba(59,130,246,0.15)"}`,
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Security style={{ color: "#3b82f6" }} />
                    <p className="text-sm" style={{ color: palette.textSecondary }}>
                        Need to update your password or manage security settings?{" "}
                        <Link href="/settings/security" className="font-semibold underline" style={{ color: "#3b82f6" }}>
                            Go to Security Settings
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
