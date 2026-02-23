"use client";

import React from "react";
import { motion } from "motion/react";
import { type ITimeline, TimelineItemType } from "../../Config/Timeline";
import { useDesignTheme } from "../../Hooks/useDesignTheme";
import { LiquidGlassCard } from "../LiquidGlass";
import { OneUICard, OneUIBadge } from "../OneUI";
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
    const { designTheme, colorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = colorMode === "dark";
    const Card = isApple ? LiquidGlassCard : OneUICard;
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

    return (
        <Card 
            {...(isApple ? { intensity: "medium" } : {})}
            className="group relative overflow-hidden"
        >
            {/* Gradient Background Overlay */}
            <div className={`absolute inset-0 opacity-5 bg-gradient-to-br ${getTypeColor(item.ItemType).replace('from-', 'from-').replace('to-', 'to-')}`} />
            
            <div className="relative p-6 space-y-4">
                {/* Header Section */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-3">
                        {/* Type Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r text-white text-sm font-bold shadow-lg group-hover:shadow-xl transition-all duration-300"
                            style={{
                                background: `linear-gradient(135deg, var(--accent-500), var(--accent-600))`
                            }}
                        >
                            <span className="text-base">{getTypeIcon(item.ItemType)}</span>
                            <span className="capitalize">{item.ItemType.toLowerCase()}</span>
                        </div>

                        {/* Title */}
                        <h3 className={`font-${isApple ? 'bold' : 'black'} text-xl ${isDark ? 'text-white' : 'text-gray-900'} leading-tight tracking-tight group-hover:text-accent-500 transition-colors duration-300`}>
                            {item.Title}
                        </h3>
                        
                        {/* Company/University */}
                        {(item.Company || item.University) && (
                            <p className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {item.Company || item.University}
                            </p>
                        )}
                    </div>

                    {/* Logo Container */}
                    {item.Logo && (
                        <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className={`flex-shrink-0 w-16 h-16 rounded-${isApple ? 'xl' : '2xl'} ${
                                isDark ? 'bg-gray-800' : 'bg-white'
                            } shadow-lg flex items-center justify-center p-2 transition-all duration-300 ${
                                item.isCurrent 
                                    ? 'border-2 border-green-500 ring-4 ring-green-500/20 animate-pulse' 
                                    : `border ${isDark ? 'border-gray-700' : 'border-gray-200'} hover:border-accent-500`
                            }`}
                        >
                            {typeof item.Logo === "string" ? (
                                <img
                                    src={item.Logo}
                                    alt="Logo"
                                    className="w-full h-full object-contain rounded-lg"
                                />
                            ) : (
                                item.Logo
                            )}
                        </motion.div>
                    )}
                </div>

                {/* Role/Specialization Badge */}
                {(item.Role || item.Specialization) && (
                    <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-accent-500/10 ${isDark ? 'text-accent-400' : 'text-accent-600'} border border-accent-500/20`}>
                        {item.Role || item.Specialization}
                    </div>
                )}

                {/* Description */}
                <p className={`text-${isApple ? '[15px]' : 'base'} leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {item.Description}
                </p>

                {/* Grade/Proficiency */}
                {(item.Grade || item.Proficiency !== undefined) && (
                    <div className={`flex items-center gap-3 p-3 rounded-${isApple ? 'xl' : '2xl'} ${
                        isDark ? 'bg-gray-800/60' : 'bg-gray-50'
                    } border ${isDark ? 'border-gray-700/60' : 'border-gray-200/60'}`}>
                        <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                        <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {item.Grade ? "Grade:" : "Proficiency:"}
                        </span>
                        <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {item.Grade || `${item.Proficiency}%`}
                        </span>
                    </div>
                )}

                {/* Technologies */}
                {item.Technology && item.Technology.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {item.Technology.map((tech, index) => (
                            <motion.span
                                key={index}
                                whileHover={{ scale: 1.05, y: -2 }}
                                className={`inline-flex items-center px-3 py-1.5 rounded-${isApple ? 'lg' : 'xl'} text-xs font-${isApple ? 'medium' : 'bold'} ${
                                    isDark 
                                        ? 'bg-gray-700 text-gray-300 border-gray-600' 
                                        : 'bg-gray-100 text-gray-700 border-gray-300'
                                } border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer`}
                            >
                                {tech}
                            </motion.span>
                        ))}
                    </div>
                )}

                {/* Location */}
                {item.Location?.Address && (
                    <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            isDark ? 'bg-red-900/30 border-red-700/50' : 'bg-red-100 border-red-200/50'
                        } border`}>
                            <span className="text-red-500 text-xs">📍</span>
                        </div>
                        <span className="font-medium">{item.Location.Address}</span>
                    </div>
                )}

                {/* Actions Bar */}
                {(item.Link || item.CompanySocials || item.UniversitySocials) && (
                    <div className={`flex items-center justify-between pt-4 border-t ${isDark ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
                        {/* Social Links */}
                        {(item.CompanySocials || item.UniversitySocials) && (
                            <div className="flex gap-2">
                                {(item.CompanySocials || item.UniversitySocials)?.map((social, index) => (
                                    <motion.a
                                        key={index}
                                        href={social.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`w-10 h-10 rounded-${isApple ? 'lg' : 'xl'} flex items-center justify-center transition-all duration-200 ${
                                            isDark 
                                                ? 'bg-gray-800 hover:bg-gray-700 border-gray-700' 
                                                : 'bg-gray-100 hover:bg-gray-200 border-gray-300'
                                        } border shadow-sm hover:shadow-md`}
                                    >
                                        {typeof social.icon === "string" ? (
                                            <img src={social.icon} alt="Social" className="w-5 h-5" />
                                        ) : (
                                            social.icon
                                        )}
                                    </motion.a>
                                ))}
                            </div>
                        )}

                        {/* Main Link */}
                        {item.Link && (
                            <motion.a
                                href={item.Link}
                                target="_blank"
                                rel="noopener noreferrer"
                                whileHover={{ scale: 1.05, x: 5 }}
                                whileTap={{ scale: 0.95 }}
                                className={`inline-flex items-center gap-2 px-${isApple ? '4' : '6'} py-${isApple ? '2.5' : '3'} rounded-${isApple ? 'lg' : 'xl'} font-${isApple ? 'medium' : 'bold'} text-sm text-white shadow-lg hover:shadow-xl transition-all duration-200`}
                                style={{
                                    background: 'linear-gradient(135deg, var(--accent-500), var(--accent-600))'
                                }}
                            >
                                <span>Learn More</span>
                                <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                            </motion.a>
                        )}
                    </div>
                )}

                {/* Current Badge */}
                {item.isCurrent && !item.Logo && (
                    <div className="absolute top-6 right-6">
                        <motion.div
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className={`inline-flex items-center gap-2 bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-${isApple ? 'semibold' : 'bold'} shadow-lg`}
                        >
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                            <span>Current</span>
                        </motion.div>
                    </div>
                )}

                {/* Image Gallery */}
                {item.Images && item.Images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                        {item.Images.slice(0, 3).map((image, index) => (
                            <motion.div
                                key={index}
                                whileHover={{ scale: 1.05, zIndex: 10 }}
                                className="relative group/img cursor-pointer"
                            >
                                <img
                                    src={image}
                                    alt={`${item.Title} ${index + 1}`}
                                    className={`w-full h-24 object-cover rounded-${isApple ? 'lg' : 'xl'} border ${
                                        isDark ? 'border-gray-700' : 'border-gray-200'
                                    } shadow-md group-hover/img:shadow-xl transition-all duration-300`}
                                />
                                <div className={`absolute inset-0 bg-black/0 group-hover/img:bg-black/40 rounded-${isApple ? 'lg' : 'xl'} transition-all duration-300 flex items-center justify-center`}>
                                    <div className="opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 text-white text-xs font-bold bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
                                        View
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        {item.Images.length > 3 && (
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className={`w-full h-24 rounded-${isApple ? 'lg' : 'xl'} flex items-center justify-center text-sm font-${isApple ? 'medium' : 'bold'} border shadow-sm hover:shadow-md transition-all cursor-pointer ${
                                    isDark 
                                        ? 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700' 
                                        : 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200'
                                }`}
                            >
                                +{item.Images.length - 3} more
                            </motion.div>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
};

export default TimelineItemCard;
