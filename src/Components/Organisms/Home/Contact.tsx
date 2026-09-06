"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import Aurora from "@Components/ReactBits/Aurora/Aurora";
import SpotlightCard from "@Components/ReactBits/SpotlightCard/SpotlightCard";
import GradientText from "@Components/ReactBits/GradientText/GradientText";
import ShinyText from "@Components/ReactBits/ShinyText/ShinyText";
import { LiquidGlassButton, LiquidGlassCard } from "@Components/Atoms/LiquidGlass/index";
import { OneUIButton, OneUIBadge, OneUICard } from "@Components/Atoms/OneUI/index";
import { Schedule, Send, Email, CalendarMonth, ArrowForward, AccessTime, Rocket, AutoAwesome } from "@mui/icons-material";
import Link from "next/link";
import { contactMethods, quickActions, services, personalInfo } from "@Static";

// --------------------------------------------------------------------------
// Availability Ring — Animated status indicator
// --------------------------------------------------------------------------
function AvailabilityRing({ isAvailable, palette, isApple, isDark }: {
    isAvailable: boolean;
    palette: any;
    isApple: boolean;
    isDark: boolean;
}) {
    const color = isAvailable ? "#34C759" : "#FF9500";

    return (
        <div className="relative flex items-center gap-3">
            <div className="relative">
                <motion.div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                    animate={isAvailable ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                />
                {isAvailable && (
                    <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{ border: `1.5px solid ${color}` }}
                        animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                )}
            </div>
            <span
                className={`text-sm ${isApple ? "font-medium" : "font-bold"}`}
                style={{ color: palette.textSecondary }}
            >
                {isAvailable ? "Currently Available" : "Away — Leave a message"}
            </span>
        </div>
    );
}

