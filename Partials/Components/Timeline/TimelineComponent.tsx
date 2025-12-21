"use client";

import React from "react";
import { motion } from "motion/react";
import TimelineItem from "./TimelineItem";
import { type ITimeline } from "../../Config/Timeline";

interface TimelineComponentProps {
    timeline: ITimeline[];
}

const TimelineComponent: React.FC<TimelineComponentProps> = ({ timeline }) => {
    return (
        <div className="relative">
            {/* Journey Continues Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center mb-16"
            >
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    The journey continues...
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Always learning, always growing 🚀
                </p>
            </motion.div>

            {/* Timeline Start Indicator */}
            <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="relative flex justify-center mb-8"
            >
                <div className="absolute left-4 md:left-1/2 transform md:-translate-x-1/2 w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-lg">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                </div>
            </motion.div>

            {/* Timeline Line */}
            <div className="absolute left-4 md:left-1/2 transform md:-translate-x-px top-32 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-blue-500"></div>
            
            {/* Timeline Items */}
            <div className="space-y-16">
                {timeline.map((item, index) => (
                    <motion.div
                        key={`${item.Title}-${index}`}
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ 
                            delay: index * 0.1,
                            duration: 0.5,
                            ease: "easeOut"
                        }}
                    >
                        <TimelineItem 
                            item={item} 
                            index={index}
                            isLeft={index % 2 === 0}
                        />
                    </motion.div>
                ))}
            </div>

            {/* Timeline ending with a simple dot */}
            {timeline.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: timeline.length * 0.1 + 0.3 }}
                    className="relative flex justify-center mt-12"
                >
                    <div className="absolute left-4 md:left-1/2 transform md:-translate-x-1/2 w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-md"></div>
                </motion.div>
            )}
        </div>
    );
};

export default TimelineComponent;
