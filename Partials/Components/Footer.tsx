"use client";

import React, { useState } from "react";
import { Config } from "../Config";
import { motion, AnimatePresence } from "motion/react";
import {
    ArrowUpward,
    Email,
    LocationOn,
    GitHub,
    LinkedIn,
    Schedule,
    Language,
    Security,
    Build,
    Copyright,
    Shield as Privacy,
    Description,
    Support,
    Analytics,
    Settings as ISettings,
    LockPerson,
    Quiz,
    PictureAsPdf,
    Book,
    Signpost,
    RssFeed,
    VideoLibrary,
    Timeline,
    Article
} from "@mui/icons-material";
import { Tooltip } from "@heroui/react";
import Link from "next/link";
import Settings from "./Settings";

interface FooterLink {
    label: string;
    href: string;
    external?: boolean;
    icon?: React.ReactNode;
    isDisabled?: boolean;
}

interface FooterSection {
    title: string;
    links: FooterLink[];
}

const footerSections: FooterSection[] = [
    {
        title: "Projects",
        links: [
            {
                label: "My Portfolio",
                href: "https://github.com/MeetBhingradiya/Portfolio",
                external: true,
                icon: <Build className="text-xs" />
            },
            {
                label: "Express Router Plugin",
                href: "https://github.com/MeetBhingradiya/express-router-plugin",
                external: true,
                icon: <Signpost className="text-xs" />
            },
            {
                label: "TS to MP4 Converter",
                href: "https://github.com/MeetBhingradiya/TStoMP4",
                external: true,
                icon: <VideoLibrary className="text-xs" />
            },
            {
                label: "Enterprise IdleLock",
                href: "https://github.com/MeetBhingradiya/SnehCreation-DeviceAutoLock",
                external: true,
                icon: <LockPerson className="text-xs" />
            },
            {
                label: "Image Compress & PDF",
                href: "https://github.com/MeetBhingradiya/NextImageCompress-PDF",
                external: true,
                icon: <PictureAsPdf className="text-xs" />
            },
            {
                label: "All Projects",
                href: "https://github.com/MeetBhingradiya?tab=repositories",
                external: true,
                icon: <Book className="text-xs" />,
                isDisabled: true
            },
        ]
    },
    {
        title: "Content",
        links: [
            {
                label: "Blogs",
                icon: <Article className="text-xs" />,
                href: "/blogs"
            },
            { 
                label: "Timeline", 
                icon: <Timeline className="text-xs" />,
                href: "/timeline",
                isDisabled: Config.ContactOptions.Timeline ? false : true
            },
            {
                label: "My Notes",
                href: "https://notes.meetbhingradiya.tech",
                icon: <Book className="text-xs" />
            },
            {
                label: "RSS Feed",
                href: "/rss.xml",
                icon: <RssFeed className="text-xs" />,
                isDisabled: Config.ContactOptions.RSS ? false : true
            },
            {
                label: "Sitemap",
                href: "/api/sitemap",
                icon: <Signpost className="text-xs" />
            }
        ]
    },
    {
        title: "Professional",
        links: [
            {
                label: "Resume",
                href: "https://rxresu.me/meetbhingradiya/resume",
                icon: <PictureAsPdf className="text-xs" />,
                external: true,
                isDisabled: Config.ContactOptions.Resume ? false : true
            },
            {
                label: "LinkedIn",
                href: "https://linkedin.com/in/meet-bhingradiya",
                icon: <LinkedIn className="text-xs" />,
                external: true,
                isDisabled: Config.ContactOptions.LinkedIn ? false : true
            },
            {
                label: "GitHub",
                href: "https://github.com/MeetBhingradiya",
                icon: <GitHub className="text-xs" />,
                external: true,
                isDisabled: Config.ContactOptions.GitHub ? false : true
            },
            {
                label: "Schedule Meeting",
                href: "https://calendly.com/meetbhingradiya",
                icon: <Schedule className="text-xs" />,
                external: true,
                isDisabled: Config.ContactOptions.Calendly ? false : true
            },
            {
                label: "Contact",
                href: "/contact",
                icon: <Email className="text-xs" />,
                isDisabled: Config.ContactOptions.Email ? false : true
            }
        ]
    },
    {
        title: "Legal & Support",
        links: [
            {
                label: "Privacy Policy",
                href: "/privacy",
                icon: <Privacy className="text-xs" />
            },
            {
                label: "Terms of Service",
                href: "/terms",
                icon: <Description className="text-xs" />
            },
            {
                label: "FAQ's",
                // href: "/support",
                href: "/contact",
                icon: <Quiz className="text-xs" />,
                isDisabled: Config.ContactOptions.Email ? false : true
            },
            {
                label: "Settings",
                href: "#settings",
                icon: <ISettings className="text-xs" />
            },
            {
                label: "Administration",
                href: "/auth/signin",
                icon: <LockPerson className="text-xs" />,
                external: true
            }
        ]
    }
];

