/**
 * Profile Page
 * Redesigned with dual-theme support
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "../../Hooks/useDesignTheme";
import { LiquidGlassCard, LiquidGlassButton } from "../../Components/LiquidGlass";
import { OneUICard, OneUIButton, OneUIBadge } from "../../Components/OneUI";
import {
    Person,
    Edit,
    Save,
    Cancel,
    PhotoCamera,
    Email,
    Phone,
    LocationOn,
    Language,
    CalendarMonth,
    Link as LinkIcon,
    GitHub,
    LinkedIn,
    Twitter,
    Instagram,
    CheckCircle,
    Error as ErrorIcon,
    Lock,
    Security,
    Verified,
    AccountCircle,
    Visibility,
    VisibilityOff,
    AccountBalanceWallet,
    Bookmark,
    Article,
    Settings,
    Delete,
    PhoneAndroid,
    Shield,
    Key,
    AlternateEmail,
    ConnectedTv,
    Fingerprint,
    VpnKey
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { Axios } from "../../Utils/Axios";
import Link from "next/link";
import { useAuth } from "../../Lib/auth-client";

interface ProfileData {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    phone: string;
    bio: string;
    location: string;
    website: string;
    dateOfBirth: string;
    socialLinks: {
        github: string;
        linkedin: string;
        twitter: string;
        instagram: string;
    };
}

interface PasswordData {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

function ProfileContent() {
    const { designTheme, palette } = useDesignTheme();
    const isApple = designTheme === "apple";
    const Card = isApple ? LiquidGlassCard : OneUICard;
    const Button = isApple ? LiquidGlassButton : OneUIButton;

    const { session, user, isLoading: status, isAuthenticated } = useAuth();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<"profile" | "security" | "connections">("profile");
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const [profileData, setProfileData] = useState<ProfileData>({
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        phone: "",
        bio: "",
        location: "",
        website: "",
        dateOfBirth: "",
        socialLinks: {
            github: "",
            linkedin: "",
            twitter: "",
            instagram: ""
        }
    });

    const [passwordData, setPasswordData] = useState<PasswordData>({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    useEffect(() => {
        if (status) return; // Still loading
        if (!isAuthenticated) {
            router.push("/auth/signin?callbackUrl=/profile");
        } else if (isAuthenticated && user) {
            loadProfileData();
        }
    }, [status, isAuthenticated, user, router]);

    const loadProfileData = async () => {
        setLoading(true);
        try {
            // Simulate API call - replace with actual endpoint
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const nameParts = user?.name?.split(" ") || ["", ""];
            const userAny = user as any;
            setProfileData({
                firstName: nameParts[0] || "",
                lastName: nameParts.slice(1).join(" ") || "",
                username: userAny?.username || user?.email?.split("@")[0] || "",
                email: user?.email || "",
                phone: "",
                bio: "",
                location: "Gujarat, India",
                website: "",
                dateOfBirth: "",
                socialLinks: {
                    github: "",
                    linkedin: "",
                    twitter: "",
                    instagram: ""
                }
            });
        } catch (error) {
            console.error("Failed to load profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name.startsWith("social_")) {
            const socialKey = name.replace("social_", "") as keyof ProfileData["socialLinks"];
            setProfileData(prev => ({
                ...prev,
                socialLinks: {
                    ...prev.socialLinks,
                    [socialKey]: value
                }
            }));
        } else {
            setProfileData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleProfileSave = async () => {
        setLoading(true);
        setMessage(null);

        try {
            const response = await Axios.put("/api/profile", profileData);
            
            if (response.data.Status === 1) {
                setMessage({ type: "success", text: "Profile updated successfully!" });
                setIsEditing(false);
            } else {
                setMessage({ type: "error", text: response.data.Message || "Failed to update profile" });
            }
        } catch (error: any) {
            setMessage({ type: "error", text: error.response?.data?.Message || "An error occurred" });
        } finally {
            setLoading(false);
            setTimeout(() => setMessage(null), 5000);
        }
    };

    const handlePasswordSave = async () => {
        setLoading(true);
        setMessage(null);

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: "error", text: "New passwords don't match" });
            setLoading(false);
            return;
        }

        if (passwordData.newPassword.length < 8) {
            setMessage({ type: "error", text: "Password must be at least 8 characters" });
            setLoading(false);
            return;
        }

        try {
            const response = await Axios.put("/api/profile/password", {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            
            if (response.data.Status === 1) {
                setMessage({ type: "success", text: "Password updated successfully!" });
                setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            } else {
                setMessage({ type: "error", text: response.data.Message || "Failed to update password" });
            }
        } catch (error: any) {
            setMessage({ type: "error", text: error.response?.data?.Message || "An error occurred" });
        } finally {
            setLoading(false);
            setTimeout(() => setMessage(null), 5000);
        }
    };

    const tabs = [
        { id: "profile" as const, label: "Profile Settings", icon: <Person /> },
        { id: "security" as const, label: "Security & Privacy", icon: <Security /> },
        { id: "connections" as const, label: "Connected Accounts", icon: <ConnectedTv /> }
    ];

    const socialIcons = {
        github: <GitHub />,
        linkedin: <LinkedIn />,
        twitter: <Twitter />,
        instagram: <Instagram />
    };

    if (status || loading) {
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
        return null;
    }

    return (
        <>

            <main
                className="min-h-screen py-24"
                style={{ background: palette.background }}
            >
                <div className="max-w-5xl mx-auto px-6">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-8"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h1
                                    className={`${isApple ? "text-4xl font-bold" : "text-5xl font-black"} mb-2`}
                                    style={{ color: palette.textPrimary }}
                                >
                                    Profile Settings
                                </h1>
                                <p
                                    className={`${isApple ? "text-base" : "text-lg font-medium"}`}
                                    style={{ color: palette.textSecondary }}
                                >
                                    Manage your account information and preferences
                                </p>
                            </div>
                            <Link href="/dashboard">
                                <Button
                                                    variant="secondary"
                                >
                                    Back to Dashboard
                                </Button>
                            </Link>
                        </div>
                    </motion.div>

                    {/* Profile Header Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="mb-8"
                    >
                        <Card
                            className={isApple ? "p-6" : "p-8"}
                            elevated={!isApple}
                        >
                            <div className="flex items-center gap-6">
                                {/* Avatar */}
                                <div className="relative">
                                    {session.user?.image ? (
                                        <img
                                            src={session.user.image}
                                            alt={session.user.name || "User"}
                                            className={`${isApple ? "w-24 h-24 rounded-2xl" : "w-28 h-28 rounded-3xl"} object-cover`}
                                            style={{ border: `3px solid ${palette.accent}` }}
                                        />
                                    ) : (
                                        <div
                                            className={`${isApple ? "w-24 h-24 rounded-2xl" : "w-28 h-28 rounded-3xl"} flex items-center justify-center text-4xl font-black`}
                                            style={{
                                                background: palette.accent,
                                                color: "#ffffff"
                                            }}
                                        >
                                            {session.user?.name?.charAt(0) || "U"}
                                        </div>
                                    )}
                                    <button
                                        className={`absolute bottom-0 right-0 ${isApple ? "p-2 rounded-lg" : "p-3 rounded-xl"} transition-all hover:scale-110`}
                                        style={{
                                            background: palette.accent,
                                            color: "#ffffff"
                                        }}
                                    >
                                        <PhotoCamera fontSize="small" />
                                    </button>
                                </div>

                                {/* User Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h2
                                            className={`${isApple ? "text-2xl font-bold" : "text-3xl font-black"}`}
                                            style={{ color: palette.textPrimary }}
                                        >
                                            {session.user?.name}
                                        </h2>
                                        <Verified style={{ color: palette.accent, fontSize: "1.5rem" }} />
                                    </div>
                                    <p
                                        className={`${isApple ? "text-sm" : "text-base font-medium"}`}
                                        style={{ color: palette.textSecondary }}
                                    >
                                        {session.user?.email}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Quick Actions */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.15 }}
                        className="mb-8"
                    >
                        <h2
                            className={`${isApple ? "text-xl font-bold" : "text-2xl font-black"} mb-4`}
                            style={{ color: palette.textPrimary }}
                        >
                            Quick Actions
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: "Write Blog", icon: <Article />, href: "/blogs/new", color: "#3b82f6" },
                                { label: "Bookmarks", icon: <Bookmark />, href: "/bookmarks", color: "#8b5cf6" },
                                { label: "Wallets", icon: <AccountBalanceWallet />, href: "/wallet", color: "#10b981" },
                                { label: "Settings", icon: <Settings />, href: "/settings", color: "#f59e0b" }
                            ].map((action, index) => (
                                <Link key={action.label} href={action.href}>
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.15 + index * 0.05 }}
                                        whileHover={{ scale: isApple ? 1.02 : 1 }}
                                        className={`${isApple ? "p-4 rounded-xl" : "p-6 rounded-2xl"} cursor-pointer transition-all`}
                                        style={{
                                            background: isApple ? palette.glassBg : palette.surfaceElevated,
                                            backdropFilter: isApple ? palette.glassBlur : "none",
                                            border: `2px solid ${palette.border}`
                                        }}
                                    >
                                        <div 
                                            className={`${isApple ? "w-10 h-10 rounded-lg" : "w-12 h-12 rounded-xl"} flex items-center justify-center mb-3`}
                                            style={{ background: `${action.color}20` }}
                                        >
                                            {React.cloneElement(action.icon, { 
                                                style: { color: action.color },
                                                fontSize: isApple ? "medium" : "large"
                                            })}
                                        </div>
                                        <p 
                                            className={`${isApple ? "text-sm font-semibold" : "text-base font-bold"}`}
                                            style={{ color: palette.textPrimary }}
                                        >
                                            {action.label}
                                        </p>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    </motion.div>

                    {/* Tabs */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="mb-8"
                    >
                        <div className="flex flex-wrap gap-3">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 ${isApple ? "px-6 py-3 rounded-xl" : "px-8 py-4 rounded-2xl font-semibold"} transition-all`}
                                    style={{
                                        background: activeTab === tab.id ? palette.accent : palette.surfaceSecondary,
                                        color: activeTab === tab.id ? "#ffffff" : palette.textSecondary,
                                        border: `2px solid ${activeTab === tab.id ? palette.accent : palette.border}`
                                    }}
                                >
                                    {tab.icon}
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>

                    {/* Status Message */}
                    <AnimatePresence>
                        {message && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-6"
                            >
                                <div
                                    className={`${isApple ? "p-4 rounded-xl" : "p-5 rounded-2xl"} flex items-center gap-3`}
                                    style={{
                                        background: message.type === "error" 
                                            ? "rgba(239, 68, 68, 0.1)" 
                                            : "rgba(34, 197, 94, 0.1)",
                                        border: `1px solid ${message.type === "error" 
                                            ? "rgba(239, 68, 68, 0.3)" 
                                            : "rgba(34, 197, 94, 0.3)"}`
                                    }}
                                >
                                    {message.type === "error" ? (
                                        <ErrorIcon style={{ color: "rgb(239, 68, 68)" }} />
                                    ) : (
                                        <CheckCircle style={{ color: "rgb(34, 197, 94)" }} />
                                    )}
                                    <span
                                        className={isApple ? "text-sm" : "text-base font-semibold"}
                                        style={{
                                            color: message.type === "error" 
                                                ? "rgb(239, 68, 68)" 
                                                : "rgb(34, 197, 94)"
                                        }}
                                    >
                                        {message.text}
                                    </span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Tab Content */}
                    <AnimatePresence mode="wait">
                        {activeTab === "profile" && (
                            <motion.div
                                key="profile"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <Card
                                    className={isApple ? "p-8" : "p-10"}
                                    intensity={isApple ? "medium" : undefined}
                                    elevated={!isApple}
                                >
                                    {/* Edit Button */}
                                    <div className="flex justify-end mb-6">
                                        {!isEditing ? (
                                            <Button
                                                onClick={() => setIsEditing(true)}
                                                variant="primary"
                                                className="flex items-center gap-2"
                                            >
                                                <Edit />
                                                <span>Edit Profile</span>
                                            </Button>
                                        ) : (
                                            <div className="flex gap-3">
                                                <Button
                                                    onClick={() => setIsEditing(false)}
                                                    variant="secondary"
                                                    className="flex items-center gap-2"
                                                >
                                                    <Cancel />
                                                    <span>Cancel</span>
                                                </Button>
                                                <Button
                                                    onClick={handleProfileSave}
                                                    disabled={loading}
                                                    variant="primary"
                                                    className="flex items-center gap-2"
                                                >
                                                    {loading ? (
                                                        <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#ffffff" }} />
                                                    ) : (
                                                        <Save />
                                                    )}
                                                    <span>Save Changes</span>
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-6">
                                        {/* Name Fields */}
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div>
                                                <label
                                                    className={`block ${isApple ? "text-sm font-medium" : "text-base font-bold"} mb-2`}
                                                    style={{ color: palette.textSecondary }}
                                                >
                                                    First Name
                                                </label>
                                                <input
                                                    type="text"
                                                    name="firstName"
                                                    value={profileData.firstName}
                                                    onChange={handleProfileChange}
                                                    disabled={!isEditing}
                                                    className={`w-full ${isApple ? "px-4 py-3 rounded-xl" : "px-5 py-4 rounded-2xl"} outline-none transition-all`}
                                                    style={{
                                                        background: palette.surfaceSecondary,
                                                        color: palette.textPrimary,
                                                        border: `2px solid ${palette.border}`,
                                                        opacity: isEditing ? 1 : 0.6
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label
                                                    className={`block ${isApple ? "text-sm font-medium" : "text-base font-bold"} mb-2`}
                                                    style={{ color: palette.textSecondary }}
                                                >
                                                    Last Name
                                                </label>
                                                <input
                                                    type="text"
                                                    name="lastName"
                                                    value={profileData.lastName}
                                                    onChange={handleProfileChange}
                                                    disabled={!isEditing}
                                                    className={`w-full ${isApple ? "px-4 py-3 rounded-xl" : "px-5 py-4 rounded-2xl"} outline-none transition-all`}
                                                    style={{
                                                        background: palette.surfaceSecondary,
                                                        color: palette.textPrimary,
                                                        border: `2px solid ${palette.border}`,
                                                        opacity: isEditing ? 1 : 0.6
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Username & Email */}
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div>
                                                <label
                                                    className={`block ${isApple ? "text-sm font-medium" : "text-base font-bold"} mb-2`}
                                                    style={{ color: palette.textSecondary }}
                                                >
                                                    Username
                                                </label>
                                                <input
                                                    type="text"
                                                    name="username"
                                                    value={profileData.username}
                                                    onChange={handleProfileChange}
                                                    disabled={!isEditing}
                                                    className={`w-full ${isApple ? "px-4 py-3 rounded-xl" : "px-5 py-4 rounded-2xl"} outline-none transition-all`}
                                                    style={{
                                                        background: palette.surfaceSecondary,
                                                        color: palette.textPrimary,
                                                        border: `2px solid ${palette.border}`,
                                                        opacity: isEditing ? 1 : 0.6
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label
                                                    className={`block ${isApple ? "text-sm font-medium" : "text-base font-bold"} mb-2`}
                                                    style={{ color: palette.textSecondary }}
                                                >
                                                    Email
                                                </label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={profileData.email}
                                                    disabled
                                                    className={`w-full ${isApple ? "px-4 py-3 rounded-xl" : "px-5 py-4 rounded-2xl"} outline-none`}
                                                    style={{
                                                        background: palette.surfaceSecondary,
                                                        color: palette.textPrimary,
                                                        border: `2px solid ${palette.border}`,
                                                        opacity: 0.6
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Bio */}
                                        <div>
                                            <label
                                                className={`block ${isApple ? "text-sm font-medium" : "text-base font-bold"} mb-2`}
                                                style={{ color: palette.textSecondary }}
                                            >
                                                Bio
                                            </label>
                                            <textarea
                                                name="bio"
                                                value={profileData.bio}
                                                onChange={handleProfileChange}
                                                disabled={!isEditing}
                                                rows={4}
                                                className={`w-full ${isApple ? "px-4 py-3 rounded-xl" : "px-5 py-4 rounded-2xl"} outline-none transition-all resize-none`}
                                                style={{
                                                    background: palette.surfaceSecondary,
                                                    color: palette.textPrimary,
                                                    border: `2px solid ${palette.border}`,
                                                    opacity: isEditing ? 1 : 0.6
                                                }}
                                                placeholder="Tell us about yourself..."
                                            />
                                        </div>

                                        {/* Location & Website */}
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div>
                                                <label
                                                    className={`block ${isApple ? "text-sm font-medium" : "text-base font-bold"} mb-2`}
                                                    style={{ color: palette.textSecondary }}
                                                >
                                                    Location
                                                </label>
                                                <input
                                                    type="text"
                                                    name="location"
                                                    value={profileData.location}
                                                    onChange={handleProfileChange}
                                                    disabled={!isEditing}
                                                    className={`w-full ${isApple ? "px-4 py-3 rounded-xl" : "px-5 py-4 rounded-2xl"} outline-none transition-all`}
                                                    style={{
                                                        background: palette.surfaceSecondary,
                                                        color: palette.textPrimary,
                                                        border: `2px solid ${palette.border}`,
                                                        opacity: isEditing ? 1 : 0.6
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label
                                                    className={`block ${isApple ? "text-sm font-medium" : "text-base font-bold"} mb-2`}
                                                    style={{ color: palette.textSecondary }}
                                                >
                                                    Website
                                                </label>
                                                <input
                                                    type="url"
                                                    name="website"
                                                    value={profileData.website}
                                                    onChange={handleProfileChange}
                                                    disabled={!isEditing}
                                                    className={`w-full ${isApple ? "px-4 py-3 rounded-xl" : "px-5 py-4 rounded-2xl"} outline-none transition-all`}
                                                    style={{
                                                        background: palette.surfaceSecondary,
                                                        color: palette.textPrimary,
                                                        border: `2px solid ${palette.border}`,
                                                        opacity: isEditing ? 1 : 0.6
                                                    }}
                                                    placeholder="https://yourwebsite.com"
                                                />
                                            </div>
                                        </div>

                                        {/* Social Links */}
                                        <div>
                                            <h3
                                                className={`${isApple ? "text-lg font-bold" : "text-xl font-black"} mb-4`}
                                                style={{ color: palette.textPrimary }}
                                            >
                                                Social Links
                                            </h3>
                                            <div className="grid md:grid-cols-2 gap-6">
                                                {Object.entries(profileData.socialLinks).map(([platform, value]) => (
                                                    <div key={platform}>
                                                        <label
                                                            className={`block ${isApple ? "text-sm font-medium" : "text-base font-bold"} mb-2 capitalize`}
                                                            style={{ color: palette.textSecondary }}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                {socialIcons[platform as keyof typeof socialIcons]}
                                                                {platform}
                                                            </div>
                                                        </label>
                                                        <input
                                                            type="url"
                                                            name={`social_${platform}`}
                                                            value={value}
                                                            onChange={handleProfileChange}
                                                            disabled={!isEditing}
                                                            className={`w-full ${isApple ? "px-4 py-3 rounded-xl" : "px-5 py-4 rounded-2xl"} outline-none transition-all`}
                                                            style={{
                                                                background: palette.surfaceSecondary,
                                                                color: palette.textPrimary,
                                                                border: `2px solid ${palette.border}`,
                                                                opacity: isEditing ? 1 : 0.6
                                                            }}
                                                            placeholder={`https://${platform}.com/username`}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        )}

                        {activeTab === "security" && (
                            <motion.div
                                key="security"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                {/* Change Password Card */}
                                <Card
                                    className={isApple ? "p-6" : "p-8"}
                                    intensity={isApple ? "medium" : undefined}
                                    elevated={!isApple}
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <div
                                            className={`${isApple ? "w-10 h-10 rounded-lg" : "w-12 h-12 rounded-xl"} flex items-center justify-center`}
                                            style={{ background: palette.accentSubtle }}
                                        >
                                            <Lock style={{ color: palette.accent }} />
                                        </div>
                                        <h2
                                            className={`${isApple ? "text-xl font-bold" : "text-2xl font-black"}`}
                                            style={{ color: palette.textPrimary }}
                                        >
                                            Change Password
                                        </h2>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Current Password */}
                                        <div>
                                            <label
                                                className={`block ${isApple ? "text-sm font-medium" : "text-base font-bold"} mb-2`}
                                                style={{ color: palette.textSecondary }}
                                            >
                                                Current Password
                                            </label>
                                            <div className="relative">
                                                <Lock
                                                    className="absolute left-4 top-1/2 -translate-y-1/2"
                                                    style={{ color: palette.textTertiary }}
                                                    fontSize="small"
                                                />
                                                <input
                                                    type={showPasswords.current ? "text" : "password"}
                                                    name="currentPassword"
                                                    value={passwordData.currentPassword}
                                                    onChange={handlePasswordChange}
                                                    className={`w-full ${isApple ? "pl-12 pr-12 py-3 rounded-xl" : "pl-14 pr-14 py-4 rounded-2xl"} outline-none transition-all`}
                                                    style={{
                                                        background: palette.surfaceSecondary,
                                                        color: palette.textPrimary,
                                                        border: `2px solid ${palette.border}`
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2"
                                                >
                                                    {showPasswords.current ? (
                                                        <VisibilityOff style={{ color: palette.textTertiary }} fontSize="small" />
                                                    ) : (
                                                        <Visibility style={{ color: palette.textTertiary }} fontSize="small" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* New Password */}
                                        <div>
                                            <label
                                                className={`block ${isApple ? "text-sm font-medium" : "text-base font-bold"} mb-2`}
                                                style={{ color: palette.textSecondary }}
                                            >
                                                New Password
                                            </label>
                                            <div className="relative">
                                                <Lock
                                                    className="absolute left-4 top-1/2 -translate-y-1/2"
                                                    style={{ color: palette.textTertiary }}
                                                    fontSize="small"
                                                />
                                                <input
                                                    type={showPasswords.new ? "text" : "password"}
                                                    name="newPassword"
                                                    value={passwordData.newPassword}
                                                    onChange={handlePasswordChange}
                                                    className={`w-full ${isApple ? "pl-12 pr-12 py-3 rounded-xl" : "pl-14 pr-14 py-4 rounded-2xl"} outline-none transition-all`}
                                                    style={{
                                                        background: palette.surfaceSecondary,
                                                        color: palette.textPrimary,
                                                        border: `2px solid ${palette.border}`
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2"
                                                >
                                                    {showPasswords.new ? (
                                                        <VisibilityOff style={{ color: palette.textTertiary }} fontSize="small" />
                                                    ) : (
                                                        <Visibility style={{ color: palette.textTertiary }} fontSize="small" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Confirm Password */}
                                        <div>
                                            <label
                                                className={`block ${isApple ? "text-sm font-medium" : "text-base font-bold"} mb-2`}
                                                style={{ color: palette.textSecondary }}
                                            >
                                                Confirm New Password
                                            </label>
                                            <div className="relative">
                                                <Lock
                                                    className="absolute left-4 top-1/2 -translate-y-1/2"
                                                    style={{ color: palette.textTertiary }}
                                                    fontSize="small"
                                                />
                                                <input
                                                    type={showPasswords.confirm ? "text" : "password"}
                                                    name="confirmPassword"
                                                    value={passwordData.confirmPassword}
                                                    onChange={handlePasswordChange}
                                                    className={`w-full ${isApple ? "pl-12 pr-12 py-3 rounded-xl" : "pl-14 pr-14 py-4 rounded-2xl"} outline-none transition-all`}
                                                    style={{
                                                        background: palette.surfaceSecondary,
                                                        color: palette.textPrimary,
                                                        border: `2px solid ${palette.border}`
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2"
                                                >
                                                    {showPasswords.confirm ? (
                                                        <VisibilityOff style={{ color: palette.textTertiary }} fontSize="small" />
                                                    ) : (
                                                        <Visibility style={{ color: palette.textTertiary }} fontSize="small" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 pt-2">
                                            <Button
                                                onClick={handlePasswordSave}
                                                disabled={loading}
                                                variant="primary"
                                                className="flex items-center gap-2"
                                            >
                                                {loading ? (
                                                    <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#ffffff" }} />
                                                ) : (
                                                    <Lock />
                                                )}
                                                <span>Update Password</span>
                                            </Button>
                                            <Button
                                                onClick={() => router.push("/auth/forgot-password")}
                                                variant="secondary"
                                                className="flex items-center gap-2"
                                            >
                                                <Key />
                                                <span>Forgot Password</span>
                                            </Button>
                                        </div>
                                    </div>
                                </Card>

                                {/* Email Management Card */}
                                <Card
                                    className={isApple ? "p-6" : "p-8"}
                                    intensity={isApple ? "medium" : undefined}
                                    elevated={!isApple}
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <div
                                            className={`${isApple ? "w-10 h-10 rounded-lg" : "w-12 h-12 rounded-xl"} flex items-center justify-center`}
                                            style={{ background: "rgba(59, 130, 246, 0.1)" }}
                                        >
                                            <AlternateEmail style={{ color: "#3b82f6" }} />
                                        </div>
                                        <h2
                                            className={`${isApple ? "text-xl font-bold" : "text-2xl font-black"}`}
                                            style={{ color: palette.textPrimary }}
                                        >
                                            Email Management
                                        </h2>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: palette.surfaceSecondary }}>
                                            <div className="flex items-center gap-3">
                                                <Email style={{ color: palette.accent }} />
                                                <div>
                                                    <p className={`${isApple ? "text-sm font-semibold" : "text-base font-bold"}`} style={{ color: palette.textPrimary }}>
                                                        {session?.user?.email}
                                                    </p>
                                                    <p className="text-xs" style={{ color: palette.textSecondary }}>Primary Email</p>
                                                </div>
                                            </div>
                                            <Verified style={{ color: "#10b981" }} />
                                        </div>
                                        <Button variant="secondary" className="w-full flex items-center justify-center gap-2">
                                            <AlternateEmail />
                                            <span>Change Email Address</span>
                                        </Button>
                                    </div>
                                </Card>

                                {/* Two-Factor Authentication Card */}
                                <Card
                                    className={isApple ? "p-6" : "p-8"}
                                    intensity={isApple ? "medium" : undefined}
                                    elevated={!isApple}
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <div
                                            className={`${isApple ? "w-10 h-10 rounded-lg" : "w-12 h-12 rounded-xl"} flex items-center justify-center`}
                                            style={{ background: "rgba(139, 92, 246, 0.1)" }}
                                        >
                                            <Shield style={{ color: "#8b5cf6" }} />
                                        </div>
                                        <h2
                                            className={`${isApple ? "text-xl font-bold" : "text-2xl font-black"}`}
                                            style={{ color: palette.textPrimary }}
                                        >
                                            Two-Factor Authentication
                                        </h2>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: palette.surfaceSecondary }}>
                                            <div className="flex items-center gap-3">
                                                <Fingerprint style={{ color: palette.textSecondary }} />
                                                <div>
                                                    <p className={`${isApple ? "text-sm font-semibold" : "text-base font-bold"}`} style={{ color: palette.textPrimary }}>
                                                        Authenticator App
                                                    </p>
                                                    <p className="text-xs" style={{ color: palette.textSecondary }}>Google Authenticator, Authy, etc.</p>
                                                </div>
                                            </div>
                                            <Button variant="secondary">Enable</Button>
                                        </div>

                                        <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: palette.surfaceSecondary }}>
                                            <div className="flex items-center gap-3">
                                                <PhoneAndroid style={{ color: palette.textSecondary }} />
                                                <div>
                                                    <p className={`${isApple ? "text-sm font-semibold" : "text-base font-bold"}`} style={{ color: palette.textPrimary }}>
                                                        SMS Authentication
                                                    </p>
                                                    <p className="text-xs" style={{ color: palette.textSecondary }}>Receive codes via text message</p>
                                                </div>
                                            </div>
                                            <Button variant="secondary">Setup</Button>
                                        </div>

                                        <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: palette.surfaceSecondary }}>
                                            <div className="flex items-center gap-3">
                                                <VpnKey style={{ color: palette.textSecondary }} />
                                                <div>
                                                    <p className={`${isApple ? "text-sm font-semibold" : "text-base font-bold"}`} style={{ color: palette.textPrimary }}>
                                                        Backup Codes
                                                    </p>
                                                    <p className="text-xs" style={{ color: palette.textSecondary }}>Generate backup recovery codes</p>
                                                </div>
                                            </div>
                                            <Button variant="secondary">Generate</Button>
                                        </div>
                                    </div>
                                </Card>

                                {/* Phone Number Card */}
                                <Card
                                    className={isApple ? "p-6" : "p-8"}
                                    intensity={isApple ? "medium" : undefined}
                                    elevated={!isApple}
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <div
                                            className={`${isApple ? "w-10 h-10 rounded-lg" : "w-12 h-12 rounded-xl"} flex items-center justify-center`}
                                            style={{ background: "rgba(16, 185, 129, 0.1)" }}
                                        >
                                            <Phone style={{ color: "#10b981" }} />
                                        </div>
                                        <h2
                                            className={`${isApple ? "text-xl font-bold" : "text-2xl font-black"}`}
                                            style={{ color: palette.textPrimary }}
                                        >
                                            Phone Number
                                        </h2>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-sm" style={{ color: palette.textSecondary }}>
                                            Add a phone number for account recovery and two-factor authentication
                                        </p>
                                        <Button variant="secondary" className="w-full flex items-center justify-center gap-2">
                                            <Phone />
                                            <span>Add Phone Number</span>
                                        </Button>
                                    </div>
                                </Card>

                                {/* Danger Zone Card */}
                                <Card
                                    className={isApple ? "p-6 border-2 border-red-500" : "p-8 border-2 border-red-500"}
                                    intensity={isApple ? "medium" : undefined}
                                    elevated={!isApple}
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <div
                                            className={`${isApple ? "w-10 h-10 rounded-lg" : "w-12 h-12 rounded-xl"} flex items-center justify-center`}
                                            style={{ background: "rgba(239, 68, 68, 0.1)" }}
                                        >
                                            <Delete style={{ color: "#ef4444" }} />
                                        </div>
                                        <h2
                                            className={`${isApple ? "text-xl font-bold" : "text-2xl font-black"}`}
                                            style={{ color: "#ef4444" }}
                                        >
                                            Danger Zone
                                        </h2>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-sm" style={{ color: palette.textSecondary }}>
                                            Once you delete your account, there is no going back. Please be certain.
                                        </p>
                                        
                                        {!showDeleteConfirm ? (
                                            <button
                                                onClick={() => setShowDeleteConfirm(true)}
                                                className={`w-full ${isApple ? "px-6 py-3 rounded-xl" : "px-8 py-4 rounded-2xl font-bold"} flex items-center justify-center gap-2 transition-all`}
                                                style={{
                                                    background: "rgba(239, 68, 68, 0.1)",
                                                    color: "#ef4444",
                                                    border: "2px solid #ef4444"
                                                }}
                                            >
                                                <Delete />
                                                <span>Delete Account</span>
                                            </button>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="p-4 rounded-xl" style={{ background: "rgba(239, 68, 68, 0.05)", border: "1px solid #ef4444" }}>
                                                    <p className={`${isApple ? "text-sm font-semibold" : "text-base font-bold"} mb-2`} style={{ color: "#ef4444" }}>
                                                        Are you absolutely sure?
                                                    </p>
                                                    <p className="text-xs" style={{ color: palette.textSecondary }}>
                                                        This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                                                    </p>
                                                </div>
                                                <div className="flex gap-3">
                                                    <Button
                                                        onClick={() => setShowDeleteConfirm(false)}
                                                        variant="secondary"
                                                        className="flex-1"
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <button
                                                        className={`flex-1 ${isApple ? "px-6 py-3 rounded-xl" : "px-8 py-4 rounded-2xl font-bold"} transition-all`}
                                                        style={{
                                                            background: "#ef4444",
                                                            color: "#ffffff"
                                                        }}
                                                    >
                                                        Yes, Delete My Account
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </motion.div>
                        )}

                        {activeTab === "connections" && (
                            <motion.div
                                key="connections"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <Card
                                    className={isApple ? "p-6" : "p-8"}
                                    intensity={isApple ? "medium" : undefined}
                                    elevated={!isApple}
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <div
                                            className={`${isApple ? "w-10 h-10 rounded-lg" : "w-12 h-12 rounded-xl"} flex items-center justify-center`}
                                            style={{ background: palette.accentSubtle }}
                                        >
                                            <ConnectedTv style={{ color: palette.accent }} />
                                        </div>
                                        <h2
                                            className={`${isApple ? "text-xl font-bold" : "text-2xl font-black"}`}
                                            style={{ color: palette.textPrimary }}
                                        >
                                            Connected OAuth Accounts
                                        </h2>
                                    </div>

                                    <div className="space-y-3">
                                        {[
                                            { name: "Google", icon: <Email />, connected: true, color: "#ea4335" },
                                            { name: "GitHub", icon: <GitHub />, connected: true, color: "#333" },
                                            { name: "LinkedIn", icon: <LinkedIn />, connected: false, color: "#0077b5" },
                                            { name: "Twitter", icon: <Twitter />, connected: false, color: "#1da1f2" }
                                        ].map((provider) => (
                                            <div 
                                                key={provider.name}
                                                className="flex items-center justify-between p-4 rounded-xl" 
                                                style={{ background: palette.surfaceSecondary }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div 
                                                        className={`${isApple ? "w-8 h-8 rounded-lg" : "w-10 h-10 rounded-xl"} flex items-center justify-center`}
                                                        style={{ background: `${provider.color}20` }}
                                                    >
                                                        {React.cloneElement(provider.icon, { 
                                                            style: { color: provider.color },
                                                            fontSize: "small"
                                                        })}
                                                    </div>
                                                    <div>
                                                        <p className={`${isApple ? "text-sm font-semibold" : "text-base font-bold"}`} style={{ color: palette.textPrimary }}>
                                                            {provider.name}
                                                        </p>
                                                        <p className="text-xs" style={{ color: palette.textSecondary }}>
                                                            {provider.connected ? "Connected" : "Not connected"}
                                                        </p>
                                                    </div>
                                                </div>
                                                {provider.connected ? (
                                                    <Button variant="secondary">
                                                        Disconnect
                                                    </Button>
                                                ) : (
                                                    <Button variant="primary">
                                                        Connect
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </>
    );
}

export default function ProfilePage() {
    return <ProfileContent />;
}
