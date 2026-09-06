"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import ResumeDownloadModal from "@Components/Tools/ResumeDownloadModal";
import { GitHub, LinkedIn, Email, Download, LocationOn, ArrowForward, AutoAwesome } from "@mui/icons-material";
import Galaxy from "@Components/ReactBits/Galaxy/Galaxy";
import DecryptedText from "@Components/ReactBits/DecryptedText/DecryptedText";
import RotatingText from "@Components/ReactBits/RotatingText/RotatingText";
import GradientText from "@Components/ReactBits/GradientText/GradientText";
import ShinyText from "@Components/ReactBits/ShinyText/ShinyText";
import { LiquidGlassButton } from "@Components/Atoms/LiquidGlass/index";
import { OneUIButton, OneUIBadge } from "@Components/Atoms/OneUI/index";

// --------------------------------------------------------------------------
// Client-attraction focused roles
// --------------------------------------------------------------------------
const roles = [
    "Scalable Web Apps",
    "Product Engineering",
    "Cloud Architecture",
    "DevOps Pipelines",
    "System Design"
];

const clientHooks = [
    "Let's build your next big product.",
    "From idea to production in record time.",
    "Engineering that scales with your vision.",
    "Full-stack solutions, zero compromises."
];

// --------------------------------------------------------------------------
// Performance: detect low-end devices
// --------------------------------------------------------------------------
function useIsLowEnd() {
    const [isLow, setIsLow] = useState(false);
    useEffect(() => {
        if (typeof window === "undefined") return;
        const nav = navigator as any;
        const cores = nav.hardwareConcurrency || 4;
        const memory = nav.deviceMemory || 4;
        const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
        if (cores <= 2 || memory <= 2 || isMobile) setIsLow(true);
    }, []);
    return isLow;
}

// --------------------------------------------------------------------------
// Floating ambient orbs (CSS only, lightweight)
// --------------------------------------------------------------------------
function AmbientOrbs({ accent, isDark }: { accent: string; isDark: boolean }) {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
                className="absolute rounded-full"
                style={{
                    width: 500,
                    height: 500,
                    top: "-10%",
                    right: "-5%",
                    background: `radial-gradient(circle, ${accent}25 0%, transparent 70%)`,
                    filter: "blur(80px)"
                }}
                animate={{ x: [0, 30, -20, 0], y: [0, -20, 15, 0] }}
                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute rounded-full"
                style={{
                    width: 400,
                    height: 400,
                    bottom: "5%",
                    left: "-8%",
                    background: `radial-gradient(circle, ${isDark ? "rgba(120,80,200,0.15)" : "rgba(120,80,200,0.08)"} 0%, transparent 70%)`,
                    filter: "blur(100px)"
                }}
                animate={{ x: [0, -25, 20, 0], y: [0, 15, -25, 0] }}
                transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute rounded-full"
                style={{
                    width: 300,
                    height: 300,
                    top: "40%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: `radial-gradient(circle, ${accent}10 0%, transparent 70%)`,
                    filter: "blur(60px)"
                }}
                animate={{ scale: [1, 1.15, 0.95, 1] }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            />
        </div>
    );
}

// --------------------------------------------------------------------------
// Stat counter with animated entrance
// --------------------------------------------------------------------------
function StatItem({
    value,
    label,
    palette,
    isApple,
    delay
}: {
    value: string;
    label: string;
    palette: any;
    isApple: boolean;
    delay: number;
}) {
    return (
        <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
                duration: 0.7,
                delay,
                ease: isApple ? [0.25, 0.46, 0.45, 0.94] : [0.34, 1.56, 0.64, 1]
            }}
        >
            <div
                className={`${isApple ? "text-3xl md:text-4xl font-semibold" : "text-4xl md:text-5xl font-black"}`}
                style={{ color: palette.accent }}
            >
                {value}
            </div>
            <div
                className={`${isApple ? "text-sm font-medium mt-1" : "text-sm font-bold mt-1.5 uppercase tracking-wider"}`}
                style={{ color: palette.textTertiary }}
            >
                {label}
            </div>
        </motion.div>
    );
}

