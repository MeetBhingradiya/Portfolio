/**
 * Advanced Product-Style Navigation Header
 * Features category hover menus, theme switcher, and dual-theme support
 */

"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks";
import { useAuth } from "@Library/auth-client";
import Link from "next/link";
import {
    Code,
    Work,
    Timeline,
    Article,
    ContactMail,
    AccountCircle,
    Settings,
    GitHub,
    LinkedIn,
    KeyboardArrowDown,
    Close,
    InfoOutlined,
    WarningAmber,
    ErrorOutline,
    CheckCircleOutline,
    SwapHoriz,
    Logout
} from "@mui/icons-material";
import { Config } from "@Config/Client";
import SwitchAccountModal from "./SwitchAccountModal";

interface MenuItem {
    label: string;
    href: string;
    description?: string;
    icon?: React.ReactNode;
}

interface MenuCategory {
    label: string;
    items: MenuItem[];
}

const menuCategories: MenuCategory[] = [
    {
        label: "Work",
        items: [
            {
                label: "Projects",
                href: "/projects",
                description: "Explore my latest work",
                icon: <Code />
            },
            {
                label: "Experience",
                href: "/experience",
                description: "Professional journey",
                icon: <Work />
            },
            {
                label: "Timeline",
                href: "/timeline",
                description: "Career milestones",
                icon: <Timeline />
            }
        ]
    },
    {
        label: "Content",
        items: [
            {
                label: "Blog",
                href: "/blogs",
                description: "Technical articles",
                icon: <Article />
            },
            {
                label: "Tools",
                href: "/Tools",
                description: "Useful utilities",
                icon: <Settings />
            }
        ]
    },
    {
        label: "Connect",
        items: [
            {
                label: "Contact",
                href: "/contact",
                description: "Grab my attention",
                icon: <ContactMail />
            },
            // ? Github & LinkedIn heare
            {
                label: "GitHub",
                href: "https://github.com/MeetBhingradiya",
                description: "Explore my Projects",
                icon: <GitHub />
            },
            {
                label: "LinkedIn",
                href: "https://linkedin.com/in/meet-bhingradiya",
                description: "Connect me on LinkedIn",
                icon: <LinkedIn />
            }
            // {
            //     label: "Profile",
            //     href: "/profile",
            //     description: "View my profile",
            //     icon: <AccountCircle />
            // }
        ]
    }
];