const achievements: Array<{
    icon: React.ReactNode;
    label: string;
    value: string;
}> = [
        // {
        // 	icon: <Security className="text-lg" />,
        // 	label: "Security Expert",
        // 	value: "95%",
        // },
        // {
        // 	icon: <Build className="text-lg" />,
        // 	label: "Automation",
        // 	value: "98%",
        // },
        // {
        // 	icon: <Public className="text-lg" />,
        // 	label: "Open Source",
        // 	value: "Active",
        // },
        // {
        // 	icon: <Star className="text-lg" />,
        // 	label: "Skill Score",
        // 	value: "89.7/100",
        // },
    ];

const technologies = [
    "Next.js",
    "TypeScript",
    "Node.js",
    "MongoDB",
    "Python",
    "Security",
    "Automation",
    "AI Tools",
    "DevOps",
    "React",
    "Express.js",
    "Docker"
];

function Footer() {
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);

    React.useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 400);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const currentYear = new Date().getFullYear();

    return (
        <>
            {/* Scroll to Top Button */}
            <AnimatePresence>
                {showScrollTop && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        onClick={scrollToTop}
                        className="fixed bottom-8 right-8 z-50 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group"
                        whileHover={{ scale: 1.1, y: -2 }}
                        whileTap={{ scale: 0.9 }}>
                        <ArrowUpward className="text-xl group-hover:animate-bounce" />
                    </motion.button>
                )}
            </AnimatePresence>

            <footer className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='m0 40l40-40h-40v40zm40 0v-40h-40l40 40z'/%3E%3C/g%3E%3C/svg%3E")`
                        }}
                    />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Main Footer Content */}
                    <div className="py-16">
                        {/* Top Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
                            {/* Brand & Bio */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="lg:col-span-1 space-y-6">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                        {/* <Code className="text-white text-xl" /> */}
                                        <img
                                            src="/favicon.ico"
                                            alt="Logo"
                                            className="w-full h-full rounded-lg"
                                        />
                                    </div>
                                    <h3 className="text-2xl font-bold">
                                        Meet Bhingradiya
                                    </h3>
                                </div>

                                <p className="text-gray-300 leading-relaxed">
                                    {/* Security-focused Staff Engineer with
                                    expertise in enterprise automation,
                                    framework development, and AI-enhanced
                                    workflows. Building the future of secure,
                                    scalable software systems. */}

                                    Project Manager with a focus on
                                    delivering high-quality software solutions
                                    on time and within your budget.
                                </p>

                                {achievements.length > 0 && (
                                    <div className="grid grid-cols-2 gap-4">
                                        {achievements.map(
                                            (achievement, index) => (
                                                <motion.div
                                                    key={achievement.label}
                                                    initial={{
                                                        opacity: 0,
                                                        scale: 0.8
                                                    }}
                                                    whileInView={{
                                                        opacity: 1,
                                                        scale: 1
                                                    }}
                                                    transition={{
                                                        duration: 0.6,
                                                        delay: index * 0.1
                                                    }}
                                                    className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center hover:bg-white/20 transition-colors duration-300">
                                                    <div className="text-blue-400 mb-1 flex justify-center">
                                                        {achievement.icon}
                                                    </div>
                                                    <div className="text-lg font-bold">
                                                        {achievement.value}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        {achievement.label}
                                                    </div>
                                                </motion.div>
                                            )
                                        )}
                                    </div>
                                )}

                                {/* Social Links */}
                                {/* <div className="flex space-x-4">
                                    <motion.a
                                        href="https://github.com/MeetBhingradiya"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        whileHover={{ scale: 1.2, y: -2 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors duration-300">
                                        <GitHub className="text-xl" />
                                    </motion.a>
                                    <motion.a
                                        href="https://linkedin.com/in/meetbhingradiya"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        whileHover={{ scale: 1.2, y: -2 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors duration-300">
                                        <LinkedIn className="text-xl" />
                                    </motion.a>
                                    <motion.a
                                        href="/contact"
                                        whileHover={{ scale: 1.2, y: -2 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors duration-300">
                                        <Email className="text-xl" />
                                    </motion.a>
                                </div> */}
                            </motion.div>

                            {/* Navigation Links */}
                            <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-8">
                                {footerSections.map((section, sectionIndex) => (
                                    <motion.div
                                        key={section.title}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{
                                            duration: 0.6,
                                            delay: sectionIndex * 0.1
                                        }}
                                        className="space-y-4">
                                        <h4 className="text-lg font-semibold text-white">
                                            {section.title}
                                        </h4>
                                        <div className="space-y-3">
                                            {section.links.map((link, linkIndex) => (
                                                <motion.div
                                                    key={link.label}
                                                    // initial={{
                                                    // 	opacity: 0,
                                                    // 	x: -10,
                                                    // }}
                                                    whileInView={{
                                                        opacity: 1,
                                                        x: 0
                                                    }}
                                                    transition={{
                                                        duration: 0.4,
                                                        delay:
                                                            linkIndex * 0.05
                                                    }}>
                                                    {link.isDisabled ? (
                                                        <Tooltip content="Item Disabled By Creator of this Website please try again later">
                                                            <span className="flex items-center space-x-2 text-gray-300 cursor-not-allowed text-sm group opacity-60 select-none">
                                                                {link.icon && (
                                                                    <span className="text-gray-300">
                                                                        {link.icon}
                                                                    </span>
                                                                )}
                                                                <span>{link.label}</span>
                                                            </span>
                                                        </Tooltip>
                                                    ) : link.href === "#settings" ? (
                                                        <button
                                                            onClick={() =>
                                                                setIsModelMenuOpen(
                                                                    true
                                                                )
                                                            }
                                                            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-200 text-sm group cursor-pointer">
                                                            {link.icon && (
                                                                <span className="text-gray-400 group-hover:text-white">
                                                                    {link.icon}
                                                                </span>
                                                            )}
                                                            <span className="group-hover:translate-x-1 transition-transform duration-200">
                                                                {link.label}
                                                            </span>
                                                        </button>
                                                    ) : (
                                                        <Link
                                                            href={link.href}
                                                            target={
                                                                link.external
                                                                    ? "_blank"
                                                                    : "_self"
                                                            }
                                                            rel={
                                                                link.external
                                                                    ? "noopener noreferrer"
                                                                    : ""
                                                            }
                                                            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-200 text-sm group">
                                                            {link.icon && (
                                                                <span className="text-gray-400 group-hover:text-white">
                                                                    {link.icon}
                                                                </span>
                                                            )}
                                                            <span className="group-hover:translate-x-1 transition-transform duration-200">
                                                                {link.label}
                                                            </span>
                                                        </Link>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Current Status */}
                        <motion.div
                            // initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.5 }}
                            className="bg-gradient-to-r from-blue-500/20 to-purple-600/20 backdrop-blur-sm rounded-xl p-6 mb-4 border border-white/10">
                            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                                <div className="flex items-center space-x-3">
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                                    <span className="font-semibold">
                                        Currently Available for Project Manager Positions
                                    </span>
                                </div>
                                <div className="flex items-center space-x-6 text-sm text-gray-300">
                                    {
                                        Config.ContactOptions.Location && (
                                            <div className="flex items-center space-x-1">
                                                <LocationOn className="text-sm" />
                                                <span>Surat, India</span>
                                            </div>
                                        )
                                    }
                                    {
                                        Config.ContactOptions.Calendly && (
                                            <div className="flex items-center space-x-1">
                                                <Schedule className="text-sm" />
                                                <span>GMT+5:30</span>
                                            </div>
                                        )
                                    }
                                    <div className="flex items-center space-x-1">
                                        <Language className="text-sm" />
                                        <span>
                                            Available for Remote {
                                                Config.ContactOptions.Location ? " & OnSite" : ""
                                            }
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <Build className="text-sm" />
                                        <span>Full Time</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Bottom Section */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="border-t border-white/10 py-8">
                        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                            <div className="flex items-center space-x-2 text-gray-300">
                                <Copyright className="text-lg" />
                                <span>{currentYear} Meet Bhingradiya.</span>
                                <span>All rights reserved.</span>
                            </div>

                            <div className="flex items-center space-x-6 text-sm text-gray-400">
                                <div className="flex items-center space-x-1">
                                    <Analytics className="text-sm" />
                                    <span>
                                        Built with Next.js, Github Copilot &
                                        TypeScript
                                    </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <Security className="text-sm" />
                                    <span>Secured with best practices</span>
                                </div>
                            </div>
                        </div>{" "}
                    </motion.div>
                </div>

                {/* Settings */}
                <Settings
                    isOpen={isModelMenuOpen}
                    onClose={() => setIsModelMenuOpen(false)}
                />
            </footer>
        </>
    );
}

export default Footer;
