"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { Close as CloseIcon, Download as DownloadIcon, CircularProgress } from "@mui/icons-material";
import { generateResumePdf } from "@/Utils/generateResumePdf";

interface ResumePreset {
    key: string;
    label: string;
    iconKey: string;
    header: any;
    sectionOrder: any[];
    style: any;
    isPublished?: boolean;
}

interface ResumeDownloadModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ResumeDownloadModal({ isOpen, onClose }: ResumeDownloadModalProps) {
    const { palette, isDark, isApple } = useDesignTheme();
    
    const [presets, setPresets] = useState<ResumePreset[]>([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchPresets();
        }
    }, [isOpen]);

    const fetchPresets = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/resume-presets/published");
            const json = await res.json();
            if (json.success) {
                setPresets(json.data);
                if (json.data.length > 0) {
                    setSelectedPreset(json.data[0].key);
                }
            } else {
                setError(json.error || "Failed to load presets");
            }
        } catch (err: any) {
            setError(err.message || "Failed to load presets");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!selectedPreset) return;
        setGenerating(true);
        setError(null);
        try {
            const res = await fetch(`/api/resume-presets/published/${selectedPreset}/data`);
            const json = await res.json();
            if (json.success) {
                const { preset, populatedData } = json.data;
                await generateResumePdf(preset.header, populatedData, preset.sectionOrder, preset.style);
                onClose();
            } else {
                setError(json.error || "Failed to fetch preset data");
            }
        } catch (err: any) {
            setError(err.message || "Failed to generate PDF");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <motion.div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.div
                        className="relative w-full max-w-sm overflow-hidden flex flex-col"
                        style={{
                            background: isApple ? (isDark ? "rgba(28,28,32,0.85)" : "rgba(255,255,255,0.85)") : palette.background,
                            backdropFilter: isApple ? "blur(32px)" : "none",
                            border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                            borderRadius: 24,
                            boxShadow: "0 24px 48px rgba(0,0,0,0.2)"
                        }}
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}>
                        
                        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}>
                            <h2 className="text-lg font-semibold" style={{ color: palette.textPrimary }}>Download Resume</h2>
                            <button onClick={onClose} className="opacity-70 hover:opacity-100 transition-opacity" style={{ color: palette.textPrimary }}>
                                <CloseIcon fontSize="small" />
                            </button>
                        </div>

                        <div className="p-5 flex flex-col gap-4">
                            {loading ? (
                                <div className="py-8 flex justify-center">
                                    <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: palette.accent, borderTopColor: "transparent" }} />
                                </div>
                            ) : error ? (
                                <div className="text-sm text-red-500 py-4 text-center">{error}</div>
                            ) : presets.length === 0 ? (
                                <div className="text-sm py-4 text-center" style={{ color: palette.textSecondary }}>No published presets found.</div>
                            ) : (
                                <>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-medium" style={{ color: palette.textSecondary }}>
                                            Select Profile
                                        </label>
                                        <div className="flex flex-col gap-2">
                                            {presets.map((preset) => (
                                                <div 
                                                    key={preset.key}
                                                    onClick={() => setSelectedPreset(preset.key)}
                                                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all"
                                                    style={{
                                                        background: selectedPreset === preset.key ? (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)") : "transparent",
                                                        borderColor: selectedPreset === preset.key ? palette.accent : (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"),
                                                    }}>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium" style={{ color: palette.textPrimary }}>
                                                            {preset.label}
                                                        </div>
                                                        <div className="text-xs truncate opacity-70" style={{ color: palette.textSecondary }}>
                                                            {preset.header?.title || "Resume"}
                                                        </div>
                                                    </div>
                                                    <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors"
                                                         style={{ 
                                                            borderColor: selectedPreset === preset.key ? palette.accent : (isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"),
                                                            background: selectedPreset === preset.key ? palette.accent : "transparent"
                                                         }}>
                                                        {selectedPreset === preset.key && (
                                                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <motion.button
                                        onClick={handleDownload}
                                        disabled={generating || !selectedPreset}
                                        className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 mt-2"
                                        style={{ background: palette.accent, color: "#fff", opacity: (generating || !selectedPreset) ? 0.7 : 1 }}
                                        whileTap={{ scale: 0.98 }}>
                                        {generating ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Generating PDF...
                                            </>
                                        ) : (
                                            <>
                                                <DownloadIcon fontSize="small" /> Download PDF
                                            </>
                                        )}
                                    </motion.button>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