// --------------------------------------------------------------------------
// Main Hero
// --------------------------------------------------------------------------
export default function ModernHero() {
    const { designTheme, actualColorMode, palette, accentColor } = useDesignTheme();
    const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
    const [hookIndex, setHookIndex] = useState(0);
    const isLowEnd = useIsLowEnd();

    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";

    // Cycle client hook text
    useEffect(() => {
        const interval = setInterval(() => {
            setHookIndex((prev) => (prev + 1) % clientHooks.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Spring config per theme
    const springConfig = isApple
        ? { damping: 30, stiffness: 200 }
        : { damping: 18, stiffness: 300, mass: 0.8 };

    return (
        <section className="relative min-h-screen flex items-center overflow-hidden">
            {/* ── Background Layer ── */}
            {!isLowEnd ? (
                <div className="absolute inset-0 pointer-events-auto">
                    <Galaxy
                        mouseInteraction={false}
                        mouseRepulsion={false}
                        density={0.6}
                        glowIntensity={0.6}
                        saturation={1}
                        hueShift={110}
                        twinkleIntensity={0.2}
                        rotationSpeed={0.25}
                        repulsionStrength={3}
                        autoCenterRepulsion={0}
                        starSpeed={0.9}
                        speed={1.8}
                    />
                </div>
            ) : (
                /* CSS fallback for low-end devices */
                <div
                    className="absolute inset-0"
                    style={{
                        background: isDark
                            ? `radial-gradient(ellipse at 30% 20%, ${accentColor}15 0%, transparent 60%), 
                               radial-gradient(ellipse at 70% 80%, rgba(80,40,120,0.1) 0%, transparent 60%),
                               ${palette.background}`
                            : `radial-gradient(ellipse at 30% 20%, ${accentColor}10 0%, transparent 60%), 
                               radial-gradient(ellipse at 70% 80%, rgba(180,140,240,0.08) 0%, transparent 60%),
                               ${palette.background}`
                    }}
                />
            )}

            {/* Readability overlay */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: isDark
                        ? "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.35) 100%)"
                        : "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.2) 100%)"
                }}
            />

            {/* Ambient floating orbs */}
            <AmbientOrbs accent={accentColor} isDark={isDark} />

            {/* ── Content ── */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 md:py-28 w-full flex flex-col items-center justify-center text-center">

                {/* Status badge */}
                <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.1, ...springConfig }}
                >
                    {isApple ? (
                        <div
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-8"
                            style={{
                                background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
                                backdropFilter: "blur(30px) saturate(200%)",
                                WebkitBackdropFilter: "blur(30px) saturate(200%)",
                                border: isDark ? "0.5px solid rgba(255,255,255,0.12)" : "0.5px solid rgba(255,255,255,0.7)",
                                boxShadow: isDark
                                    ? "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)"
                                    : "0 2px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)"
                            }}
                        >
                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#34C759" }} />
                            <span className="text-sm font-medium" style={{ color: palette.textSecondary }}>
                                Available for Projects
                            </span>
                        </div>
                    ) : (
                        <div className="mb-8">
                            <OneUIBadge variant="success">
                                <span className="flex items-center gap-2">
                                    <AutoAwesome style={{ fontSize: 14 }} />
                                    Open to Collaborate
                                </span>
                            </OneUIBadge>
                        </div>
                    )}
                </motion.div>

                {/* Main Name — DecryptedText effect */}
                <motion.div
                    className="mb-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                >
                    <h1 className={`${isApple ? "text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight" : "text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter"}`}>
                        <DecryptedText
                            text="Meet Bhingradiya"
                            speed={40}
                            maxIterations={15}
                            sequential={true}
                            revealDirection="start"
                            animateOn="view"
                            className={isDark ? "text-white" : "text-gray-900"}
                            encryptedClassName={`${isDark ? "text-white/40" : "text-gray-900/30"}`}
                            parentClassName="justify-center"
                        />
                    </h1>
                </motion.div>

                {/* Specialty line with RotatingText */}
                <motion.div
                    className="flex flex-wrap items-center justify-center gap-x-3 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5, ...springConfig }}
                >
                    <span
                        className={`${isApple ? "text-xl md:text-2xl font-medium" : "text-2xl md:text-3xl font-bold"}`}
                        style={{ color: palette.textSecondary }}
                    >
                        I craft
                    </span>
                    <GradientText
                        colors={
                            isApple
                                ? ["#007AFF", "#5AC8FA", "#AF52DE", "#007AFF"]
                                : [accentColor, "#FF6B6B", "#FFE66D", accentColor]
                        }
                        animationSpeed={4}
                        className={`${isApple ? "text-xl md:text-2xl font-semibold" : "text-2xl md:text-3xl font-black"}`}
                    >
                        <RotatingText
                            texts={roles}
                            rotationInterval={3000}
                            staggerDuration={0.02}
                            staggerFrom="first"
                            transition={{ type: "spring", ...springConfig }}
                            mainClassName="overflow-hidden h-[1.4em]"
                            splitLevelClassName="inline-flex"
                        />
                    </GradientText>
                </motion.div>

                {/* Client-focused hook text — rotating */}
                <motion.div
                    className="h-8 md:h-10 mb-10 relative overflow-hidden"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                >
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={hookIndex}
                            className={`${isApple ? "text-lg md:text-xl font-normal" : "text-lg md:text-xl font-semibold"} absolute inset-0 flex items-center justify-center`}
                            style={{ color: palette.textSecondary }}
                            initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
                            transition={{ duration: 0.5 }}
                        >
                            {clientHooks[hookIndex]}
                        </motion.p>
                    </AnimatePresence>
                </motion.div>

                {/* CTA Buttons */}
                <motion.div
                    className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mb-14"
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.9, ...springConfig }}
                >
                    {isApple ? (
                        <>
                            <LiquidGlassButton
                                variant="primary"
                                size="lg"
                                icon={<Email />}
                                onClick={() => (window.location.href = "/contact")}
                            >
                                Start a Project
                            </LiquidGlassButton>
                            <LiquidGlassButton
                                variant="secondary"
                                size="lg"
                                icon={<Download />}
                                onClick={() => setIsResumeModalOpen(true)}
                            >
                                Download Resume
                            </LiquidGlassButton>
                        </>
                    ) : (
                        <>
                            <OneUIButton
                                variant="primary"
                                size="lg"
                                icon={<Email />}
                                onClick={() => (window.location.href = "/contact")}
                            >
                                Start a Project
                            </OneUIButton>
                            <OneUIButton
                                variant="secondary"
                                size="lg"
                                icon={<Download />}
                                onClick={() => setIsResumeModalOpen(true)}
                            >
                                Download Resume
                            </OneUIButton>
                        </>
                    )}
                </motion.div>

                {/* Stats Row */}
                <motion.div
                    className={`grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-14 px-4 py-8 rounded-3xl max-w-3xl w-full mx-auto`}
                    style={{
                        background: isApple
                            ? isDark
                                ? "rgba(255,255,255,0.04)"
                                : "rgba(255,255,255,0.3)"
                            : isDark
                                ? "rgba(255,255,255,0.03)"
                                : "rgba(0,0,0,0.02)",
                        backdropFilter: isApple ? "blur(40px) saturate(180%)" : "none",
                        WebkitBackdropFilter: isApple ? "blur(40px) saturate(180%)" : "none",
                        border: isApple
                            ? isDark
                                ? "0.5px solid rgba(255,255,255,0.08)"
                                : "0.5px solid rgba(255,255,255,0.6)"
                            : isDark
                                ? "1.5px solid rgba(255,255,255,0.05)"
                                : "1.5px solid rgba(0,0,0,0.04)",
                        borderRadius: isApple ? "20px" : "32px",
                        boxShadow: isApple
                            ? isDark
                                ? "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)"
                                : "0 4px 20px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)"
                            : isDark
                                ? "0 6px 24px rgba(0,0,0,0.25)"
                                : "0 2px 16px rgba(0,0,0,0.04)"
                    }}
                >
                    <StatItem value="3+" label="Years Exp." palette={palette} isApple={isApple} delay={1.0} />
                    <StatItem value="50+" label="Projects" palette={palette} isApple={isApple} delay={1.1} />
                    <StatItem value="20+" label="Technologies" palette={palette} isApple={isApple} delay={1.2} />
                    <StatItem value="100%" label="Dedication" palette={palette} isApple={isApple} delay={1.3} />
                </motion.div>

                {/* Social Links & Location */}
                <motion.div
                    className="flex items-center justify-center gap-4 flex-wrap"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.4 }}
                >
                    {[
                        { icon: <GitHub />, href: "https://github.com/MeetBhingradiya", label: "GitHub" },
                        { icon: <LinkedIn />, href: "https://linkedin.com/in/meetbhingradiya", label: "LinkedIn" }
                    ].map((social, i) => (
                        <motion.a
                            key={i}
                            href={social.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={social.label}
                            className="p-3.5 transition-all"
                            style={{
                                color: palette.textPrimary,
                                background: isApple
                                    ? isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.4)"
                                    : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                                backdropFilter: isApple ? "blur(20px) saturate(180%)" : "none",
                                WebkitBackdropFilter: isApple ? "blur(20px) saturate(180%)" : "none",
                                border: isApple
                                    ? isDark ? "0.5px solid rgba(255,255,255,0.1)" : "0.5px solid rgba(255,255,255,0.7)"
                                    : isDark ? "1.5px solid rgba(255,255,255,0.06)" : "1.5px solid rgba(0,0,0,0.05)",
                                borderRadius: isApple ? "14px" : "24px",
                                boxShadow: isApple
                                    ? isDark ? "0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)" : "0 2px 8px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)"
                                    : isDark ? "0 2px 8px rgba(0,0,0,0.15)" : "0 1px 4px rgba(0,0,0,0.04)"
                            }}
                            whileHover={{ scale: 1.1, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: "spring", ...springConfig }}
                        >
                            {social.icon}
                        </motion.a>
                    ))}

                    {/* Divider */}
                    <div className="w-px h-8" style={{ backgroundColor: palette.border }} />

                    {/* Location */}
                    <motion.div
                        className="flex items-center gap-2 px-5 py-3"
                        style={{
                            color: palette.textSecondary,
                            background: isApple
                                ? isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.4)"
                                : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                            backdropFilter: isApple ? "blur(20px) saturate(180%)" : "none",
                            WebkitBackdropFilter: isApple ? "blur(20px) saturate(180%)" : "none",
                            border: isApple
                                ? isDark ? "0.5px solid rgba(255,255,255,0.1)" : "0.5px solid rgba(255,255,255,0.7)"
                                : isDark ? "1.5px solid rgba(255,255,255,0.06)" : "1.5px solid rgba(0,0,0,0.05)",
                            borderRadius: isApple ? "14px" : "24px",
                            boxShadow: isApple
                                ? isDark ? "0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)" : "0 2px 8px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)"
                                : isDark ? "0 2px 8px rgba(0,0,0,0.15)" : "0 1px 4px rgba(0,0,0,0.04)"
                        }}
                        whileHover={{ scale: 1.03 }}
                        transition={{ type: "spring", ...springConfig }}
                    >
                        <LocationOn className="text-sm" />
                        <span className={`text-sm ${isApple ? "font-medium" : "font-bold"}`}>
                            Surat, Gujarat, India
                        </span>
                    </motion.div>
                </motion.div>

                {/* Scroll indicator */}
                <motion.div
                    className="absolute bottom-8 left-1/2 -translate-x-1/2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5, y: [0, 8, 0] }}
                    transition={{ opacity: { delay: 2, duration: 0.8 }, y: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}
                >
                    <div
                        className="w-6 h-10 rounded-full border-2 flex items-start justify-center pt-2"
                        style={{ borderColor: palette.textTertiary }}
                    >
                        <motion.div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: palette.textTertiary }}
                            animate={{ y: [0, 12, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        />
                    </div>
                </motion.div>
            </div>

            <ResumeDownloadModal isOpen={isResumeModalOpen} onClose={() => setIsResumeModalOpen(false)} />
        </section>
    );
}
