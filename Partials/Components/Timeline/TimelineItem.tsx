"use client";

import React from "react";
import { motion } from "motion/react";
import TimelineItemCard from "./TimelineItemCard";
import { type ITimeline } from "../../Config/Timeline";

interface TimelineItemProps {
    item: ITimeline;
    index: number;
    isLeft: boolean;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ item, index, isLeft }) => {
    const formatDate = (dateString?: string) => {
        if (!dateString) return "";
        
        // Handle MM-YYYY format
        if (dateString.length === 7) {
            const [month, year] = dateString.split("-");
            const monthNames = [
                "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
            ];
            return `${monthNames[parseInt(month) - 1]} ${year}`;
        }
        
        // Handle DD-MM-YYYY format
        if (dateString.length === 10) {
            const [day, month, year] = dateString.split("-");
            return `${day}/${month}/${year}`;
        }
        
        return dateString;
    };

    const getDateRange = () => {
        const start = formatDate(item.Start);
        const end = item.isCurrent ? "Present" : formatDate(item.End);
        
        if (start && end) {
            return `${start} - ${end}`;
        } else if (start) {
            return start;
        } else if (end) {
            return end;
        }
        return "";
    };

    return (
        <div className="relative">
            {/* Desktop Layout (>= md) */}
            <div className="hidden md:block">
                <div className={`flex items-center ${isLeft ? 'justify-end' : 'justify-start'}`}>
                    <div className={`w-1/2 ${isLeft ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                        {isLeft && (
                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <TimelineItemCard item={item} isLeft={true} />
                            </motion.div>
                        )}
                    </div>

                    {/* Timeline Node */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ 
                            delay: 0.3,
                            type: "spring",
                            stiffness: 300,
                            damping: 20
                        }}
                        className="relative z-10 flex items-center justify-center w-6 h-6 bg-white dark:bg-gray-800 rounded-full border-4 border-blue-500 shadow-lg"
                    >
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </motion.div>

                    <div className={`w-1/2 ${isLeft ? 'pl-8 text-left' : 'pl-8 text-left'}`}>
                        {!isLeft && (
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <TimelineItemCard item={item} isLeft={false} />
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Date Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="absolute left-1/2 transform -translate-x-1/2 -top-10"
                >
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                        {getDateRange()}
                    </div>
                </motion.div>
            </div>

            {/* Mobile Layout (< md) */}
            <div className="block md:hidden">
                <div className="flex items-start">
                    {/* Timeline Node */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ 
                            delay: 0.3,
                            type: "spring",
                            stiffness: 300,
                            damping: 20
                        }}
                        className="relative z-10 flex items-center justify-center w-6 h-6 bg-white dark:bg-gray-800 rounded-full border-4 border-blue-500 shadow-lg mt-2"
                    >
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </motion.div>

                    {/* Content */}
                    <div className="flex-1 ml-6">
                        {/* Date Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="mb-4"
                        >
                            <div className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                                {getDateRange()}
                            </div>
                        </motion.div>

                        {/* Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <TimelineItemCard item={item} isLeft={false} />
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimelineItem;
