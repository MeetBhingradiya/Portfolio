"use client";

import React, { useState } from 'react'
import "@Styles/LandingFooter.sass"
import { SocialLinks } from '@Config/SocialLinks'
import { useTheme } from "@Hooks/useTheme";
import { Tooltip } from '@heroui/react';
import { motion } from 'framer-motion';
import {
    ArrowUpward,
    Favorite,
    Email,
    LocationOn,
    Code,
    Coffee,
    GitHub,
    LinkedIn,
    Lightbulb,
    Settings,
    Contrast,
    DarkMode,
    LightMode
} from '@mui/icons-material';
import Image from 'next/image';
import ModelMenu from "@Components/ModelMenu";


interface Link {
    label: string
    endpoint?: string
    tooltip?: string
    function?: () => void
    isEnable?: boolean
}

interface Group {
    title: string
    links: Link[]
    isEnable?: boolean
}

function LandingFooter() {
    const { theme, toggleTheme } = useTheme();
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Scroll to top functionality
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Show/hide scroll to top button based on scroll position
    React.useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 400);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const Links: Group[] = [
        // {
        //     title: "About",
        //     links: [{
        //         label: "About Me",
        //         endpoint: "/about"
        //     },
        //     {
        //         label: "Experience",
        //         endpoint: "/Experience"
        //     },
        //     {
        //         label: "Education",
        //         endpoint: "/Education",
        //         isEnable: false
        //     },
        //     {
        //         label: "Skills",
        //         endpoint: "/Skills"
        //     },
        //     {
        //         label: "Resume",
        //         endpoint: "/Resume",
        //         tooltip: "Generate PDF Resume (Short Version of CV)"
        //     },
        //     {
        //         label: "CV",
        //         endpoint: "/CurriculumVitae",
        //         tooltip: "Generate PDF CV"
        //     },
        //     ]
        // },
        // {
        //     title: "Explore",
        //     isEnable: true,
        //     links: [
        //         {
        //             label: "Blogs",
        //             endpoint: "/blogs"
        //         },
        //         {
        //             label: "Showcase",
        //             endpoint: "/Showcase"
        //         },
        //         {
        //             label: "Timeline",
        //             endpoint: "/Showcase"
        //         },
        //     ]
        // },
        {
            title: "Projects",
            isEnable: true,
            links: [
                {
                    tooltip: "My Bookmark Manager",
                    label: "Browser Tab",
                    endpoint: "/Tools",
                    isEnable: true
                },
                {
                    tooltip: "Advanced QR Code Generator",
                    label: "QR Generator",
                    endpoint: "/Tools/QR",
                    isEnable: true
                },
                {
                    tooltip: "Python, Multi-Threaded, FFmpeg, Customizable",
                    label: "TS to MP4",
                    endpoint: "https://github.com/MeetBhingradiya/TStoMP4",
                    isEnable: true
                },
                {
                    tooltip: "Python, Multi-Threaded, Batch Convert, Customizable",
                    label: "Embroidery DST to PNG",
                    endpoint: "https://github.com/MeetBhingradiya/Embroidery-DST-to-PNG",
                    isEnable: true
                },
                {
                    label: "UUID Generator",
                    endpoint: "/Tools/UUID",
                    isEnable: false
                },
            ]
        },
        {
            title: "Products & Services",
            isEnable: false,
            links: [
                {
                    label: "Status",
                    endpoint: "/status"
                },
                {
                    label: "SM Network VIP",
                    endpoint: "/Social/Discord",
                    isEnable: false
                },
                {
                    label: "XBox Game Pass",
                    endpoint: "/Social/Discord",
                    isEnable: false
                },
            ]
        },
        {
            title: "Personalisation",
            isEnable: false,
            links: [
                {
                    label: "Switch Theme",
                    function: () => {
                        toggleTheme()
                    }
                },
                {
                    label: "Language",
                    function: () => { }
                }
            ]
        },
        {
            title: "Connect",
            isEnable: true,
            links: [
                {
                    label: "GitHub Projects",
                    endpoint: "https://github.com/MeetBhingradiya",
                    tooltip: "Explore my open source projects"
                },
                {
                    label: "LinkedIn Profile",
                    endpoint: "https://linkedin.com/in/meetbhingradiya",
                    tooltip: "Connect professionally"
                },
                {
                    label: "Email Me",
                    endpoint: "/contact",
                    tooltip: "Get in touch directly"
                },
                {
                    label: "Location",
                    endpoint: "#",
                    tooltip: "Surat, Gujarat, India",
                }
            ]
        },
        {
            title: "Support & Policies",
            isEnable: true,
            links: [
                {
                    label: "Open Source",
                    endpoint: ""
                },
                {
                    label: "Privacy Policy",
                    endpoint: "/privacy"
                },
                {
                    label: "Terms of Service",
                    endpoint: "/terms"
                },
                {
                    label: "Sitemap",
                    endpoint: "/api/sitemap"
                },
                {
                    label: "Contact Support",
                    endpoint: "/contact",
                    tooltip: "Get help and support"
                }
            ]
        },
    ];

    return (<>
        <footer className="relative bg-gradient-to-b from-slate-800 to-slate-900 text-white">
            {/* Scroll to Top Button */}
            {showScrollTop && (
                <motion.button
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    onClick={scrollToTop}
                    className="fixed bottom-8 right-8 z-50 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-full shadow-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-110"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <ArrowUpward className="text-xl" />
                </motion.button>
            )}

            {/* Main Footer Content */}
            <div className="max-w-6xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Brand Section */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="lg:col-span-1"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <Code className="text-white text-xl" />
                                {/* <Image
                                    src="http://localhost:3000/favicon.ico"
                                    alt="Meet Bhingradiya Logo"
                                    width={48}
                                    height={48}
                                    className="rounded-lg"
                                /> */}
                            </div>
                            <h2 className="text-2xl font-bold">Meet Bhingradiya</h2>
                        </div>
                        <p className="text-gray-300 mb-6 leading-relaxed">
                            Self-taught developer passionate about creating innovative solutions and contributing to open source. Currently pursuing Diploma in IT and exploring the tech industry.
                        </p>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                                <div className="text-2xl font-bold text-blue-400">30+</div>
                                <div className="text-sm text-gray-400">Projects</div>
                            </div>
                            <div className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                                <div className="text-2xl font-bold text-purple-400">2025</div>
                                <div className="text-sm text-gray-400">Goals</div>
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className="flex space-x-4">
                            {SocialLinks.filter(link => link.isEnable).map((social, index) => (
                                <motion.a
                                    key={social.Label}
                                    href={social.URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    whileHover={{ scale: 1.2, rotate: 5 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="text-gray-400 hover:text-white transition-colors duration-300 text-2xl"
                                >
                                    {social.Component}
                                </motion.a>
                            ))}
                        </div>
                    </motion.div>

                    {/* Links Sections */}
                    {Links.filter(group => group.isEnable !== false).map((group, groupIndex) => (
                        <motion.div
                            key={groupIndex}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: groupIndex * 0.1 }}
                            className="space-y-4"
                        >
                            <h3 className="text-lg font-semibold text-white mb-4">{group.title}</h3>
                            <div className="space-y-3">
                                {group.links.filter(link => link.isEnable !== false).map((link, linkIndex) => (
                                    <div key={linkIndex}>
                                        {link.tooltip ? (
                                            <Tooltip content={link.tooltip} placement="top">
                                                {link.function ? (
                                                    <button
                                                        onClick={link.function}
                                                        className="text-gray-400 hover:text-white transition-colors duration-300 cursor-pointer block text-left"
                                                    >
                                                        {link.label}
                                                    </button>
                                                ) : (
                                                    <a
                                                        href={link.endpoint}
                                                        target={link.endpoint?.startsWith('http') ? '_blank' : '_self'}
                                                        rel={link.endpoint?.startsWith('http') ? 'noopener noreferrer' : ''}
                                                        className="text-gray-400 hover:text-white transition-colors duration-300 block"
                                                    >
                                                        {link.label}
                                                    </a>
                                                )}
                                            </Tooltip>
                                        ) : (
                                            link.function ? (
                                                <button
                                                    onClick={link.function}
                                                    className="text-gray-400 hover:text-white transition-colors duration-300 cursor-pointer block text-left"
                                                >
                                                    {link.label}
                                                </button>
                                            ) : (
                                                <a
                                                    href={link.endpoint}
                                                    target={link.endpoint?.startsWith('http') ? '_blank' : '_self'}
                                                    rel={link.endpoint?.startsWith('http') ? 'noopener noreferrer' : ''}
                                                    className="text-gray-400 hover:text-white transition-colors duration-300 block"
                                                >
                                                    {link.label}
                                                </a>
                                            )
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
                {/* Bottom Section */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="border-t border-gray-700 mt-12 pt-8"
                >                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <div className="text-gray-400 text-sm">
                            All rights reserved. Meet Bhingradiya © 2021 - {new Date().getFullYear()}
                        </div>
                        <div className="flex items-center space-x-4 text-gray-400 text-sm">
                            {/* Sosical Links with Icons only */}
                            {
                                SocialLinks.filter(link => link.isEnable).map((social, index) => (
                                    <Tooltip key={index} content={social.Label} placement="top">
                                        <a
                                            href={social.URL}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-gray-400 hover:text-white transition-colors duration-300 text-lg"
                                        >
                                            {social.Component}
                                        </a>
                                    </Tooltip>
                                ))
                            }

                            {/* Theme Toggle */}
                            <Tooltip content={`Switch to ${theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark'} mode`} placement="top">
                                <div
                                    className="cursor-pointer hover:text-white"
                                    onClick={toggleTheme}
                                >
                                    {theme === "system" ? (
                                        <Contrast className="text-lg" />
                                    ) : theme === "light" ? (
                                        <LightMode className="text-lg" />
                                    ) : (
                                        <DarkMode className="text-lg" />
                                    )}
                                </div>
                            </Tooltip>

                            <Tooltip content="Site Settings" placement="top">
                                <div
                                    className="cursor-pointer hover:text-white"
                                    onClick={() => setIsSettingsOpen(true)}
                                >
                                    <Settings className="text-lg" />
                                </div>
                            </Tooltip>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Settings Modal */}
            <ModelMenu
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </footer>
    </>)
}

export default LandingFooter