"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import TimelineComponent from "../../Components/Timeline/TimelineComponent";
import TimelineFilters from "../../Components/Timeline/TimelineFilters";
import TimelineStats from "../../Components/Timeline/TimelineStats";
import { MyTimeline, TimelineItemType } from "@Config/Timeline";
import Link from "next/link";

export default function TimelinePage() {
    const [selectedFilters, setSelectedFilters] = useState<TimelineItemType[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<"date" | "type" | "relevance">("date");

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
                // Convert dates to comparable format and get the latest date for each item
                const convertToSortableDate = (dateStr?: string) => {
                    if (!dateStr) return "0000-00";
                    
                    if (dateStr.length === 7) { // MM-YYYY format
                        const [month, year] = dateStr.split("-");
                        return `${year}-${month.padStart(2, '0')}`;
                    } else if (dateStr.length === 10) { // DD-MM-YYYY format
                        const [day, month, year] = dateStr.split("-");
                        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                    }
                    return dateStr;
                };
                
                // Get the most recent date for comparison
                const getRecentDate = (item: any) => {
                    // For current items, use current date (2025-09)
                    if (item.isCurrent) return "2025-09";
                    
                    const endDate = convertToSortableDate(item.End);
                    const startDate = convertToSortableDate(item.Start);
                    
                    // Use end date if available, otherwise start date
                    return endDate !== "0000-00" ? endDate : startDate;
                };
                
                const aDate = getRecentDate(a);
                const bDate = getRecentDate(b);
                
                // Sort by date descending (most recent first)
                const dateComparison = bDate.localeCompare(aDate);
                
                // If dates are the same, prioritize current items
                if (dateComparison === 0) {
                    if (a.isCurrent && !b.isCurrent) return -1;
                    if (!a.isCurrent && b.isCurrent) return 1;
                }
                
                return dateComparison;
            } else if (sortBy === "type") {
                return a.ItemType.localeCompare(b.ItemType);
            }
            return 0; // relevance sorting can be implemented later
        });

        return filtered;
    }, [selectedFilters, searchQuery, sortBy]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
            {/* Hero Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white"
            >
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-center"
                    >
                        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                            My Journey
                        </h1>
                        <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
                            Explore my professional evolution, educational milestones, and creative contributions. 
                            A personalized timeline that goes beyond LinkedIn - showcasing the real story behind the code.
                        </p>
                        <div className="mt-8 flex items-center justify-center space-x-4 text-sm text-blue-200">
                            <span className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span>Currently Building Amazing Things</span>
                            </span>
                        </div>
                    </motion.div>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute top-20 left-10 w-20 h-20 bg-blue-400/20 rounded-full blur-xl animate-pulse"></div>
                <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
            </motion.div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Stats Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-12"
                >
                    <TimelineStats timeline={MyTimeline} />
                </motion.div>

                {/* Filters and Search */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mb-12"
                >
                    <TimelineFilters
                        selectedFilters={selectedFilters}
                        onFiltersChange={setSelectedFilters}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        sortBy={sortBy}
                        onSortChange={setSortBy}
                        totalItems={filteredTimeline.length}
                    />
                </motion.div>

                {/* Timeline */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <AnimatePresence mode="wait">
                        <TimelineComponent
                            key={`${selectedFilters.join()}-${searchQuery}-${sortBy}`}
                            timeline={filteredTimeline}
                        />
                    </AnimatePresence>
                </motion.div>

                {/* Empty State */}
                {filteredTimeline.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-20"
                    >
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                            No items found
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            Try adjusting your filters or search terms
                        </p>
                        <button
                            onClick={() => {
                                setSelectedFilters([]);
                                setSearchQuery("");
                                setSortBy("date");
                            }}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Clear All Filters
                        </button>
                    </motion.div>
                )}
            </div>

            {/* Call to Action */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16 mt-20"
            >
                <div className="max-w-4xl mx-auto text-center px-4">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Ready to Collaborate?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8">
                        Let&apos;s build something amazing together. My journey continues, and I&apos;d love for you to be part of it!
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href={"/contact"} className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                            Get In Touch
                        </Link>
                        <Link href="/projects">
                            <button className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
                                View Projects
                            </button>
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
