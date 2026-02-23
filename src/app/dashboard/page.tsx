"use client";

import React, { useEffect, useState, useCallback, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { useSession, authClient, signOut } from "@Library/auth-client";

// MUI Icons
import DashboardIcon from "@mui/icons-material/Dashboard";
import ArticleIcon from "@mui/icons-material/Article";
import DevicesIcon from "@mui/icons-material/Devices";
import SettingsIcon from "@mui/icons-material/Settings";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FavoriteIcon from "@mui/icons-material/Favorite";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LogoutIcon from "@mui/icons-material/Logout";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import ShieldIcon from "@mui/icons-material/Shield";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import BlockIcon from "@mui/icons-material/Block";
import ComputerIcon from "@mui/icons-material/Computer";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import RefreshIcon from "@mui/icons-material/Refresh";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import LinkIcon from "@mui/icons-material/Link";
import BarChartIcon from "@mui/icons-material/BarChart";

// ── Types ────────────────────────────────────────────────────────
interface BlogItem {
    _id: string;
    title: string;
    slug: string;
    status: string;
    category?: string;
    readTime?: number;
    views?: number;
    likes?: number;
    createdAt?: string;
    publishedAt?: string;
    excerpt?: string;
}

type Tab = "overview" | "blogs" | "sessions" | "settings";

const STATUS_CFG: Record<string, { label: string; color: string }> = {
    draft: { label: "Draft", color: "#94a3b8" },
    pending_review: { label: "Pending", color: "#f59e0b" },
    published: { label: "Published", color: "#22c55e" },
    unlisted: { label: "Unlisted", color: "#818cf8" },
    private: { label: "Private", color: "#6b7280" },
    rejected: { label: "Rejected", color: "#ef4444" }
};

const BLOG_FILTERS = ["all", "published", "draft", "pending_review", "rejected"] as const;
type BlogFilter = (typeof BLOG_FILTERS)[number];

// ── Helpers ──────────────────────────────────────────────────────
const ua2Icon = (ua?: string) => {
    if (!ua) return <ComputerIcon style={{ fontSize: 18 }} />;
    if (/mobile|android|iphone/i.test(ua)) return <PhoneAndroidIcon style={{ fontSize: 18 }} />;
    return <ComputerIcon style={{ fontSize: 18 }} />;
};

const fmtDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

// ── Component ────────────────────────────────────────────────────
export default function UserDashboard() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";
    const router = useRouter();
    const session = useSession();

    const user = session.data?.user as any;
    const isAdmin = user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL || (user as any)?.role === "admin";

    const [tab, setTab] = useState<Tab>("overview");
    const [blogs, setBlogs] = useState<BlogItem[]>([]);
    const [blogsLoading, setBlogsLoading] = useState(true);
    const [blogFilter, setBlogFilter] = useState<BlogFilter>("all");
    const [sessions, setSessions] = useState<any[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [revokingId, setRevokingId] = useState<string | null>(null);
    const [signingOut, setSigningOut] = useState(false);

    // Redirect if not authenticated
    useEffect(() => {
        if (!session.isPending && !session.data) {
            router.push("/auth/signin?redirect=/dashboard");
        }
    }, [session.isPending, session.data, router]);

    // Load user's blogs
    const fetchBlogs = useCallback(async () => {
        setBlogsLoading(true);
        try {
            const res = await fetch("/api/blogs?mine=true&limit=100");
            const data = await res.json();
            setBlogs(data.data || data.blogs || []);
        } catch {}
        setBlogsLoading(false);
    }, []);

    // Load sessions when that tab opens
    const fetchSessions = useCallback(async () => {
        setSessionsLoading(true);
        try {
            const res = await authClient.listSessions();
            setSessions((res as any).data || []);
        } catch {}
        setSessionsLoading(false);
    }, []);

    useEffect(() => { if (user) fetchBlogs(); }, [user, fetchBlogs]);
    useEffect(() => { if (tab === "sessions") fetchSessions(); }, [tab, fetchSessions]);

    const handleRevokeSession = async (token: string) => {
        setRevokingId(token);
        try {
            await authClient.revokeSession({ token });
            setSessions((s) => s.filter((x) => x.token !== token));
        } catch {}
        setRevokingId(null);
    };

    const handleSignOut = async () => {
        setSigningOut(true);
        await signOut();
        router.push("/");
    };

    // ── Derived stats ─────────────────────────────────────────────
    const blogStats = {
        total: blogs.length,
        published: blogs.filter((b) => b.status === "published").length,
        pending: blogs.filter((b) => b.status === "pending_review").length,
        draft: blogs.filter((b) => b.status === "draft").length,
        rejected: blogs.filter((b) => b.status === "rejected").length,
        totalViews: blogs.reduce((a, b) => a + (b.views || 0), 0),
        totalLikes: blogs.reduce((a, b) => a + (b.likes || 0), 0)
    };

    const filteredBlogs = blogFilter === "all" ? blogs : blogs.filter((b) => b.status === blogFilter);

    // ── Styles ───────────────────────────────────────────────────
    const card = {
        background: isApple
            ? isDark ? "rgba(28,28,32,0.72)" : "rgba(255,255,255,0.72)"
            : isDark ? "rgba(20,20,28,0.95)" : "#fff",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`,
        backdropFilter: isApple ? "blur(20px)" : "none",
        borderRadius: 18
    };

    const navItems: { key: Tab; label: string; icon: React.ReactNode }[] = [
        { key: "overview", label: "Overview", icon: <DashboardIcon style={{ fontSize: 18 }} /> },
        { key: "blogs", label: "My Blogs", icon: <ArticleIcon style={{ fontSize: 18 }} /> },
        { key: "sessions", label: "Sessions", icon: <DevicesIcon style={{ fontSize: 18 }} /> },
        { key: "settings", label: "Settings", icon: <SettingsIcon style={{ fontSize: 18 }} /> }
    ];

    if (session.isPending) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: palette.background }}>
                <div className="w-9 h-9 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: palette.accent }} />
            </div>
        );
    }

    if (!user) return null;

    const avatarLetter = (user.name || user.email || "U").charAt(0).toUpperCase();

    return (
        <div className="min-h-screen flex" style={{ background: palette.background }}>
            {/* ── Sidebar ─────────────────────────────────────── */}
            <motion.aside
                className="hidden md:flex flex-col w-64 sticky top-0 h-screen border-r overflow-y-auto"
                style={{
                    background: isApple
                        ? isDark ? "rgba(18,18,22,0.85)" : "rgba(246,246,252,0.85)"
                        : isDark ? "rgba(14,14,20,0.98)" : "rgba(248,248,252,0.98)",
                    borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
                    backdropFilter: isApple ? "blur(24px)" : "none"
                }}
                initial={{ x: -40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
                {/* Profile mini */}
                <div className="p-6 border-b" style={{ borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }}>
                    <div className="flex items-center gap-3">
                        {user.image ? (
                            <img src={user.image} alt={user.name} className="w-11 h-11 rounded-full object-cover" style={{ outline: `2px solid ${palette.accent}40`, outlineOffset: "2px" }} />
                        ) : (
                            <div className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold"
                                style={{ background: `linear-gradient(135deg, ${palette.accent}, ${palette.accent}88)`, color: "#fff" }}>
                                {avatarLetter}
                            </div>
                        )}
                        <div className="min-w-0">
                            <div className="font-semibold text-sm truncate" style={{ color: palette.textPrimary }}>{user.name || "User"}</div>
                            <div className="text-xs truncate" style={{ color: palette.textSecondary }}>{user.email}</div>
                        </div>
                    </div>
                    {isAdmin && (
                        <div className="mt-3 flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold w-fit"
                            style={{ background: "rgba(250,204,21,0.12)", color: "#f59e0b" }}>
                            <ShieldIcon style={{ fontSize: 12 }} /> Admin
                        </div>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex flex-col gap-1 p-3 flex-1">
                    {navItems.map(({ key, label, icon }) => (
                        <motion.button
                            key={key}
                            onClick={() => setTab(key)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left"
                            style={{
                                background: tab === key ? `${palette.accent}18` : "transparent",
                                color: tab === key ? palette.accent : palette.textSecondary
                            }}
                            whileTap={{ scale: 0.97 }}
                        >
                            {icon}{label}
                            {key === "blogs" && blogStats.pending > 0 && (
                                <span className="ml-auto px-1.5 py-0.5 rounded-full text-xs font-bold"
                                    style={{ background: "#f59e0b20", color: "#f59e0b" }}>
                                    {blogStats.pending}
                                </span>
                            )}
                        </motion.button>
                    ))}

                    <div className="mt-2 pt-2 border-t" style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                        {isAdmin && (
                            <Link href="/admin">
                                <motion.button
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full"
                                    style={{ color: "#f59e0b" }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    <AdminPanelSettingsIcon style={{ fontSize: 18 }} /> Admin Panel
                                </motion.button>
                            </Link>
                        )}
                        <motion.button
                            onClick={handleSignOut}
                            disabled={signingOut}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full"
                            style={{ color: "#ef4444" }}
                            whileTap={{ scale: 0.97 }}
                        >
                            <LogoutIcon style={{ fontSize: 18 }} />
                            {signingOut ? "Signing out…" : "Sign Out"}
                        </motion.button>
                    </div>
                </nav>
            </motion.aside>

            {/* ── Main ────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile top nav */}
                <div className="flex md:hidden items-center gap-2 px-4 py-3 overflow-x-auto border-b sticky top-0 z-20"
                    style={{
                        background: isApple ? (isDark ? "rgba(18,18,22,0.88)" : "rgba(246,246,252,0.88)") : palette.background,
                        backdropFilter: isApple ? "blur(20px)" : "none",
                        borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"
                    }}>
                    {navItems.map(({ key, label, icon }) => (
                        <motion.button
                            key={key}
                            onClick={() => setTab(key)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap"
                            style={{
                                background: tab === key ? palette.accent : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                                color: tab === key ? "#fff" : palette.textSecondary
                            }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {icon}{label}
                        </motion.button>
                    ))}
                </div>

                <div className="flex-1 p-4 md:p-8 max-w-5xl w-full mx-auto">
                    <AnimatePresence mode="wait">
                        {/* ══ OVERVIEW ══════════════════════════════ */}
                        {tab === "overview" && (
                            <motion.div key="overview" className="flex flex-col gap-6"
                                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                                transition={{ duration: 0.25 }}>

                                {/* Hero banner */}
                                <div className="relative overflow-hidden rounded-2xl p-6 md:p-8"
                                    style={{
                                        background: `linear-gradient(135deg, ${palette.accent}22, ${palette.accent}08)`,
                                        border: `1px solid ${palette.accent}30`
                                    }}>
                                    <div className="flex items-start justify-between flex-wrap gap-4">
                                        <div className="flex items-center gap-4">
                                            {user.image ? (
                                                <img src={user.image} alt={user.name}
                                                    className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover ring-2"
                                                    style={{ '--ring-color': palette.accent + "50" } as any} />
                                            ) : (
                                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-3xl font-bold"
                                                    style={{ background: `linear-gradient(135deg, ${palette.accent}, ${palette.accent}88)`, color: "#fff" }}>
                                                    {avatarLetter}
                                                </div>
                                            )}
                                            <div>
                                                <h1 className="text-2xl md:text-3xl font-bold" style={{ color: palette.textPrimary }}>
                                                    Welcome back, {user.name?.split(" ")[0] || "there"}!
                                                </h1>
                                                <p className="mt-0.5" style={{ color: palette.textSecondary }}>{user.email}</p>
                                                {(user as any)?.username && (
                                                    <p className="text-sm mt-1" style={{ color: palette.accent }}>@{(user as any).username}</p>
                                                )}
                                            </div>
                                        </div>
                                        <Link href="/blogs/new">
                                            <motion.button className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
                                                style={{ background: palette.accent, color: "#fff" }}
                                                whileTap={{ scale: 0.95 }}>
                                                <AddIcon style={{ fontSize: 18 }} /> Write Blog
                                            </motion.button>
                                        </Link>
                                    </div>
                                </div>

                                {/* Stats grid */}
                                {blogsLoading ? (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className="h-24 rounded-2xl animate-pulse"
                                                style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { label: "Total Posts", value: blogStats.total, icon: <ArticleIcon style={{ fontSize: 22 }} />, color: palette.accent },
                                            { label: "Published", value: blogStats.published, icon: <CheckCircleIcon style={{ fontSize: 22 }} />, color: "#22c55e" },
                                            { label: "Total Views", value: blogStats.totalViews, icon: <VisibilityIcon style={{ fontSize: 22 }} />, color: "#818cf8" },
                                            { label: "Total Likes", value: blogStats.totalLikes, icon: <FavoriteIcon style={{ fontSize: 22 }} />, color: "#f43f5e" }
                                        ].map(({ label, value, icon, color }) => (
                                            <motion.div key={label} className="p-4 flex flex-col gap-3" style={card}
                                                whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300 }}>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-medium" style={{ color: palette.textSecondary }}>{label}</span>
                                                    <div className="p-1.5 rounded-lg" style={{ background: color + "18", color }}>{icon}</div>
                                                </div>
                                                <div className="text-3xl font-bold" style={{ color: palette.textPrimary }}>{value.toLocaleString()}</div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}

                                {/* Status breakdown */}
                                {!blogsLoading && blogs.length > 0 && (
                                    <div style={card} className="p-5">
                                        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: palette.textPrimary }}>
                                            <BarChartIcon style={{ fontSize: 16, color: palette.accent }} /> Blog Status Breakdown
                                        </h3>
                                        <div className="flex flex-col gap-2">
                                            {[
                                                { key: "published", label: "Published", count: blogStats.published, color: "#22c55e" },
                                                { key: "draft", label: "Drafts", count: blogStats.draft, color: "#94a3b8" },
                                                { key: "pending_review", label: "Pending Review", count: blogStats.pending, color: "#f59e0b" },
                                                { key: "rejected", label: "Rejected", count: blogStats.rejected, color: "#ef4444" }
                                            ].filter((s) => s.count > 0).map(({ label, count, color }) => (
                                                <div key={label} className="flex items-center gap-3">
                                                    <span className="text-xs w-28 shrink-0" style={{ color: palette.textSecondary }}>{label}</span>
                                                    <div className="flex-1 h-2 rounded-full overflow-hidden"
                                                        style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }}>
                                                        <motion.div className="h-full rounded-full"
                                                            style={{ background: color, width: `${(count / blogStats.total) * 100}%` }}
                                                            initial={{ width: 0 }} animate={{ width: `${(count / blogStats.total) * 100}%` }}
                                                            transition={{ duration: 0.8, delay: 0.1 }} />
                                                    </div>
                                                    <span className="text-xs font-semibold w-5 text-right" style={{ color }}>{count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Recent blogs */}
                                <div style={card} className="p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: palette.textPrimary }}>
                                            <ArticleIcon style={{ fontSize: 16, color: palette.accent }} /> Recent Posts
                                        </h3>
                                        <button onClick={() => setTab("blogs")}
                                            className="text-xs font-medium" style={{ color: palette.accent }}>
                                            View all →
                                        </button>
                                    </div>
                                    {blogsLoading ? (
                                        <div className="space-y-3">
                                            {Array.from({ length: 3 }).map((_, i) => (
                                                <div key={i} className="h-14 rounded-xl animate-pulse"
                                                    style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }} />
                                            ))}
                                        </div>
                                    ) : blogs.length === 0 ? (
                                        <div className="py-8 text-center">
                                            <ArticleIcon style={{ fontSize: 36, color: palette.textSecondary, opacity: 0.3 }} />
                                            <p className="mt-2 text-sm" style={{ color: palette.textSecondary }}>No blog posts yet.</p>
                                            <Link href="/blogs/new">
                                                <button className="mt-3 px-4 py-2 rounded-xl text-sm font-medium"
                                                    style={{ background: palette.accent, color: "#fff" }}>
                                                    Write Your First Post
                                                </button>
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col divide-y" style={{ '--divide-color': isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" } as any}>
                                            {blogs.slice(0, 5).map((blog) => {
                                                const sc = STATUS_CFG[blog.status] || { label: blog.status, color: "#94a3b8" };
                                                return (
                                                    <div key={blog._id} className="flex items-center gap-3 py-3">
                                                        <div className="flex-1 min-w-0">
                                                            <Link href={`/blogs/${blog.slug}`}
                                                                className="text-sm font-medium line-clamp-1 hover:underline"
                                                                style={{ color: palette.textPrimary }}>
                                                                {blog.title}
                                                            </Link>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                                                                    style={{ background: sc.color + "18", color: sc.color }}>
                                                                    {sc.label}
                                                                </span>
                                                                {blog.views != null && (
                                                                    <span className="text-xs flex items-center gap-0.5" style={{ color: palette.textSecondary }}>
                                                                        <VisibilityIcon style={{ fontSize: 11 }} />{blog.views}
                                                                    </span>
                                                                )}
                                                                <span className="text-xs" style={{ color: palette.textSecondary }}>
                                                                    {fmtDate(blog.publishedAt || blog.createdAt)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <Link href={`/blogs/${blog.slug}/edit`}>
                                                            <motion.button className="p-1.5 rounded-lg"
                                                                style={{ color: palette.textSecondary }}
                                                                whileTap={{ scale: 0.9 }}>
                                                                <EditIcon style={{ fontSize: 15 }} />
                                                            </motion.button>
                                                        </Link>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Quick actions */}
                                <div>
                                    <h3 className="text-sm font-semibold mb-3" style={{ color: palette.textSecondary }}>QUICK ACTIONS</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {[
                                            { label: "Write Blog", icon: <AddIcon />, href: "/blogs/new", color: palette.accent },
                                            { label: "Edit Profile", icon: <PersonIcon />, href: "/settings/profile", color: "#818cf8" },
                                            { label: "Security", icon: <LockIcon />, href: "/settings/security", color: "#f59e0b" },
                                            { label: "Linked Accounts", icon: <LinkIcon />, href: "/settings/linked-accounts", color: "#22c55e" }
                                        ].map(({ label, icon, href, color }) => (
                                            <Link key={label} href={href}>
                                                <motion.div className="flex flex-col items-center gap-2 p-4 rounded-2xl cursor-pointer text-center"
                                                    style={card}
                                                    whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}
                                                    transition={{ type: "spring", stiffness: 300 }}>
                                                    <div className="p-2.5 rounded-xl" style={{ background: color + "18", color }}>
                                                        {React.cloneElement(icon, { style: { fontSize: 22, color } })}
                                                    </div>
                                                    <span className="text-xs font-medium" style={{ color: palette.textPrimary }}>{label}</span>
                                                </motion.div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ══ MY BLOGS ══════════════════════════════ */}
                        {tab === "blogs" && (
                            <motion.div key="blogs" className="flex flex-col gap-5"
                                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                                transition={{ duration: 0.25 }}>

                                <div className="flex items-center justify-between flex-wrap gap-3">
                                    <div>
                                        <h2 className="text-2xl font-bold" style={{ color: palette.textPrimary }}>My Blog Posts</h2>
                                        <p className="text-sm mt-0.5" style={{ color: palette.textSecondary }}>
                                            {blogStats.total} posts · {blogStats.published} published
                                        </p>
                                    </div>
                                    <Link href="/blogs/new">
                                        <motion.button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                                            style={{ background: palette.accent, color: "#fff" }}
                                            whileTap={{ scale: 0.95 }}>
                                            <AddIcon style={{ fontSize: 16 }} /> New Post
                                        </motion.button>
                                    </Link>
                                </div>

                                {/* Filter tabs */}
                                <div className="flex gap-1.5 flex-wrap">
                                    {BLOG_FILTERS.map((f) => {
                                        const count = f === "all" ? blogs.length : blogs.filter((b) => b.status === f).length;
                                        const color = f === "all" ? palette.accent : STATUS_CFG[f]?.color;
                                        return (
                                            <motion.button key={f}
                                                onClick={() => setBlogFilter(f)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                                                style={{
                                                    background: blogFilter === f ? color : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                                                    color: blogFilter === f ? "#fff" : palette.textSecondary,
                                                    border: `1px solid ${blogFilter === f ? "transparent" : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"}`
                                                }}
                                                whileTap={{ scale: 0.95 }}>
                                                {f === "all" ? "All" : STATUS_CFG[f]?.label}
                                                {count > 0 && <span>{count}</span>}
                                            </motion.button>
                                        );
                                    })}
                                </div>

                                {/* Blog list */}
                                {blogsLoading ? (
                                    <div className="flex flex-col gap-3">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <div key={i} className="h-20 rounded-2xl animate-pulse"
                                                style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }} />
                                        ))}
                                    </div>
                                ) : filteredBlogs.length === 0 ? (
                                    <div className="py-16 text-center rounded-2xl" style={card}>
                                        <ArticleIcon style={{ fontSize: 48, color: palette.textSecondary, opacity: 0.3 }} />
                                        <p className="mt-3 text-sm" style={{ color: palette.textSecondary }}>No posts in this category.</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {filteredBlogs.map((blog) => {
                                            const sc = STATUS_CFG[blog.status] || { label: blog.status, color: "#94a3b8" };
                                            return (
                                                <motion.div key={blog._id} className="flex items-center gap-4 p-4"
                                                    style={card}
                                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                                    whileHover={{ y: -1 }}
                                                    transition={{ type: "spring", stiffness: 300 }}>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <Link href={`/blogs/${blog.slug}`}
                                                                className="text-sm font-semibold hover:underline line-clamp-1"
                                                                style={{ color: palette.textPrimary }}>
                                                                {blog.title}
                                                            </Link>
                                                            <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                                                                style={{ background: sc.color + "18", color: sc.color }}>
                                                                {sc.label}
                                                            </span>
                                                        </div>
                                                        {blog.excerpt && (
                                                            <p className="text-xs mt-1 line-clamp-1" style={{ color: palette.textSecondary }}>{blog.excerpt}</p>
                                                        )}
                                                        <div className="flex items-center gap-3 mt-1.5">
                                                            {blog.category && (
                                                                <span className="text-xs capitalize" style={{ color: palette.textSecondary }}>{blog.category}</span>
                                                            )}
                                                            {blog.readTime != null && (
                                                                <span className="text-xs flex items-center gap-0.5" style={{ color: palette.textSecondary }}>
                                                                    <AccessTimeIcon style={{ fontSize: 11 }} />{blog.readTime}m
                                                                </span>
                                                            )}
                                                            {blog.views != null && (
                                                                <span className="text-xs flex items-center gap-0.5" style={{ color: palette.textSecondary }}>
                                                                    <VisibilityIcon style={{ fontSize: 11 }} />{blog.views}
                                                                </span>
                                                            )}
                                                            {blog.likes != null && (
                                                                <span className="text-xs flex items-center gap-0.5" style={{ color: "#f43f5e" }}>
                                                                    <FavoriteIcon style={{ fontSize: 11 }} />{blog.likes}
                                                                </span>
                                                            )}
                                                            <span className="text-xs" style={{ color: palette.textSecondary }}>
                                                                {fmtDate(blog.publishedAt || blog.createdAt)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {blog.status === "draft" && (
                                                            <motion.button
                                                                onClick={async () => {
                                                                    await fetch(`/api/blogs?id=${blog._id}&action=submit`, { method: "PATCH" });
                                                                    fetchBlogs();
                                                                }}
                                                                className="px-2.5 py-1.5 rounded-lg text-xs font-medium"
                                                                style={{ background: "#f59e0b18", color: "#f59e0b" }}
                                                                whileTap={{ scale: 0.95 }}>
                                                                <PendingIcon style={{ fontSize: 13 }} /> Submit
                                                            </motion.button>
                                                        )}
                                                        <Link href={`/blogs/${blog.slug}/edit`}>
                                                            <motion.button className="p-2 rounded-xl"
                                                                style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", color: palette.textSecondary }}
                                                                whileTap={{ scale: 0.9 }}>
                                                                <EditIcon style={{ fontSize: 15 }} />
                                                            </motion.button>
                                                        </Link>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* ══ SESSIONS ══════════════════════════════ */}
                        {tab === "sessions" && (
                            <motion.div key="sessions" className="flex flex-col gap-5"
                                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                                transition={{ duration: 0.25 }}>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold" style={{ color: palette.textPrimary }}>Active Sessions</h2>
                                        <p className="text-sm mt-0.5" style={{ color: palette.textSecondary }}>Manage all devices signed into your account</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <motion.button onClick={fetchSessions}
                                            className="p-2 rounded-xl"
                                            style={{ ...card, borderRadius: 12, color: palette.textSecondary }}
                                            whileTap={{ scale: 0.95 }}>
                                            <RefreshIcon style={{ fontSize: 18 }} />
                                        </motion.button>
                                        <motion.button
                                            onClick={async () => {
                                                await authClient.revokeOtherSessions();
                                                fetchSessions();
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium"
                                            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
                                            whileTap={{ scale: 0.95 }}>
                                            <BlockIcon style={{ fontSize: 15 }} /> Revoke Others
                                        </motion.button>
                                    </div>
                                </div>

                                {sessionsLoading ? (
                                    <div className="flex flex-col gap-3">
                                        {Array.from({ length: 3 }).map((_, i) => (
                                            <div key={i} className="h-20 rounded-2xl animate-pulse"
                                                style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }} />
                                        ))}
                                    </div>
                                ) : sessions.length === 0 ? (
                                    <div className="py-16 text-center rounded-2xl" style={card}>
                                        <DevicesIcon style={{ fontSize: 48, color: palette.textSecondary, opacity: 0.3 }} />
                                        <p className="mt-3 text-sm" style={{ color: palette.textSecondary }}>No active sessions found.</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {sessions.map((s: any) => {
                                            const isCurrent = s.id === session.data?.session?.id;
                                            const expiresAt = s.expiresAt ? new Date(s.expiresAt) : null;
                                            const isExpired = expiresAt ? expiresAt < new Date() : false;
                                            return (
                                                <motion.div key={s.token || s.id}
                                                    className="flex items-center gap-4 p-4"
                                                    style={{ ...card, opacity: isExpired ? 0.5 : 1 }}
                                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: isExpired ? 0.5 : 1, y: 0 }}>
                                                    <div className="p-2.5 rounded-xl"
                                                        style={{
                                                            background: isCurrent ? palette.accent + "18" : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                                                            color: isCurrent ? palette.accent : palette.textSecondary
                                                        }}>
                                                        {ua2Icon(s.userAgent)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium" style={{ color: palette.textPrimary }}>
                                                                {s.userAgent?.split(")")[0]?.replace("(", "").split(";")[0] || "Unknown Device"}
                                                            </span>
                                                            {isCurrent && (
                                                                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                                                    style={{ background: palette.accent + "18", color: palette.accent }}>
                                                                    Current
                                                                </span>
                                                            )}
                                                            {isExpired && (
                                                                <span className="text-xs px-2 py-0.5 rounded-full"
                                                                    style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                                                                    Expired
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs mt-0.5" style={{ color: palette.textSecondary }}>
                                                            Created: {fmtDate(s.createdAt)} ·{" "}
                                                            {expiresAt ? `Expires: ${fmtDate(s.expiresAt)}` : ""}
                                                            {s.ipAddress && ` · ${s.ipAddress}`}
                                                        </p>
                                                    </div>
                                                    {!isCurrent && (
                                                        <motion.button
                                                            onClick={() => handleRevokeSession(s.token)}
                                                            disabled={revokingId === s.token}
                                                            className="p-2 rounded-xl"
                                                            style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}
                                                            whileTap={{ scale: 0.9 }}>
                                                            <DeleteOutlineIcon style={{ fontSize: 16 }} />
                                                        </motion.button>
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* ══ SETTINGS ══════════════════════════════ */}
                        {tab === "settings" && (
                            <motion.div key="settings" className="flex flex-col gap-5"
                                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                                transition={{ duration: 0.25 }}>

                                <div>
                                    <h2 className="text-2xl font-bold" style={{ color: palette.textPrimary }}>Account Settings</h2>
                                    <p className="text-sm mt-0.5" style={{ color: palette.textSecondary }}>Manage your profile, security, and preferences</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                        {
                                            href: "/settings/profile",
                                            icon: <PersonIcon style={{ fontSize: 24 }} />,
                                            label: "Profile",
                                            description: "Update your name, username, and avatar",
                                            color: palette.accent
                                        },
                                        {
                                            href: "/settings/security",
                                            icon: <ShieldIcon style={{ fontSize: 24 }} />,
                                            label: "Security",
                                            description: "Password, two-factor auth, passkeys",
                                            color: "#f59e0b"
                                        },
                                        {
                                            href: "/settings/linked-accounts",
                                            icon: <LinkIcon style={{ fontSize: 24 }} />,
                                            label: "Linked Accounts",
                                            description: "Google, GitHub, and other OAuth connections",
                                            color: "#22c55e"
                                        },
                                        {
                                            href: "/blogs?mine=true",
                                            icon: <ArticleIcon style={{ fontSize: 24 }} />,
                                            label: "My Blogs",
                                            description: "View and manage all your blog posts",
                                            color: "#818cf8"
                                        }
                                    ].map(({ href, icon, label, description, color }) => (
                                        <Link key={label} href={href}>
                                            <motion.div className="flex items-center gap-4 p-5 cursor-pointer"
                                                style={card}
                                                whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                                                transition={{ type: "spring", stiffness: 300 }}>
                                                <div className="p-3 rounded-2xl shrink-0"
                                                    style={{ background: color + "18", color }}>
                                                    {icon}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold" style={{ color: palette.textPrimary }}>{label}</div>
                                                    <div className="text-xs mt-0.5" style={{ color: palette.textSecondary }}>{description}</div>
                                                </div>
                                                <div className="ml-auto" style={{ color: palette.textSecondary }}>→</div>
                                            </motion.div>
                                        </Link>
                                    ))}
                                </div>

                                {/* Danger zone */}
                                <div className="p-5 rounded-2xl"
                                    style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                                    <h3 className="text-sm font-semibold mb-3" style={{ color: "#ef4444" }}>Danger Zone</h3>
                                    <motion.button
                                        onClick={handleSignOut}
                                        disabled={signingOut}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                                        style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
                                        whileTap={{ scale: 0.95 }}>
                                        <LogoutIcon style={{ fontSize: 16 }} />
                                        {signingOut ? "Signing out…" : "Sign Out"}
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
