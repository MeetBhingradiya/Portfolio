"use client";

import React, { useMemo } from "react";
import { motion } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { CheckCircle, RadioButtonUnchecked } from "@mui/icons-material";

interface RoadmapItem {
    _id: string;
    title: string;
    description: string;
    status: "planned" | "completed";
    completedAt?: string;
    order: number;
}

interface RoadmapViewProps {
    planned: RoadmapItem[];
    completed: RoadmapItem[];
}

export default function RoadmapView({ planned, completed }: RoadmapViewProps) {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";

    const allItems = useMemo(() => {
        // Planned items first, then completed items
        return [...planned, ...completed];
    }, [planned, completed]);

    return (
        <div className="min-h-screen py-24 px-6 relative" style={{ background: palette.background }}>
            <div className="max-w-3xl mx-auto relative z-10">
                
                {/* Header */}
                <div className="text-center mb-20">
                    <motion.h1 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className={`mb-4 ${isApple ? "text-4xl font-bold" : "text-5xl font-black tracking-tight"}`}
                        style={{ color: palette.textPrimary }}
                    >
                        Feature Roadmap
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className={`${isApple ? "text-lg" : "text-xl font-medium"}`}
                        style={{ color: palette.textSecondary }}
                    >
                        What we're working on and what's coming next.
                    </motion.p>
                </div>

                {/* Timeline */}
                <div className="relative">
                    {/* Vertical Line */}
                    <div 
                        className="absolute left-6 md:left-[50%] top-0 bottom-0 w-px"
                        style={{ 
                            background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                            transform: "translateX(-50%)"
                        }}
                    />

                    <div className="space-y-12">
                        {allItems.map((item, index) => {
                            const isCompleted = item.status === "completed";
                            const isEven = index % 2 === 0;

                            return (
                                <motion.div 
                                    key={item._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-50px" }}
                                    transition={{ duration: 0.5, delay: index * 0.05 }}
                                    className={`relative flex flex-col md:flex-row items-center ${isEven ? "md:flex-row-reverse" : ""}`}
                                >
                                    {/* Icon / Marker */}
                                    <div 
                                        className="absolute left-6 md:left-[50%] w-10 h-10 rounded-full flex items-center justify-center z-10"
                                        style={{ 
                                            transform: "translate(-50%, 0)",
                                            background: palette.background,
                                            border: `4px solid ${palette.background}`
                                        }}
                                    >
                                        {isCompleted ? (
                                            <CheckCircle style={{ color: "#34C759", fontSize: 24 }} />
                                        ) : (
                                            <RadioButtonUnchecked style={{ color: palette.accent, fontSize: 24 }} />
                                        )}
                                    </div>

                                    {/* Content Card */}
                                    <div className="w-full md:w-[calc(50%-40px)] ml-16 md:ml-0 px-4 md:px-0">
                                        <div 
                                            className="p-6 rounded-3xl relative"
                                            style={{ 
                                                background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                                                border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"}`
                                            }}
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                <span 
                                                    className="text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
                                                    style={{ 
                                                        background: isCompleted ? "rgba(52, 199, 89, 0.15)" : `${palette.accent}20`,
                                                        color: isCompleted ? "#34C759" : palette.accent
                                                    }}
                                                >
                                                    {isCompleted ? new Date(item.completedAt!).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : "Soon™"}
                                                </span>
                                            </div>
                                            <h3 
                                                className={`text-xl mb-2 ${isApple ? "font-semibold" : "font-bold"}`}
                                                style={{ color: palette.textPrimary }}
                                            >
                                                {item.title}
                                            </h3>
                                            {item.description && (
                                                <p className="text-sm leading-relaxed" style={{ color: palette.textSecondary }}>
                                                    {item.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {allItems.length === 0 && (
                    <div className="text-center mt-20" style={{ color: palette.textTertiary }}>
                        <p>No roadmap items available yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
