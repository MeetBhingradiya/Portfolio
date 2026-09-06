"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { Add, Check, Close, Delete, Edit, Key, PhotoCamera, Refresh, Search, Email, Link as LinkIcon, Info, ContentCopy, Block } from "@mui/icons-material";
import Image from "next/image";
import { CDNImageField } from "@Components/Tools/CDNUploaders";

interface SSOApp {
    _id: string;
    name: string;
    clientId: string;
    clientSecret?: string;
    appIcon?: string;
    description?: string;
    enabled: boolean;
    allowNewTokens: boolean;
    allowNewSignups: boolean;
    visibility: "public" | "private";
    accessMode: "public" | "private";
    redirectUris?: string | string[];
    allowedOrigins?: string | string[];
    createdAt: string;
}

interface BAUser {
    _id: string;
    name?: string;
    email?: string;
    image?: string;
}

interface WhitelistEntry {
    _id: string;
    email: string;
    label: string;
    note?: string;
    enabled: boolean;
    linkedAccount: boolean;
    subOverride?: string;
    createdAt?: string;
    lastAccess?: string;
    account?: {
        _id: string;
        name?: string;
        image?: string;
        email?: string;
    } | null;
}

export default function SSOAppsPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const [apps, setApps] = useState<SSOApp[]>([]);
    const [selectedApp, setSelectedApp] = useState<SSOApp | null>(null);
    const [entries, setEntries] = useState<WhitelistEntry[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // App Creation state
    const [showAddApp, setShowAddApp] = useState(false);
    const [newApp, setNewApp] = useState({ name: "", clientId: "", redirectUris: "", appIcon: "", description: "", visibility: "private" as "public" | "private", accessMode: "private" as "public" | "private", allowNewSignups: false });
    const [activeTab, setActiveTab] = useState<"info" | "settings" | "users" | "security" | "integrations">("info");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [editAppName, setEditAppName] = useState("");
    const [editAppDesc, setEditAppDesc] = useState("");
    
    // Arrays for chips
    const [editRedirectUris, setEditRedirectUris] = useState<string[]>([]);
    const [editAllowedOrigins, setEditAllowedOrigins] = useState<string[]>([]);
    const [editAppIconUrl, setEditAppIconUrl] = useState("");
    const [showSensitive, setShowSensitive] = useState(false);

    // Access Creation state
    const [showAddAccess, setShowAddAccess] = useState(false);
    const [newAccess, setNewAccess] = useState({ email: "", label: "", note: "" });
    const [selectedEntry, setSelectedEntry] = useState<WhitelistEntry | null>(null);
    const [editAccessData, setEditAccessData] = useState<{ enabled: boolean, subOverride: string }>({ enabled: true, subOverride: "" });
    const [userSearchTerm, setUserSearchTerm] = useState("");
    const [userSuggestions, setUserSuggestions] = useState<any[]>([]);
    const [searchingUsers, setSearchingUsers] = useState(false);
    const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const cardBg = isApple ? (isDark ? "rgba(35,35,40,0.85)" : "rgba(255,255,255,0.88)") : isDark ? "rgba(27,27,33,0.98)" : "#ffffff";
    const shellBg = isDark ? palette.background : palette.background;
    const borderColor = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)";
    const inputBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";

    const flash = (msg: string, isErr = false) => {
        if (isErr) setError(msg);
        else setSuccess(msg);
        setTimeout(() => { setError(""); setSuccess(""); }, 4000);
    };

    const loadApps = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/sso-apps");
            const json = await res.json();
            if (json.success) setApps(json.data);
            else flash(json.error, true);
        } catch {
            flash("Failed to load apps", true);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadEntries = useCallback(async () => {
        if (!selectedApp) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/sso-access?appId=${selectedApp._id}&search=${encodeURIComponent(search)}`);
            const json = await res.json();
            if (json.success) setEntries(json.data);
            else flash(json.error, true);
        } catch {
            flash("Failed to load access", true);
        } finally {
            setLoading(false);
        }
    }, [selectedApp, search]);

    useEffect(() => {
        loadApps();
    }, [loadApps]);

    useEffect(() => {
        if (selectedApp) {
            setEditAppIconUrl(selectedApp.appIcon || "");
            setEditAppName(selectedApp.name || "");
            setEditAppDesc(selectedApp.description || "");
            setEditRedirectUris(selectedApp.redirectUris ? (Array.isArray(selectedApp.redirectUris) ? selectedApp.redirectUris : selectedApp.redirectUris.split(",")).map(s => s.trim()).filter(Boolean) : []);
            setEditAllowedOrigins(selectedApp.allowedOrigins ? (Array.isArray(selectedApp.allowedOrigins) ? selectedApp.allowedOrigins : selectedApp.allowedOrigins.split(",")).map(s => s.trim()).filter(Boolean) : []);
            loadEntries();
        }
    }, [selectedApp, loadEntries]);

    const handleCreateApp = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/sso-apps", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newApp)
            });
            const json = await res.json();
            if (json.success) {
                flash("App created successfully!");
                setShowAddApp(false);
                setNewApp({ name: "", clientId: "", redirectUris: "", appIcon: "", description: "", visibility: "private" as "public" | "private", accessMode: "private" as "public" | "private", allowNewSignups: false });
                loadApps();
            } else {
                flash(json.error, true);
            }
        } catch {
            flash("Network error", true);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAccess = async () => {
        if (!selectedApp) return;
        setLoading(true);
        try {
            const res = await fetch("/api/admin/sso-access", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    appId: selectedApp._id,
                    ...newAccess
                })
            });
            const json = await res.json();
            if (json.success) {
                flash("Access granted!");
                setShowAddAccess(false);
                setNewAccess({ email: "", label: "", note: "" });
                loadEntries();
            } else {
                flash(json.error, true);
            }
        } catch {
            flash("Network error", true);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveAccess = async (id: string) => {
        if (!confirm("Are you sure you want to remove this access?")) return;
        try {
            const res = await fetch(`/api/admin/sso-access/${id}`, { method: "DELETE" });
            const json = await res.json();
            if (json.success) {
                flash("Access removed.");
                setSelectedEntry(null);
                loadEntries();
            } else {
                flash(json.error, true);
            }
        } catch {
            flash("Network error", true);
        }
    };

    const handleUpdateAccess = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/sso-access/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editAccessData)
            });
            const json = await res.json();
            if (json.success) {
                flash("Access updated.");
                if (selectedEntry) setSelectedEntry({ ...selectedEntry, ...editAccessData });
                loadEntries();
            } else {
                flash(json.error, true);
            }
        } catch {
            flash("Network error", true);
        }
    };

    const handleRegenerateSecret = async (appId: string) => {
        if (!confirm("Are you sure you want to regenerate the Client Secret? The old secret will immediately stop working.")) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/sso-apps/${appId}/regenerate-secret`, { method: "POST" });
            const json = await res.json();
            if (json.success) {
                flash("Secret regenerated.");
                setApps(prev => prev.map(a => a._id === appId ? { ...a, clientSecret: json.clientSecret } : a));
                if (selectedApp?._id === appId) {
                    setSelectedApp(prev => prev ? { ...prev, clientSecret: json.clientSecret } : null);
                }
            } else {
                flash(json.error, true);
            }
        } catch {
            flash("Network error", true);
        } finally {
            setLoading(false);
        }
    };

    const handleUserSearch = (val: string) => {
        setUserSearchTerm(val);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        
        if (val.trim().length < 2) {
            setUserSuggestions([]);
            return;
        }

        setSearchingUsers(true);
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/admin/users?search=${encodeURIComponent(val)}&limit=5`);
                const json = await res.json();
                if (json.success) {
                    setUserSuggestions(json.data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setSearchingUsers(false);
            }
        }, 300);
    };

    const selectUser = (user: any) => {
        setNewAccess(prev => ({ ...prev, email: user.email, label: user.name || user.email.split("@")[0] }));
        setUserSearchTerm("");
        setUserSuggestions([]);
    };

    const handleToggleAppProp = async (appId: string, prop: "enabled" | "allowNewTokens", val: boolean) => {
        try {
            const res = await fetch(`/api/admin/sso-apps/${appId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [prop]: val })
            });
            const json = await res.json();
            if (json.success) {
                setApps(prev => prev.map(a => a._id === appId ? { ...a, [prop]: val } : a));
                if (selectedApp?._id === appId) {
                    setSelectedApp(prev => prev ? { ...prev, [prop]: val } : null);
                }
            } else {
                flash(json.error, true);
            }
        } catch {
            flash("Network error", true);
        }
    };

    const handleExpireTokens = async (appId: string) => {
        if (!confirm("Are you sure you want to expire all active authorization tokens for this app? This may interrupt active sign-ins.")) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/sso-apps/${appId}/tokens`, { method: "DELETE" });
            const json = await res.json();
            if (json.success) {
                flash(`Successfully expired ${json.deletedCount} token(s).`);
            } else {
                flash(json.error, true);
            }
        } catch {
            flash("Network error", true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-4 sm:p-6" style={{ background: shellBg }}>
            <div className="mx-auto w-full max-w-5xl space-y-6">
                <div className="rounded-[30px] p-6" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold" style={{ color: palette.textPrimary }}>SSO Applications</h1>
                            <p className="text-sm mt-1" style={{ color: palette.textSecondary }}>Manage applications and their access lists.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {!selectedApp && (
                                <div className="flex bg-black/5 dark:bg-white/5 rounded-xl p-1">
                                    <button onClick={() => setViewMode('grid')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-black/40 shadow-sm' : 'opacity-50'}`} style={{ color: palette.textPrimary }}>Grid</button>
                                    <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-black/40 shadow-sm' : 'opacity-50'}`} style={{ color: palette.textPrimary }}>List</button>
                                </div>
                            )}
                            <button onClick={() => setShowSensitive(!showSensitive)} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", color: palette.textPrimary }}>
                                {showSensitive ? "Hide Secrets" : "Reveal Secrets"}
                            </button>
                            {!selectedApp ? (
                                <button onClick={() => setShowAddApp(true)} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: palette.accent, color: "#fff" }}>
                                    Add App
                                </button>
                            ) : (
                                <button onClick={() => setSelectedApp(null)} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: inputBg, color: palette.textPrimary }}>
                                    Back to Apps
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {(error || success) && (
                    <div className="px-4 py-3 rounded-2xl text-sm font-medium" style={{ background: error ? "rgba(255,59,48,0.14)" : "rgba(52,199,89,0.14)", color: error ? "#ff3b30" : "#34c759" }}>
                        {error || success}
                    </div>
                )}

                {showAddApp && (
                    <div className="rounded-[30px] p-6 space-y-4" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                        <h2 className="text-lg font-semibold" style={{ color: palette.textPrimary }}>Create Application</h2>
                        <input type="text" placeholder="App Name" value={newApp.name} onChange={(e) => setNewApp({ ...newApp, name: e.target.value })} className="w-full px-4 py-2 rounded-xl outline-none" style={{ background: inputBg, color: palette.textPrimary }} />
                        <input type="text" placeholder="Client ID" value={newApp.clientId} onChange={(e) => setNewApp({ ...newApp, clientId: e.target.value })} className="w-full px-4 py-2 rounded-xl outline-none" style={{ background: inputBg, color: palette.textPrimary }} />
                        
                        <textarea placeholder="App Description (Optional)" value={newApp.description} onChange={(e) => setNewApp({ ...newApp, description: e.target.value })} className="w-full px-4 py-2 rounded-xl outline-none min-h-[80px] resize-none" style={{ background: inputBg, color: palette.textPrimary }} />
                        
                        <div>
                            <p className="text-sm font-semibold mb-2" style={{ color: palette.textPrimary }}>App Icon (Optional)</p>
                            <CDNImageField
                                value={newApp.appIcon}
                                onChange={(url) => setNewApp({ ...newApp, appIcon: url })}
                                cdnType="sso-icon"
                                palette={palette}
                                isDark={isDark}
                                borderColor={borderColor}
                                isApple={isApple}
                            />
                        </div>

                        <input type="text" placeholder="Redirect URIs (comma separated)" value={newApp.redirectUris} onChange={(e) => setNewApp({ ...newApp, redirectUris: e.target.value })} className="w-full px-4 py-2 rounded-xl outline-none" style={{ background: inputBg, color: palette.textPrimary }} />
                        <div className="flex gap-2">
                            <button onClick={() => setShowAddApp(false)} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: inputBg, color: palette.textPrimary }}>Cancel</button>
                            <button onClick={handleCreateApp} disabled={loading} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: palette.accent, color: "#fff" }}>Create</button>
                        </div>
                    </div>
                )}

                {!selectedApp ? (
                    <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-3"}>
                        {apps.map(app => (
                            <div key={app._id} onClick={() => { setSelectedApp(app); setActiveTab('info'); }} className={`rounded-[24px] cursor-pointer transition-transform hover:scale-[1.02] ${viewMode === 'grid' ? 'p-5' : 'p-4 flex items-center justify-between'}`} style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                                <div className={`flex items-center ${viewMode === 'grid' ? 'gap-3 mb-3' : 'gap-4'}`}>
                                    {app.appIcon ? (
                                        <img src={app.appIcon} alt={app.name} className="w-10 h-10 rounded-xl object-cover shrink-0" style={{ border: `1px solid ${borderColor}` }} />
                                    ) : (
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${palette.accent}20`, color: palette.accent }}>
                                            <Key />
                                        </div>
                                    )}
                                    <h3 className="font-bold text-lg" style={{ color: palette.textPrimary }}>{app.name}</h3>
                                </div>
                                <div className={viewMode === 'grid' ? '' : 'text-right'}>
                                    <p className="text-xs font-mono" style={{ color: palette.textSecondary }}>ID: {app.clientId}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Header & Tabs */}
                        <div className="rounded-[30px] p-6" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                            <div className="flex items-center gap-4 mb-6">
                                {selectedApp.appIcon ? (
                                    <img src={selectedApp.appIcon} alt="App Icon" className="w-16 h-16 rounded-2xl object-cover shrink-0" style={{ border: `1px solid ${borderColor}` }} />
                                ) : (
                                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${palette.accent}20`, color: palette.accent }}>
                                        <Key fontSize="large" />
                                    </div>
                                )}
                                <div>
                                    <h2 className="text-2xl font-bold" style={{ color: palette.textPrimary }}>{selectedApp.name}</h2>
                                    <p className="text-sm font-mono mt-1" style={{ color: palette.textSecondary }}>{selectedApp.clientId}</p>
                                </div>
                            </div>
                            
                            <div className="flex gap-6 border-b" style={{ borderColor }}>
                                {["info", "settings", "integrations", "users", "security"].map(tab => (
                                    <button 
                                        key={tab} 
                                        onClick={() => setActiveTab(tab as any)}
                                        className="pb-3 font-semibold text-sm capitalize transition-colors relative"
                                        style={{ 
                                            color: activeTab === tab ? palette.accent : palette.textSecondary
                                        }}
                                    >
                                        {tab}
                                        {activeTab === tab && (
                                            <motion.div 
                                                layoutId="activeTab"
                                                className="absolute bottom-0 left-0 right-0 h-0.5"
                                                style={{ background: palette.accent }}
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* INFO TAB */}
                        {activeTab === "info" && (
                            <div className="rounded-[30px] p-6 space-y-6" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: palette.textSecondary }}>App ID</p>
                                        <p className="font-mono text-sm font-bold" style={{ color: palette.textPrimary }}>{selectedApp.clientId}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: palette.textSecondary }}>App Name</p>
                                        <input 
                                            type="text" 
                                            value={editAppName}
                                            onChange={(e) => setEditAppName(e.target.value)}
                                            onBlur={(e) => {
                                                if (e.target.value !== selectedApp.name) {
                                                    handleToggleAppProp(selectedApp._id, "name" as any, e.target.value as any);
                                                }
                                            }}
                                            className="w-full px-4 py-2 rounded-xl outline-none text-sm font-bold" 
                                            style={{ background: inputBg, color: palette.textPrimary, border: `1px solid ${borderColor}` }} 
                                        />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: palette.textSecondary }}>Created At</p>
                                        <p className="text-sm font-bold" style={{ color: palette.textPrimary }}>{new Date(selectedApp.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: palette.textSecondary }}>Activation Status</p>
                                        <p className="text-sm font-bold" style={{ color: selectedApp.enabled ? "#34c759" : "#ff3b30" }}>{selectedApp.enabled ? "Active" : "Deactivated"}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: palette.textSecondary }}>Description</p>
                                    <textarea 
                                        value={editAppDesc}
                                        onChange={(e) => setEditAppDesc(e.target.value)}
                                        onBlur={(e) => {
                                            if (e.target.value !== (selectedApp.description || "")) {
                                                handleToggleAppProp(selectedApp._id, "description" as any, e.target.value as any);
                                            }
                                        }}
                                        placeholder="Add an app description..."
                                        className="w-full px-4 py-3 rounded-2xl outline-none min-h-[100px] resize-none text-sm" 
                                        style={{ background: inputBg, color: palette.textPrimary, border: `1px solid ${borderColor}` }} 
                                    />
                                </div>
                            </div>
                        )}

                        {/* SETTINGS TAB */}
                        {activeTab === "settings" && (
                            <div className="space-y-4">
                                <div className="rounded-[30px] p-6 space-y-6" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                                    <h3 className="text-lg font-semibold" style={{ color: palette.textPrimary }}>General Settings</h3>
                                    
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 rounded-2xl" style={{ border: `1px solid ${borderColor}` }}>
                                            <div>
                                                <p className="text-sm font-semibold" style={{ color: palette.textPrimary }}>App Enabled</p>
                                                <p className="text-xs mt-1" style={{ color: palette.textSecondary }}>Disable to completely block access to this app.</p>
                                            </div>
                                            <button onClick={() => handleToggleAppProp(selectedApp._id, "enabled", !selectedApp.enabled)} className="w-12 h-6 rounded-full relative transition-colors" style={{ background: selectedApp.enabled ? palette.accent : inputBg }}>
                                                <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: `translateX(${selectedApp.enabled ? '24px' : '4px'})` }} />
                                            </button>
                                        </div>
                                        
                                        <div className="flex items-center justify-between p-4 rounded-2xl" style={{ border: `1px solid ${borderColor}` }}>
                                            <div>
                                                <p className="text-sm font-semibold" style={{ color: palette.textPrimary }}>Allow New Logins</p>
                                                <p className="text-xs mt-1" style={{ color: palette.textSecondary }}>Disable to block new logins while keeping existing sessions valid.</p>
                                            </div>
                                            <button onClick={() => handleToggleAppProp(selectedApp._id, "allowNewTokens", !selectedApp.allowNewTokens)} className="w-12 h-6 rounded-full relative transition-colors" style={{ background: selectedApp.allowNewTokens ? palette.accent : inputBg }}>
                                                <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: `translateX(${selectedApp.allowNewTokens ? '24px' : '4px'})` }} />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between p-4 rounded-2xl" style={{ border: `1px solid ${borderColor}` }}>
                                            <div>
                                                <p className="text-sm font-semibold" style={{ color: palette.textPrimary }}>Allow New Signups</p>
                                                <p className="text-xs mt-1" style={{ color: palette.textSecondary }}>Allow new users to sign up and auto-grant access via SSO.</p>
                                            </div>
                                            <button onClick={() => handleToggleAppProp(selectedApp._id, "allowNewSignups" as any, !selectedApp.allowNewSignups as any)} className="w-12 h-6 rounded-full relative transition-colors" style={{ background: selectedApp.allowNewSignups ? palette.accent : inputBg }}>
                                                <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: `translateX(${selectedApp.allowNewSignups ? '24px' : '4px'})` }} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="rounded-[30px] p-6 space-y-6" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                                    <h3 className="text-lg font-semibold" style={{ color: palette.textPrimary }}>App Branding</h3>
                                    <div>
                                        <p className="text-xs font-semibold mb-2" style={{ color: palette.textSecondary }}>Icon Image</p>
                                        <CDNImageField
                                            value={editAppIconUrl}
                                            onChange={(url) => {
                                                setEditAppIconUrl(url);
                                                handleToggleAppProp(selectedApp._id, "appIcon" as any, url as any);
                                            }}
                                            cdnType="sso-icon"
                                            palette={palette}
                                            isDark={isDark}
                                            borderColor={borderColor}
                                            isApple={isApple}
                                        />
                                    </div>
                                </div>

                            </div>
                        )}

                        {/* INTEGRATIONS TAB */}
                        {activeTab === "integrations" && (
                            <div className="space-y-6">
                                <div className="rounded-[30px] p-6 space-y-6" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                                    <h3 className="text-lg font-semibold" style={{ color: palette.textPrimary }}>App Credentials</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: palette.textSecondary }}>Client ID</p>
                                            <div className="flex gap-2">
                                                <input type="text" readOnly value={showSensitive ? selectedApp.clientId : "••••••••••••••••••••••••••••"} className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none font-mono" style={{ background: inputBg, color: palette.textPrimary }} />
                                                <button onClick={() => navigator.clipboard.writeText(selectedApp.clientId)} title="Copy Client ID" className="w-10 h-10 flex items-center justify-center rounded-xl text-sm font-semibold transition-colors" style={{ background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)", color: palette.textPrimary }}><ContentCopy fontSize="small" /></button>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: palette.textSecondary }}>Client Secret</p>
                                            <div className="flex gap-2">
                                                <input type="text" readOnly value={selectedApp.clientSecret ? (showSensitive ? selectedApp.clientSecret : "••••••••••••••••••••••••••••") : "Not generated"} className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none font-mono" style={{ background: inputBg, color: palette.textPrimary }} />
                                                {selectedApp.clientSecret && (
                                                    <button onClick={() => navigator.clipboard.writeText(selectedApp.clientSecret!)} title="Copy Secret" className="w-10 h-10 flex items-center justify-center rounded-xl text-sm font-semibold transition-colors" style={{ background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)", color: palette.textPrimary }}><ContentCopy fontSize="small" /></button>
                                                )}
                                                <button onClick={() => handleRegenerateSecret(selectedApp._id)} title="Regenerate Secret" className="w-10 h-10 flex items-center justify-center rounded-xl text-sm font-semibold transition-colors" style={{ background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)", color: palette.textPrimary }}><Refresh fontSize="small" /></button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-6 mt-6 border-t flex justify-end" style={{ borderColor }}>
                                        <button onClick={() => handleExpireTokens(selectedApp._id)} disabled={loading} title="Expire All Tokens" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50" style={{ background: isDark ? "rgba(255,59,48,0.1)" : "rgba(255,59,48,0.1)", color: "#ff3b30" }}>
                                            <Block fontSize="small" /> Expire Tokens
                                        </button>
                                    </div>
                                </div>

                                {/* Network Settings - URIs and Origins */}
                                <div className="rounded-[30px] p-6 space-y-6" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                                    <h3 className="text-lg font-semibold" style={{ color: palette.textPrimary }}>Network Integrations</h3>
                                    
                                    <div>
                                        <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: palette.textSecondary }}>Redirect URIs</p>
                                        <div className="flex flex-wrap gap-2 p-3 rounded-xl min-h-[48px]" style={{ background: inputBg, border: `1px solid ${borderColor}` }}>
                                            {editRedirectUris.map((uri, idx) => (
                                                <div key={idx} className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-mono" style={{ background: palette.accent, color: "#fff" }}>
                                                    {uri}
                                                    <button onClick={() => {
                                                        const newUris = editRedirectUris.filter((_, i) => i !== idx);
                                                        setEditRedirectUris(newUris);
                                                        handleToggleAppProp(selectedApp._id, "redirectUris" as any, newUris.join(",") as any);
                                                    }} className="hover:opacity-75"><Close fontSize="small" style={{ fontSize: "16px" }}/></button>
                                                </div>
                                            ))}
                                            <input 
                                                type="text"
                                                placeholder="Add URI & press Enter"
                                                className="flex-1 min-w-[150px] bg-transparent outline-none text-sm font-mono"
                                                style={{ color: palette.textPrimary }}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" && e.currentTarget.value.trim()) {
                                                        e.preventDefault();
                                                        const val = e.currentTarget.value.trim();
                                                        if (!editRedirectUris.includes(val)) {
                                                            const newUris = [...editRedirectUris, val];
                                                            setEditRedirectUris(newUris);
                                                            handleToggleAppProp(selectedApp._id, "redirectUris" as any, newUris.join(",") as any);
                                                        }
                                                        e.currentTarget.value = "";
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: palette.textSecondary }}>Allowed Origins (CORS)</p>
                                        <div className="flex flex-wrap gap-2 p-3 rounded-xl min-h-[48px]" style={{ background: inputBg, border: `1px solid ${borderColor}` }}>
                                            {editAllowedOrigins.map((origin, idx) => (
                                                <div key={idx} className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-mono" style={{ background: palette.accent, color: "#fff" }}>
                                                    {origin}
                                                    <button onClick={() => {
                                                        const newOrigins = editAllowedOrigins.filter((_, i) => i !== idx);
                                                        setEditAllowedOrigins(newOrigins);
                                                        handleToggleAppProp(selectedApp._id, "allowedOrigins" as any, newOrigins.join(",") as any);
                                                    }} className="hover:opacity-75"><Close fontSize="small" style={{ fontSize: "16px" }}/></button>
                                                </div>
                                            ))}
                                            <input 
                                                type="text"
                                                placeholder="Add Origin & press Enter"
                                                className="flex-1 min-w-[150px] bg-transparent outline-none text-sm font-mono"
                                                style={{ color: palette.textPrimary }}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" && e.currentTarget.value.trim()) {
                                                        e.preventDefault();
                                                        const val = e.currentTarget.value.trim();
                                                        if (!editAllowedOrigins.includes(val)) {
                                                            const newOrigins = [...editAllowedOrigins, val];
                                                            setEditAllowedOrigins(newOrigins);
                                                            handleToggleAppProp(selectedApp._id, "allowedOrigins" as any, newOrigins.join(",") as any);
                                                        }
                                                        e.currentTarget.value = "";
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* USERS TAB */}
                        {activeTab === "users" && (
                            <div className="space-y-4">
                                <div className="rounded-[30px] p-6 flex items-center justify-between" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                                    <div className="flex items-center gap-4">
                                        <input type="text" placeholder="Search access..." value={search} onChange={(e) => setSearch(e.target.value)} className="px-4 py-2.5 rounded-xl text-sm outline-none w-64" style={{ background: inputBg, color: palette.textPrimary }} />
                                        <button onClick={loadEntries} className="p-2.5 rounded-xl" style={{ background: inputBg, color: palette.textPrimary }}><Refresh fontSize="small" /></button>
                                    </div>
                                    <button onClick={() => setShowAddAccess(true)} className="px-5 py-2.5 rounded-xl text-sm font-semibold" style={{ background: palette.accent, color: "#fff" }}>
                                        Grant Access
                                    </button>
                                </div>

                                {showAddAccess && (
                                    <div className="rounded-[30px] p-6 space-y-4 relative" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                                        <h2 className="text-lg font-semibold" style={{ color: palette.textPrimary }}>Grant Access to {selectedApp.name}</h2>
                                        
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                placeholder="Search Users (Name or Email)..." 
                                                value={userSearchTerm} 
                                                onChange={(e) => handleUserSearch(e.target.value)} 
                                                className="w-full px-4 py-2 rounded-xl outline-none" 
                                                style={{ background: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)", color: palette.textPrimary, border: `1px solid ${palette.accent}` }} 
                                            />
                                            {userSuggestions.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden shadow-xl z-50" style={{ background: shellBg, border: `1px solid ${borderColor}` }}>
                                                    {userSuggestions.map(u => (
                                                        <div 
                                                            key={u.id || u._id}
                                                            onClick={() => selectUser(u)}
                                                            className="px-4 py-3 cursor-pointer transition-colors flex items-center gap-3"
                                                            style={{ borderBottom: `1px solid ${borderColor}`, background: cardBg }}
                                                            onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"}
                                                            onMouseLeave={e => e.currentTarget.style.background = cardBg}
                                                        >
                                                            {u.image ? (
                                                                <img src={u.image} alt={u.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                                                            ) : (
                                                                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs" style={{ background: palette.accent, color: "#fff" }}>
                                                                    {u.name?.charAt(0)?.toUpperCase() || u.email?.charAt(0)?.toUpperCase()}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <p className="font-bold text-sm" style={{ color: palette.textPrimary }}>{u.name || "Unknown"}</p>
                                                                <p className="text-xs" style={{ color: palette.textSecondary }}>{u.email}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center gap-4 my-2">
                                            <div className="flex-1 h-px bg-black/10 dark:bg-white/10"></div>
                                            <span className="text-xs font-semibold uppercase text-gray-500">Or Manual Entry</span>
                                            <div className="flex-1 h-px bg-black/10 dark:bg-white/10"></div>
                                        </div>

                                        <input type="email" placeholder="Email" value={newAccess.email} onChange={(e) => setNewAccess({ ...newAccess, email: e.target.value })} className="w-full px-4 py-2 rounded-xl outline-none" style={{ background: inputBg, color: palette.textPrimary }} />
                                        <input type="text" placeholder="Label (Name)" value={newAccess.label} onChange={(e) => setNewAccess({ ...newAccess, label: e.target.value })} className="w-full px-4 py-2 rounded-xl outline-none" style={{ background: inputBg, color: palette.textPrimary }} />
                                        <input type="text" placeholder="Note (Optional)" value={newAccess.note} onChange={(e) => setNewAccess({ ...newAccess, note: e.target.value })} className="w-full px-4 py-2 rounded-xl outline-none" style={{ background: inputBg, color: palette.textPrimary }} />
                                        <div className="flex gap-2">
                                            <button onClick={() => {
                                                setShowAddAccess(false);
                                                setUserSearchTerm("");
                                                setUserSuggestions([]);
                                            }} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: inputBg, color: palette.textPrimary }}>Cancel</button>
                                            <button onClick={handleAddAccess} disabled={loading} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: palette.accent, color: "#fff" }}>Grant</button>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {entries.map(entry => (
                                        <div 
                                            key={entry._id} 
                                            onClick={() => {
                                                setSelectedEntry(entry);
                                                setEditAccessData({ enabled: entry.enabled, subOverride: entry.subOverride || "" });
                                            }}
                                            className="rounded-[24px] p-4 flex items-center justify-between cursor-pointer transition-transform hover:scale-[1.01]" 
                                            style={{ background: cardBg, border: `1px solid ${borderColor}`, opacity: entry.enabled ? 1 : 0.6 }}
                                        >
                                            <div className="flex items-center gap-4">
                                                {!entry.enabled && <div className="w-2 h-2 rounded-full bg-red-500"></div>}
                                                {entry.account?.image ? (
                                                    <img src={entry.account.image} alt="Avatar" className="w-10 h-10 rounded-full object-cover shrink-0" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm" style={{ background: palette.accent, color: "#fff" }}>
                                                        {(entry.account?.name || entry.label)?.charAt(0)?.toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-bold text-sm" style={{ color: palette.textPrimary }}>{entry.account?.name || entry.label}</p>
                                                    <p className="text-xs" style={{ color: palette.textSecondary }}>{showSensitive ? (entry.account?.email || entry.email) : "••••••••••••••••"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {entries.length === 0 && !loading && (
                                        <p className="text-center text-sm py-10" style={{ color: palette.textSecondary }}>No access granted yet.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* SECURITY TAB */}
                        {activeTab === "security" && (
                            <div className="rounded-[30px] p-6 space-y-6" style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                                <h3 className="text-lg font-semibold" style={{ color: palette.textPrimary }}>Security & Access</h3>
                                
                                <div className="space-y-6">
                                    <div className="p-4 rounded-2xl space-y-4" style={{ border: `1px solid ${borderColor}` }}>
                                        <div>
                                            <p className="text-sm font-semibold" style={{ color: palette.textPrimary }}>App Visibility</p>
                                            <p className="text-xs mb-3" style={{ color: palette.textSecondary }}>Determines if this app is shown on the public Apps directory and user menus.</p>
                                            
                                            <div className="flex gap-4">
                                                <button 
                                                    onClick={() => handleToggleAppProp(selectedApp._id, "visibility" as any, "public" as any)}
                                                    className="flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 border-2 transition-colors"
                                                    style={{ 
                                                        borderColor: selectedApp.visibility === "public" ? palette.accent : borderColor,
                                                        background: selectedApp.visibility === "public" ? `${palette.accent}15` : inputBg,
                                                        color: palette.textPrimary
                                                    }}
                                                >
                                                    <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: selectedApp.visibility === "public" ? palette.accent : palette.textSecondary }}>
                                                        {selectedApp.visibility === "public" && <div className="w-2 h-2 rounded-full" style={{ background: palette.accent }} />}
                                                    </div>
                                                    <span className="font-semibold text-sm">Public</span>
                                                </button>
                                                
                                                <button 
                                                    onClick={() => handleToggleAppProp(selectedApp._id, "visibility" as any, "private" as any)}
                                                    className="flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 border-2 transition-colors"
                                                    style={{ 
                                                        borderColor: selectedApp.visibility === "private" ? palette.accent : borderColor,
                                                        background: selectedApp.visibility === "private" ? `${palette.accent}15` : inputBg,
                                                        color: palette.textPrimary
                                                    }}
                                                >
                                                    <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: selectedApp.visibility === "private" ? palette.accent : palette.textSecondary }}>
                                                        {selectedApp.visibility === "private" && <div className="w-2 h-2 rounded-full" style={{ background: palette.accent }} />}
                                                    </div>
                                                    <span className="font-semibold text-sm">Private</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-2xl space-y-4" style={{ border: `1px solid ${borderColor}` }}>
                                        <div>
                                            <p className="text-sm font-semibold" style={{ color: palette.textPrimary }}>Access Mode</p>
                                            <p className="text-xs mb-3" style={{ color: palette.textSecondary }}>Control who is allowed to sign into this app.</p>
                                            
                                            <div className="flex gap-4">
                                                <button 
                                                    onClick={() => handleToggleAppProp(selectedApp._id, "accessMode" as any, "public" as any)}
                                                    className="flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 border-2 transition-colors"
                                                    style={{ 
                                                        borderColor: selectedApp.accessMode === "public" ? palette.accent : borderColor,
                                                        background: selectedApp.accessMode === "public" ? `${palette.accent}15` : inputBg,
                                                        color: palette.textPrimary
                                                    }}
                                                >
                                                    <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: selectedApp.accessMode === "public" ? palette.accent : palette.textSecondary }}>
                                                        {selectedApp.accessMode === "public" && <div className="w-2 h-2 rounded-full" style={{ background: palette.accent }} />}
                                                    </div>
                                                    <div className="text-left">
                                                        <span className="font-semibold text-sm block">Public Access</span>
                                                        <span className="text-xs block" style={{ color: palette.textSecondary }}>Any signed-in user can access</span>
                                                    </div>
                                                </button>
                                                
                                                <button 
                                                    onClick={() => handleToggleAppProp(selectedApp._id, "accessMode" as any, "private" as any)}
                                                    className="flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 border-2 transition-colors"
                                                    style={{ 
                                                        borderColor: selectedApp.accessMode === "private" ? palette.accent : borderColor,
                                                        background: selectedApp.accessMode === "private" ? `${palette.accent}15` : inputBg,
                                                        color: palette.textPrimary
                                                    }}
                                                >
                                                    <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: selectedApp.accessMode === "private" ? palette.accent : palette.textSecondary }}>
                                                        {selectedApp.accessMode === "private" && <div className="w-2 h-2 rounded-full" style={{ background: palette.accent }} />}
                                                    </div>
                                                    <div className="text-left">
                                                        <span className="font-semibold text-sm block">Private / Whitelist</span>
                                                        <span className="text-xs block" style={{ color: palette.textSecondary }}>Only explicitly granted users</span>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Side Modal for User Details */}
            <AnimatePresence>
                {selectedEntry && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedEntry(null)}
                            className="fixed inset-0 z-40"
                            style={{ background: isDark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)", backdropFilter: "blur(4px)" }}
                        />
                        <motion.div 
                            initial={{ x: "100%" }} 
                            animate={{ x: 0 }} 
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 bottom-0 w-full max-w-md z-50 p-6 overflow-y-auto flex flex-col"
                            style={{ background: cardBg, borderLeft: `1px solid ${borderColor}`, boxShadow: "-10px 0 30px rgba(0,0,0,0.1)" }}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold" style={{ color: palette.textPrimary }}>User Details</h2>
                                <button onClick={() => setSelectedEntry(null)} className="p-2 rounded-xl" style={{ background: inputBg, color: palette.textPrimary }}>
                                    <Close fontSize="small" />
                                </button>
                            </div>

                            <div className="flex items-center gap-4 mb-8">
                                {selectedEntry.account?.image ? (
                                    <img src={selectedEntry.account.image} alt="Avatar" className="w-16 h-16 rounded-full object-cover shrink-0" />
                                ) : (
                                    <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 font-bold text-xl" style={{ background: palette.accent, color: "#fff" }}>
                                        {(selectedEntry.account?.name || selectedEntry.label)?.charAt(0)?.toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <p className="font-bold text-lg" style={{ color: palette.textPrimary }}>{selectedEntry.account?.name || selectedEntry.label}</p>
                                    <p className="text-sm" style={{ color: palette.textSecondary }}>{showSensitive ? (selectedEntry.account?.email || selectedEntry.email) : "••••••••••••••••"}</p>
                                </div>
                            </div>

                            <div className="space-y-6 flex-1">
                                <div>
                                    <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: palette.textSecondary }}>Access Information</h3>
                                    <div className="space-y-3 p-4 rounded-2xl" style={{ background: inputBg }}>
                                        <div className="flex justify-between">
                                            <span className="text-xs font-semibold" style={{ color: palette.textSecondary }}>Status</span>
                                            <span className="text-xs font-bold" style={{ color: selectedEntry.enabled ? "#34c759" : "#ff3b30" }}>
                                                {selectedEntry.enabled ? "Active" : "Disabled"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-xs font-semibold" style={{ color: palette.textSecondary }}>Account Linked</span>
                                            <span className="text-xs font-bold" style={{ color: palette.textPrimary }}>{selectedEntry.linkedAccount ? "Yes" : "Pending"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-xs font-semibold" style={{ color: palette.textSecondary }}>Added On</span>
                                            <span className="text-xs font-bold" style={{ color: palette.textPrimary }}>{selectedEntry.createdAt ? new Date(selectedEntry.createdAt).toLocaleDateString() : "Unknown"}</span>
                                        </div>
                                        {selectedEntry.note && (
                                            <div className="pt-2">
                                                <span className="text-xs font-semibold block mb-1" style={{ color: palette.textSecondary }}>Note</span>
                                                <span className="text-xs font-medium" style={{ color: palette.textPrimary }}>{selectedEntry.note}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: palette.textSecondary }}>Manage Access</h3>
                                    <div className="space-y-4 p-4 rounded-2xl" style={{ border: `1px solid ${borderColor}` }}>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold" style={{ color: palette.textPrimary }}>Access Enabled</span>
                                            <button onClick={() => setEditAccessData(prev => ({ ...prev, enabled: !prev.enabled }))} className="w-12 h-6 rounded-full relative transition-colors" style={{ background: editAccessData.enabled ? palette.accent : inputBg }}>
                                                <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: `translateX(${editAccessData.enabled ? '24px' : '4px'})` }} />
                                            </button>
                                        </div>
                                        <div>
                                            <span className="text-sm font-semibold block mb-1" style={{ color: palette.textPrimary }}>Override Account ID (sub)</span>
                                            <p className="text-xs mb-2" style={{ color: palette.textSecondary }}>Overrides the standard SSO user identifier (sub) returned in tokens.</p>
                                            <input 
                                                type="text" 
                                                placeholder="Leave empty to use default user ID" 
                                                value={editAccessData.subOverride} 
                                                onChange={(e) => setEditAccessData(prev => ({ ...prev, subOverride: e.target.value }))}
                                                className="w-full px-4 py-2.5 rounded-xl outline-none text-sm" 
                                                style={{ background: inputBg, color: palette.textPrimary }} 
                                            />
                                        </div>
                                        <div className="pt-2">
                                            <button onClick={() => handleUpdateAccess(selectedEntry._id)} className="w-full py-2.5 rounded-xl text-sm font-bold transition-transform active:scale-95" style={{ background: palette.accent, color: "#fff" }}>Save Changes</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="pt-6 mt-6 border-t" style={{ borderColor }}>
                                <button onClick={() => handleRemoveAccess(selectedEntry._id)} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-colors">
                                    <Delete fontSize="small" /> Remove Access
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
