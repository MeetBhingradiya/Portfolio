"use client";

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { useDesignTheme } from "@Hooks/useDesignTheme";

export default function EAsPage() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const [eas, setEas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch EAs (Products with category EAs or similar)
        // For demonstration, we'll fetch from the shop API, filtering for EAs.
        const fetchEAs = async () => {
            try {
                // You may need to adjust the API call depending on your shop implementation
                const res = await fetch("/api/shop/products");
                const json = await res.json();
                if (json.success) {
                    // Filter or use all if testing
                    setEas(json.data.filter((p: any) => p.category === "EAs" || p.name.includes("APEX")));
                }
            } catch (e) {
                console.error(e);
            }
            setLoading(false);
        };
        fetchEAs();
    }, []);

    const surfaceBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";

    return (
        <div className="min-h-screen pt-24 pb-20 px-6 max-w-7xl mx-auto">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-16"
            >
                <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight" style={{ color: palette.textPrimary }}>
                    Expert Advisors
                </h1>
                <p className="text-xl max-w-2xl mx-auto" style={{ color: palette.textSecondary }}>
                    Automate your trading with our premium MetaTrader 5 Expert Advisors. High-performance, low-latency algorithms.
                </p>
            </motion.div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1,2,3].map(i => (
                        <div key={i} className="h-96 rounded-3xl animate-pulse" style={{ background: surfaceBg }}></div>
                    ))}
                </div>
            ) : eas.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-2xl font-bold" style={{ color: palette.textSecondary }}>No EAs available right now. Check back soon!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {eas.map((ea, idx) => (
                        <motion.div
                            key={ea.productId}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            whileHover={{ y: -8, scale: 1.02 }}
                            className="flex flex-col rounded-3xl overflow-hidden relative"
                            style={{ 
                                background: isDark ? "linear-gradient(145deg, rgba(30,30,35,0.8), rgba(20,20,25,0.9))" : "#ffffff",
                                boxShadow: isDark ? "0 20px 40px rgba(0,0,0,0.4)" : "0 20px 40px rgba(0,0,0,0.08)",
                                border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}`
                            }}
                        >
                            <div className="h-48 relative overflow-hidden flex items-center justify-center bg-black/5 dark:bg-white/5">
                                {ea.banner ? (
                                    <img src={ea.banner} alt={ea.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-4xl font-black text-black/10 dark:text-white/10">{ea.name.substring(0,2)}</div>
                                )}
                                <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md bg-white/20 dark:bg-black/40 text-black dark:text-white border border-white/20">
                                    {ea.type}
                                </div>
                            </div>
                            
                            <div className="p-8 flex flex-col flex-1">
                                <h3 className="text-2xl font-bold mb-2" style={{ color: palette.textPrimary }}>{ea.name}</h3>
                                <p className="text-sm line-clamp-3 mb-6" style={{ color: palette.textSecondary }}>{ea.description || ea.tagline}</p>
                                
                                <div className="mt-auto flex items-center justify-between">
                                    <div className="font-black text-2xl" style={{ color: palette.accent }}>
                                        {ea.variants?.[0]?.price ? `$${(ea.variants[0].price / 100).toFixed(2)}` : "Free"}
                                        <span className="text-sm font-normal ml-1 text-gray-500">/ {ea.variants?.[0]?.billingCycle === 'monthly' ? 'mo' : 'lifetime'}</span>
                                    </div>
                                    <Link href={`/eas/${ea.slug}`}>
                                        <motion.button 
                                            whileTap={{ scale: 0.95 }}
                                            className="px-6 py-3 rounded-xl font-bold text-white shadow-lg"
                                            style={{ background: palette.accent }}
                                        >
                                            View Details
                                        </motion.button>
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
