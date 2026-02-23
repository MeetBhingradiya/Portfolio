/**
 * New Landing Page
 * Modern portfolio with Apple Liquid Glass and Samsung One UI 7 themes
 */

"use client";

import React from "react";
import AdvancedNavigation from "../../Components/NewLanding/AdvancedNavigation";
import ModernHero from "../../Components/NewLanding/ModernHero";
import {
    ProjectsSection,
    SkillsSection,
    ExperienceSection
} from "../../Components/NewLanding/LandingSections";
import ThemeSwitcher from "../../Components/NewLanding/ThemeSwitcher";
import { useDesignTheme } from "../../Hooks/useDesignTheme";
import { motion } from "motion/react";
import Link from "next/link";
import {
    Email,
    GitHub,
    LinkedIn,
    Twitter,
    Article,
    Timeline,
    Settings
} from "@mui/icons-material";

function FooterContent() {
    const { palette, designTheme } = useDesignTheme();
    const isApple = designTheme === "apple";

    const footerLinks = [
        {
            title: "Navigation",
            links: [
                { label: "Projects", href: "/projects" },
                { label: "Blog", href: "/blogs" },
                { label: "Timeline", href: "/timeline" },
                { label: "Contact", href: "/contact" }
            ]
        },
        {
            title: "Tools",
            links: [
                { label: "Utilities", href: "/Tools" },
                { label: "Timetable", href: "/timetable" },
                { label: "Settings", href: "/settings" }
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
        { icon: <GitHub />, href: "https://github.com/MeetBhingradiya", label: "GitHub" },
        { icon: <LinkedIn />, href: "https://linkedin.com/in/meetbhingradiya", label: "LinkedIn" },
        { icon: <Email />, href: "/contact", label: "Email" }
    ];

    return (
        <footer
            className={`${isApple ? "py-16" : "py-20"} border-t`}
            style={{
                background: isApple
                    ? palette.backgroundElevated
                    : palette.background,
                borderColor: palette.border
            }}
        >
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
                    {/* Brand Column */}
                    <div className="lg:col-span-2">
                        <h3
                            className={`${isApple ? "text-2xl font-bold" : "text-3xl font-black"} mb-4`}
                            style={{ color: palette.textPrimary }}
                        >
                            Meet<span style={{ color: palette.accent }}>.</span>
                        </h3>
                        <p
                            className={`${isApple ? "text-sm" : "text-base font-medium"} mb-6 max-w-xs`}
                            style={{ color: palette.textSecondary }}
                        >
                            Full Stack Developer & Project Manager building innovative
                            solutions for the web.
                        </p>
                        <div className="flex items-center gap-3">
                            {socialLinks.map((social) => (
                                <motion.a
                                    key={social.label}
                                    href={social.href}
                                    target={social.href.startsWith("http") ? "_blank" : undefined}
                                    rel={social.href.startsWith("http") ? "noopener noreferrer" : undefined}
                                    className={`${isApple ? "p-2" : "p-3"} rounded-full`}
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
                                        backgroundColor: palette.accentSubtle,
                                        color: palette.accent
                                    }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    {social.icon}
                                </motion.a>
                            ))}
                        </div>
                    </div>

                    {/* Link Columns */}
                    {footerLinks.map((section) => (
                        <div key={section.title}>
                            <h4
                                className={`${isApple ? "text-sm font-semibold" : "text-base font-bold"} uppercase tracking-wider mb-4`}
                                style={{ color: palette.textTertiary }}
                            >
                                {section.title}
                            </h4>
                            <ul className="space-y-3">
                                {section.links.map((link) => (
                                    <li key={link.label}>
                                        <Link href={link.href}>
                                            <span
                                                className={`${isApple ? "text-sm" : "text-base font-medium"} hover:underline`}
                                                style={{ color: palette.textSecondary }}
                                            >
                                                {link.label}
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom Bar */}
                <div
                    className={`flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t`}
                    style={{ borderColor: palette.border }}
                >
                    <p
                        className={`${isApple ? "text-sm" : "text-base font-medium"}`}
                        style={{ color: palette.textTertiary }}
                    >
                        © {new Date().getFullYear()} Meet Bhingradiya. All rights reserved.
                    </p>

                    {/* Theme Switcher */}
                    <ThemeSwitcher />
                </div>
            </div>
        </footer>
    );
}

export default function NewLandingPage() {
    return (
        <div className="min-h-screen">
            <AdvancedNavigation />
            <ModernHero />
            <ProjectsSection />
            <SkillsSection />
            <ExperienceSection />
            <FooterContent />
        </div>
    );
}
