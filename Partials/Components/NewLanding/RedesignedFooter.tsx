/**
 * Redesigned Footer Component
 * Supports both Apple Liquid Glass and Samsung One UI 7 themes
 * Features theme switcher and comprehensive navigation
 */

"use client";

import React from "react";
import { motion } from "motion/react";
import { useDesignTheme } from "../../Hooks/useDesignTheme";
import ThemeSwitcher from "./ThemeSwitcher";
import Link from "next/link";
import {
    Email,
    GitHub,
    LinkedIn,
    Twitter,
    LocationOn,
    Phone,
    ArrowUpward,
    Favorite
} from "@mui/icons-material";

interface FooterLink {
    label: string;
    href: string;
    external?: boolean;
}

interface FooterSection {
    title: string;
    links: FooterLink[];
}

const footerSections: FooterSection[] = [
    {
        title: "Navigation",
        links: [
            { label: "Home", href: "/" },
            { label: "Projects", href: "/projects" },
            { label: "Blog", href: "/blogs" },
            { label: "Timeline", href: "/timeline" }
        ]
    },
    {
        title: "Tools",
        links: [
            { label: "Utilities", href: "/Tools" },
            { label: "Timetable", href: "/timetable" },
            { label: "Dashboard", href: "/dashboard" },
            { label: "Settings", href: "/settings" }
        ]
    },
    {
        title: "Connect",
        links: [
            { label: "Contact", href: "/contact" },
            { label: "Profile", href: "/profile" },
            { label: "Tickets", href: "/tickets" }
        ]
    },
    {
        title: "Legal",
        links: [
            { label: "Privacy Policy", href: "/privacy" },
            { label: "Terms of Service", href: "/terms" }
        ]
    }
];

const socialLinks = [
    {
        icon: <GitHub />,
        href: "https://github.com/MeetBhingradiya",
        label: "GitHub",
        color: "#333333"
    },
    {
        icon: <LinkedIn />,
        href: "https://linkedin.com/in/meetbhingradiya",
        label: "LinkedIn",
        color: "#0A66C2"
    },
    {
        icon: <Twitter />,
        href: "https://twitter.com/meetbhingradiya",
        label: "Twitter",
        color: "#1DA1F2"
    },
    {
        icon: <Email />,
        href: "/contact",
        label: "Email",
        color: "#EA4335"
    }
];

