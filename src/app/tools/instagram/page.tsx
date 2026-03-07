/**
 * Instagram Export Analyser — /tools/instagram
 * 100 % client-side. Drop your Instagram data ZIP (or the individual JSONs)
 * and explore: who doesn't follow you back, close friends, follow request
 * history, recently-unfollowed, and blocked accounts — all with live
 * search + RegExp filtering.
 */

"use client";

import React, {
    useState,
    useCallback,
    useMemo,
    useRef,
    useEffect,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import JSZip from "jszip";
import { useDesignTheme } from "@Hooks";
import { useToolDefaults } from "@Hooks";
import { LiquidGlassCard } from "@Components/Atoms/LiquidGlass";
import { OneUICard } from "@Components/Atoms/OneUI";
import ToolPageWrapper from "@Components/Organisms/Tools/ToolPageWrapper";
import {
    Instagram,
    Upload,
    Search,
    PersonRemove,
    StarBorder,
    PersonAddAlt1,
    History,
    PersonOff,
    Block,
    OpenInNew,
    ContentCopy,
    Check,
    FilterList,
    Download,
    Close,
    FolderZip,
    CheckCircle,
    HourglassEmpty,
    ExpandMore,
    ExpandLess,
} from "@mui/icons-material";

// ─── Types ────────────────────────────────────────────────────────────────────

interface IGProfile {
    username: string;
    href: string;
    timestamp: number;
}

interface ParsedData {
    followers: IGProfile[];
    following: IGProfile[];
    closeFriends: IGProfile[];
    pendingRequests: IGProfile[];
    requestHistory: IGProfile[];
    recentlyUnfollowed: IGProfile[];
    blocked: IGProfile[];
}

type TabId =
    | "not-following-back"
    | "close-friends"
    | "pending-requests"
    | "request-history"
    | "recently-unfollowed"
    | "blocked";

interface TabDef {
    id: TabId;
    label: string;
    icon: React.ReactNode;
    color: string;
    description: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extract a username + href + timestamp from either followers or following format */
function extractProfiles(entries: any[]): IGProfile[] {
    const profiles: IGProfile[] = [];
    for (const entry of entries) {
        try {
            const sld = Array.isArray(entry.string_list_data) ? entry.string_list_data : [];
            if (sld.length === 0) continue;
            const first = sld[0];
            const username: string =
                (entry.title && entry.title.trim())
                    ? entry.title.trim()
                    : (first.value ?? first.href?.split("/").filter(Boolean).pop() ?? "");
            const href: string = first.href ?? `https://www.instagram.com/${username}`;
            const timestamp: number = first.timestamp ?? 0;
            if (username) profiles.push({ username, href, timestamp });
        } catch {
            /* skip malformed entry */
        }
    }
    return profiles;
}

/** Try to parse one JSON file and populate the data bucket */
function applyFile(filename: string, json: any, bucket: Partial<ParsedData>) {
    const lc = filename.toLowerCase();

    // followers_1.json, followers_2.json … — top-level array
    if (/followers[_\d]*.json/.test(lc) && Array.isArray(json)) {
        bucket.followers = [...(bucket.followers ?? []), ...extractProfiles(json)];
        return;
    }
    // following.json
    if (lc.includes("following.json") && json?.relationships_following) {
        bucket.following = extractProfiles(json.relationships_following);
        return;
    }
    // close_friends.json
    if (json?.relationships_close_friends) {
        bucket.closeFriends = extractProfiles(json.relationships_close_friends);
        return;
    }
    // pending_follow_requests.json
    if (json?.relationships_follow_requests_sent) {
        bucket.pendingRequests = extractProfiles(json.relationships_follow_requests_sent);
        return;
    }
    // recent_follow_requests.json / permanent follow requests
    if (json?.relationships_permanent_follow_requests) {
        bucket.requestHistory = extractProfiles(json.relationships_permanent_follow_requests);
        return;
    }
    // recently_unfollowed_profiles.json
    if (json?.relationships_unfollowed_users) {
        bucket.recentlyUnfollowed = extractProfiles(json.relationships_unfollowed_users);
        return;
    }
    // blocked_profiles.json
    if (json?.relationships_blocked_users) {
        bucket.blocked = extractProfiles(json.relationships_blocked_users);
        return;
    }
}

function buildData(raw: Partial<ParsedData>): ParsedData {
    return {
        followers: raw.followers ?? [],
        following: raw.following ?? [],
        closeFriends: raw.closeFriends ?? [],
        pendingRequests: raw.pendingRequests ?? [],
        requestHistory: raw.requestHistory ?? [],
        recentlyUnfollowed: raw.recentlyUnfollowed ?? [],
        blocked: raw.blocked ?? [],
    };
}

function formatDate(ts: number): string {
    if (!ts) return "—";
    try {
        return new Intl.DateTimeFormat("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }).format(new Date(ts * 1000));
    } catch {
        return "—";
    }
}

function exportCSV(profiles: IGProfile[], filename: string) {
    const rows = [
        ["Username", "Profile URL", "Date"],
        ...profiles.map((p) => [
            p.username,
            p.href,
            formatDate(p.timestamp),
        ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS: TabDef[] = [
    {
        id: "not-following-back",
        label: "Not Following Back",
        icon: <PersonRemove fontSize="small" />,
        color: "#FF3B30",
        description: "Accounts you follow that don't follow you back",
    },
    {
        id: "close-friends",
        label: "Close Friends",
        icon: <StarBorder fontSize="small" />,
        color: "#FFD60A",
        description: "People on your Close Friends list",
    },
    {
        id: "pending-requests",
        label: "Pending Requests",
        icon: <HourglassEmpty fontSize="small" />,
        color: "#FF9500",
        description: "Follow requests you've sent that are still pending",
    },
    {
        id: "request-history",
        label: "Request History",
        icon: <History fontSize="small" />,
        color: "#AF52DE",
        description: "All follow requests you've ever sent",
    },
    {
        id: "recently-unfollowed",
        label: "Recently Unfollowed",
        icon: <PersonOff fontSize="small" />,
        color: "#5AC8FA",
        description: "Accounts you've recently unfollowed",
    },
    {
        id: "blocked",
        label: "Blocked",
        icon: <Block fontSize="small" />,
        color: "#FF2D55",
        description: "Accounts you've blocked",
    },
];

// ─── Profile Row ──────────────────────────────────────────────────────────────

const ProfileRow: React.FC<{
    profile: IGProfile;
    accent: string;
    index: number;
    palette: any;
    isDark: boolean;
    isApple: boolean;
    showDates: boolean;
}> = ({ profile, accent, index, palette, isDark, isApple, showDates }) => {
    const [copied, setCopied] = useState(false);

    const copyUsername = () => {
        navigator.clipboard.writeText(profile.username).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };

    const rowBg = isApple
        ? isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.025)"
        : isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)";

    return (
        <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.4) }}
            className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl group"
            style={{ background: rowBg }}
        >
            {/* Avatar placeholder */}
            <div
                className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold select-none"
                style={{ background: `${accent}20`, color: accent }}
            >
                {profile.username.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p
                    className="text-sm font-semibold truncate"
                    style={{ color: palette.textPrimary }}
                >
                    @{profile.username}
                </p>
                {profile.timestamp > 0 && showDates && (
                    <p className="text-xs" style={{ color: palette.textTertiary }}>
                        {formatDate(profile.timestamp)}
                    </p>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={copyUsername}
                    title="Copy username"
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: palette.textSecondary }}
                >
                    {copied ? (
                        <Check sx={{ fontSize: 15 }} style={{ color: "#34C759" }} />
                    ) : (
                        <ContentCopy sx={{ fontSize: 15 }} />
                    )}
                </button>
                <a
                    href={profile.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open Instagram profile"
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: palette.textSecondary }}
                >
                    <OpenInNew sx={{ fontSize: 15 }} />
                </a>
            </div>
        </motion.div>
    );
};

const LIST_HEIGHT: Record<string, string> = {
    compact: "360px",
    normal:  "580px",
    tall:    "800px",
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ACCENT = "#E1306C"; // Instagram brand pink

export default function InstagramAnalyserPage() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";
    const Card = isApple ? LiquidGlassCard : (OneUICard as any);

    const { defaults: adminDefaults } = useToolDefaults();
    const igDefaults = adminDefaults.instagram;

    // ── State ────────────────────────────────────────────────────────────────
    const [data, setData] = useState<ParsedData | null>(null);
    const [activeTab, setActiveTab] = useState<TabId>((igDefaults?.defaultTab as TabId) ?? "not-following-back");
    const [searchQuery, setSearchQuery] = useState("");
    const [useRegExp, setUseRegExp] = useState(igDefaults?.useRegExpByDefault ?? false);
    const [regexpError, setRegexpError] = useState("");
    const [loading, setLoading] = useState(false);
    const [parseError, setParseError] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const [copiedAll, setCopiedAll] = useState(false);
    const [expandedStats, setExpandedStats] = useState(false);

    const dropRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Parse ZIP ────────────────────────────────────────────────────────────
    const processZip = useCallback(async (file: File) => {
        setLoading(true);
        setParseError("");
        try {
            const zip = await JSZip.loadAsync(file);
            const bucket: Partial<ParsedData> = {};

            const jsonFiles = Object.entries(zip.files).filter(
                ([name, f]) => !f.dir && name.toLowerCase().endsWith(".json")
            );

            await Promise.all(
                jsonFiles.map(async ([name, f]) => {
                    try {
                        const text = await f.async("text");
                        const json = JSON.parse(text);
                        const basename = name.split("/").pop() ?? name;
                        applyFile(basename, json, bucket);
                    } catch {
                        /* skip unreadable files */
                    }
                })
            );

            if (!bucket.following && !bucket.followers) {
                setParseError(
                    "No Instagram data found in this ZIP. Make sure you're uploading the official Instagram data export."
                );
                setLoading(false);
                return;
            }
            setData(buildData(bucket));
        } catch {
            setParseError("Failed to read the ZIP file. Please check the file is valid.");
        } finally {
            setLoading(false);
        }
    }, []);

    /** Also accept loose JSON files dropped together */
    const processJsonFiles = useCallback(async (files: FileList | File[]) => {
        setLoading(true);
        setParseError("");
        try {
            const bucket: Partial<ParsedData> = {};
            await Promise.all(
                Array.from(files).map(async (file) => {
                    try {
                        const text = await file.text();
                        const json = JSON.parse(text);
                        applyFile(file.name, json, bucket);
                    } catch {
                        /* skip */
                    }
                })
            );
            if (!bucket.following && !bucket.followers) {
                setParseError("No recognised Instagram JSON files found. Please upload files from the export's followers_and_following folder.");
                setLoading(false);
                return;
            }
            setData(buildData(bucket));
        } catch {
            setParseError("Failed to read the files.");
        } finally {
            setLoading(false);
        }
    }, []);

    const handleFiles = useCallback(
        (files: FileList | File[]) => {
            const arr = Array.from(files);
            if (arr.length === 1 && arr[0].name.toLowerCase().endsWith(".zip")) {
                processZip(arr[0]);
            } else {
                processJsonFiles(arr);
            }
        },
        [processZip, processJsonFiles]
    );

    // ── Drag & drop ──────────────────────────────────────────────────────────
    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);
    const onDragLeave = useCallback(() => setIsDragging(false), []);
    const onDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
        },
        [handleFiles]
    );

    // ── Derived list for active tab ───────────────────────────────────────────
    const rawList = useMemo((): IGProfile[] => {
        if (!data) return [];
        const followerSet = new Set(data.followers.map((f) => f.username.toLowerCase()));
        switch (activeTab) {
            case "not-following-back":
                return data.following.filter((f) => !followerSet.has(f.username.toLowerCase()));
            case "close-friends":
                return data.closeFriends;
            case "pending-requests":
                return data.pendingRequests;
            case "request-history":
                return data.requestHistory;
            case "recently-unfollowed":
                return data.recentlyUnfollowed;
            case "blocked":
                return data.blocked;
            default:
                return [];
        }
    }, [data, activeTab]);

    // ── Filter (search / regexp) ───────────────────────────────────────────
    const filteredList = useMemo((): IGProfile[] => {
        if (!searchQuery.trim()) return rawList;
        if (useRegExp) {
            try {
                const re = new RegExp(searchQuery, "i");
                setRegexpError("");
                return rawList.filter((p) => re.test(p.username));
            } catch (e: any) {
                setRegexpError(e.message ?? "Invalid RegExp");
                return rawList;
            }
        }
        setRegexpError("");
        const q = searchQuery.toLowerCase();
        return rawList.filter((p) => p.username.toLowerCase().includes(q));
    }, [rawList, searchQuery, useRegExp]);

    // Sync regexp error clearing
    useEffect(() => {
        if (!useRegExp) setRegexpError("");
    }, [useRegExp]);

    // Apply admin defaults once they load (only before data is loaded)
    useEffect(() => {
        if (!data && igDefaults) {
            if (igDefaults.defaultTab) setActiveTab(igDefaults.defaultTab as TabId);
            if (igDefaults.useRegExpByDefault !== undefined) setUseRegExp(igDefaults.useRegExpByDefault);
        }
    }, [igDefaults]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Copy all usernames ────────────────────────────────────────────────
    const copyAllUsernames = () => {
        const text = filteredList.map((p) => `@${p.username}`).join("\n");
        navigator.clipboard.writeText(text).catch(() => {});
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 2000);
    };

    // ── Active tab meta ───────────────────────────────────────────────────
    const activeTabDef = TABS.find((t) => t.id === activeTab)!;

    // ── Tab count helper ──────────────────────────────────────────────────
    const tabCount = useCallback(
        (tabId: TabId): number => {
            if (!data) return 0;
            const followerSet = new Set(data.followers.map((f) => f.username.toLowerCase()));
            switch (tabId) {
                case "not-following-back":
                    return data.following.filter((f) => !followerSet.has(f.username.toLowerCase())).length;
                case "close-friends": return data.closeFriends.length;
                case "pending-requests": return data.pendingRequests.length;
                case "request-history": return data.requestHistory.length;
                case "recently-unfollowed": return data.recentlyUnfollowed.length;
                case "blocked": return data.blocked.length;
            }
        },
        [data]
    );

    // ── Styles ────────────────────────────────────────────────────────────
    const border = `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`;
    const cardBg = isApple
        ? isDark ? "rgba(28,28,32,0.80)" : "rgba(255,255,255,0.80)"
        : isDark ? "rgba(24,24,28,0.98)" : "#fff";

    const inputStyle: React.CSSProperties = {
        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
        border,
        borderRadius: isApple ? 12 : 16,
        color: palette.textPrimary,
        outline: "none",
        padding: "8px 12px",
        fontSize: 14,
        width: "100%",
    };

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <ToolPageWrapper
            title="Instagram Analyser"
            description="Analyse your Instagram export — who doesn't follow back, close friends, follow request history and more."
            icon={<Instagram />}
            accentColor={ACCENT}
        >
            {/* ── Upload zone (shown until data is loaded) ── */}
            {!data && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <Card>
                        <div
                            ref={dropRef}
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                            className="flex flex-col items-center justify-center text-center cursor-pointer select-none"
                            style={{
                                minHeight: 300,
                                border: `2px dashed ${isDragging ? ACCENT : isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`,
                                borderRadius: isApple ? 20 : 24,
                                background: isDragging
                                    ? `${ACCENT}10`
                                    : isApple
                                    ? isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"
                                    : "transparent",
                                transition: "all 0.2s ease",
                                padding: 40,
                            }}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <motion.div
                                animate={isDragging ? { scale: 1.15 } : { scale: 1 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            >
                                <FolderZip
                                    sx={{ fontSize: 64, color: ACCENT, opacity: isDragging ? 1 : 0.7 }}
                                />
                            </motion.div>
                            <h3
                                className="text-xl font-bold mt-4 mb-2"
                                style={{ color: palette.textPrimary }}
                            >
                                Drop your Instagram export here
                            </h3>
                            <p
                                className="text-sm max-w-xs"
                                style={{ color: palette.textSecondary }}
                            >
                                Upload the <strong>.zip</strong> file from
                                &ldquo;Download your information&rdquo;, or drop the
                                individual <strong>.json</strong> files from the{" "}
                                <code className="text-xs px-1 py-0.5 rounded" style={{ background: `${ACCENT}20`, color: ACCENT }}>
                                    followers_and_following
                                </code>{" "}
                                folder all at once.
                            </p>
                            <div
                                className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"
                                style={{
                                    background: ACCENT,
                                    color: "#fff",
                                    boxShadow: `0 4px 14px ${ACCENT}50`,
                                }}
                            >
                                <Upload sx={{ fontSize: 18 }} />
                                Choose File
                            </div>
                            <p className="text-xs mt-3" style={{ color: palette.textTertiary }}>
                                Everything is processed entirely in your browser — no data is uploaded.
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".zip,.json"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        handleFiles(e.target.files);
                                    }
                                }}
                            />
                        </div>

                        {/* How to export guide */}
                        <div className="mt-6 p-4 rounded-xl" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border }}>
                            <p className="text-xs font-semibold mb-2" style={{ color: palette.textSecondary }}>
                                How to get your Instagram data export:
                            </p>
                            <ol className="text-xs space-y-1" style={{ color: palette.textTertiary }}>
                                <li>1. Go to Instagram → Settings → Your activity → Download your information</li>
                                <li>2. Select <strong>JSON</strong> as the format and choose &ldquo;Some of your information&rdquo;</li>
                                <li>3. Tick <em>Connections</em> → Request download</li>
                                <li>4. Download the ZIP when Instagram emails you the link</li>
                            </ol>
                        </div>
                    </Card>

                    {/* Loading */}
                    <AnimatePresence>
                        {loading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center justify-center gap-3 mt-6"
                                style={{ color: palette.textSecondary }}
                            >
                                <motion.div
                                    className="w-5 h-5 border-2 rounded-full"
                                    style={{ borderColor: `${ACCENT} transparent ${ACCENT} transparent` }}
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
                                />
                                <span className="text-sm">Parsing export…</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Parse error */}
                    <AnimatePresence>
                        {parseError && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mt-4 p-4 rounded-xl text-sm"
                                style={{ background: "#FF3B3020", color: "#FF3B30", border: "1px solid #FF3B3040" }}
                            >
                                {parseError}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* ── Dashboard (shown once data is loaded) ── */}
            {data && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.35 }}
                    className="space-y-5"
                >
                    {/* ── Top bar: summary + reset ── */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <button
                            onClick={() => setExpandedStats((s) => !s)}
                            className="flex items-center gap-2 text-sm font-semibold"
                            style={{ color: palette.textPrimary }}
                        >
                            <CheckCircle sx={{ fontSize: 18, color: "#34C759" }} />
                            Export loaded — {data.following.length} following · {data.followers.length} followers
                            {expandedStats ? <ExpandLess sx={{ fontSize: 17 }} /> : <ExpandMore sx={{ fontSize: 17 }} />}
                        </button>
                        <button
                            onClick={() => {
                                setData(null);
                                setSearchQuery("");
                                setParseError("");
                                setActiveTab("not-following-back");
                            }}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold"
                            style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: palette.textSecondary }}
                        >
                            <Close sx={{ fontSize: 14 }} />
                            Load new export
                        </button>
                    </div>

                    {/* ── Expanded stats cards ── */}
                    <AnimatePresence>
                        {expandedStats && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="overflow-hidden"
                            >
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pb-1">
                                    {TABS.map((tab) => {
                                        const count = tabCount(tab.id);
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => { setActiveTab(tab.id); setExpandedStats(false); }}
                                                className="flex flex-col items-center gap-1 p-3 rounded-2xl text-center transition-transform active:scale-95"
                                                style={{
                                                    background: activeTab === tab.id ? `${tab.color}20` : cardBg,
                                                    border: activeTab === tab.id ? `1.5px solid ${tab.color}60` : border,
                                                }}
                                            >
                                                <span style={{ color: tab.color }}>{tab.icon}</span>
                                                <span className="text-xl font-black" style={{ color: palette.textPrimary }}>{count}</span>
                                                <span className="text-[10px] leading-tight" style={{ color: palette.textTertiary }}>{tab.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── Tabs ── */}
                    <div className="flex flex-wrap gap-2">
                        {TABS.map((tab) => {
                            const count = tabCount(tab.id);
                            const active = tab.id === activeTab;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all"
                                    style={{
                                        background: active ? `${tab.color}20` : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                                        color: active ? tab.color : palette.textSecondary,
                                        border: `1.5px solid ${active ? `${tab.color}60` : "transparent"}`,
                                    }}
                                >
                                    {tab.icon}
                                    <span className="hidden sm:inline">{tab.label}</span>
                                    {count > 0 && (
                                        <span
                                            className="text-xs px-1.5 py-0.5 rounded-full font-bold min-w-[20px] text-center"
                                            style={{
                                                background: active ? tab.color : isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
                                                color: active ? "#fff" : palette.textSecondary,
                                            }}
                                        >
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* ── Main card ── */}
                    <Card>
                        {/* Card header */}
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span style={{ color: activeTabDef.color }}>{activeTabDef.icon}</span>
                                    <h2 className="text-lg font-bold" style={{ color: palette.textPrimary }}>
                                        {activeTabDef.label}
                                    </h2>
                                    <span
                                        className="text-xs px-2 py-0.5 rounded-full font-bold"
                                        style={{ background: `${activeTabDef.color}20`, color: activeTabDef.color }}
                                    >
                                        {rawList.length}
                                    </span>
                                </div>
                                <p className="text-xs" style={{ color: palette.textTertiary }}>
                                    {activeTabDef.description}
                                </p>
                            </div>

                            {/* Actions */}
                            {rawList.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={copyAllUsernames}
                                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
                                        style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)", color: palette.textSecondary }}
                                    >
                                        {copiedAll ? <Check sx={{ fontSize: 14, color: "#34C759" }} /> : <ContentCopy sx={{ fontSize: 14 }} />}
                                        {copiedAll ? "Copied!" : "Copy all"}
                                    </button>
                                    <button
                                        onClick={() => exportCSV(filteredList, `instagram_${activeTab}.csv`)}
                                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
                                        style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)", color: palette.textSecondary }}
                                    >
                                        <Download sx={{ fontSize: 14 }} />
                                        CSV
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* ── Search / filter bar ── */}
                        <div className="flex flex-col sm:flex-row gap-2 mb-4">
                            {/* Search input */}
                            <div className="relative flex-1">
                                <Search
                                    sx={{ fontSize: 17 }}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                                    style={{ color: palette.textTertiary }}
                                />
                                <input
                                    type="text"
                                    placeholder={useRegExp ? "RegExp pattern…" : "Search by username…"}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{ ...inputStyle, paddingLeft: 36 }}
                                    spellCheck={false}
                                />
                                {searchQuery && (
                                    <button
                                        className="absolute right-3 top-1/2 -translate-y-1/2"
                                        onClick={() => setSearchQuery("")}
                                        style={{ color: palette.textTertiary }}
                                    >
                                        <Close sx={{ fontSize: 15 }} />
                                    </button>
                                )}
                            </div>

                            {/* RegExp toggle */}
                            <button
                                onClick={() => setUseRegExp((v) => !v)}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-colors flex-shrink-0"
                                style={{
                                    background: useRegExp ? `${activeTabDef.color}20` : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                                    color: useRegExp ? activeTabDef.color : palette.textSecondary,
                                    border: `1.5px solid ${useRegExp ? `${activeTabDef.color}50` : "transparent"}`,
                                }}
                            >
                                <FilterList sx={{ fontSize: 15 }} />
                                .*  RegExp
                            </button>
                        </div>

                        {/* RegExp error */}
                        <AnimatePresence>
                            {regexpError && (
                                <motion.p
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="text-xs mb-3 px-3 py-1.5 rounded-lg"
                                    style={{ background: "#FF3B3015", color: "#FF3B30" }}
                                >
                                    Invalid RegExp: {regexpError}
                                </motion.p>
                            )}
                        </AnimatePresence>

                        {/* Results count when filtering */}
                        {searchQuery && !regexpError && (
                            <p className="text-xs mb-3" style={{ color: palette.textTertiary }}>
                                Showing {filteredList.length} of {rawList.length} results
                            </p>
                        )}

                        {/* ── Profile list ── */}
                        {rawList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <span style={{ color: palette.textTertiary, opacity: 0.4, fontSize: 48 }}>
                                    {activeTabDef.icon}
                                </span>
                                <p className="text-sm" style={{ color: palette.textTertiary }}>
                                    {activeTab === "not-following-back"
                                        ? "Everyone you follow also follows you back 🎉"
                                        : "No data available for this category"}
                                </p>
                                <p className="text-xs" style={{ color: palette.textTertiary, opacity: 0.6 }}>
                                    {activeTab !== "not-following-back" && "This file may not have been included in your export."}
                                </p>
                            </div>
                        ) : filteredList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-2">
                                <Search sx={{ fontSize: 40, color: palette.textTertiary, opacity: 0.3 }} />
                                <p className="text-sm" style={{ color: palette.textTertiary }}>
                                    No results for &ldquo;{searchQuery}&rdquo;
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-1.5 overflow-y-auto pr-0.5 -mr-1" style={{ maxHeight: LIST_HEIGHT[igDefaults?.maxListHeight ?? "normal"] ?? "580px" }}>
                                <AnimatePresence mode="popLayout">
                                    {filteredList.map((profile, index) => (
                                        <ProfileRow
                                            key={profile.username}
                                            profile={profile}
                                            accent={activeTabDef.color}
                                            index={index}
                                            palette={palette}
                                            isDark={isDark}
                                            isApple={isApple}
                                            showDates={igDefaults?.showDates ?? true}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </Card>

                    {/* ── Privacy notice ── */}
                    <p className="text-xs text-center" style={{ color: palette.textTertiary }}>
                        🔒 All analysis runs entirely in your browser. No data is ever sent to any server.
                    </p>
                </motion.div>
            )}
        </ToolPageWrapper>
    );
}