export default function HeadNavigation() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const { session, user, isAuthenticated, isLoading, signOut } = useAuth();
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [uiState, setUiState] = useState({
        mobileMenuOpen: false,
        notificationDismissed: false,
        scrolled: false
    });
    const [showSwitchAccountModal, setShowSwitchAccountModal] = useState(false);
    const menuTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
    const navRef = useRef<HTMLElement>(null);
    
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";
    const showNotification = Config.Notification?.enabled && !uiState.notificationDismissed;

    const notificationIcon = useMemo(() => {
        switch (Config.Notification?.type) {
            case "warning":
                return <WarningAmber className="text-lg" />;
            case "error":
                return <ErrorOutline className="text-lg" />;
            case "success":
                return <CheckCircleOutline className="text-lg" />;
            default:
                return <InfoOutlined className="text-lg" />;
        }
    }, [Config.Notification?.type]);

    const notificationColors = useMemo(() => {
        const type = Config.Notification?.type || "info";
        if (isDark) {
            return {
                info: { bg: "rgba(59, 130, 246, 0.15)", border: "rgba(59, 130, 246, 0.3)", text: "#93c5fd" },
                warning: { bg: "rgba(251, 191, 36, 0.15)", border: "rgba(251, 191, 36, 0.3)", text: "#fcd34d" },
                error: { bg: "rgba(239, 68, 68, 0.15)", border: "rgba(239, 68, 68, 0.3)", text: "#fca5a5" },
                success: { bg: "rgba(34, 197, 94, 0.15)", border: "rgba(34, 197, 94, 0.3)", text: "#86efac" }
            }[type];
        }
        return {
            info: { bg: "rgba(59, 130, 246, 0.1)", border: "rgba(59, 130, 246, 0.2)", text: "#2563eb" },
            warning: { bg: "rgba(251, 191, 36, 0.1)", border: "rgba(251, 191, 36, 0.2)", text: "#d97706" },
            error: { bg: "rgba(239, 68, 68, 0.1)", border: "rgba(239, 68, 68, 0.2)", text: "#dc2626" },
            success: { bg: "rgba(34, 197, 94, 0.1)", border: "rgba(34, 197, 94, 0.2)", text: "#16a34a" }
        }[type];
    }, [isDark, Config.Notification?.type]);

    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            const nav = navRef.current;
            if (!nav) return;

            const isScrolled = scrollY > 20;
            
            // Use CSS classes for visual effects
            if (isScrolled) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }

            // Handle notification bar visibility
            if (scrollY <= 10) {
                nav.classList.remove('notification-hidden');
            } else {
                nav.classList.add('notification-hidden');
            }

            // Update scrolled state only when it changes (for style calculations)
            setUiState(prev => {
                if (prev.scrolled !== isScrolled) {
                    return { ...prev, scrolled: isScrolled };
                }
                return prev;
            });
        };

        // Passive listener for better scroll performance
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleMenuEnter = useCallback((label: string) => {
        if (menuTimeout.current) {
            clearTimeout(menuTimeout.current);
        }
        setActiveMenu(label);
    }, []);

    const handleMenuLeave = useCallback(() => {
        menuTimeout.current = setTimeout(() => {
            setActiveMenu(null);
        }, 150);
    }, []);

    const toggleMobileMenu = useCallback(() => {
        setUiState(prev => ({ ...prev, mobileMenuOpen: !prev.mobileMenuOpen }));
    }, []);

    const closeMobileMenu = useCallback(() => {
        setUiState(prev => ({ ...prev, mobileMenuOpen: false }));
    }, []);

    const dismissNotification = useCallback(() => {
        setUiState(prev => ({ ...prev, notificationDismissed: true }));
    }, []);

    const handleSignOut = useCallback(async () => {
        try {
            await signOut();
            window.location.href = "/";
        } catch (error) {
            console.error("Sign out failed:", error);
        }
    }, [signOut]);

    return (
        <>
            {/* Top Notification Banner */}
            <AnimatePresence>
                {showNotification && (
                    <motion.div
                        className="fixed top-0 left-0 right-0 z-[100] overflow-hidden"
                        style={{
                            backdropFilter: isApple ? "blur(40px) saturate(180%)" : "blur(20px)",
                            WebkitBackdropFilter: isApple ? "blur(40px) saturate(180%)" : "blur(20px)",
                            background: notificationColors?.bg,
                            borderBottom: `1px solid ${notificationColors?.border}`
                        }}
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div style={{ color: notificationColors?.text }}>
                                        {notificationIcon}
                                    </div>
                                    <p
                                        className="text-sm md:text-base font-medium truncate"
                                        style={{ color: notificationColors?.text }}
                                    >
                                        {Config.Notification?.message}
                                    </p>
                                    {Config.Notification?.link && (
                                        <Link href={Config.Notification.link.href}>
                                            <motion.span
                                                className="text-sm font-semibold whitespace-nowrap hidden sm:inline"
                                                style={{ color: notificationColors?.text }}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                {Config.Notification.link.text} →
                                            </motion.span>
                                        </Link>
                                    )}
                                </div>
                                {Config.Notification?.dismissible && (
                                    <motion.button
                                        onClick={dismissNotification}
                                        className="p-1.5 rounded-lg shrink-0"
                                        style={{ color: notificationColors?.text }}
                                        whileHover={{
                                            backgroundColor: isDark
                                                ? "rgba(255, 255, 255, 0.1)"
                                                : "rgba(0, 0, 0, 0.1)",
                                            scale: 1.05
                                        }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <Close className="text-lg" />
                                    </motion.button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Desktop Navigation */}
            <motion.nav
                ref={navRef}
                className="fixed left-0 right-0 z-50 hidden md:block overflow-visible"
                style={{
                    top: showNotification ? "52px" : "0",
                    transition: "top 0.3s ease",
                    backdropFilter: isApple
                        ? uiState.scrolled
                            ? "blur(60px) saturate(200%)"
                            : "blur(40px) saturate(180%)"
                        : "none",
                    WebkitBackdropFilter: isApple
                        ? uiState.scrolled
                            ? "blur(60px) saturate(200%)"
                            : "blur(40px) saturate(180%)"
                        : "none",
                    background: isApple
                        ? uiState.scrolled
                            ? isDark
                                ? "linear-gradient(180deg, rgba(28, 28, 30, 0.85) 0%, rgba(20, 20, 22, 0.8) 100%)"
                                : "linear-gradient(180deg, rgba(255, 255, 255, 0.85) 0%, rgba(250, 250, 252, 0.8) 100%)"
                            : isDark
                                ? "linear-gradient(180deg, rgba(28, 28, 30, 0.7) 0%, rgba(20, 20, 22, 0.65) 100%)"
                                : "linear-gradient(180deg, rgba(255, 255, 255, 0.7) 0%, rgba(250, 250, 252, 0.65) 100%)"
                        : isDark
                            ? "linear-gradient(135deg, rgba(30, 30, 35, 0.95) 0%, rgba(25, 25, 30, 0.9) 100%)"
                            : "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 248, 250, 0.9) 100%)",
                    borderBottom: isApple
                        ? `0.5px solid ${isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)"}`
                        : `1.5px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}`,
                    boxShadow: isApple
                        ? uiState.scrolled
                            ? isDark
                                ? "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 0.5px rgba(255, 255, 255, 0.08) inset"
                                : "0 4px 24px rgba(0, 0, 0, 0.1), 0 0 0 0.5px rgba(255, 255, 255, 1) inset"
                            : isDark
                                ? "0 4px 16px rgba(0, 0, 0, 0.2), 0 0 0 0.5px rgba(255, 255, 255, 0.05) inset"
                                : "0 2px 12px rgba(0, 0, 0, 0.06), 0 0 0 0.5px rgba(255, 255, 255, 0.8) inset"
                        : isDark
                            ? "0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                            : "0 2px 12px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.7)"
                }}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Top glass reflection - Apple only */}
                {isApple && (
                    <div
                        className="absolute inset-x-0 top-0 pointer-events-none"
                        style={{
                            height: uiState.scrolled ? "60%" : "50%",
                            background: isDark
                                ? "linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, transparent 100%)"
                                : "linear-gradient(180deg, rgba(255, 255, 255, 0.6) 0%, transparent 100%)",
                            borderRadius: "0 0 50% 50% / 0 0 100% 100%"
                        }}
                    />
                )}
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href="/">
                            <motion.div
                                className={`${isApple ? "text-xl" : "text-2xl font-black"} font-black cursor-pointer`}
                                style={{ color: palette.textPrimary }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Meet<span style={{ color: palette.accent }}>.</span>
                            </motion.div>
                        </Link>

                        {/* Menu Categories */}
                        <div className="flex items-center gap-1">
                            {menuCategories.map((category) => (
                                <div
                                    key={category.label}
                                    className="relative"
                                    onMouseEnter={() => handleMenuEnter(category.label)}
                                    onMouseLeave={handleMenuLeave}
                                >
                                    <motion.button
                                        className={`${isApple ? "px-4 py-2" : "px-5 py-2.5"} ${isApple ? "text-sm font-semibold" : "text-base font-black"} rounded-xl transition-all duration-300 flex items-center gap-1 relative overflow-hidden`}
                                        style={{
                                            color:
                                                activeMenu === category.label
                                                    ? palette.accent
                                                    : palette.textSecondary,
                                            background:
                                                activeMenu === category.label
                                                    ? isApple
                                                        ? isDark
                                                            ? `linear-gradient(135deg, ${palette.accent}20 0%, ${palette.accent}15 100%)`
                                                            : `linear-gradient(135deg, ${palette.accent}15 0%, ${palette.accent}10 100%)`
                                                        : `linear-gradient(135deg, ${palette.accent}20 0%, ${palette.accent}15 100%)`
                                                    : "transparent",
                                            backdropFilter: activeMenu === category.label && isApple ? "blur(10px)" : "none",
                                            WebkitBackdropFilter: activeMenu === category.label && isApple ? "blur(10px)" : "none",
                                            border: activeMenu === category.label 
                                                ? isApple
                                                    ? `0.5px solid ${palette.accent}30`
                                                    : `1.5px solid ${palette.accent}40`
                                                : "0.5px solid transparent"
                                        }}
                                        whileHover={{
                                            scale: 1.02,
                                            backgroundColor: activeMenu !== category.label 
                                                ? isApple
                                                    ? isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)"
                                                    : isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)"
                                                : undefined
                                        }}
                                        whileTap={{ scale: 0.97 }}
                                    >
                                        {activeMenu === category.label && (
                                            <div
                                                className="absolute inset-x-0 top-0 h-1/2 pointer-events-none"
                                                style={{
                                                    background: isApple
                                                        ? isDark
                                                            ? "linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, transparent 100%)"
                                                            : "linear-gradient(180deg, rgba(255, 255, 255, 0.5) 0%, transparent 100%)"
                                                        : isDark
                                                            ? "linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, transparent 100%)"
                                                            : "linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, transparent 100%)",
                                                    borderRadius: "50% 50% 0 0 / 100% 100% 0 0"
                                                }}
                                            />
                                        )}
                                        <span className="relative z-10">{category.label}</span>
                                        <KeyboardArrowDown
                                            className="text-sm relative z-10"
                                            style={{
                                                transform:
                                                    activeMenu === category.label
                                                        ? "rotate(180deg)"
                                                        : "rotate(0deg)",
                                                transition: "transform 0.3s ease"
                                            }}
                                        />
                                    </motion.button>

                                    {/* Dropdown Menu */}
                                    <AnimatePresence>
                                        {activeMenu === category.label && (
                                            <motion.div
                                                className="absolute top-full left-0 mt-2 min-w-[280px] overflow-hidden"
                                                style={{
                                                    zIndex: 9999,
                                                    backdropFilter: isApple
                                                        ? "blur(60px) saturate(200%)"
                                                        : "none",
                                                    WebkitBackdropFilter: isApple
                                                        ? "blur(60px) saturate(200%)"
                                                        : "none",
                                                    background: isApple
                                                        ? isDark
                                                            ? "linear-gradient(135deg, rgba(38, 38, 42, 0.88) 0%, rgba(28, 28, 32, 0.85) 100%)"
                                                            : "linear-gradient(135deg, rgba(255, 255, 255, 0.88) 0%, rgba(250, 250, 252, 0.85) 100%)"
                                                        : isDark
                                                            ? "linear-gradient(135deg, rgba(40, 40, 45, 0.95) 0%, rgba(30, 30, 35, 0.9) 100%)"
                                                            : "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 250, 252, 0.9) 100%)",
                                                    border: isApple
                                                        ? isDark
                                                            ? "0.5px solid rgba(255, 255, 255, 0.15)"
                                                            : "0.5px solid rgba(255, 255, 255, 0.8)"
                                                        : `1.5px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}`,
                                                    borderRadius: isApple ? "18px" : "32px",
                                                    boxShadow: isApple
                                                        ? isDark
                                                            ? "0 16px 48px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3), 0 0 0 0.5px rgba(255, 255, 255, 0.1) inset"
                                                            : "0 12px 40px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06), 0 0 0 0.5px rgba(255, 255, 255, 1) inset"
                                                        : isDark
                                                            ? "0 12px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                                                            : "0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)"
                                                }}
                                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                                            >
                                                {/* Top glass reflection */}
                                                {isApple && (
                                                    <div
                                                        className="absolute inset-x-0 top-0 pointer-events-none"
                                                        style={{
                                                            height: "40%",
                                                            background: isDark
                                                                ? "linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%)"
                                                                : "linear-gradient(180deg, rgba(255, 255, 255, 0.6) 0%, transparent 100%)",
                                                            borderRadius: "50% 50% 0 0 / 100% 100% 0 0"
                                                        }}
                                                    />
                                                )}
                                                <div className={`${isApple ? "p-2.5" : "p-3"} relative z-10`}>
                                                    {category.items.map((item, index) => (
                                                        <Link
                                                            key={item.href}
                                                            href={item.href}
                                                        >
                                                            <motion.div
                                                                className={`${isApple ? "p-3 rounded-xl" : "p-4 rounded-2xl"} cursor-pointer flex items-start gap-3`}
                                                                whileHover={{
                                                                    backgroundColor: isApple
                                                                        ? isDark
                                                                            ? "rgba(255, 255, 255, 0.08)"
                                                                            : "rgba(0, 0, 0, 0.04)"
                                                                        : isDark
                                                                            ? "rgba(255, 255, 255, 0.08)"
                                                                            : "rgba(0, 0, 0, 0.05)",
                                                                    scale: 1.01
                                                                }}
                                                                whileTap={{ scale: 0.98 }}
                                                                initial={{ opacity: 0, x: -10 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{
                                                                    delay: index * 0.05,
                                                                    duration: 0.2,
                                                                    ease: [0.25, 0.46, 0.45, 0.94]
                                                                }}
                                                            >
                                                                {item.icon && (
                                                                    <div
                                                                        className={`flex-shrink-0 ${isApple ? "text-lg" : "text-xl"}`}
                                                                        style={{
                                                                            color: palette.accent
                                                                        }}
                                                                    >
                                                                        {item.icon}
                                                                    </div>
                                                                )}
                                                                <div className="flex-1 min-w-0">
                                                                    <div
                                                                        className={`${isApple ? "text-sm font-semibold" : "text-base font-bold"}`}
                                                                        style={{
                                                                            color: palette.textPrimary
                                                                        }}
                                                                    >
                                                                        {item.label}
                                                                    </div>
                                                                    {item.description && (
                                                                        <div
                                                                            className={`${isApple ? "text-xs" : "text-sm"} mt-0.5`}
                                                                            style={{
                                                                                color: palette.textSecondary
                                                                            }}
                                                                        >
                                                                            {item.description}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>

                        {/* Right Section - Quick Action Buttons */}
                        <div className="flex items-center gap-2">
                            {!isAuthenticated && (
                                <>
                                    <Link href="/auth/signin">
                                        <motion.button
                                            className={`${isApple ? "px-4 py-2 text-sm font-semibold" : "px-5 py-2.5 text-sm font-bold"} rounded-xl relative overflow-hidden`}
                                            style={{
                                                color: palette.textSecondary,
                                                background: "transparent"
                                            }}
                                            whileHover={{
                                                backgroundColor: isApple
                                                    ? isDark
                                                        ? "rgba(255, 255, 255, 0.08)"
                                                        : "rgba(0, 0, 0, 0.04)"
                                                    : isDark
                                                        ? "rgba(255, 255, 255, 0.08)"
                                                        : "rgba(0, 0, 0, 0.05)",
                                                color: palette.textPrimary,
                                                scale: 1.02
                                            }}
                                            whileTap={{ scale: 0.97 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            Login
                                        </motion.button>
                                    </Link>
                                    <Link href="/auth/signup">
                                        <motion.button
                                            className={`${isApple ? "px-4 py-2 text-sm font-semibold" : "px-5 py-2.5 text-sm font-bold"} rounded-xl relative overflow-hidden`}
                                            style={{
                                                background: isApple
                                                    ? isDark
                                                        ? `linear-gradient(135deg, ${palette.accent} 0%, ${palette.accent}dd 100%)`
                                                        : `linear-gradient(135deg, ${palette.accent} 0%, ${palette.accent}ee 100%)`
                                                    : `linear-gradient(135deg, ${palette.accent} 0%, ${palette.accent}dd 100%)`,
                                                color: isDark ? "#ffffff" : "#ffffff",
                                                border: isApple
                                                    ? `0.5px solid ${palette.accent}40`
                                                    : "none",
                                                boxShadow: isApple
                                                    ? isDark
                                                        ? `0 4px 12px ${palette.accent}30, 0 0 0 0.5px rgba(255, 255, 255, 0.1) inset`
                                                        : `0 2px 8px ${palette.accent}25, 0 0 0 0.5px rgba(255, 255, 255, 0.5) inset`
                                                    : `0 4px 12px ${palette.accent}40`
                                            }}
                                            whileHover={{
                                                scale: 1.05,
                                                boxShadow: isApple
                                                    ? isDark
                                                        ? `0 6px 16px ${palette.accent}40, 0 0 0 0.5px rgba(255, 255, 255, 0.15) inset`
                                                        : `0 4px 12px ${palette.accent}30, 0 0 0 0.5px rgba(255, 255, 255, 0.6) inset`
                                                    : `0 6px 16px ${palette.accent}50`
                                            }}
                                            whileTap={{ scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            {isApple && (
                                                <div
                                                    className="absolute inset-x-0 top-0 h-1/2 pointer-events-none"
                                                    style={{
                                                        background: isDark
                                                            ? "linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, transparent 100%)"
                                                            : "linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, transparent 100%)",
                                                        borderRadius: "50% 50% 0 0 / 100% 100% 0 0"
                                                    }}
                                                />
                                            )}
                                            <span className="relative z-10">Register</span>
                                        </motion.button>
                                    </Link>
                                </>
                            )}
                            
                            {/* User Menu Dropdown */}
                            {isAuthenticated && (
                            <div
                                className="relative"
                                onMouseEnter={() => handleMenuEnter("user-menu")}
                                onMouseLeave={handleMenuLeave}
                            >
                                <motion.button
                                    className={`${isApple ? "p-2.5" : "p-3"} rounded-xl relative overflow-hidden`}
                                    style={{
                                        color: activeMenu === "user-menu" ? palette.accent : palette.textSecondary,
                                        background: activeMenu === "user-menu"
                                            ? isApple
                                                ? isDark
                                                    ? `linear-gradient(135deg, ${palette.accent}20 0%, ${palette.accent}15 100%)`
                                                    : `linear-gradient(135deg, ${palette.accent}15 0%, ${palette.accent}10 100%)`
                                                : `linear-gradient(135deg, ${palette.accent}20 0%, ${palette.accent}15 100%)`
                                            : "transparent",
                                        border: activeMenu === "user-menu" 
                                            ? isApple
                                                ? `0.5px solid ${palette.accent}30`
                                                : `1.5px solid ${palette.accent}40`
                                            : "0.5px solid transparent"
                                    }}
                                    whileHover={{
                                        backgroundColor: activeMenu !== "user-menu" 
                                            ? isApple
                                                ? isDark
                                                    ? `${palette.accent}20`
                                                    : `${palette.accent}15`
                                                : `${palette.accent}20`
                                            : undefined,
                                        color: palette.accent,
                                        scale: 1.08
                                    }}
                                    whileTap={{ scale: 0.92 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <AccountCircle />
                                </motion.button>

                                {/* User Dropdown Menu */}
                                <AnimatePresence>
                                    {activeMenu === "user-menu" && (
                                        <motion.div
                                            className="absolute top-full right-0 mt-2 min-w-[240px] overflow-hidden"
                                            style={{
                                                zIndex: 9999,
                                                backdropFilter: isApple
                                                    ? "blur(60px) saturate(200%)"
                                                    : "none",
                                                WebkitBackdropFilter: isApple
                                                    ? "blur(60px) saturate(200%)"
                                                    : "none",
                                                background: isApple
                                                    ? isDark
                                                        ? "linear-gradient(135deg, rgba(38, 38, 42, 0.88) 0%, rgba(28, 28, 32, 0.85) 100%)"
                                                        : "linear-gradient(135deg, rgba(255, 255, 255, 0.88) 0%, rgba(250, 250, 252, 0.85) 100%)"
                                                    : isDark
                                                        ? "linear-gradient(135deg, rgba(40, 40, 45, 0.95) 0%, rgba(30, 30, 35, 0.9) 100%)"
                                                        : "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 250, 252, 0.9) 100%)",
                                                border: isApple
                                                    ? isDark
                                                        ? "0.5px solid rgba(255, 255, 255, 0.15)"
                                                        : "0.5px solid rgba(255, 255, 255, 0.8)"
                                                    : `1.5px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}`,
                                                borderRadius: isApple ? "18px" : "32px",
                                                boxShadow: isApple
                                                    ? isDark
                                                        ? "0 16px 48px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3), 0 0 0 0.5px rgba(255, 255, 255, 0.1) inset"
                                                        : "0 12px 40px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06), 0 0 0 0.5px rgba(255, 255, 255, 1) inset"
                                                    : isDark
                                                        ? "0 12px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                                                        : "0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)"
                                            }}
                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                                        >
                                            {/* Top glass reflection */}
                                            {isApple && (
                                                <div
                                                    className="absolute inset-x-0 top-0 pointer-events-none"
                                                    style={{
                                                        height: "40%",
                                                        background: isDark
                                                            ? "linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%)"
                                                            : "linear-gradient(180deg, rgba(255, 255, 255, 0.6) 0%, transparent 100%)",
                                                        borderRadius: "50% 50% 0 0 / 100% 100% 0 0"
                                                    }}
                                                />
                                            )}
                                            <div className={`${isApple ? "p-2.5" : "p-3"} relative z-10`}>
                                                <Link href="/profile">
                                                    <motion.div
                                                        className={`${isApple ? "p-3 rounded-xl" : "p-4 rounded-2xl"} cursor-pointer flex items-start gap-3`}
                                                        whileHover={{
                                                            backgroundColor: isApple
                                                                ? isDark
                                                                    ? "rgba(255, 255, 255, 0.08)"
                                                                    : "rgba(0, 0, 0, 0.04)"
                                                                : isDark
                                                                    ? "rgba(255, 255, 255, 0.08)"
                                                                    : "rgba(0, 0, 0, 0.05)",
                                                            scale: 1.01
                                                        }}
                                                        whileTap={{ scale: 0.98 }}
                                                    >
                                                        <div className={`flex-shrink-0 ${isApple ? "text-lg" : "text-xl"}`} style={{ color: palette.accent }}>
                                                            <AccountCircle />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className={`${isApple ? "text-sm font-semibold" : "text-base font-bold"}`} style={{ color: palette.textPrimary }}>
                                                                Profile
                                                            </div>
                                                            <div className={`${isApple ? "text-xs" : "text-sm"} mt-0.5`} style={{ color: palette.textSecondary }}>
                                                                View your profile
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                </Link>
                                                <Link href="/settings">
                                                    <motion.div
                                                        className={`${isApple ? "p-3 rounded-xl" : "p-4 rounded-2xl"} cursor-pointer flex items-start gap-3`}
                                                        whileHover={{
                                                            backgroundColor: isApple
                                                                ? isDark
                                                                    ? "rgba(255, 255, 255, 0.08)"
                                                                    : "rgba(0, 0, 0, 0.04)"
                                                                : isDark
                                                                    ? "rgba(255, 255, 255, 0.08)"
                                                                    : "rgba(0, 0, 0, 0.05)",
                                                            scale: 1.01
                                                        }}
                                                        whileTap={{ scale: 0.98 }}
                                                    >
                                                        <div className={`flex-shrink-0 ${isApple ? "text-lg" : "text-xl"}`} style={{ color: palette.accent }}>
                                                            <Settings />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className={`${isApple ? "text-sm font-semibold" : "text-base font-bold"}`} style={{ color: palette.textPrimary }}>
                                                                Settings
                                                            </div>
                                                            <div className={`${isApple ? "text-xs" : "text-sm"} mt-0.5`} style={{ color: palette.textSecondary }}>
                                                                Manage preferences
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                </Link>
                                                <motion.div
                                                    className={`${isApple ? "p-3 rounded-xl" : "p-4 rounded-2xl"} cursor-pointer flex items-start gap-3`}
                                                    onClick={() => setShowSwitchAccountModal(true)}
                                                    whileHover={{
                                                        backgroundColor: isApple
                                                            ? isDark
                                                                ? "rgba(255, 255, 255, 0.08)"
                                                                : "rgba(0, 0, 0, 0.04)"
                                                            : isDark
                                                                ? "rgba(255, 255, 255, 0.08)"
                                                                : "rgba(0, 0, 0, 0.05)",
                                                        scale: 1.01
                                                    }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    <div className={`flex-shrink-0 ${isApple ? "text-lg" : "text-xl"}`} style={{ color: palette.accent }}>
                                                        <SwapHoriz />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className={`${isApple ? "text-sm font-semibold" : "text-base font-bold"}`} style={{ color: palette.textPrimary }}>
                                                            Switch Account
                                                        </div>
                                                        <div className={`${isApple ? "text-xs" : "text-sm"} mt-0.5`} style={{ color: palette.textSecondary }}>
                                                            Change active account
                                                        </div>
                                                    </div>
                                                </motion.div>
                                                <div className={`${isApple ? "my-2 mx-3" : "my-2.5 mx-4"} h-px`} style={{ background: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)" }} />
                                                <motion.button
                                                    onClick={handleSignOut}
                                                    className={`${isApple ? "p-3 rounded-xl" : "p-4 rounded-2xl"} cursor-pointer flex items-start gap-3 w-full`}
                                                    whileHover={{
                                                        backgroundColor: isApple
                                                            ? isDark
                                                                ? "rgba(255, 68, 68, 0.12)"
                                                                : "rgba(239, 68, 68, 0.08)"
                                                            : isDark
                                                                ? "rgba(255, 68, 68, 0.12)"
                                                                : "rgba(239, 68, 68, 0.08)",
                                                        scale: 1.01
                                                    }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    <div className={`flex-shrink-0 ${isApple ? "text-lg" : "text-xl"}`} style={{ color: isDark ? "#ff4444" : "#ef4444" }}>
                                                        <Logout />
                                                    </div>
                                                    <div className="flex-1 min-w-0 text-left">
                                                        <div className={`${isApple ? "text-sm font-semibold" : "text-base font-bold"}`} style={{ color: isDark ? "#ff4444" : "#ef4444" }}>
                                                            Sign Out
                                                        </div>
                                                        <div className={`${isApple ? "text-xs" : "text-sm"} mt-0.5`} style={{ color: palette.textSecondary }}>
                                                            Log out of your account
                                                        </div>
                                                    </div>
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile Navigation */}
            <motion.nav
                className="fixed left-0 right-0 z-50 md:hidden overflow-visible"
                style={{
                    top: showNotification ? "52px" : "0",
                    transition: "top 0.3s ease",
                    backdropFilter: isApple ? "blur(40px) saturate(180%)" : "none",
                    WebkitBackdropFilter: isApple ? "blur(40px) saturate(180%)" : "none",
                    background: isApple
                        ? isDark
                            ? "linear-gradient(180deg, rgba(28, 28, 30, 0.85) 0%, rgba(20, 20, 22, 0.8) 100%)"
                            : "linear-gradient(180deg, rgba(255, 255, 255, 0.85) 0%, rgba(250, 250, 252, 0.8) 100%)"
                        : isDark
                            ? "linear-gradient(135deg, rgba(30, 30, 35, 0.95) 0%, rgba(25, 25, 30, 0.9) 100%)"
                            : "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 248, 250, 0.9) 100%)",
                    borderBottom: isApple
                        ? `0.5px solid ${isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)"}`
                        : `1.5px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}`,
                    boxShadow: isApple
                        ? isDark
                            ? "0 4px 16px rgba(0, 0, 0, 0.3), 0 0 0 0.5px rgba(255, 255, 255, 0.05) inset"
                            : "0 2px 12px rgba(0, 0, 0, 0.06), 0 0 0 0.5px rgba(255, 255, 255, 0.8) inset"
                        : isDark
                            ? "0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                            : "0 2px 12px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.7)"
                }}
            >
                {/* Top glass reflection - Apple only */}
                {isApple && (
                    <div
                        className="absolute inset-x-0 top-0 h-1/2 pointer-events-none"
                        style={{
                            background: isDark
                                ? "linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, transparent 100%)"
                                : "linear-gradient(180deg, rgba(255, 255, 255, 0.6) 0%, transparent 100%)",
                            borderRadius: "0 0 50% 50% / 0 0 100% 100%"
                        }}
                    />
                )}
                <div className="px-4 py-3 flex items-center justify-between relative z-10">
                    <Link href="/">
                        <motion.div
                            className="text-xl font-black"
                            style={{ color: palette.textPrimary }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Meet<span style={{ color: palette.accent }}>.</span>
                        </motion.div>
                    </Link>

                    <motion.button
                        onClick={toggleMobileMenu}
                        className="p-2 rounded-lg"
                        style={{ color: palette.textPrimary }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <div className="space-y-1.5">
                            <motion.div
                                className="w-6 h-0.5 bg-current rounded-full"
                                animate={{
                                    rotate: uiState.mobileMenuOpen ? 45 : 0,
                                    y: uiState.mobileMenuOpen ? 8 : 0
                                }}
                                transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                            />
                            <motion.div
                                className="w-6 h-0.5 bg-current rounded-full"
                                animate={{ opacity: uiState.mobileMenuOpen ? 0 : 1 }}
                                transition={{ duration: 0.15 }}
                            />
                            <motion.div
                                className="w-6 h-0.5 bg-current rounded-full"
                                animate={{
                                    rotate: uiState.mobileMenuOpen ? -45 : 0,
                                    y: uiState.mobileMenuOpen ? -8 : 0
                                }}
                                transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                            />
                        </div>
                    </motion.button>
                </div>

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {uiState.mobileMenuOpen && (
                        <motion.div
                            className="absolute top-full left-0 right-0 overflow-hidden"
                            style={{
                                backdropFilter: isApple ? "blur(60px) saturate(200%)" : "none",
                                WebkitBackdropFilter: isApple ? "blur(60px) saturate(200%)" : "none",
                                background: isApple
                                    ? isDark
                                        ? "linear-gradient(180deg, rgba(28, 28, 30, 0.92) 0%, rgba(20, 20, 22, 0.88) 100%)"
                                        : "linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(250, 250, 252, 0.88) 100%)"
                                    : isDark
                                        ? "linear-gradient(135deg, rgba(30, 30, 35, 0.98) 0%, rgba(25, 25, 30, 0.95) 100%)"
                                        : "linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 248, 250, 0.95) 100%)",
                                borderBottom: isApple
                                    ? `0.5px solid ${isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)"}`
                                    : `1.5px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}`,
                                maxHeight: "calc(100vh - 60px)",
                                overflowY: "auto",
                                boxShadow: isApple
                                    ? isDark
                                        ? "0 8px 32px rgba(0, 0, 0, 0.4)"
                                        : "0 4px 24px rgba(0, 0, 0, 0.1)"
                                    : isDark
                                        ? "0 8px 32px rgba(0, 0, 0, 0.5)"
                                        : "0 4px 24px rgba(0, 0, 0, 0.08)"
                            }}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                        >
                            <div className="p-5 space-y-5">
                                {menuCategories.map((category, catIndex) => (
                                    <motion.div 
                                        key={category.label} 
                                        className="space-y-2.5"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: catIndex * 0.1 }}
                                    >
                                        <div
                                            className={`${isApple ? "text-xs font-semibold" : "text-xs font-black"} uppercase tracking-[0.15em]`}
                                            style={{ color: palette.textTertiary }}
                                        >
                                            {category.label}
                                        </div>
                                        {category.items.map((item, itemIndex) => (
                                            <Link key={item.href} href={item.href}>
                                                <motion.div
                                                    className={`p-4 ${isApple ? "rounded-2xl" : "rounded-3xl"} flex items-center gap-3.5 relative overflow-hidden`}
                                                    style={{
                                                        background: isApple
                                                            ? isDark
                                                                ? "linear-gradient(135deg, rgba(44, 44, 48, 0.5) 0%, rgba(36, 36, 40, 0.45) 100%)"
                                                                : "linear-gradient(135deg, rgba(242, 242, 247, 0.7) 0%, rgba(235, 235, 240, 0.65) 100%)"
                                                            : isDark
                                                                ? "linear-gradient(135deg, rgba(45, 45, 50, 0.6) 0%, rgba(35, 35, 40, 0.55) 100%)"
                                                                : "linear-gradient(135deg, rgba(248, 248, 250, 0.8) 0%, rgba(240, 240, 245, 0.75) 100%)",
                                                        border: isApple
                                                            ? `0.5px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}`
                                                            : `1.5px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}`,
                                                        boxShadow: isApple
                                                            ? isDark
                                                                ? "0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)"
                                                                : "0 1px 4px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.6)"
                                                            : isDark
                                                                ? "0 2px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                                                                : "0 2px 12px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.7)"
                                                    }}
                                                    onClick={closeMobileMenu}
                                                    whileTap={{ scale: 0.97 }}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: catIndex * 0.1 + itemIndex * 0.05 }}
                                                >
                                                    {/* Top highlight */}
                                                    <div
                                                        className="absolute inset-x-0 top-0 h-px"
                                                        style={{
                                                            background: isDark
                                                                ? "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.08) 50%, transparent 100%)"
                                                                : "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.8) 50%, transparent 100%)"
                                                        }}
                                                    />
                                                    {item.icon && (
                                                        <div
                                                            className="text-xl"
                                                            style={{ color: palette.accent }}
                                                        >
                                                            {item.icon}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div
                                                            className={isApple ? "font-semibold" : "font-black"}
                                                            style={{
                                                                color: palette.textPrimary
                                                            }}
                                                        >
                                                            {item.label}
                                                        </div>
                                                        {item.description && (
                                                            <div
                                                                className={`text-xs mt-0.5 ${isApple ? "font-medium" : "font-semibold"}`}
                                                                style={{
                                                                    color: palette.textSecondary
                                                                }}
                                                            >
                                                                {item.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            </Link>
                                        ))}
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.nav>

            {/* Spacer */}
            <div 
                style={{
                    height: showNotification ? "116px" : "64px",
                    transition: "height 0.3s ease"
                }}
            />

            {/* Switch Account Modal */}
            <SwitchAccountModal 
                isOpen={showSwitchAccountModal} 
                onClose={() => setShowSwitchAccountModal(false)} 
            />
        </>
    );
}
