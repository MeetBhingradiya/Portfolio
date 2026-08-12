"use client";

import React, { useEffect, useState } from "react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import HeadNavigation from "@Components/Common/HeadNavigation";
import { Key } from "@mui/icons-material";
import { motion } from "motion/react";
import Link from "next/link";

interface PublicApp {
    _id: string;
    name: string;
    description?: string;
    appIcon?: string;
    clientId: string;
    enabled: boolean;
}

export default function AppsDirectoryPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const [apps, setApps] = useState<PublicApp[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/apps")
            .then(res => res.json())
            .then(json => {
                if (json.success) setApps(json.data);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const cardBg = isApple ? (isDark ? "rgba(35,35,40,0.85)" : "rgba(255,255,255,0.88)") : isDark ? "rgba(27,27,33,0.98)" : "#ffffff";
    const shellBg = isDark ? palette.background : palette.background;
    const borderColor = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)";
    const badgeBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)";

    return (
        <main className="min-h-screen" style={{ background: shellBg }}>
            <HeadNavigation />
            
            <div className="pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-extrabold mb-4" 
                        style={{ color: palette.textPrimary }}
                    >
                        Applications
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg md:text-xl max-w-2xl mx-auto" 
                        style={{ color: palette.textSecondary }}
                    >
                        Discover and connect with integrated applications in our ecosystem.
                    </motion.p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: \`\${palette.accent} transparent transparent transparent\` }} />
                    </div>
                ) : apps.length === 0 ? (
                    <div className="text-center py-20 rounded-[30px]" style={{ background: cardBg, border: \`1px solid \${borderColor}\` }}>
                        <Key style={{ fontSize: 48, color: palette.textSecondary, opacity: 0.5, marginBottom: 16 }} />
                        <h2 className="text-xl font-bold mb-2" style={{ color: palette.textPrimary }}>No Apps Found</h2>
                        <p style={{ color: palette.textSecondary }}>There are currently no public applications available.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {apps.map((app, idx) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                key={app._id} 
                                className="rounded-[30px] p-6 transition-all hover:scale-[1.02] flex flex-col"
                                style={{ 
                                    background: cardBg, 
                                    border: \`1px solid \${borderColor}\`,
                                    boxShadow: isDark ? '0 10px 40px rgba(0,0,0,0.2)' : '0 10px 40px rgba(0,0,0,0.05)'
                                }}
                            >
                                <div className="flex items-start gap-4 mb-4">
                                    {app.appIcon ? (
                                        <img src={app.appIcon} alt={app.name} className="w-16 h-16 rounded-2xl object-cover shrink-0" style={{ border: \`1px solid \${borderColor}\` }} />
                                    ) : (
                                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0" style={{ background: \`\${palette.accent}15\`, color: palette.accent }}>
                                            <Key fontSize="large" />
                                        </div>
                                    )}
                                    <div className="pt-1 flex-1">
                                        <h3 className="text-xl font-bold leading-tight mb-1" style={{ color: palette.textPrimary }}>{app.name}</h3>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider" style={{ background: badgeBg, color: palette.textSecondary }}>
                                            Integration
                                        </span>
                                    </div>
                                </div>
                                
                                <p className="text-sm flex-1 mb-6" style={{ color: palette.textSecondary, lineHeight: 1.6 }}>
                                    {app.description || "No description provided for this application."}
                                </p>
                                
                                <div className="mt-auto pt-4 border-t flex items-center justify-between" style={{ borderColor }}>
                                    <span className="text-xs font-semibold" style={{ color: app.enabled ? "#34c759" : "#ff3b30" }}>
                                        {app.enabled ? "• Active" : "• Offline"}
                                    </span>
                                    <Link href={\`/sso/login?client_id=\${app.clientId}\`}>
                                        <button 
                                            className="px-4 py-2 rounded-xl text-sm font-bold transition-transform active:scale-95"
                                            style={{ background: palette.accent, color: "#fff" }}
                                            disabled={!app.enabled}
                                        >
                                            Connect
                                        </button>
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
