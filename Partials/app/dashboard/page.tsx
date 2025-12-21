/**
 * Dashboard Page
 * Redesigned with dual-theme support
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useDesignTheme } from "../../Hooks/useDesignTheme";
import { LiquidGlassCard, LiquidGlassButton } from "../../Components/LiquidGlass";
import { OneUICard, OneUIButton, OneUIBadge } from "../../Components/OneUI";
import {
    Dashboard as DashboardIcon,
    Person,
    Article,
    Bookmark,
    Schedule,
    TrendingUp,
    Notifications,
    Settings,
    ExitToApp,
    Verified,
    Shield,
    LocationOn,
    Language,
    ChevronRight,
    Edit,
    Visibility,
    Favorite,
    Share,
    Link as LinkIcon,
    CalendarMonth
} from "@mui/icons-material";
import { useSession, signOut } from "../../Lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface DashboardStats {
    totalBlogs: number;
    totalViews: number;
    totalBookmarks: number;
    accountAge: number;
}

interface RecentActivity {
    id: string;
    type: "blog" | "bookmark" | "profile";
    title: string;
    description: string;
    timestamp: string;
    icon: JSX.Element;
}

function DashboardContent() {
    const { designTheme, palette } = useDesignTheme();
    const isApple = designTheme === "apple";
    const Card = isApple ? LiquidGlassCard : OneUICard;
    const Button = isApple ? LiquidGlassButton : OneUIButton;

    const { data: session, isPending } = useSession();
    const router = useRouter();

    const [stats, setStats] = useState<DashboardStats>({
        totalBlogs: 0,
        totalViews: 0,
        totalBookmarks: 0,
        accountAge: 0
    });

    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isPending && !session) {
            router.push("/auth/signin?callbackUrl=/dashboard");
        } else if (!isPending && session) {
            loadDashboardData();
        }
    }, [isPending, session, router]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            // Simulate API calls - replace with actual API endpoints
            await new Promise(resolve => setTimeout(resolve, 1000));

            setStats({
                totalBlogs: 12,
                totalViews: 1543,
                totalBookmarks: 28,
                accountAge: 45
            });

            setRecentActivity([
                {
                    id: "1",
                    type: "blog",
                    title: "Published new blog post",
                    description: "Getting Started with Next.js 15",
                    timestamp: "2 hours ago",
                    icon: <Article />
                },
                {
                    id: "2",
                    type: "bookmark",
                    title: "Added new bookmark",
                    description: "React Documentation",
                    timestamp: "5 hours ago",
                    icon: <Bookmark />
                },
                {
                    id: "3",
                    type: "profile",
                    title: "Updated profile",
                    description: "Changed profile picture",
                    timestamp: "1 day ago",
                    icon: <Person />
                }
            ]);
        } catch (error) {
            console.error("Failed to load dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        router.push("/");
    };

    const statCards = [
        {
            label: "Blog Posts",
            value: stats.totalBlogs,
            icon: <Article />,
            change: "+3 this month",
            color: palette.accent
        },
        {
            label: "Total Views",
            value: stats.totalViews,
            icon: <Visibility />,
            change: "+245 this week",
            color: "#3b82f6"
        },
        {
            label: "Bookmarks",
            value: stats.totalBookmarks,
            icon: <Bookmark />,
            change: "+5 this week",
            color: "#8b5cf6"
        },
        {
            label: "Account Age",
            value: `${stats.accountAge}d`,
            icon: <Schedule />,
            change: "Member since",
            color: "#10b981"
        }
    ];

    const quickActions = [
        {
            label: "Write Blog",
            icon: <Edit />,
            href: "/blogs/new",
            color: palette.accent
        },
        {
            label: "Bookmarks",
            icon: <Bookmark />,
            href: "/bookmarks",
            color: "#8b5cf6"
        },
        {
            label: "Wallets",
            icon: <TrendingUp />,
            href: "/wallet",
            color: "#10b981"
        },
        {
            label: "Profile",
            icon: <Person />,
            href: "/profile",
            color: "#3b82f6"
        },
        {
            label: "Settings",
            icon: <Settings />,
            href: "/settings",
            color: "#64748b"
        }
    ];

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
                <div className="max-w-7xl mx-auto px-6">
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
                                    Welcome back, {session.user?.name?.split(" ")[0]}!
                                </h1>
                                <p
                                    className={`${isApple ? "text-base" : "text-lg font-medium"}`}
                                    style={{ color: palette.textSecondary }}
                                >
                                    Here&apos;s what&apos;s happening with your account
                                </p>
                            </div>
                            <Button
                                onClick={handleSignOut}
                                variant="secondary"
                                className="flex items-center gap-2"
                            >
                                <ExitToApp />
                                <span>Sign Out</span>
                            </Button>
                        </div>
                    </motion.div>

                    {/* User Info Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="mb-8"
                    >
                        <Card
                            className={isApple ? "p-6" : "p-8"}
                            intensity={isApple ? "strong" : undefined}
                            elevated={!isApple}
                        >
                            <div className="flex items-center gap-6">
                                {/* Avatar */}
                                <div className="relative">
                                    {session.user?.image ? (
                                        <img
                                            src={session.user.image}
                                            alt={session.user.name || "User"}
                                            className={`${isApple ? "w-20 h-20 rounded-2xl" : "w-24 h-24 rounded-3xl"} object-cover`}
                                            style={{ border: `3px solid ${palette.accent}` }}
                                        />
                                    ) : (
                                        <div
                                            className={`${isApple ? "w-20 h-20 rounded-2xl" : "w-24 h-24 rounded-3xl"} flex items-center justify-center text-3xl font-black`}
                                            style={{
                                                background: palette.accent,
                                                color: "#ffffff"
                                            }}
                                        >
                                            {session.user?.name?.charAt(0) || "U"}
                                        </div>
                                    )}
                                    <div
                                        className="absolute -bottom-1 -right-1 p-1 rounded-full"
                                        style={{ background: palette.surface }}
                                    >
                                        <Verified style={{ color: palette.accent, fontSize: "1.5rem" }} />
                                    </div>
                                </div>

                                {/* User Details */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h2
                                            className={`${isApple ? "text-2xl font-bold" : "text-3xl font-black"}`}
                                            style={{ color: palette.textPrimary }}
                                        >
                                            {session.user?.name}
                                        </h2>
                                        {isApple ? (
                                            <span
                                                className="text-xs px-2 py-1 rounded-full"
                                                style={{
                                                    background: palette.accentSubtle,
                                                    color: palette.accent
                                                }}
                                            >
                                                Pro
                                            </span>
                                        ) : (
                                            <OneUIBadge variant="accent">Pro</OneUIBadge>
                                        )}
                                    </div>
                                    <p
                                        className={`${isApple ? "text-sm" : "text-base font-medium"} mb-3`}
                                        style={{ color: palette.textSecondary }}
                                    >
                                        {session.user?.email}
                                    </p>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <LocationOn
                                                fontSize="small"
                                                style={{ color: palette.textTertiary }}
                                            />
                                            <span
                                                className={isApple ? "text-xs" : "text-sm font-semibold"}
                                                style={{ color: palette.textSecondary }}
                                            >
                                                Gujarat, India
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Language
                                                fontSize="small"
                                                style={{ color: palette.textTertiary }}
                                            />
                                            <span
                                                className={isApple ? "text-xs" : "text-sm font-semibold"}
                                                style={{ color: palette.textSecondary }}
                                            >
                                                IST (UTC+5:30)
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Edit Profile Button */}
                                <Link href="/profile">
                                    <Button
                                        variant="secondary"
                                        className="flex items-center gap-2"
                                    >
                                        <Edit />
                                        <span>Edit Profile</span>
                                    </Button>
                                </Link>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Stats Grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="grid md:grid-cols-4 gap-6 mb-8"
                    >
                        {statCards.map((stat, index) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4, delay: 0.3 + index * 0.05 }}
                            >
                                <Card
                                    className={isApple ? "p-6" : "p-8"}
                                    intensity={isApple ? "medium" : undefined}
                                    elevated={!isApple}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div
                                            className={`${isApple ? "p-3 rounded-xl" : "p-4 rounded-2xl"}`}
                                            style={{
                                                background: `${stat.color}20`,
                                                color: stat.color
                                            }}
                                        >
                                            {stat.icon}
                                        </div>
                                    </div>
                                    <p
                                        className={`${isApple ? "text-3xl font-bold" : "text-4xl font-black"} mb-1`}
                                        style={{ color: palette.textPrimary }}
                                    >
                                        {stat.value}
                                    </p>
                                    <p
                                        className={`${isApple ? "text-sm" : "text-base font-semibold"} mb-2`}
                                        style={{ color: palette.textSecondary }}
                                    >
                                        {stat.label}
                                    </p>
                                    <p
                                        className={`${isApple ? "text-xs" : "text-sm font-medium"}`}
                                        style={{ color: palette.textTertiary }}
                                    >
                                        {stat.change}
                                    </p>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Quick Actions */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                        >
                            <Card
                                className={isApple ? "p-6" : "p-8"}
                                intensity={isApple ? "strong" : undefined}
                                elevated={!isApple}
                            >
                                <h2
                                    className={`${isApple ? "text-xl font-bold" : "text-2xl font-black"} mb-6`}
                                    style={{ color: palette.textPrimary }}
                                >
                                    Quick Actions
                                </h2>
                                <div className="space-y-4">
                                    {quickActions.map((action) => (
                                        <Link key={action.label} href={action.href}>
                                            <button
                                                className={`w-full ${isApple ? "p-4 rounded-xl" : "p-5 rounded-2xl"} flex items-center gap-4 transition-all hover:scale-105`}
                                                style={{
                                                    background: palette.surfaceSecondary,
                                                    border: `1px solid ${palette.border}`
                                                }}
                                            >
                                                <div
                                                    className={`${isApple ? "p-2 rounded-lg" : "p-3 rounded-xl"}`}
                                                    style={{
                                                        background: `${action.color}20`,
                                                        color: action.color
                                                    }}
                                                >
                                                    {action.icon}
                                                </div>
                                                <span
                                                    className={`flex-1 text-left ${isApple ? "text-base font-semibold" : "text-lg font-black"}`}
                                                    style={{ color: palette.textPrimary }}
                                                >
                                                    {action.label}
                                                </span>
                                                <ChevronRight
                                                    style={{ color: palette.textTertiary }}
                                                />
                                            </button>
                                        </Link>
                                    ))}
                                </div>
                            </Card>
                        </motion.div>

                        {/* Recent Activity */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.5 }}
                            className="lg:col-span-2"
                        >
                            <Card
                                className={isApple ? "p-6" : "p-8"}
                                intensity={isApple ? "medium" : undefined}
                                elevated={!isApple}
                            >
                                <h2
                                    className={`${isApple ? "text-xl font-bold" : "text-2xl font-black"} mb-6`}
                                    style={{ color: palette.textPrimary }}
                                >
                                    Recent Activity
                                </h2>
                                <div className="space-y-4">
                                    {recentActivity.map((activity, index) => (
                                        <motion.div
                                            key={activity.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                                            className={`${isApple ? "p-4 rounded-xl" : "p-5 rounded-2xl"} flex items-start gap-4`}
                                            style={{
                                                background: palette.surfaceSecondary,
                                                border: `1px solid ${palette.border}`
                                            }}
                                        >
                                            <div
                                                className={`${isApple ? "p-2 rounded-lg" : "p-3 rounded-xl"}`}
                                                style={{
                                                    background: palette.accentSubtle,
                                                    color: palette.accent
                                                }}
                                            >
                                                {activity.icon}
                                            </div>
                                            <div className="flex-1">
                                                <h3
                                                    className={`${isApple ? "text-base font-bold" : "text-lg font-black"} mb-1`}
                                                    style={{ color: palette.textPrimary }}
                                                >
                                                    {activity.title}
                                                </h3>
                                                <p
                                                    className={`${isApple ? "text-sm" : "text-base font-medium"} mb-2`}
                                                    style={{ color: palette.textSecondary }}
                                                >
                                                    {activity.description}
                                                </p>
                                                <p
                                                    className={`${isApple ? "text-xs" : "text-sm font-medium"}`}
                                                    style={{ color: palette.textTertiary }}
                                                >
                                                    {activity.timestamp}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </main>
        </>
    );
}

export default function DashboardPage() {
    return <DashboardContent />;
}
