"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Security,
    Architecture,
    Code,
    CloudDownload,
    GitHub,
    LinkedIn,
    LocationOn,
    Star,
    Visibility,
    Group,
    TrendingUp
} from "@mui/icons-material";
import Link from "next/link";
import Image from "next/image";

const expertiseAreas = [
    "Security Engineer",
    "Full Stack Developer",
    // "Framework Author",
    "DevOps Engineer",
    "System Architect",
    "Open Source Contributor"
];

const quickStats = [
    {
        icon: <Star className="text-lg" />,
        label: "10+",
        description: "Projects"
    },
    {
        icon: <Group className="text-lg" />,
        label: "10k+",
        description: "Lines of Code"
    },
    {
        icon: <GitHub className="text-lg" />,
        label: "3+",
        description: "Years Experience"
    }
    // {
    // 	icon: <TrendingUp className="text-lg" />,
    // 	label: "89.7",
    // 	description: "Skill Score By AI",
    // },
];

function HeroSection() {
    const [currentExpertiseIndex, setCurrentExpertiseIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentExpertiseIndex(
                (prev) => (prev + 1) % expertiseAreas.length
            );
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 dark:opacity-10">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='7'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}
                />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[80vh]">
                    <div className="lg:col-span-8 space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="inline-flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-4 py-2 rounded-full text-sm font-medium border border-green-200 dark:border-green-800">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span>
                                Available for Full Stack Developer positions
                            </span>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="space-y-4">
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                                Hi, I&apos;m{" "}
                                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Meet Bhingradiya
                                </span>
                            </h1>

                            <div className="flex flex-wrap items-center gap-3 text-xl sm:text-2xl text-gray-600 dark:text-gray-300">
                                <span>I&apos;m a</span>
                                <div className="relative h-8 flex items-center">
                                    <AnimatePresence mode="wait">
                                        <motion.span
                                            key={currentExpertiseIndex}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.5 }}
                                            className="font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                            {
                                                expertiseAreas[
                                                    currentExpertiseIndex
                                                ]
                                            }
                                        </motion.span>
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                        {/* Description */}{" "}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl">
                            Security-focused software engineer specializing in{" "}
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                                enterprise automation
                            </span>
                            ,{" "}
                            <span className="font-semibold text-purple-600 dark:text-purple-400">
                                framework development
                            </span>
                            , and{" "}
                            <span className="font-semibold text-pink-600 dark:text-pink-400">
                                AI-enhanced workflows
                            </span>
                            . Building production systems with advanced security
                            and scalability.
                        </motion.p>
                        {/* Quick Stats */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {quickStats.map((stat, index) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{
                                        duration: 0.6,
                                        delay: 0.4 + index * 0.1
                                    }}
                                    className="text-center p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700">
                                    <div className="text-blue-600 dark:text-blue-400 mb-2 flex justify-center">
                                        {stat.icon}
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {stat.label}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        {stat.description}
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                        {/* Action Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.5 }}
                            className="flex flex-wrap gap-4">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}>
                                <Link
                                    href="#showcase"
                                    className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-lg shadow-blue-600/25">
                                    <Code className="text-lg" />
                                    <span>View Projects</span>
                                </Link>
                            </motion.div>

                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}>
                                <Link
                                    href="#contact"
                                    className="inline-flex items-center space-x-2 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 border border-gray-300 dark:border-gray-600">
                                    <span>Get In Touch</span>
                                </Link>
                            </motion.div>

                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}>
                                <Link
                                    href="https://rxresu.me/meetbhingradiya/resume"
                                    target="_blank"
                                    className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200">
                                    <CloudDownload className="text-lg" />
                                    <span>Resume</span>
                                </Link>
                            </motion.div>
                        </motion.div>
                        {/* Location & Social */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.6 }}
                            className="flex flex-wrap items-center gap-6 text-gray-600 dark:text-gray-400">
                            <div className="flex items-center space-x-2">
                                <LocationOn className="text-lg" />
                                <span>Surat, Gujarat, India</span>
                            </div>

                            <div className="flex items-center space-x-4">
                                <motion.a
                                    href="https://github.com/MeetBhingradiya"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors duration-200">
                                    <GitHub className="text-xl" />
                                </motion.a>
                                <motion.a
                                    href="https://linkedin.com/in/meetbhingradiya"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors duration-200">
                                    <LinkedIn className="text-xl" />
                                </motion.a>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Side - Profile */}
                    <div className="lg:col-span-4 flex justify-center lg:justify-end">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            className="relative">
                            {/* Profile Image */}
                            <div className="relative w-64 h-64 lg:w-80 lg:h-80">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-spin-slow opacity-75"></div>
                                <div className="absolute inset-2 bg-white dark:bg-gray-900 rounded-full"></div>
                                <Image
                                    src="/favicon.ico"
                                    alt="Meet Bhingradiya - Security Engineer"
                                    className="absolute inset-4 rounded-full object-cover"
                                    width={280}
                                    height={280}
                                />

                                {/* Status indicators */}
                                <div className="absolute -bottom-2 -right-2 bg-green-500 text-white rounded-full p-3 shadow-lg">
                                    <Security className="text-lg" />
                                </div>
                            </div>

                            {/* Floating Elements */}
                            <motion.div
                                className="absolute -top-4 -left-4 bg-blue-500 text-white p-3 rounded-lg shadow-lg"
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 3, repeat: Infinity }}>
                                <Code className="text-lg" />
                            </motion.div>

                            <motion.div
                                className="absolute -bottom-4 -left-8 bg-purple-500 text-white p-3 rounded-lg shadow-lg"
                                animate={{ y: [0, 10, 0] }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    delay: 1.5
                                }}>
                                <Architecture className="text-lg" />
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default HeroSection;