// --------------------------------------------------------------------------
// Card wrapper — adapts to theme
// --------------------------------------------------------------------------
function ThemedCard({
    children,
    className,
    isApple,
    isDark,
    palette,
    intensity,
    ...props
}: {
    children: React.ReactNode;
    className?: string;
    isApple: boolean;
    isDark: boolean;
    palette: any;
    intensity?: "subtle" | "medium" | "strong";
    [key: string]: any;
}) {
    if (isApple) {
        return (
            <LiquidGlassCard
                className={className}
                intensity={intensity || "medium"}
                enableTilt={false}
                enableGlow={true}
                {...props}
            >
                {children}
            </LiquidGlassCard>
        );
    }

    return (
        <SpotlightCard
            spotlightColor={isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(0, 0, 0, 0.15)"}
            className={`${isDark ? "bg-white/[0.03]" : "bg-black/[0.02]"} ${className}`}
            style={{
                border: isDark ? "1.5px solid rgba(255,255,255,0.06)" : "1.5px solid rgba(0,0,0,0.05)",
                borderRadius: "32px",
                padding: "28px",
                boxShadow: isDark
                    ? "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)"
                    : "0 4px 20px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)"
            }}
            {...props}
        >
            {children}
        </SpotlightCard>
    );
}

// --------------------------------------------------------------------------
// Main Contact Section
// --------------------------------------------------------------------------
export default function ContactSection() {
    const { designTheme, palette, actualColorMode, accentColor } = useDesignTheme();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [hoveredCard, setHoveredCard] = useState<string | null>(null);

    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";

    // Spring config
    const springConfig = isApple
        ? { damping: 30, stiffness: 200 }
        : { damping: 18, stiffness: 300, mass: 0.8 };

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const getLocalTime = () => {
        return currentTime.toLocaleTimeString("en-US", {
            hour12: true,
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Kolkata"
        });
    };

    const isBusinessHours = () => {
        const indiaHour = new Date().toLocaleString("en-US", {
            hour: "numeric",
            hour12: false,
            timeZone: personalInfo.timezone
        });
        const hour = parseInt(indiaHour);
        return hour >= personalInfo.workingHours.start && hour <= personalInfo.workingHours.end;
    };

    const Button = isApple ? LiquidGlassButton : OneUIButton;

    return (
        <section id="contact" className={`relative ${isApple ? "py-24 md:py-32" : "py-28 md:py-36"} overflow-hidden`}>
            {/* Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <Aurora
                    colorStops={
                        isDark
                            ? ["#1a0b2e", "#2c1458", "#12082b"]
                            : ["#e8dff5", "#fce1e4", "#fcf4dd"]
                    }
                    amplitude={0.5}
                    blend={0.5}
                />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6">
                {/* ── Section Header ── */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: isApple ? [0.25, 0.46, 0.45, 0.94] : [0.34, 1.56, 0.64, 1] }}
                    className="text-center mb-16"
                >
                    {/* Badge */}
                    <motion.div
                        className="inline-flex items-center gap-2 mb-6"
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        {isApple ? (
                            <div
                                className="px-5 py-2.5 rounded-full"
                                style={{
                                    background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
                                    backdropFilter: "blur(20px) saturate(180%)",
                                    WebkitBackdropFilter: "blur(20px) saturate(180%)",
                                    border: isDark ? "0.5px solid rgba(255,255,255,0.1)" : "0.5px solid rgba(255,255,255,0.7)",
                                    boxShadow: isDark
                                        ? "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)"
                                        : "0 2px 12px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)"
                                }}
                            >
                                <span className="text-sm font-medium" style={{ color: accentColor }}>
                                    Let's Connect
                                </span>
                            </div>
                        ) : (
                            <OneUIBadge variant="accent">Let's Connect</OneUIBadge>
                        )}
                    </motion.div>

                    {/* Title */}
                    <h2
                        className={`${isApple ? "text-4xl md:text-5xl font-bold tracking-tight" : "text-5xl md:text-6xl font-black tracking-tight"} mb-5`}
                        style={{ color: palette.textPrimary }}
                    >
                        Get In Touch
                    </h2>
                    <p
                        className={`${isApple ? "text-lg font-normal" : "text-xl font-medium"} max-w-2xl mx-auto mb-8`}
                        style={{ color: palette.textSecondary }}
                    >
                        Have a project in mind, want to collaborate, or just say hello?
                        I'd love to hear from you.
                    </p>

                    {/* Status Bar */}
                    <motion.div
                        className="flex items-center justify-center gap-5 flex-wrap"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                    >
                        <AvailabilityRing
                            isAvailable={isBusinessHours()}
                            palette={palette}
                            isApple={isApple}
                            isDark={isDark}
                        />
                        <div className="w-px h-5" style={{ backgroundColor: palette.border }} />
                        <div className="flex items-center gap-2">
                            <AccessTime className="text-sm" style={{ color: palette.textTertiary }} />
                            <span className={`text-sm ${isApple ? "font-medium" : "font-bold"}`} style={{ color: palette.textTertiary }}>
                                {getLocalTime()} IST
                            </span>
                        </div>
                    </motion.div>
                </motion.div>

                {/* ── Quick Actions ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="mb-20"
                >
                    <h3
                        className={`${isApple ? "text-xl font-semibold" : "text-2xl font-black"} mb-8 text-center`}
                        style={{ color: palette.textPrimary }}
                    >
                        Looking to...
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        {quickActions.map((action, index) => (
                            <motion.div
                                key={action.id}
                                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{
                                    duration: 0.5,
                                    delay: index * 0.08,
                                    ease: isApple ? [0.25, 0.46, 0.45, 0.94] : [0.34, 1.56, 0.64, 1]
                                }}
                            >
                                <Link href={action.action}>
                                    <ThemedCard
                                        className="h-full cursor-pointer group"
                                        isApple={isApple}
                                        isDark={isDark}
                                        palette={palette}
                                        intensity="subtle"
                                    >
                                        <div className="flex flex-col h-full">
                                            <motion.div
                                                className={`w-14 h-14 flex items-center justify-center mb-4 ${isApple ? "rounded-2xl" : "rounded-3xl"}`}
                                                style={{
                                                    background: `${action.color}18`,
                                                    color: action.color
                                                }}
                                                whileHover={{ scale: 1.1, rotate: 5 }}
                                                transition={{ type: "spring", ...springConfig }}
                                            >
                                                {action.icon}
                                            </motion.div>
                                            <h4
                                                className={`${isApple ? "font-medium text-base" : "font-bold text-lg"} mb-2`}
                                                style={{ color: palette.textPrimary }}
                                            >
                                                {action.title}
                                            </h4>
                                            <p
                                                className="text-sm flex-grow leading-relaxed"
                                                style={{ color: palette.textSecondary }}
                                            >
                                                {action.description}
                                            </p>
                                            <div
                                                className={`flex items-center gap-1 mt-4 text-sm ${isApple ? "font-medium" : "font-bold"}`}
                                                style={{ color: action.color }}
                                            >
                                                Get Started
                                                <ArrowForward
                                                    className="text-sm transition-transform group-hover:translate-x-1"
                                                />
                                            </div>
                                        </div>
                                    </ThemedCard>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* ── Contact Methods ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mb-20"
                >
                    <h3
                        className={`${isApple ? "text-xl font-semibold" : "text-2xl font-black"} mb-8 text-center`}
                        style={{ color: palette.textPrimary }}
                    >
                        Connect With Me
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {contactMethods.map((method, index) => (
                            <motion.div
                                key={method.id}
                                initial={{ opacity: 0, y: 25, scale: 0.95 }}
                                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{
                                    duration: 0.5,
                                    delay: index * 0.06,
                                    ease: isApple ? [0.25, 0.46, 0.45, 0.94] : [0.34, 1.56, 0.64, 1]
                                }}
                                onMouseEnter={() => setHoveredCard(method.id)}
                                onMouseLeave={() => setHoveredCard(null)}
                            >
                                <Link
                                    href={method.link}
                                    target={method.link.startsWith("http") ? "_blank" : undefined}
                                    rel={method.link.startsWith("http") ? "noopener noreferrer" : undefined}
                                >
                                    <ThemedCard
                                        className="h-full cursor-pointer group"
                                        isApple={isApple}
                                        isDark={isDark}
                                        palette={palette}
                                        intensity="medium"
                                    >
                                        <div className="flex items-start gap-4">
                                            <motion.div
                                                className={`w-14 h-14 flex items-center justify-center flex-shrink-0 ${isApple ? "rounded-2xl" : "rounded-3xl"}`}
                                                style={{
                                                    background: hoveredCard === method.id ? method.color : `${method.color}18`,
                                                    color: hoveredCard === method.id ? "#FFFFFF" : method.color
                                                }}
                                                animate={{
                                                    scale: hoveredCard === method.id ? 1.08 : 1,
                                                    rotate: hoveredCard === method.id ? 5 : 0
                                                }}
                                                transition={{ type: "spring", ...springConfig }}
                                            >
                                                {method.icon}
                                            </motion.div>
                                            <div className="flex-grow min-w-0">
                                                <h4
                                                    className={`${isApple ? "font-medium" : "font-bold"} mb-1`}
                                                    style={{ color: palette.textPrimary }}
                                                >
                                                    {method.title}
                                                </h4>
                                                <p
                                                    className="text-sm mb-2"
                                                    style={{ color: palette.textSecondary }}
                                                >
                                                    {method.description}
                                                </p>
                                                {method.responseTime && (
                                                    <p
                                                        className="text-xs flex items-center gap-1"
                                                        style={{ color: palette.textTertiary }}
                                                    >
                                                        <Schedule className="text-xs" />
                                                        {method.responseTime}
                                                    </p>
                                                )}
                                            </div>
                                            <motion.div
                                                animate={{ x: hoveredCard === method.id ? 4 : 0 }}
                                                transition={{ type: "spring", ...springConfig }}
                                            >
                                                <ArrowForward
                                                    className="text-lg"
                                                    style={{ color: palette.textTertiary }}
                                                />
                                            </motion.div>
                                        </div>
                                    </ThemedCard>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* ── CTA Section ── */}
                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.97 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: 0.2, ease: isApple ? [0.25, 0.46, 0.45, 0.94] : [0.34, 1.56, 0.64, 1] }}
                >
                    <ThemedCard
                        className="text-center"
                        isApple={isApple}
                        isDark={isDark}
                        palette={palette}
                        intensity="strong"
                    >
                        <div className="py-10 px-6">
                            {/* Animated icon */}
                            <motion.div
                                className={`w-20 h-20 flex items-center justify-center mx-auto mb-8 ${isApple ? "rounded-3xl" : "rounded-[28px]"}`}
                                style={{
                                    background: `${accentColor}15`,
                                    color: accentColor,
                                    boxShadow: `0 8px 24px ${accentColor}20`
                                }}
                                animate={{ y: [0, -6, 0] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Rocket className="text-3xl" />
                            </motion.div>

                            <h3
                                className={`${isApple ? "text-3xl font-bold tracking-tight" : "text-3xl font-black tracking-tight"} mb-4`}
                                style={{ color: palette.textPrimary }}
                            >
                                Ready to Start a Project?
                            </h3>
                            <p
                                className={`${isApple ? "text-base font-normal" : "text-lg font-medium"} max-w-xl mx-auto mb-10`}
                                style={{ color: palette.textSecondary }}
                            >
                                Let's discuss your ideas and create something extraordinary together.
                                I'm always excited to work on new challenges.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link href="/contact">
                                    <Button variant="primary" size="lg" icon={<Email />}>
                                        Send a Message
                                    </Button>
                                </Link>
                                <Link href="https://calendly.com/meetbhingradiya" target="_blank">
                                    <Button variant="secondary" size="lg" icon={<CalendarMonth />}>
                                        Schedule a Call
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </ThemedCard>
                </motion.div>
            </div>
        </section>
    );
}
