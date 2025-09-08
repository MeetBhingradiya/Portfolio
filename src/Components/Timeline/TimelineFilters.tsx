"use client";

import React from "react";
import { motion } from "motion/react";
import { TimelineItemType } from "@Config/Timeline";
import { 
    FaGraduationCap, 
    FaBriefcase, 
    FaProjectDiagram, 
    FaCertificate, 
    FaBook,
    FaTrophy,
    FaCogs,
    FaHeart,
    FaLanguage,
    FaNewspaper,
    FaSearch
} from "react-icons/fa";

interface TimelineFiltersProps {
    selectedFilters: TimelineItemType[];
    onFiltersChange: (filters: TimelineItemType[]) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    sortBy: "date" | "type" | "relevance";
    onSortChange: (sort: "date" | "type" | "relevance") => void;
    totalItems: number;
}

const TimelineFilters: React.FC<TimelineFiltersProps> = ({
    selectedFilters,
    onFiltersChange,
    searchQuery,
    onSearchChange,
    totalItems
}) => {
    const filterOptions = [
        { type: TimelineItemType.Experience, icon: FaBriefcase, label: "Work", color: "bg-blue-500" },
        { type: TimelineItemType.Education, icon: FaGraduationCap, label: "Education", color: "bg-green-500" },
        { type: TimelineItemType.Project, icon: FaProjectDiagram, label: "Projects", color: "bg-purple-500" },
        { type: TimelineItemType.Certification, icon: FaCertificate, label: "Certs", color: "bg-yellow-500" },
        { type: TimelineItemType.Award, icon: FaTrophy, label: "Awards", color: "bg-orange-500" },
        { type: TimelineItemType.Skill, icon: FaCogs, label: "Skills", color: "bg-gray-500" },
    ];

    const toggleFilter = (type: TimelineItemType) => {
        if (selectedFilters.includes(type)) {
            onFiltersChange(selectedFilters.filter(f => f !== type));
        } else {
            onFiltersChange([...selectedFilters, type]);
        }
    };

    const clearAllFilters = () => {
        onFiltersChange([]);
        onSearchChange("");
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
        >
            {/* Search Bar */}
            <div className="relative mb-6">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                    type="text"
                    placeholder="Search timeline..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
            </div>

            {/* Filter Chips and Results */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                    {filterOptions.map((option) => {
                        const isSelected = selectedFilters.includes(option.type);
                        const Icon = option.icon;
                        
                        return (
                            <motion.button
                                key={option.type}
                                onClick={() => toggleFilter(option.type)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`
                                    flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all
                                    ${isSelected
                                        ? `${option.color} text-white shadow-md`
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                    }
                                `}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{option.label}</span>
                            </motion.button>
                        );
                    })}
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>{totalItems} items</span>
                    {(selectedFilters.length > 0 || searchQuery) && (
                        <button
                            onClick={clearAllFilters}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                        >
                            Clear all
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default TimelineFilters;
