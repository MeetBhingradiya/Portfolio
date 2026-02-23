
/**
 * Profile Page
 * User profile management with username support
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useDesignTheme } from "@Hooks";
import { useAuth, updateUser, isUsernameAvailable } from "@Library/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Person,
    ArrowBack,
    Edit,
    Save,
    Cancel,
    CheckCircle,
    Error as ErrorIcon,
    Email,
    Badge,
    Image as ImageIcon,
    Security,
    Warning,
    Check,
    Close
} from "@mui/icons-material";

export default function ProfilePage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        username: "",
        email: "",
        image: ""
    });

    // Username validation
    const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
    const [usernameError, setUsernameError] = useState("");

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || "",
                username: (user as any).username || "",
                email: user.email || "",
                image: user.image || ""
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
        } catch (error) {
            setUsernameStatus("idle");
            setUsernameError("Failed to check username availability");
        }
    };

    useEffect(() => {
        if (editing && formData.username) {
            const timer = setTimeout(() => {
                checkUsernameAvailability(formData.username);
            }, 500);
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
            if (formData.image !== user?.image) updates.image = formData.image;

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
                image: user.image || ""
            });
        }
        setEditing(false);
        setMessage(null);
        setUsernameStatus("idle");
        setUsernameError("");
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: palette.background }}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mx-auto mb-4" 
                         style={{ borderColor: `${palette.accent} transparent transparent transparent` }} />
                    <p style={{ color: palette.textSecondary }}>Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return null;
    }

    return (
        <div className="min-h-screen" style={{ background: palette.background }}>
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/settings">
                        <motion.button
                            className="flex items-center gap-2 mb-4 px-4 py-2 rounded-xl"
                            style={{ color: palette.textSecondary }}
                            whileHover={{
                                backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
                                color: palette.textPrimary
                            }}
                        >
                            <ArrowBack />
                            <span>Back to Settings</span>
                        </motion.button>
                    </Link>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl" style={{ background: `${palette.accent}20` }}>
                                <Person className="text-3xl" style={{ color: palette.accent }} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold" style={{ color: palette.textPrimary }}>
                                    Profile Settings
                                </h1>
                                <p style={{ color: palette.textSecondary }}>
                                    Manage your personal information
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

                {/* Message */}
                {message && (
                    <motion.div
                        className="mb-6 p-4 rounded-2xl flex items-center gap-3"
                        style={{
                            background: message.type === "success" 
                                ? isDark ? "rgba(34, 197, 94, 0.1)" : "rgba(34, 197, 94, 0.08)"
                                : isDark ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.08)",
                            border: `1px solid ${message.type === "success" ? "#22c55e" : "#ef4444"}`
                        }}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {message.type === "success" ? (
                            <CheckCircle style={{ color: "#22c55e" }} />
                        ) : (
                            <ErrorIcon style={{ color: "#ef4444" }} />
                        )}
                        <p style={{ color: palette.textPrimary }}>{message.text}</p>
                    </motion.div>
                )}

                {/* Profile Card */}
                <motion.div
                    className="p-8 rounded-3xl mb-6"
                    style={{
                        background: isApple
                            ? isDark ? "rgba(38, 38, 42, 0.6)" : "rgba(255, 255, 255, 0.6)"
                            : palette.surface,
                        backdropFilter: "blur(20px)",
                        border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"}`
                    }}
                >
                    {/* Avatar Section */}
                    <div className="flex items-center gap-6 mb-8 pb-8" style={{ borderBottom: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}` }}>
                        <div 
                            className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold"
                            style={{ 
                                background: formData.image 
                                    ? `url(${formData.image}) center/cover`
                                    : `linear-gradient(135deg, ${palette.accent}, ${palette.accent})`,
                                color: "#ffffff"
                            }}
                        >
                            {!formData.image && (formData.name?.[0] || formData.email?.[0] || "U").toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold mb-1" style={{ color: palette.textPrimary }}>
                                {formData.name || "No name set"}
                            </h2>
                            <p style={{ color: palette.textSecondary }}>
                                @{(user as any)?.username || "No username"}
                            </p>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-6">
                        {/* Name */}
                        <div>
                            <label className="flex items-center gap-2 mb-2 font-semibold" style={{ color: palette.textPrimary }}>
                                <Person />
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
                                        ? isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)"
                                        : isDark ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)",
                                    border: editing 
                                        ? `2px solid ${palette.accent}` 
                                        : `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"}`,
                                    color: palette.textPrimary,
                                    cursor: editing ? "text" : "not-allowed"
                                }}
                                placeholder="Enter your display name"
                            />
                        </div>

                        {/* Username */}
                        <div>
                            <label className="flex items-center gap-2 mb-2 font-semibold" style={{ color: palette.textPrimary }}>
                                <Badge />
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
                                            ? isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)"
                                            : isDark ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)",
                                        border: editing 
                                            ? `2px solid ${usernameError ? "#ef4444" : usernameStatus === "available" ? "#22c55e" : palette.accent}` 
                                            : `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"}`,
                                        color: palette.textPrimary,
                                        cursor: editing ? "text" : "not-allowed"
                                    }}
                                    placeholder="Enter your username"
                                />
                                {editing && formData.username && formData.username !== (user as any)?.username && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {usernameStatus === "checking" && (
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-t-transparent" 
                                                 style={{ borderColor: `${palette.accent} transparent transparent transparent` }} />
                                        )}
                                        {usernameStatus === "available" && (
                                            <Check style={{ color: "#22c55e" }} />
                                        )}
                                        {usernameStatus === "taken" && (
                                            <Close style={{ color: "#ef4444" }} />
                                        )}
                                    </div>
                                )}
                            </div>
                            {editing && usernameError && (
                                <p className="text-sm mt-1" style={{ color: "#ef4444" }}>
                                    {usernameError}
                                </p>
                            )}
                            {editing && usernameStatus === "available" && (
                                <p className="text-sm mt-1" style={{ color: "#22c55e" }}>
                                    Username is available!
                                </p>
                            )}
                            {!editing && (
                                <p className="text-sm mt-1" style={{ color: palette.textTertiary }}>
                                    Your unique identifier on the platform
                                </p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="flex items-center gap-2 mb-2 font-semibold" style={{ color: palette.textPrimary }}>
                                <Email />
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                disabled
                                className="w-full px-4 py-3 rounded-xl outline-none cursor-not-allowed"
                                style={{
                                    background: isDark ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)",
                                    border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"}`,
                                    color: palette.textSecondary
                                }}
                            />
                            <p className="text-sm mt-1" style={{ color: palette.textTertiary }}>
                                Email cannot be changed
                            </p>
                        </div>

                        {/* Avatar URL */}
                        <div>
                            <label className="flex items-center gap-2 mb-2 font-semibold" style={{ color: palette.textPrimary }}>
                                <ImageIcon />
                                Avatar URL
                            </label>
                            <input
                                type="url"
                                value={formData.image}
                                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                disabled={!editing}
                                className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                                style={{
                                    background: editing 
                                        ? isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)"
                                        : isDark ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)",
                                    border: editing 
                                        ? `2px solid ${palette.accent}` 
                                        : `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"}`,
                                    color: palette.textPrimary,
                                    cursor: editing ? "text" : "not-allowed"
                                }}
                                placeholder="https://example.com/avatar.jpg"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {editing && (
                        <div className="flex gap-3 mt-8 pt-6" style={{ borderTop: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}` }}>
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
                                className="px-6 py-3 rounded-xl font-semibold"
                                style={{
                                    background: "transparent",
                                    border: `2px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}`,
                                    color: palette.textPrimary
                                }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleCancel}
                                disabled={saving}
                            >
                                <Cancel />
                            </motion.button>
                        </div>
                    )}
                </motion.div>

                {/* Security Note */}
                <motion.div
                    className="p-4 rounded-2xl flex gap-3"
                    style={{
                        background: isDark ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.08)",
                        border: `1px solid ${isDark ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.15)"}`
                    }}
                >
                    <Security style={{ color: "#3b82f6" }} />
                    <div>
                        <p className="text-sm" style={{ color: palette.textSecondary }}>
                            Need to update your password or manage security settings?{" "}
                            <Link href="/settings/security" className="font-semibold underline" style={{ color: "#3b82f6" }}>
                                Go to Security Settings
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
