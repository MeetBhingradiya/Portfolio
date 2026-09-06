"use client";

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useParams } from "next/navigation";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { Download, ShoppingCart, Schedule, Lock, CheckCircle } from "@mui/icons-material";

export default function EADetailsPage() {
    const params = useParams();
    const slug = params.slug as string;
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isDark = actualColorMode === "dark";

    const [ea, setEa] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [hasAccess, setHasAccess] = useState(false);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                // Fetch product details
                const res = await fetch(`/api/shop/products/${slug}`);
                const json = await res.json();
                if (json.success) {
                    setEa(json.data);
                    
                    // Check if user has access to this EA
                    const accessRes = await fetch(`/api/eas/download/${json.data.productId}`);
                    if (accessRes.ok) {
                        setHasAccess(true);
                    }
                }
            } catch (e) {
                console.error(e);
            }
            setLoading(false);
        };
        fetchDetails();
    }, [slug]);

    const handleDownload = async () => {
        if (!ea) return;
        setDownloading(true);
        try {
            const res = await fetch(`/api/eas/download/${ea.productId}`);
            if (!res.ok) {
                const err = await res.json();
                alert(err.error || "Failed to download");
                setDownloading(false);
                return;
            }
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = ea.downloadUrl ? ea.downloadUrl.split('/').pop() : `${ea.slug}.ex5`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
            alert("Error downloading file.");
        }
        setDownloading(false);
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading EA details...</div>;
    }

    if (!ea) {
        return <div className="min-h-screen flex items-center justify-center">EA not found.</div>;
    }

    const price = ea.variants?.[0]?.price ? `$${(ea.variants[0].price / 100).toFixed(2)}` : "Free";
    const billing = ea.variants?.[0]?.billingCycle === 'monthly' ? ' / month' : ' lifetime access';

    return (
        <div className="min-h-screen pt-24 pb-20 px-6 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Left: Images & Info */}
                <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="rounded-3xl overflow-hidden shadow-2xl mb-8 aspect-video bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 relative">
                        {ea.banner ? (
                            <img src={ea.banner} alt={ea.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full text-6xl font-black text-black/10 dark:text-white/10">EA</div>
                        )}
                        <div className="absolute bottom-4 left-4 flex gap-2">
                            <span className="px-3 py-1 bg-black/50 backdrop-blur-md text-white text-xs font-bold uppercase rounded-full border border-white/20">
                                {ea.type}
                            </span>
                            <span className="px-3 py-1 bg-green-500/50 backdrop-blur-md text-white text-xs font-bold uppercase rounded-full border border-white/20">
                                MT5
                            </span>
                        </div>
                    </div>
                    
                    <h2 className="text-2xl font-bold mb-4" style={{ color: palette.textPrimary }}>Description</h2>
                    <div className="prose dark:prose-invert max-w-none text-sm md:text-base leading-relaxed" dangerouslySetInnerHTML={{ __html: ea.description || "No description provided." }} />
                </motion.div>

                {/* Right: Actions */}
                <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-6">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none" style={{ color: palette.textPrimary }}>
                        {ea.name}
                    </h1>
                    <p className="text-xl" style={{ color: palette.textSecondary }}>{ea.tagline}</p>
                    
                    <div className="p-8 rounded-3xl mt-4" style={{ 
                        background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"}`
                    }}>
                        <div className="text-4xl font-black mb-2" style={{ color: palette.accent }}>
                            {price}<span className="text-lg font-normal text-gray-500">{billing}</span>
                        </div>
                        
                        <div className="flex flex-col gap-3 my-8">
                            <div className="flex items-center gap-3"><CheckCircle className="text-green-500" fontSize="small"/> <span>Instant Download</span></div>
                            <div className="flex items-center gap-3"><Schedule className="text-blue-500" fontSize="small"/> <span>Scheduled Access Supported</span></div>
                            <div className="flex items-center gap-3"><Lock className="text-purple-500" fontSize="small"/> <span>HWID / MetaQuotes ID Locking</span></div>
                        </div>

                        {hasAccess ? (
                            <motion.button 
                                whileTap={{ scale: 0.95 }}
                                onClick={handleDownload}
                                disabled={downloading}
                                className="w-full py-4 rounded-xl font-black text-white text-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                                style={{ background: palette.accent, opacity: downloading ? 0.7 : 1 }}
                            >
                                <Download /> {downloading ? "Downloading..." : "Download EA"}
                            </motion.button>
                        ) : (
                            <motion.button 
                                whileTap={{ scale: 0.95 }}
                                className="w-full py-4 rounded-xl font-black text-white text-lg flex items-center justify-center gap-2 shadow-lg"
                                style={{ background: palette.textPrimary, color: isDark ? "#000" : "#fff" }}
                            >
                                <ShoppingCart /> Subscribe to Access
                            </motion.button>
                        )}
                        
                        {!hasAccess && (
                            <p className="text-center text-xs mt-4" style={{ color: palette.textTertiary }}>
                                Requires an active subscription. Terms and conditions apply.
                            </p>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