export default function RedesignedFooter() {
    const { designTheme, palette, colorMode } = useDesignTheme();
    const isApple = designTheme === "apple";

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <footer
            className="relative border-t"
            style={{
                background: isApple
                    ? colorMode === "light"
                        ? `linear-gradient(180deg, ${palette.background} 0%, ${palette.backgroundElevated} 100%)`
                        : `linear-gradient(180deg, ${palette.background} 0%, ${palette.backgroundSecondary} 100%)`
                    : palette.background,
                borderColor: palette.border
            }}
        >
            {/* Decorative Top Border */}
            <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{
                    background: `linear-gradient(90deg, transparent 0%, ${palette.accent} 50%, transparent 100%)`
                }}
            />

            {/* Main Footer Content */}
            <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 mb-12">
                    {/* Brand Column */}
                    <div className="lg:col-span-2">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            {/* Logo */}
                            <Link href="/">
                                <motion.h3
                                    className={`${isApple ? "text-3xl font-bold" : "text-4xl font-black"} mb-4 cursor-pointer`}
                                    style={{ color: palette.textPrimary }}
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    Meet
                                    <span style={{ color: palette.accent }}>.</span>
                                </motion.h3>
                            </Link>

                            {/* Description */}
                            <p
                                className={`${isApple ? "text-sm leading-relaxed" : "text-base font-medium leading-relaxed"} mb-6 max-w-xs`}
                                style={{ color: palette.textSecondary }}
                            >
                                Full Stack Developer & Project Manager crafting innovative
                                solutions for the modern web. Passionate about clean code and
                                exceptional user experiences.
                            </p>

                            {/* Contact Info */}
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3">
                                    <LocationOn
                                        className={isApple ? "text-base" : "text-lg"}
                                        style={{ color: palette.accent }}
                                    />
                                    <span
                                        className={isApple ? "text-sm" : "text-base font-medium"}
                                        style={{ color: palette.textSecondary }}
                                    >
                                        Surat, Gujarat, India
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Email
                                        className={isApple ? "text-base" : "text-lg"}
                                        style={{ color: palette.accent }}
                                    />
                                    <a
                                        href="/contact"
                                        className={`${isApple ? "text-sm" : "text-base font-medium"} hover:underline`}
                                        style={{ color: palette.textSecondary }}
                                    >
                                        Get in touch
                                    </a>
                                </div>
                            </div>

                            {/* Social Links */}
                            <div className="flex items-center gap-3">
                                {socialLinks.map((social, index) => (
                                    <motion.a
                                        key={social.label}
                                        href={social.href}
                                        target={social.href.startsWith("http") ? "_blank" : undefined}
                                        rel={social.href.startsWith("http") ? "noopener noreferrer" : undefined}
                                        className={`${isApple ? "p-2.5 rounded-xl" : "p-3 rounded-2xl"}`}
                                        style={{
                                            background: isApple
                                                ? palette.glassBg
                                                : palette.backgroundSecondary,
                                            backdropFilter: isApple ? palette.glassBlur : "none",
                                            border: `1px solid ${palette.border}`,
                                            color: palette.textSecondary
                                        }}
                                        whileHover={{
                                            scale: 1.1,
                                            y: -4,
                                            backgroundColor: palette.accentSubtle,
                                            color: palette.accent,
                                            borderColor: palette.accent
                                        }}
                                        whileTap={{ scale: 0.9 }}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.3, delay: index * 0.1 }}
                                    >
                                        {social.icon}
                                    </motion.a>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* Link Columns */}
                    {footerSections.map((section, sectionIndex) => (
                        <motion.div
                            key={section.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: sectionIndex * 0.1 }}
                        >
                            <h4
                                className={`${isApple ? "text-sm font-semibold" : "text-base font-bold"} uppercase tracking-wider mb-4`}
                                style={{ color: palette.textTertiary }}
                            >
                                {section.title}
                            </h4>
                            <ul className="space-y-3">
                                {section.links.map((link, linkIndex) => (
                                    <motion.li
                                        key={link.label}
                                        initial={{ opacity: 0, x: -10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{
                                            duration: 0.3,
                                            delay: sectionIndex * 0.1 + linkIndex * 0.05
                                        }}
                                    >
                                        <Link href={link.href}>
                                            <motion.span
                                                className={`${isApple ? "text-sm" : "text-base font-medium"} block`}
                                                style={{ color: palette.textSecondary }}
                                                whileHover={{
                                                    color: palette.accent,
                                                    x: 4
                                                }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                {link.label}
                                            </motion.span>
                                        </Link>
                                    </motion.li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom Bar */}
                <motion.div
                    className={`flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t`}
                    style={{ borderColor: palette.border }}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    {/* Copyright */}
                    <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
                        <p
                            className={`${isApple ? "text-sm" : "text-base font-medium"} text-center md:text-left`}
                            style={{ color: palette.textTertiary }}
                        >
                            © {new Date().getFullYear()} Meet Bhingradiya
                        </p>
                        <span style={{ color: palette.textTertiary }}>•</span>
                        <div
                            className={`${isApple ? "text-sm" : "text-base font-medium"} flex items-center gap-2`}
                            style={{ color: palette.textTertiary }}
                        >
                            Made with{" "}
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            >
                                <Favorite
                                    className="text-base"
                                    style={{ color: "#FF2D55" }}
                                />
                            </motion.div>{" "}
                            in India
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-4">
                        {/* Theme Switcher */}
                        <ThemeSwitcher />

                        {/* Scroll to Top */}
                        <motion.button
                            onClick={scrollToTop}
                            className={`${isApple ? "p-3" : "p-4"} rounded-full`}
                            style={{
                                background: isApple
                                    ? palette.glassBg
                                    : palette.backgroundSecondary,
                                backdropFilter: isApple ? palette.glassBlur : "none",
                                border: `1px solid ${palette.border}`,
                                color: palette.textPrimary
                            }}
                            whileHover={{
                                scale: 1.1,
                                y: -4,
                                backgroundColor: palette.accent,
                                color: palette.textOnAccent,
                                borderColor: palette.accent
                            }}
                            whileTap={{ scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            aria-label="Scroll to top"
                        >
                            <ArrowUpward />
                        </motion.button>
                    </div>
                </motion.div>

                {/* Additional Info */}
                <motion.div
                    className={`mt-8 pt-6 border-t text-center`}
                    style={{ borderColor: palette.borderSubtle }}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                >
                    <p
                        className={`${isApple ? "text-xs" : "text-sm font-medium"}`}
                        style={{ color: palette.textTertiary }}
                    >
                        Built with Next.js, React, TypeScript & Tailwind CSS • Featuring Apple
                        Liquid Glass & Samsung One UI 7 themes
                    </p>
                </motion.div>
            </div>

            {/* Background Decoration */}
            {isApple && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
                    <motion.div
                        className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full"
                        style={{
                            background: `radial-gradient(circle, ${palette.accent} 0%, transparent 70%)`,
                            filter: "blur(60px)"
                        }}
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.5, 0.3]
                        }}
                        transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                    <motion.div
                        className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full"
                        style={{
                            background: `radial-gradient(circle, ${palette.accentLight} 0%, transparent 70%)`,
                            filter: "blur(60px)"
                        }}
                        animate={{
                            scale: [1.2, 1, 1.2],
                            opacity: [0.5, 0.3, 0.5]
                        }}
                        transition={{
                            duration: 10,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                </div>
            )}
        </footer>
    );
}
