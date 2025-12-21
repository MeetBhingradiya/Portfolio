/**
 * Timeline Page
 * Redesigned with dual-theme support
 */

"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "../../Hooks/useDesignTheme";
import AdvancedNavigation from "../../Components/NewLanding/AdvancedNavigation";
import RedesignedFooter from "../../Components/NewLanding/RedesignedFooter";
import { LiquidGlassCard, LiquidGlassButton } from "../../Components/LiquidGlass";
import { OneUICard, OneUIButton, OneUIBadge } from "../../Components/OneUI";
import TimelineComponent from "../../Components/Timeline/TimelineComponent";
import TimelineFilters from "../../Components/Timeline/TimelineFilters";
import TimelineStats from "../../Components/Timeline/TimelineStats";
import { MyTimeline, TimelineItemType } from "../../Config/Timeline";
import {
    WorkOutline,
    School,
    EmojiEvents,
    Code,
    Lightbulb,
    Timeline as TimelineIcon,
    FilterList,
    Search,
    Clear,
    TrendingUp
} from "@mui/icons-material";
import Link from "next/link";

function TimelineContent() {
    const { designTheme, palette } = useDesignTheme();
    const isApple = designTheme === "apple";
    const Card = isApple ? LiquidGlassCard : OneUICard;
    const Button = isApple ? LiquidGlassButton : OneUIButton;

    const [selectedFilters, setSelectedFilters] = useState<TimelineItemType[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<"date" | "type" | "relevance">("date");
    const [showFilters, setShowFilters] = useState(false);

    // Filter and sort timeline data
    const filteredTimeline = useMemo(() => {
        let filtered = MyTimeline.filter(item => item.visiblity);

        // Apply type filters
        if (selectedFilters.length > 0) {
            filtered = filtered.filter(item => selectedFilters.includes(item.ItemType));
        }

        // Apply search query
        if (searchQuery) {
            filtered = filtered.filter(item =>
                item.Title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.Description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.Company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.University?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.Technology?.some(tech => tech.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        // Sort items - most recent first
        filtered.sort((a, b) => {
            if (sortBy === "date") {
                const convertToSortableDate = (dateStr?: string) => {
                    if (!dateStr) return "0000-00";
                    
                    if (dateStr.length === 7) {
                        const [month, year] = dateStr.split("-");
                        return `${year}-${month.padStart(2, '0')}`;
                    } else if (dateStr.length === 10) {
                        const [day, month, year] = dateStr.split("-");
                        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                    }
                    return dateStr;
                };
                
                const getRecentDate = (item: any) => {
                    if (item.isCurrent) return "2025-11";
                    
                    const endDate = convertToSortableDate(item.End);
                    const startDate = convertToSortableDate(item.Start);
                    
                    return endDate !== "0000-00" ? endDate : startDate;
                };
                
                const aDate = getRecentDate(a);
                const bDate = getRecentDate(b);
                
                const dateComparison = bDate.localeCompare(aDate);
                
                if (dateComparison === 0) {
                    if (a.isCurrent && !b.isCurrent) return -1;
                    if (!a.isCurrent && b.isCurrent) return 1;
                }
                
                return dateComparison;
            } else if (sortBy === "type") {
                return a.ItemType.localeCompare(b.ItemType);
            }
            return 0;
        });

        return filtered;
    }, [selectedFilters, searchQuery, sortBy]);

    // Calculate stats
    const stats = useMemo(() => {
        const visible = MyTimeline.filter(item => item.visiblity);
        return {
            total: visible.length,
            work: visible.filter(item => item.ItemType === TimelineItemType.Experience).length,
            education: visible.filter(item => item.ItemType === TimelineItemType.Education).length,
            achievements: visible.filter(item => item.ItemType === TimelineItemType.Award).length,
            projects: visible.filter(item => item.ItemType === TimelineItemType.Project).length,
            current: visible.filter(item => item.isCurrent).length
        };
    }, []);

    const typeIcons: Record<string, JSX.Element> = {
        [TimelineItemType.Experience]: <WorkOutline />,
        [TimelineItemType.Education]: <School />,
        [TimelineItemType.Award]: <EmojiEvents />,
        [TimelineItemType.Project]: <Code />,
        [TimelineItemType.Certification]: <Lightbulb />
    };

    const allTypes: TimelineItemType[] = [
        TimelineItemType.Experience,
        TimelineItemType.Education,
        TimelineItemType.Award,
        TimelineItemType.Project,
        TimelineItemType.Certification
    ];

    return (
        <>
            <AdvancedNavigation />

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
                        className="mb-12"
                    >
                        <h1
                            className={`${isApple ? "text-5xl md:text-6xl font-bold" : "text-6xl md:text-7xl font-black"} mb-4`}
                            style={{ color: palette.textPrimary }}
                        >
                            My Journey
                        </h1>
                        <p
                            className={`${isApple ? "text-lg" : "text-xl font-medium"} max-w-3xl`}
                            style={{ color: palette.textSecondary }}
                        >
                            Explore my professional evolution, educational milestones, and creative contributions. 
                            A personalized timeline that goes beyond LinkedIn - showcasing the real story behind the code.
                        </p>
                    </motion.div>

                    {/* Stats Cards */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
                    >
                        {[
                            { label: "Total Events", value: stats.total, icon: <TimelineIcon /> },
                            { label: "Work Experience", value: stats.work, icon: <WorkOutline /> },
                            { label: "Education", value: stats.education, icon: <School /> },
                            { label: "Achievements", value: stats.achievements, icon: <EmojiEvents /> }
                        ].map((stat, index) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4, delay: 0.2 + index * 0.05 }}
                            >
                                <Card
                                    className={isApple ? "p-6" : "p-8"}
                                    {...(isApple ? { intensity: "medium" } : { elevated: true })}
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className={`${isApple ? "p-3 rounded-xl text-2xl" : "p-4 rounded-2xl text-3xl"}`}
                                            style={{
                                                background: palette.accentSubtle,
                                                color: palette.accent
                                            }}
                                        >
                                            {stat.icon}
                                        </div>
                                        <div>
                                            <p
                                                className={`${isApple ? "text-3xl font-bold" : "text-4xl font-black"}`}
                                                style={{ color: palette.textPrimary }}
                                            >
                                                {stat.value}
                                            </p>
                                            <p
                                                className={`${isApple ? "text-xs" : "text-sm font-semibold"}`}
                                                style={{ color: palette.textSecondary }}
                                            >
                                                {stat.label}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Search & Filters */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="mb-8"
                    >
                        <Card
                            className={isApple ? "p-6" : "p-8"}
                            {...(isApple ? { intensity: "medium" } : { elevated: true })}
                        >
                            <div className="flex flex-col md:flex-row gap-4">
                                {/* Search */}
                                <div className="flex-1 relative">
                                    <Search
                                        className="absolute left-4 top-1/2 -translate-y-1/2"
                                        style={{ color: palette.textTertiary }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Search timeline events..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className={`w-full ${isApple ? "pl-12 pr-12 py-3 rounded-xl" : "pl-14 pr-14 py-4 rounded-2xl"} outline-none transition-all`}
                                        style={{
                                            background: palette.surfaceSecondary,
                                            color: palette.textPrimary,
                                            border: `2px solid ${palette.border}`
                                        }}
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery("")}
                                            className="absolute right-4 top-1/2 -translate-y-1/2"
                                        >
                                            <Clear style={{ color: palette.textTertiary }} />
                                        </button>
                                    )}
                                </div>

                                {/* Sort */}
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className={`${isApple ? "px-6 py-3 rounded-xl" : "px-8 py-4 rounded-2xl font-semibold"} outline-none cursor-pointer`}
                                    style={{
                                        background: palette.surfaceSecondary,
                                        color: palette.textPrimary,
                                        border: `2px solid ${palette.border}`
                                    }}
                                >
                                    <option value="date">Latest First</option>
                                    <option value="type">By Type</option>
                                </select>

                                {/* Filters Toggle */}
                                <Button
                                    onClick={() => setShowFilters(!showFilters)}
                                    variant="secondary"
                                    className="flex items-center gap-2"
                                >
                                    <FilterList />
                                    <span>Filters {selectedFilters.length > 0 && `(${selectedFilters.length})`}</span>
                                </Button>
                            </div>

                            {/* Filter Types */}
                            <AnimatePresence>
                                {showFilters && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="mt-4 pt-4"
                                        style={{ borderTop: `1px solid ${palette.border}` }}
                                    >
                                        <p
                                            className={`${isApple ? "text-sm font-medium" : "text-base font-bold"} mb-3`}
                                            style={{ color: palette.textSecondary }}
                                        >
                                            Filter by Type
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {allTypes.map((type) => {
                                                const isSelected = selectedFilters.includes(type);
                                                return (
                                                    <button
                                                        key={type}
                                                        onClick={() => {
                                                            if (isSelected) {
                                                                setSelectedFilters(prev => prev.filter(t => t !== type));
                                                            } else {
                                                                setSelectedFilters(prev => [...prev, type]);
                                                            }
                                                        }}
                                                        className={`flex items-center gap-2 ${isApple ? "px-4 py-2 rounded-lg" : "px-5 py-2.5 rounded-xl font-semibold"} transition-all`}
                                                        style={{
                                                            background: isSelected ? palette.accent : palette.surfaceSecondary,
                                                            color: isSelected ? "#ffffff" : palette.textSecondary,
                                                            border: `1px solid ${isSelected ? palette.accent : palette.border}`
                                                        }}
                                                    >
                                                        {typeIcons[type]}
                                                        <span>{type === TimelineItemType.Experience ? 'Experience' : type === TimelineItemType.Award ? 'Awards' : type}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {selectedFilters.length > 0 && (
                                            <button
                                                onClick={() => setSelectedFilters([])}
                                                className={`mt-3 ${isApple ? "text-sm" : "text-base font-semibold"} underline`}
                                                style={{ color: palette.accent }}
                                            >
                                                Clear all filters
                                            </button>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </Card>
                    </motion.div>

                    {/* Results Info */}
                    {(selectedFilters.length > 0 || searchQuery) && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6"
                        >
                            <p
                                className={`${isApple ? "text-sm" : "text-base font-semibold"}`}
                                style={{ color: palette.textSecondary }}
                            >
                                Showing {filteredTimeline.length} of {stats.total} events
                            </p>
                        </motion.div>
                    )}

                    {/* Timeline */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                    >
                        <AnimatePresence mode="wait">
                            {filteredTimeline.length > 0 ? (
                                <TimelineComponent
                                    key={`${selectedFilters.join()}-${searchQuery}-${sortBy}`}
                                    timeline={filteredTimeline}
                                />
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                >
                                    <Card
                                        className={`${isApple ? "p-16" : "p-20"} text-center`}
                                        {...(isApple ? { intensity: "medium" } : {})}
                                    >
                                        <Search
                                            style={{ fontSize: "4rem", color: palette.textTertiary }}
                                        />
                                        <h3
                                            className={`${isApple ? "text-2xl font-bold" : "text-3xl font-black"} mt-6 mb-3`}
                                            style={{ color: palette.textPrimary }}
                                        >
                                            No events found
                                        </h3>
                                        <p
                                            className={`${isApple ? "text-base" : "text-lg font-medium"} mb-8`}
                                            style={{ color: palette.textSecondary }}
                                        >
                                            Try adjusting your filters or search terms
                                        </p>
                                        <Button
                                            onClick={() => {
                                                setSelectedFilters([]);
                                                setSearchQuery("");
                                                setSortBy("date");
                                            }}
                                            variant="primary"
                                        >
                                            Clear All Filters
                                        </Button>
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* CTA Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="mt-16"
                    >
                        <Card
                            className={isApple ? "p-12" : "p-16"}
                            {...(isApple ? { intensity: "strong" } : { elevated: true })}
                        >
                            <div className="text-center max-w-2xl mx-auto">
                                <TrendingUp
                                    style={{ fontSize: "3rem", color: palette.accent }}
                                    className="mb-4"
                                />
                                <h2
                                    className={`${isApple ? "text-3xl font-bold" : "text-4xl font-black"} mb-4`}
                                    style={{ color: palette.textPrimary }}
                                >
                                    Ready to Collaborate?
                                </h2>
                                <p
                                    className={`${isApple ? "text-lg" : "text-xl font-medium"} mb-8`}
                                    style={{ color: palette.textSecondary }}
                                >
                                    Let&apos;s build something amazing together. My journey continues, and I&apos;d love for you to be part of it!
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Link href="/contact">
                                        <Button variant="primary">
                                            Get In Touch
                                        </Button>
                                    </Link>
                                    <Link href="/projects">
                                        <Button variant="secondary">
                                            View Projects
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </div>
            </main>

            <RedesignedFooter />
        </>
    );
}

export default function TimelinePage() {
    return <TimelineContent />;
}
