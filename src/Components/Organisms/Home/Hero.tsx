/**
 * Advanced Hero Section
 * Optimized for recruiters and HR managers
 * Supports both Apple Liquid Glass and Samsung One UI 7 themes
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { LiquidGlassCard, LiquidGlassButton } from "@Components/Atoms/LiquidGlass/index";
import { OneUICard, OneUIButton, OneUIBadge } from "@Components/Atoms/OneUI/index";
import ResumeDownloadModal from "@Components/Tools/ResumeDownloadModal";
import { GitHub, LinkedIn, Email, Download, ArrowForward, LocationOn, Code, Work, Star, TrendingUp, Schedule } from "@mui/icons-material";

const roles = [
    "Full Stack Developer",
    "Product Engineer",
    "Project Manager",
    "DevOps Engineer",
    "System Architect",
    "Open Source Contributor"
];

const keyHighlights = [
    {
        icon: <Work />,
        label: "Available",
        value: "Full Stack Role",
        color: "#34C759"
    },
    {
        icon: <Star />,
        label: "Experience",
        value: "3+ Years",
        color: "#007AFF"
    },
    {
        icon: <Code />,
        label: "Projects",
        value: "5+ Major",
        color: "#AF52DE"
    },
    {
        icon: <TrendingUp />,
        label: "Code Quality",
        value: "100k+ Lines",
        color: "#FF9500"
    }
];

const expertise = ["React & Next.js", "TypeScript", "Node.js", "Python", "DevOps", "System Design", "Cloud Architecture", "Security"];

export default function ModernHero() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const [currentRoleIndex, setCurrentRoleIndex] = useState(0);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);

    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentRoleIndex((prev) => (prev + 1) % roles.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({
                x: (e.clientX / window.innerWidth) * 100,
                y: (e.clientY / window.innerHeight) * 100
            });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    const Card = isApple ? LiquidGlassCard : OneUICard;
    const Button = isApple ? LiquidGlassButton : OneUIButton;

    return (
        <section
            className="relative min-h-screen flex items-center overflow-hidden"
            style={{
                background: isApple
                    ? `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, ${palette.accentSubtle} 0%, ${palette.background} 50%)`
                    : palette.background
            }}>
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {isApple ? (
                    <>
                        {/* Liquid Glass Orbs */}
                        <motion.div
                            className="absolute w-96 h-96 rounded-full opacity-20"
                            style={{
                                background: `radial-gradient(circle, ${palette.accent} 0%, transparent 70%)`,
                                filter: "blur(60px)",
                                top: "10%",
                                right: "10%"
                            }}
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.2, 0.3, 0.2]
                            }}
                            transition={{
                                duration: 8,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                        <motion.div
                            className="absolute w-96 h-96 rounded-full opacity-20"
                            style={{
                                background: `radial-gradient(circle, ${palette.accentLight} 0%, transparent 70%)`,
                                filter: "blur(60px)",
                                bottom: "10%",
                                left: "10%"
                            }}
                            animate={{
                                scale: [1.2, 1, 1.2],
                                opacity: [0.3, 0.2, 0.3]
                            }}
                            transition={{
                                duration: 10,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                    </>
                ) : (
                    <>
                        {/* Samsung One UI Grid Pattern */}
                        <div
                            className="absolute inset-0 opacity-[0.03]"
                            style={{
                                backgroundImage: `
                                    linear-gradient(${palette.textPrimary} 1px, transparent 1px),
                                    linear-gradient(90deg, ${palette.textPrimary} 1px, transparent 1px)
                                `,
                                backgroundSize: "60px 60px"
                            }}
                        />
                    </>
                )}
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    {/* Left Column - Main Info */}
                    <div className="lg:col-span-7 space-y-8">
                        {/* Availability Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}>
                            {isApple ? (
                                <div
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold relative overflow-hidden"
                                    style={{
                                        backdropFilter: "blur(30px) saturate(200%)",
                                        WebkitBackdropFilter: "blur(30px) saturate(200%)",
                                        background: isDark
                                            ? "linear-gradient(180deg, rgba(58, 58, 60, 0.7) 0%, rgba(44, 44, 46, 0.65) 100%)"
                                            : "linear-gradient(180deg, rgba(255, 255, 255, 0.7) 0%, rgba(250, 250, 250, 0.65) 100%)",
                                        border: isDark ? "0.5px solid rgba(255, 255, 255, 0.15)" : "0.5px solid rgba(255, 255, 255, 0.8)",
                                        boxShadow: isDark
                                            ? "0 4px 16px rgba(0, 0, 0, 0.3), 0 0 0 0.5px rgba(255, 255, 255, 0.08) inset"
                                            : "0 2px 12px rgba(0, 0, 0, 0.08), 0 0 0 0.5px rgba(255, 255, 255, 1) inset",
                                        color: "#34C759"
                                    }}>
                                    <div
                                        className="absolute inset-x-0 top-0 h-1/2 pointer-events-none"
                                        style={{
                                            background: isDark
                                                ? "linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%)"
                                                : "linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, transparent 100%)",
                                            borderRadius: "50% 50% 0 0 / 100% 100% 0 0"
                                        }}
                                    />
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse relative z-10" />
                                    <span className="relative z-10">Available for Project Management roles</span>
                                </div>
                            ) : (
                                <OneUIBadge variant="success">
                                    <div className="flex flex-row gap-1 items-center">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2" />
                                        Available for Project Management roles
                                    </div>
                                </OneUIBadge>
                            )}
                        </motion.div>

                        {/* Main Heading */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="space-y-4">
                            <h1
                                className={`${isApple ? "text-5xl md:text-7xl font-extrabold" : "text-6xl md:text-8xl font-black"} leading-tight`}
                                style={{ color: palette.textPrimary }}>
                                Meet Bhingradiya
                            </h1>

                            {/* Animated Role */}
                            <div className="flex items-center gap-3 flex-wrap">
                                <span
                                    className={`${isApple ? "text-2xl md:text-3xl font-semibold" : "text-3xl md:text-4xl font-bold"}`}
                                    style={{ color: palette.textSecondary }}>
                                    I&apos;m a
                                </span>
                                <div className="relative h-12 md:h-14 overflow-hidden">
                                    <AnimatePresence mode="wait">
                                        <motion.span
                                            key={currentRoleIndex}
                                            className={`${isApple ? "text-2xl md:text-3xl font-bold" : "text-3xl md:text-4xl font-black"} absolute whitespace-nowrap`}
                                            style={{ color: palette.accent }}
                                            initial={{ y: 50, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            exit={{ y: -50, opacity: 0 }}
                                            transition={{ duration: 0.5 }}>
                                            {roles[currentRoleIndex]}
                                        </motion.span>
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>

                        {/* Description */}
                        <motion.p
                            className={`${isApple ? "text-lg md:text-xl" : "text-xl md:text-2xl font-medium"} max-w-2xl leading-relaxed`}
                            style={{ color: palette.textSecondary }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}>
                            Passionate software engineer specializing in building scalable applications, leading projects, and creating
                            exceptional user experiences. Expert in modern web technologies and cloud architecture.
                        </motion.p>

                        {/* Location */}
                        <motion.div
                            className="flex items-center gap-2"
                            style={{ color: palette.textTertiary }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.25 }}>
                            <LocationOn className="text-lg" />
                            <span className={isApple ? "text-sm" : "text-base font-semibold"}>Surat, Gujarat, India</span>
                        </motion.div>

                        {/* CTAs */}
                        <motion.div
                            className="flex flex-wrap gap-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}>
                            <Button
                                variant="primary"
                                size={isApple ? "md" : "lg"}
                                icon={<Email />}
                                onClick={() => (window.location.href = "/contact")}>
                                Get In Touch
                            </Button>

                            <Button
                                variant="secondary"
                                size={isApple ? "md" : "lg"}
                                icon={<Download />}
                                onClick={() => setIsResumeModalOpen(true)}>
                                Download Resume
                            </Button>
                        </motion.div>

                        <ResumeDownloadModal isOpen={isResumeModalOpen} onClose={() => setIsResumeModalOpen(false)} />

                        {/* Social Links */}
                        <motion.div
                            className="flex items-center gap-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.35 }}>
                            <a
                                href="https://github.com/MeetBhingradiya"
                                target="_blank"
                                rel="noopener noreferrer">
                                <motion.div
                                    className={`${isApple ? "p-3" : "p-4"} rounded-full relative overflow-hidden`}
                                    style={{
                                        background: isApple
                                            ? isDark
                                                ? "linear-gradient(180deg, rgba(58, 58, 60, 0.7) 0%, rgba(44, 44, 46, 0.65) 100%)"
                                                : "linear-gradient(180deg, rgba(255, 255, 255, 0.7) 0%, rgba(250, 250, 250, 0.65) 100%)"
                                            : palette.backgroundSecondary,
                                        backdropFilter: isApple ? "blur(30px) saturate(200%)" : "none",
                                        WebkitBackdropFilter: isApple ? "blur(30px) saturate(200%)" : "none",
                                        border: isApple
                                            ? isDark
                                                ? "0.5px solid rgba(255, 255, 255, 0.15)"
                                                : "0.5px solid rgba(255, 255, 255, 0.8)"
                                            : `1px solid ${palette.border}`,
                                        boxShadow: isApple
                                            ? isDark
                                                ? "0 4px 16px rgba(0, 0, 0, 0.3), 0 0 0 0.5px rgba(255, 255, 255, 0.08) inset"
                                                : "0 2px 12px rgba(0, 0, 0, 0.08), 0 0 0 0.5px rgba(255, 255, 255, 1) inset"
                                            : "none",
                                        color: palette.textPrimary
                                    }}
                                    whileHover={{ scale: 1.08, y: -2 }}
                                    whileTap={{ scale: 0.95 }}>
                                    {isApple && (
                                        <div
                                            className="absolute inset-x-0 top-0 h-1/2 pointer-events-none"
                                            style={{
                                                background: isDark
                                                    ? "linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%)"
                                                    : "linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, transparent 100%)",
                                                borderRadius: "50% 50% 0 0 / 100% 100% 0 0"
                                            }}
                                        />
                                    )}
                                    <GitHub className="relative z-10" />
                                </motion.div>
                            </a>

                            <a
                                href="https://linkedin.com/in/meetbhingradiya"
                                target="_blank"
                                rel="noopener noreferrer">
                                <motion.div
                                    className={`${isApple ? "p-3" : "p-4"} rounded-full relative overflow-hidden`}
                                    style={{
                                        background: isApple
                                            ? isDark
                                                ? "linear-gradient(180deg, rgba(58, 58, 60, 0.7) 0%, rgba(44, 44, 46, 0.65) 100%)"
                                                : "linear-gradient(180deg, rgba(255, 255, 255, 0.7) 0%, rgba(250, 250, 250, 0.65) 100%)"
                                            : palette.backgroundSecondary,
                                        backdropFilter: isApple ? "blur(30px) saturate(200%)" : "none",
                                        WebkitBackdropFilter: isApple ? "blur(30px) saturate(200%)" : "none",
                                        border: isApple
                                            ? isDark
                                                ? "0.5px solid rgba(255, 255, 255, 0.15)"
                                                : "0.5px solid rgba(255, 255, 255, 0.8)"
                                            : `1px solid ${palette.border}`,
                                        boxShadow: isApple
                                            ? isDark
                                                ? "0 4px 16px rgba(0, 0, 0, 0.3), 0 0 0 0.5px rgba(255, 255, 255, 0.08) inset"
                                                : "0 2px 12px rgba(0, 0, 0, 0.08), 0 0 0 0.5px rgba(255, 255, 255, 1) inset"
                                            : "none",
                                        color: palette.textPrimary
                                    }}
                                    whileHover={{ scale: 1.08, y: -2 }}
                                    whileTap={{ scale: 0.95 }}>
                                    {isApple && (
                                        <div
                                            className="absolute inset-x-0 top-0 h-1/2 pointer-events-none"
                                            style={{
                                                background: isDark
                                                    ? "linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%)"
                                                    : "linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, transparent 100%)",
                                                borderRadius: "50% 50% 0 0 / 100% 100% 0 0"
                                            }}
                                        />
                                    )}
                                    <LinkedIn className="relative z-10" />
                                </motion.div>
                            </a>
                        </motion.div>
                    </div>

                    {/* Right Column - Stats & Highlights */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Key Highlights Grid */}
                        <motion.div
                            className="grid grid-cols-2 gap-5"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}>
                            {keyHighlights.map((highlight, index) => (
                                <Card
                                    key={index}
                                    className={isApple ? "p-6" : "p-7"}
                                    intensity={isApple ? "medium" : undefined}
                                    elevated={!isApple}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            duration: 0.6,
                                            delay: 0.5 + index * 0.1
                                        }}>
                                        <div
                                            className={`${isApple ? "text-2xl" : "text-4xl"} mb-4`}
                                            style={{ color: highlight.color }}>
                                            {highlight.icon}
                                        </div>
                                        <div
                                            className={`${isApple ? "text-xs" : "text-xs font-black"} uppercase tracking-[0.15em] mb-2`}
                                            style={{
                                                color: palette.textTertiary
                                            }}>
                                            {highlight.label}
                                        </div>
                                        <div
                                            className={`${isApple ? "text-xl font-bold" : "text-3xl font-black leading-tight"}`}
                                            style={{
                                                color: palette.textPrimary
                                            }}>
                                            {highlight.value}
                                        </div>
                                    </motion.div>
                                </Card>
                            ))}
                        </motion.div>

                        {/* Expertise Tags */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.8 }}>
                            <Card
                                className={isApple ? "p-6" : "p-8"}
                                intensity={isApple ? "medium" : undefined}
                                elevated={!isApple}>
                                <h3
                                    className={`${isApple ? "text-sm font-semibold" : "text-sm font-black"} uppercase tracking-[0.15em] mb-5`}
                                    style={{ color: palette.textTertiary }}>
                                    Core Expertise
                                </h3>
                                <div className="flex flex-wrap gap-2.5">
                                    {expertise.map((skill, index) => (
                                        <motion.span
                                            key={skill}
                                            className={`${isApple ? "px-3 py-1.5 text-xs rounded-lg relative overflow-hidden" : "px-4 py-2 text-sm rounded-full font-bold"}`}
                                            style={{
                                                background: isApple ? `${palette.accent}15` : palette.accentSubtle,
                                                color: palette.accent,
                                                border: isApple ? `0.5px solid ${palette.accent}30` : `1px solid ${palette.accent}30`,
                                                backdropFilter: isApple ? "blur(10px)" : "none",
                                                WebkitBackdropFilter: isApple ? "blur(10px)" : "none"
                                            }}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{
                                                duration: 0.3,
                                                delay: 0.9 + index * 0.05
                                            }}
                                            whileHover={{
                                                scale: 1.05,
                                                background: isApple ? `${palette.accent}25` : palette.accentSubtle
                                            }}>
                                            {isApple && (
                                                <span
                                                    className="absolute inset-0 pointer-events-none"
                                                    style={{
                                                        background: `linear-gradient(180deg, ${palette.accent}10 0%, transparent 100%)`,
                                                        mixBlendMode: "overlay"
                                                    }}
                                                />
                                            )}
                                            <span className="relative z-10">{skill}</span>
                                        </motion.span>
                                    ))}
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <motion.div
                    className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 1.2 }}>
                    <motion.div
                        className="flex flex-col items-center gap-2"
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}>
                        <span
                            className={`${isApple ? "text-xs" : "text-sm font-semibold"}`}
                            style={{ color: palette.textTertiary }}>
                            Scroll to explore
                        </span>
                        <ArrowForward
                            className="rotate-90"
                            style={{ color: palette.accent }}
                        />
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
