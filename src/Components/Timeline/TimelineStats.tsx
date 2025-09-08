"use client";

import React, { useMemo } from "react";
import { motion } from "motion/react";
import { type ITimeline, TimelineItemType } from "@Config/Timeline";
import { 
    FaGraduationCap, 
    FaBriefcase, 
    FaProjectDiagram, 
    FaCertificate,
    FaChartLine,
    FaCalendarAlt,
    FaTrophy,
    FaCode
} from "react-icons/fa";

interface TimelineStatsProps {
    timeline: ITimeline[];
}

const TimelineStats: React.FC<TimelineStatsProps> = ({ timeline }) => {
    const stats = useMemo(() => {
        const visibleItems = timeline.filter(item => item.visiblity);
        
        // Count by type
        const typeCounts = visibleItems.reduce((acc, item) => {
            acc[item.ItemType] = (acc[item.ItemType] || 0) + 1;
            return acc;
        }, {} as Record<TimelineItemType, number>);

        // Calculate years of experience
        const experienceItems = visibleItems.filter(item => item.ItemType === TimelineItemType.Experience);
        const yearsOfExperience = experienceItems.reduce((total, item) => {
            if (!item.Start) return total;
            
            const startYear = parseInt(item.Start.split("-")[1] || item.Start.split("-")[0]);
            const endYear = item.isCurrent 
                ? new Date().getFullYear() 
                : item.End 
                    ? parseInt(item.End.split("-")[1] || item.End.split("-")[0])
                    : startYear;
            
            return total + (endYear - startYear + 1);
        }, 0);

        // Count technologies
        const allTechnologies = new Set<string>();
        visibleItems.forEach(item => {
            item.Technology?.forEach(tech => allTechnologies.add(tech));
        });

        // Calculate completion rate for current items
        const currentItems = visibleItems.filter(item => item.isCurrent).length;
        
        return {
            total: visibleItems.length,
            experience: typeCounts[TimelineItemType.Experience] || 0,
            education: typeCounts[TimelineItemType.Education] || 0,
            projects: typeCounts[TimelineItemType.Project] || 0,
            certifications: typeCounts[TimelineItemType.Certification] || 0,
            awards: typeCounts[TimelineItemType.Award] || 0,
            yearsOfExperience,
            technologies: allTechnologies.size,
            currentItems
        };
    }, [timeline]);

    const statCards = [
        {
            icon: FaChartLine,
            label: "Total Items",
            value: stats.total,
            color: "from-blue-500 to-cyan-500",
            description: "Milestones achieved"
        },
        {
            icon: FaBriefcase,
            label: "Experience",
            value: `${stats.yearsOfExperience}+ years`,
            color: "from-green-500 to-emerald-500",
            description: `${stats.experience} positions`
        },
        {
            icon: FaGraduationCap,
            label: "Education",
            value: stats.education,
            color: "from-purple-500 to-violet-500",
            description: "Academic achievements"
        },
        {
            icon: FaProjectDiagram,
            label: "Projects",
            value: stats.projects,
            color: "from-orange-500 to-red-500",
            description: "Built & shipped"
        },
        {
            icon: FaCertificate,
            label: "Certifications",
            value: stats.certifications,
            color: "from-yellow-500 to-orange-500",
            description: "Professional credentials"
        },
        {
            icon: FaTrophy,
            label: "Awards",
            value: stats.awards,
            color: "from-pink-500 to-rose-500",
            description: "Recognition received"
        },
        {
            icon: FaCode,
            label: "Technologies",
            value: stats.technologies,
            color: "from-indigo-500 to-purple-500",
            description: "Tools & frameworks"
        },
        {
            icon: FaCalendarAlt,
            label: "Current",
            value: stats.currentItems,
            color: "from-teal-500 to-cyan-500",
            description: "Ongoing activities"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, index) => {
                const Icon = stat.icon;
                
                return (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ 
                            delay: index * 0.1,
                            type: "spring",
                            stiffness: 300,
                            damping: 20
                        }}
                        whileHover={{ 
                            scale: 1.05,
                            boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
                        }}
                        className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
                    >
                        {/* Background Gradient */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5`}></div>
                        
                        {/* Content */}
                        <div className="relative p-6">
                            {/* Icon */}
                            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-r ${stat.color} text-white mb-4`}>
                                <Icon className="w-6 h-6" />
                            </div>

                            {/* Value */}
                            <div className="mb-2">
                                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                                    {stat.value}
                                </div>
                                <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                                    {stat.label}
                                </div>
                            </div>

                            {/* Description */}
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                {stat.description}
                            </div>

                            {/* Decorative Element */}
                            <div className={`absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-10 rounded-full`}></div>
                        </div>

                        {/* Progress Indicator */}
                        <div className="absolute bottom-0 left-0 right-0 h-1">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ delay: index * 0.1 + 0.5, duration: 0.8 }}
                                className={`h-full bg-gradient-to-r ${stat.color}`}
                            ></motion.div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default TimelineStats;
