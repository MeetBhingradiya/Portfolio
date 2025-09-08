"use client";

import React from "react";
import { motion } from "motion/react";
import { type ITimeline, TimelineItemType } from "@Config/Timeline";
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
    FaNewspaper
} from "react-icons/fa";

interface TimelineItemCardProps {
    item: ITimeline;
    isLeft: boolean;
}

const TimelineItemCard: React.FC<TimelineItemCardProps> = ({ item, isLeft }) => {
    const getTypeIcon = (type: TimelineItemType) => {
        const iconProps = { className: "w-5 h-5" };

        switch (type) {
            case TimelineItemType.Education:
                return <FaGraduationCap {...iconProps} />;
            case TimelineItemType.Experience:
                return <FaBriefcase {...iconProps} />;
            case TimelineItemType.Project:
                return <FaProjectDiagram {...iconProps} />;
            case TimelineItemType.Certification:
                return <FaCertificate {...iconProps} />;
            case TimelineItemType.Course:
                return <FaBook {...iconProps} />;
            case TimelineItemType.Award:
                return <FaTrophy {...iconProps} />;
            case TimelineItemType.Skill:
                return <FaCogs {...iconProps} />;
            case TimelineItemType.Volunteer:
                return <FaHeart {...iconProps} />;
            case TimelineItemType.Language:
                return <FaLanguage {...iconProps} />;
            case TimelineItemType.Publication:
                return <FaNewspaper {...iconProps} />;
            default:
                return <FaCogs {...iconProps} />;
        }
    };

    const getTypeColor = (type: TimelineItemType) => {
        switch (type) {
            case TimelineItemType.Education:
                return "from-green-500 to-emerald-500";
            case TimelineItemType.Experience:
                return "from-blue-500 to-blue-600";
            case TimelineItemType.Project:
                return "from-purple-500 to-violet-500";
            case TimelineItemType.Certification:
                return "from-yellow-500 to-orange-500";
            case TimelineItemType.Course:
                return "from-indigo-500 to-blue-500";
            case TimelineItemType.Award:
                return "from-yellow-400 to-yellow-600";
            case TimelineItemType.Skill:
                return "from-gray-500 to-gray-600";
            case TimelineItemType.Volunteer:
                return "from-pink-500 to-rose-500";
            case TimelineItemType.Language:
                return "from-teal-500 to-cyan-500";
            case TimelineItemType.Publication:
                return "from-slate-500 to-gray-600";
            default:
                return "from-blue-500 to-purple-500";
        }
    };

    const getBackgroundPattern = (type: TimelineItemType) => {
        // Consistent background patterns for all types
        switch (type) {
            case TimelineItemType.Experience:
                return "bg-gradient-to-br from-blue-50/80 to-blue-100/80 dark:from-blue-900/10 dark:to-blue-800/10";
            case TimelineItemType.Education:
                return "bg-gradient-to-br from-green-50/80 to-green-100/80 dark:from-green-900/10 dark:to-green-800/10";
            case TimelineItemType.Project:
                return "bg-gradient-to-br from-purple-50/80 to-purple-100/80 dark:from-purple-900/10 dark:to-purple-800/10";
            case TimelineItemType.Skill:
                return "bg-gradient-to-br from-gray-50/80 to-gray-100/80 dark:from-gray-900/10 dark:to-gray-800/10";
            case TimelineItemType.Volunteer:
                return "bg-gradient-to-br from-pink-50/80 to-pink-100/80 dark:from-pink-900/10 dark:to-pink-800/10";
            default:
                return "bg-gradient-to-br from-gray-50/80 to-white/80 dark:from-gray-900/20 dark:to-gray-800/20";
        }
    };

    return (
        <motion.div
            whileHover={{
                y: -8,
                scale: 1.01,
                transition: { duration: 0.2 }
            }}
            className="relative group"
        >
            {/* Glow effect */}
            <div className={`absolute -inset-0.5 bg-gradient-to-r ${getTypeColor(item.ItemType)} rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-300`}></div>

            {/* Main card */}
            <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-200/60 dark:border-gray-700/60 overflow-hidden shadow-xl">
                {/* Enhanced header with better spacing */}
                <div className="relative p-6 pb-4 bg-gradient-to-br from-white/50 to-gray-50/50 dark:from-gray-800/50 dark:to-gray-900/50">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                            {/* Type badge with improved styling */}
                            <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${getTypeColor(item.ItemType)} text-white text-sm font-medium mb-4 shadow-lg hover:shadow-xl transition-shadow duration-300`}>
                                {getTypeIcon(item.ItemType)}
                                <span className="capitalize font-semibold">{item.ItemType.toLowerCase()}</span>
                            </div>

                            {/* Title with better typography */}
                            <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2 leading-tight tracking-tight">
                                {item.Title}
                            </h3>
                            {(item.Company || item.University) && (
                                <p className="text-gray-600 dark:text-gray-300 font-medium mb-1 text-base">
                                    {item.Company || item.University}
                                </p>
                            )}
                        </div>

                        {/* Enhanced logo container */}
                        {item.Logo && (
                            <div className={`w-16 h-16 bg-white dark:bg-gray-900 rounded-xl shadow-lg flex items-center justify-center ml-4 transition-all duration-300 ${
                                item.isCurrent 
                                    ? 'border-2 border-green-400 ring-2 ring-green-400/20 animate-pulse hover:ring-green-400/40' 
                                    : 'border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}>
                                {typeof item.Logo === "string" ? (
                                    <img
                                        src={item.Logo}
                                        alt="Logo"
                                        className="w-10 h-10 object-contain rounded-lg"
                                    />
                                ) : (
                                    item.Logo
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Enhanced content section */}
                <div className={`px-6 bg-white/60 dark:bg-gray-900/60 ${(item.Link || item.CompanySocials || item.UniversitySocials) ? 'pb-4' : 'pb-6'}`}>
                    {/* Role/Specialization with better styling */}
                    {(item.Role || item.Specialization) && (
                        <div className="mb-3">
                            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/50 shadow-sm">
                                {item.Role || item.Specialization}
                            </span>
                        </div>
                    )}

                    {/* Enhanced description */}
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4 text-[15px] font-normal">
                        {item.Description}
                    </p>

                    {/* Enhanced Grade/Proficiency */}
                    {(item.Grade || item.Proficiency !== undefined) && (
                        <div className="mb-4">
                            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/60 dark:to-gray-800/40 rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm">
                                <div className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-sm"></div>
                                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                    {item.Grade ? "Grade:" : "Proficiency:"}
                                </span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    {item.Grade || `${item.Proficiency}%`}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Enhanced Technologies */}
                    {item.Technology && item.Technology.length > 0 && (
                        <div className="mb-4">
                            <div className="flex flex-wrap gap-2">
                                {item.Technology.map((tech, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 border border-gray-300/50 dark:border-gray-600/50 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200"
                                    >
                                        {tech}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Enhanced Location */}
                    {item.Location?.Address && (
                        <div className={`flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 ${(item.Link || item.CompanySocials || item.UniversitySocials) ? 'mb-3' : 'mb-0'}`}>
                            <div className="w-4 h-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center border border-red-200/50 dark:border-red-700/50">
                                <span className="text-red-500 text-xs">📍</span>
                            </div>
                            <span className="font-medium">{item.Location.Address}</span>
                        </div>
                    )}

                    {/* Enhanced Actions bar */}
                    {(item.Link || item.CompanySocials || item.UniversitySocials) && (
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
                            <div className="flex space-x-2">
                                {/* Enhanced Company/University Socials */}
                                {(item.CompanySocials || item.UniversitySocials) && (
                                    <div className="flex space-x-2">
                                        {(item.CompanySocials || item.UniversitySocials)?.map((social, index) => (
                                            <a
                                                key={index}
                                                href={social.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-9 h-9 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg flex items-center justify-center hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-200 border border-gray-300/50 dark:border-gray-600/50 hover:scale-110 shadow-sm hover:shadow-md"
                                            >
                                                {typeof social.icon === "string" ? (
                                                    <img src={social.icon} alt="Social" className="w-4 h-4" />
                                                ) : (
                                                    social.icon
                                                )}
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Enhanced Main Link */}
                            {item.Link && (
                                <a
                                    href={item.Link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium text-sm hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105"
                                >
                                    <span>Learn More</span>
                                    <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                                </a>
                            )}
                        </div>
                    )}
                </div>

                {/* Enhanced Current Badge - positioned consistently */}
                {item.isCurrent && !item.Logo && (
                    <div className="absolute top-4 right-4 z-10">
                        <div className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-green-400 to-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg animate-pulse hover:shadow-xl transition-shadow duration-300">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                            <span>Current</span>
                        </div>
                    </div>
                )}

                {/* Enhanced Image Gallery */}
                {item.Images && item.Images.length > 0 && (
                    <div className="px-6 pb-4 bg-white/60 dark:bg-gray-900/60">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {item.Images.slice(0, 3).map((image, index) => (
                                <div key={index} className="relative group cursor-pointer">
                                    <img
                                        src={image}
                                        alt={`${item.Title} ${index + 1}`}
                                        className="w-full h-20 object-cover rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200/60 dark:border-gray-700/60 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-all duration-300 flex items-center justify-center">
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-xs font-medium">
                                            View
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {item.Images.length > 3 && (
                                <div className="w-full h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm font-medium border border-gray-300/60 dark:border-gray-600/60 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all cursor-pointer hover:scale-105 shadow-sm hover:shadow-md">
                                    +{item.Images.length - 3} more
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default TimelineItemCard;
