/**
 * Profile Settings Page
 * Comprehensive account management with Better Auth integration
 */

"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { LiquidGlassCard } from "@Components/Atoms/LiquidGlass";
import { OneUICard } from "@Components/Atoms/OneUI";
import {
    Person,
    Email,
    Security,
    Lock,
    Devices,
    LinkOff,
    Google,
    GitHub,
    CheckCircle,
    Error as ErrorIcon,
    Visibility,
    VisibilityOff,
    Shield,
    Edit,
    Save,
    Cancel
} from "@mui/icons-material";
import { 
    useAuth, 
    signOut, 
    updateUser, 
    changePassword, 
    listSessions, 
    revokeSession, 
    revokeOtherSessions,
    linkSocial, 
    unlinkAccount, 
    listAccounts 
} from "@/Library/auth-client";
import { useRouter } from "next/navigation";

interface SecuritySection {
    id: string;
    icon: React.ReactElement;
    title: string;
    description: string;
}

function ProfileContent() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";
    const Card = isApple ? LiquidGlassCard : OneUICard;
    const router = useRouter();
    const { session, user, isLoading } = useAuth();

    // State management
    const [activeSection, setActiveSection] = useState<string>("profile");
    const [editingProfile, setEditingProfile] = useState(false);
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Profile data - initialize from user session
    const [profileData, setProfileData] = useState({
        name: "",
        email: "",
        image: ""
    });

    // Update profile data when user loads
    React.useEffect(() => {
        if (user) {
            setProfileData({
                name: user.name || "",
                email: user.email || "",
                image: user.image || ""
            });
        }
    }, [user]);

    // Password change data
    const [passwordData, setPasswordData] = useState({
        current: "",
        new: "",
        confirm: ""
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    // Connected accounts
    const [connectedAccounts, setConnectedAccounts] = useState<Record<string, boolean>>({});
    const [loadingAccounts, setLoadingAccounts] = useState(true);

    // Fetch connected accounts
    React.useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const { data } = await listAccounts();
                if (data) {
                    const accountsMap: Record<string, boolean> = {};
                    data.forEach((account: any) => {
                        accountsMap[account.providerId] = true;
                    });
                    setConnectedAccounts(accountsMap);
                }
            } catch (err) {
                console.error("Failed to fetch accounts:", err);
            } finally {
                setLoadingAccounts(false);
            }
        };
        if (user) {
            fetchAccounts();
        }
    }, [user]);

    // Active sessions
    const [activeSessions, setActiveSessions] = useState<any[]>([]);
    const [loadingSessions, setLoadingSessions] = useState(true);

    // Fetch active sessions
    React.useEffect(() => {
        const fetchSessions = async () => {
            try {
                const { data } = await listSessions();
                if (data) {
                    const currentToken = session?.session?.token;
                    const formattedSessions = data.map((sess: any) => ({
                        id: sess.token,
                        device: sess.userAgent || "Unknown Device",
                        location: sess.ipAddress || "Unknown Location",
                        lastActive: new Date(sess.updatedAt).toLocaleString(),
                        current: sess.token === currentToken
                    }));
                    setActiveSessions(formattedSessions);
                }
            } catch (err) {
                console.error("Failed to fetch sessions:", err);
            } finally {
                setLoadingSessions(false);
            }
        };
        if (user) {
            fetchSessions();
        }
    }, [user, session]);

    // 2FA enabled state
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [passkeysEnabled, setPasskeysEnabled] = useState(false);

    const handleProfileUpdate = async () => {
        setError("");
        setSuccess("");

        try {
            await updateUser({
                name: profileData.name,
                image: profileData.image
            });
            setSuccess("Profile updated successfully");
            setEditingProfile(false);
        } catch (err: any) {
            setError(err.message || "Failed to update profile");
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (passwordData.new !== passwordData.confirm) {
            setError("New passwords do not match");
            return;
        }

        if (passwordData.new.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        try {
            await changePassword({
                newPassword: passwordData.new,
                currentPassword: passwordData.current,
                revokeOtherSessions: false
            });
            setSuccess("Password changed successfully");
            setPasswordData({ current: "", new: "", confirm: "" });
            setShowPasswordChange(false);
        } catch (err: any) {
            setError(err.message || "Failed to change password");
        }
    };

    const handleConnectAccount = async (provider: string) => {
        try {
            const { data } = await linkSocial({
                provider: provider as any,
                callbackURL: window.location.origin + "/profile"
            });
            if (data?.url) {
                window.location.href = data.url;
            }
        } catch (err: any) {
            setError(err.message || `Failed to connect to ${provider}`);
        }
    };

    const handleDisconnectAccount = async (provider: string) => {
        try {
            await unlinkAccount({
                providerId: provider
            });
            setConnectedAccounts(prev => ({ ...prev, [provider]: false }));
            setSuccess(`Disconnected from ${provider}`);
        } catch (err: any) {
            setError(err.message || `Failed to disconnect from ${provider}`);
        }
    };

    const handleRevokeSession = async (sessionToken: string) => {
        try {
            await revokeSession({ token: sessionToken });
            setActiveSessions(prev => prev.filter(s => s.id !== sessionToken));
            setSuccess("Session revoked successfully");
        } catch (err: any) {
            setError(err.message || "Failed to revoke session");
        }
    };

    const handleEnable2FA = async () => {
        try {
            // TODO: Implement 2FA setup
            await new Promise(resolve => setTimeout(resolve, 1000));
            setTwoFactorEnabled(true);
            setSuccess("Two-factor authentication enabled");
        } catch (err: any) {
            setError("Failed to enable 2FA");
        }
    };

    const handleDisable2FA = async () => {
        try {
            // TODO: Implement 2FA disable
            await new Promise(resolve => setTimeout(resolve, 1000));
            setTwoFactorEnabled(false);
            setSuccess("Two-factor authentication disabled");
        } catch (err: any) {
            setError("Failed to disable 2FA");
        }
    };

    const handleAddPasskey = async () => {
        try {
            // TODO: Implement passkey registration
            await new Promise(resolve => setTimeout(resolve, 1000));
            setPasskeysEnabled(true);
            setSuccess("Passkey added successfully");
        } catch (err: any) {
            setError("Failed to add passkey");
        }
    };

    const sections = [
        { id: "profile", label: "Profile", icon: <Person /> },
        { id: "security", label: "Security", icon: <Security /> },
        { id: "accounts", label: "Connected Accounts", icon: <LinkOff /> },
        { id: "sessions", label: "Active Sessions", icon: <Devices /> }
    ];

    if (isLoading) {
        return (
            <div 
                className="min-h-screen flex items-center justify-center"
                style={{ background: palette.background }}
            >
                <div 
                    className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: palette.accent }}
                />
            </div>
        );
    }

    if (!session) {
        router.push("/auth/signin");
        return null;
    }

    return (
        <div
            className="min-h-screen py-24 px-6"
            style={{ 
                background: isApple && isDark
                    ? `linear-gradient(180deg, ${palette.background} 0%, ${palette.backgroundSecondary} 100%)`
                    : palette.background
            }}
        >
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1
                        className={`${isApple ? "text-4xl font-bold" : "text-5xl font-black"} mb-2`}
                        style={{ color: palette.textPrimary }}
                    >
                        Account Settings
                    </h1>
                    <p
                        className={`${isApple ? "text-base" : "text-lg font-medium"}`}
                        style={{ color: palette.textSecondary }}
                    >
                        Manage your profile, security, and connected accounts
                    </p>
                </motion.div>

                {/* Status Messages */}
                <AnimatePresence>
                    {(error || success) && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                            animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        >
                            <div
                                className={`${isApple ? "p-4 rounded-xl" : "p-5 rounded-2xl"} flex items-center gap-3`}
                                style={{
                                    background: error 
                                        ? "rgba(239, 68, 68, 0.1)" 
                                        : "rgba(34, 197, 94, 0.1)",
                                    border: `1px solid ${error 
                                        ? "rgba(239, 68, 68, 0.3)" 
                                        : "rgba(34, 197, 94, 0.3)"}`
                                }}
                            >
                                {error ? (
                                    <ErrorIcon style={{ color: "rgb(239, 68, 68)" }} />
                                ) : (
                                    <CheckCircle style={{ color: "rgb(34, 197, 94)" }} />
                                )}
                                <span
                                    className={isApple ? "text-sm" : "text-base font-semibold"}
                                    style={{
                                        color: error 
                                            ? "rgb(239, 68, 68)" 
                                            : "rgb(34, 197, 94)"
                                    }}
                                >
                                    {error || success}
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Sidebar Navigation */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-1"
                    >
                        <Card
                            className={isApple ? "p-4" : "p-5"}
                            intensity={isApple ? "medium" : undefined}
                            elevated={!isApple}
                        >
                            <div className="space-y-2">
                                {sections.map((section) => (
                                    <button
                                        key={section.id}
                                        onClick={() => {
                                            setActiveSection(section.id);
                                            setError("");
                                            setSuccess("");
                                        }}
                                        className={`w-full flex items-center gap-3 ${isApple ? "p-3 rounded-lg" : "p-4 rounded-xl"} transition-all text-left`}
                                        style={{
                                            background: activeSection === section.id 
                                                ? `${palette.accent}15` 
                                                : "transparent",
                                            color: activeSection === section.id 
                                                ? palette.accent 
                                                : palette.textSecondary
                                        }}
                                    >
                                        {section.icon}
                                        <span className={`${isApple ? "text-sm font-medium" : "text-base font-semibold"}`}>
                                            {section.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </Card>
                    </motion.div>

                    {/* Main Content */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-3"
                    >
                        <Card
                            className={isApple ? "p-6" : "p-8"}
                            intensity={isApple ? "medium" : undefined}
                            elevated={!isApple}
                        >
                            {/* Profile Section */}
                            {activeSection === "profile" && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2
                                            className={`${isApple ? "text-2xl font-bold" : "text-3xl font-black"}`}
                                            style={{ color: palette.textPrimary }}
                                        >
                                            Profile Information
                                        </h2>
                                        {!editingProfile ? (
                                            <button
                                                onClick={() => setEditingProfile(true)}
                                                className={`flex items-center gap-2 ${isApple ? "px-4 py-2 rounded-lg" : "px-5 py-3 rounded-xl"} font-semibold transition-all`}
                                                style={{
                                                    background: palette.accent,
                                                    color: palette.textOnAccent
                                                }}
                                            >
                                                <Edit fontSize="small" />
                                                <span>Edit</span>
                                            </button>
                                        ) : (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleProfileUpdate}
                                                    className={`flex items-center gap-2 ${isApple ? "px-4 py-2 rounded-lg" : "px-5 py-3 rounded-xl"} font-semibold transition-all`}
                                                    style={{
                                                        background: palette.accent,
                                                        color: palette.textOnAccent
                                                    }}
                                                >
                                                    <Save fontSize="small" />
                                                    <span>Save</span>
                                                </button>
                                                <button
                                                    onClick={() => setEditingProfile(false)}
                                                    className={`flex items-center gap-2 ${isApple ? "px-4 py-2 rounded-lg" : "px-5 py-3 rounded-xl"} font-semibold transition-all`}
                                                    style={{
                                                        background: palette.surfaceSecondary,
                                                        color: palette.textPrimary
                                                    }}
                                                >
                                                    <Cancel fontSize="small" />
                                                    <span>Cancel</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        {/* Name */}
                                        <div>
                                            <label
                                                className={`block ${isApple ? "text-sm font-medium" : "text-base font-bold"} mb-2`}
                                                style={{ color: palette.textSecondary }}
                                            >
                                                Full Name
                                            </label>
                                            <div className="relative">
                                                <Person
                                                    className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                                                    style={{ color: palette.textTertiary }}
                                                    fontSize="small"
                                                />
                                                <input
                                                    type="text"
                                                    value={profileData.name}
                                                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                                                    disabled={!editingProfile}
                                                    className={`w-full ${isApple ? "pl-12 pr-4 py-3 rounded-lg" : "pl-14 pr-5 py-4 rounded-xl"} outline-none transition-all`}
                                                    style={{
                                                        background: editingProfile ? palette.surfaceSecondary : palette.surface,
                                                        color: palette.textPrimary,
                                                        border: `2px solid ${palette.border}`,
                                                        cursor: editingProfile ? "text" : "not-allowed"
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <label
                                                className={`block ${isApple ? "text-sm font-medium" : "text-base font-bold"} mb-2`}
                                                style={{ color: palette.textSecondary }}
                                            >
                                                Email Address
                                            </label>
                                            <div className="relative">
                                                <Email
                                                    className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                                                    style={{ color: palette.textTertiary }}
                                                    fontSize="small"
                                                />
                                                <input
                                                    type="email"
                                                    value={profileData.email}
                                                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                                                    disabled={!editingProfile}
                                                    className={`w-full ${isApple ? "pl-12 pr-4 py-3 rounded-lg" : "pl-14 pr-5 py-4 rounded-xl"} outline-none transition-all`}
                                                    style={{
                                                        background: editingProfile ? palette.surfaceSecondary : palette.surface,
                                                        color: palette.textPrimary,
                                                        border: `2px solid ${palette.border}`,
                                                        cursor: editingProfile ? "text" : "not-allowed"
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Profile Image URL */}
                                        <div>
                                            <label
                                                className={`block ${isApple ? "text-sm font-medium" : "text-base font-bold"} mb-2`}
                                                style={{ color: palette.textSecondary }}
                                            >
                                                Profile Image URL
                                            </label>
                                            <div className="relative">
                                                <Person
                                                    className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                                                    style={{ color: palette.textTertiary }}
                                                    fontSize="small"
                                                />
                                                <input
                                                    type="url"
                                                    value={profileData.image}
                                                    onChange={(e) => setProfileData(prev => ({ ...prev, image: e.target.value }))}
                                                    disabled={!editingProfile}
                                                    placeholder="https://example.com/avatar.jpg"
                                                    className={`w-full ${isApple ? "pl-12 pr-4 py-3 rounded-lg" : "pl-14 pr-5 py-4 rounded-xl"} outline-none transition-all`}
                                                    style={{
                                                        background: editingProfile ? palette.surfaceSecondary : palette.surface,
                                                        color: palette.textPrimary,
                                                        border: `2px solid ${palette.border}`,
                                                        cursor: editingProfile ? "text" : "not-allowed"
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Security Section */}
                            {activeSection === "security" && (
                                <div className="space-y-6">
                                    <h2
                                        className={`${isApple ? "text-2xl font-bold" : "text-3xl font-black"} mb-6`}
                                        style={{ color: palette.textPrimary }}
                                    >
                                        Security Settings
                                    </h2>

                                    {/* Change Password */}
                                    <div
                                        className={`${isApple ? "p-4 rounded-lg" : "p-5 rounded-xl"}`}
                                        style={{
                                            background: palette.surfaceSecondary,
                                            border: `1px solid ${palette.border}`
                                        }}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-start gap-3">
                                                <Lock style={{ color: palette.accent }} />
                                                <div>
                                                    <h3
                                                        className={`${isApple ? "text-base font-semibold" : "text-lg font-bold"} mb-1`}
                                                        style={{ color: palette.textPrimary }}
                                                    >
                                                        Password
                                                    </h3>
                                                    <p
                                                        className={`${isApple ? "text-sm" : "text-base"}`}
                                                        style={{ color: palette.textSecondary }}
                                                    >
                                                        Change your account password
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setShowPasswordChange(!showPasswordChange)}
                                                className={`${isApple ? "px-4 py-2 rounded-lg text-sm" : "px-5 py-3 rounded-xl text-base"} font-semibold transition-all`}
                                                style={{
                                                    background: palette.accent,
                                                    color: palette.textOnAccent
                                                }}
                                            >
                                                Change
                                            </button>
                                        </div>

                                        <AnimatePresence>
                                            {showPasswordChange && (
                                                <motion.form
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    onSubmit={handlePasswordChange}
                                                    className="space-y-4 mt-4 pt-4 border-t"
                                                    style={{ borderColor: palette.border }}
                                                >
                                                    {/* Current Password */}
                                                    <div className="relative">
                                                        <input
                                                            type={showPasswords.current ? "text" : "password"}
                                                            value={passwordData.current}
                                                            onChange={(e) => setPasswordData(prev => ({ ...prev, current: e.target.value }))}
                                                            placeholder="Current password"
                                                            required
                                                            className={`w-full ${isApple ? "px-4 py-2 rounded-lg" : "px-5 py-3 rounded-xl"} outline-none pr-12`}
                                                            style={{
                                                                background: palette.surface,
                                                                color: palette.textPrimary,
                                                                border: `2px solid ${palette.border}`
                                                            }}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2"
                                                        >
                                                            {showPasswords.current ? (
                                                                <VisibilityOff style={{ color: palette.textTertiary }} fontSize="small" />
                                                            ) : (
                                                                <Visibility style={{ color: palette.textTertiary }} fontSize="small" />
                                                            )}
                                                        </button>
                                                    </div>

                                                    {/* New Password */}
                                                    <div className="relative">
                                                        <input
                                                            type={showPasswords.new ? "text" : "password"}
                                                            value={passwordData.new}
                                                            onChange={(e) => setPasswordData(prev => ({ ...prev, new: e.target.value }))}
                                                            placeholder="New password"
                                                            required
                                                            className={`w-full ${isApple ? "px-4 py-2 rounded-lg" : "px-5 py-3 rounded-xl"} outline-none pr-12`}
                                                            style={{
                                                                background: palette.surface,
                                                                color: palette.textPrimary,
                                                                border: `2px solid ${palette.border}`
                                                            }}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2"
                                                        >
                                                            {showPasswords.new ? (
                                                                <VisibilityOff style={{ color: palette.textTertiary }} fontSize="small" />
                                                            ) : (
                                                                <Visibility style={{ color: palette.textTertiary }} fontSize="small" />
                                                            )}
                                                        </button>
                                                    </div>

                                                    {/* Confirm Password */}
                                                    <div className="relative">
                                                        <input
                                                            type={showPasswords.confirm ? "text" : "password"}
                                                            value={passwordData.confirm}
                                                            onChange={(e) => setPasswordData(prev => ({ ...prev, confirm: e.target.value }))}
                                                            placeholder="Confirm new password"
                                                            required
                                                            className={`w-full ${isApple ? "px-4 py-2 rounded-lg" : "px-5 py-3 rounded-xl"} outline-none pr-12`}
                                                            style={{
                                                                background: palette.surface,
                                                                color: palette.textPrimary,
                                                                border: `2px solid ${palette.border}`
                                                            }}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2"
                                                        >
                                                            {showPasswords.confirm ? (
                                                                <VisibilityOff style={{ color: palette.textTertiary }} fontSize="small" />
                                                            ) : (
                                                                <Visibility style={{ color: palette.textTertiary }} fontSize="small" />
                                                            )}
                                                        </button>
                                                    </div>

                                                    <button
                                                        type="submit"
                                                        className={`w-full ${isApple ? "px-4 py-2 rounded-lg" : "px-5 py-3 rounded-xl"} font-semibold transition-all`}
                                                        style={{
                                                            background: palette.accent,
                                                            color: palette.textOnAccent
                                                        }}
                                                    >
                                                        Update Password
                                                    </button>
                                                </motion.form>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Note about advanced security features */}
                                    <div
                                        className={`${isApple ? "p-4 rounded-lg" : "p-5 rounded-xl"} text-center`}
                                        style={{
                                            background: `${palette.accent}10`,
                                            border: `1px solid ${palette.accent}30`
                                        }}
                                    >
                                        <Shield style={{ color: palette.accent, fontSize: 48 }} className="mx-auto mb-3" />
                                        <h3
                                            className={`${isApple ? "text-base font-semibold" : "text-lg font-bold"} mb-2`}
                                            style={{ color: palette.textPrimary }}
                                        >
                                            Advanced Security Features
                                        </h3>
                                        <p
                                            className={`${isApple ? "text-sm" : "text-base"}`}
                                            style={{ color: palette.textSecondary }}
                                        >
                                            Two-factor authentication and Passkeys are available with Better Auth plugins.
                                            <br />
                                            Install <code className="px-2 py-1 rounded" style={{ background: palette.surface }}>@better-auth/two-factor</code> and <code className="px-2 py-1 rounded" style={{ background: palette.surface }}>@better-auth/passkey</code> to enable these features.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Connected Accounts Section */}
                            {activeSection === "accounts" && (
                                <div className="space-y-6">
                                    <h2
                                        className={`${isApple ? "text-2xl font-bold" : "text-3xl font-black"} mb-6`}
                                        style={{ color: palette.textPrimary }}
                                    >
                                        Connected Accounts
                                    </h2>

                                    {/* Google */}
                                    <div
                                        className={`${isApple ? "p-4 rounded-lg" : "p-5 rounded-xl"}`}
                                        style={{
                                            background: palette.surfaceSecondary,
                                            border: `1px solid ${palette.border}`
                                        }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`${isApple ? "p-2 rounded-lg" : "p-3 rounded-xl"}`}
                                                    style={{ background: `${palette.accent}15` }}
                                                >
                                                    <Google style={{ color: palette.accent }} />
                                                </div>
                                                <div>
                                                    <h3
                                                        className={`${isApple ? "text-base font-semibold" : "text-lg font-bold"}`}
                                                        style={{ color: palette.textPrimary }}
                                                    >
                                                        Google
                                                    </h3>
                                                    <p
                                                        className={`${isApple ? "text-sm" : "text-base"}`}
                                                        style={{ color: palette.textSecondary }}
                                                    >
                                                        {connectedAccounts.google ? "Connected" : "Not connected"}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => connectedAccounts.google 
                                                    ? handleDisconnectAccount("google") 
                                                    : handleConnectAccount("google")}
                                                className={`${isApple ? "px-4 py-2 rounded-lg text-sm" : "px-5 py-3 rounded-xl text-base"} font-semibold transition-all`}
                                                style={{
                                                    background: connectedAccounts.google 
                                                        ? "rgba(239, 68, 68, 0.1)" 
                                                        : palette.accent,
                                                    color: connectedAccounts.google 
                                                        ? "rgb(239, 68, 68)" 
                                                        : palette.textOnAccent,
                                                    border: connectedAccounts.google 
                                                        ? "2px solid rgba(239, 68, 68, 0.3)" 
                                                        : "none"
                                                }}
                                            >
                                                {connectedAccounts.google ? "Disconnect" : "Connect"}
                                            </button>
                                        </div>
                                    </div>

                                    {/* GitHub */}
                                    <div
                                        className={`${isApple ? "p-4 rounded-lg" : "p-5 rounded-xl"}`}
                                        style={{
                                            background: palette.surfaceSecondary,
                                            border: `1px solid ${palette.border}`
                                        }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`${isApple ? "p-2 rounded-lg" : "p-3 rounded-xl"}`}
                                                    style={{ background: `${palette.accent}15` }}
                                                >
                                                    <GitHub style={{ color: palette.accent }} />
                                                </div>
                                                <div>
                                                    <h3
                                                        className={`${isApple ? "text-base font-semibold" : "text-lg font-bold"}`}
                                                        style={{ color: palette.textPrimary }}
                                                    >
                                                        GitHub
                                                    </h3>
                                                    <p
                                                        className={`${isApple ? "text-sm" : "text-base"}`}
                                                        style={{ color: palette.textSecondary }}
                                                    >
                                                        {connectedAccounts.github ? "Connected" : "Not connected"}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => connectedAccounts.github 
                                                    ? handleDisconnectAccount("github") 
                                                    : handleConnectAccount("github")}
                                                className={`${isApple ? "px-4 py-2 rounded-lg text-sm" : "px-5 py-3 rounded-xl text-base"} font-semibold transition-all`}
                                                style={{
                                                    background: connectedAccounts.github 
                                                        ? "rgba(239, 68, 68, 0.1)" 
                                                        : palette.accent,
                                                    color: connectedAccounts.github 
                                                        ? "rgb(239, 68, 68)" 
                                                        : palette.textOnAccent,
                                                    border: connectedAccounts.github 
                                                        ? "2px solid rgba(239, 68, 68, 0.3)" 
                                                        : "none"
                                                }}
                                            >
                                                {connectedAccounts.github ? "Disconnect" : "Connect"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Active Sessions Section */}
                            {activeSection === "sessions" && (
                                <div className="space-y-6">
                                    <h2
                                        className={`${isApple ? "text-2xl font-bold" : "text-3xl font-black"} mb-6`}
                                        style={{ color: palette.textPrimary }}
                                    >
                                        Active Sessions
                                    </h2>

                                    <div className="space-y-4">
                                        {activeSessions.map((session) => (
                                            <div
                                                key={session.id}
                                                className={`${isApple ? "p-4 rounded-lg" : "p-5 rounded-xl"}`}
                                                style={{
                                                    background: palette.surfaceSecondary,
                                                    border: `1px solid ${palette.border}`
                                                }}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-3">
                                                        <Devices style={{ color: palette.accent }} />
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h3
                                                                    className={`${isApple ? "text-base font-semibold" : "text-lg font-bold"}`}
                                                                    style={{ color: palette.textPrimary }}
                                                                >
                                                                    {session.device}
                                                                </h3>
                                                                {session.current && (
                                                                    <span
                                                                        className={`${isApple ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"} rounded-full font-semibold`}
                                                                        style={{
                                                                            background: `${palette.accent}15`,
                                                                            color: palette.accent
                                                                        }}
                                                                    >
                                                                        Current
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p
                                                                className={`${isApple ? "text-sm" : "text-base"} mb-1`}
                                                                style={{ color: palette.textSecondary }}
                                                            >
                                                                {session.location}
                                                            </p>
                                                            <p
                                                                className={`${isApple ? "text-xs" : "text-sm"}`}
                                                                style={{ color: palette.textTertiary }}
                                                            >
                                                                Last active: {session.lastActive}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {!session.current && (
                                                        <button
                                                            onClick={() => handleRevokeSession(session.id)}
                                                            className={`${isApple ? "px-4 py-2 rounded-lg text-sm" : "px-5 py-3 rounded-xl text-base"} font-semibold transition-all`}
                                                            style={{
                                                                background: "rgba(239, 68, 68, 0.1)",
                                                                color: "rgb(239, 68, 68)",
                                                                border: "2px solid rgba(239, 68, 68, 0.3)"
                                                            }}
                                                        >
                                                            Revoke
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div
                                        className={`${isApple ? "p-4 rounded-lg" : "p-5 rounded-xl"} text-center`}
                                        style={{
                                            background: "rgba(239, 68, 68, 0.05)",
                                            border: "1px solid rgba(239, 68, 68, 0.2)"
                                        }}
                                    >
                                        <p
                                            className={`${isApple ? "text-sm" : "text-base font-medium"} mb-3`}
                                            style={{ color: palette.textSecondary }}
                                        >
                                            Revoke all sessions except this one?
                                        </p>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await revokeOtherSessions();
                                                    setActiveSessions(prev => prev.filter(s => s.current));
                                                    setSuccess("All other sessions revoked");
                                                } catch (err: any) {
                                                    setError(err.message || "Failed to revoke sessions");
                                                }
                                            }}
                                            className={`${isApple ? "px-4 py-2 rounded-lg text-sm" : "px-5 py-3 rounded-xl text-base"} font-semibold transition-all`}
                                            style={{
                                                background: "rgba(239, 68, 68, 0.1)",
                                                color: "rgb(239, 68, 68)",
                                                border: "2px solid rgba(239, 68, 68, 0.3)"
                                            }}
                                        >
                                            Revoke All Other Sessions
                                        </button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

export default function ProfilePage() {
    return <ProfileContent />;
}
