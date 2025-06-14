"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import "@Styles/Home.sass";
import { useState, useEffect } from "react";

// @ Icons Import
import {
    Bookmark,
    Analytics,
    GitHub,
    LinkedIn,
} from '@mui/icons-material';
import Link from "next/link";
import { SocialLinks } from "@Config/SocialLinks";
import RemoteImageLoader from "@/Utils/RemoteImageLoader";
import TechnologyGrid from "@Components/TechnologyIcons";
import Aurora from "@Lib/Backgrounds/Aurora/Aurora";
import GitHubStatsComponent from "@Components/GitHubStats";

const jobRoles = [
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "Freelanceer",
    // "Data Analytics",
    "Open Source Contributor",
    // "Student & Learner",
    "Software Engineer",
    // "SEO Specialist",
];

// @ File
export default function HomePage() {
    const [currentRoleIndex, setCurrentRoleIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentRoleIndex((prev) => (prev + 1) % jobRoles.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (<>
        <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
            {/* ReactBits Aurora Background */}
            <div className="absolute inset-0 opacity-20">
                <Aurora />
            </div>

            {/* Background Animations */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-10 left-10 w-20 h-20 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="absolute top-40 right-20 w-16 h-16 bg-purple-500 rounded-full animate-bounce"></div>
                <div className="absolute bottom-20 left-20 w-24 h-24 bg-pink-500 rounded-full animate-ping"></div>
                <div className="absolute bottom-40 right-10 w-12 h-12 bg-green-500 rounded-full animate-pulse"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pb-10 pt-40 sm:px-6 lg:px-8">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center space-y-8 max-w-4xl mx-auto"
                >
                    {/* Profile Image */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="relative mx-auto w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-spin-slow"></div>
                        <div className="absolute inset-2 bg-slate-900 rounded-full"></div>
                        <Image
                            src="/favicon.ico"
                            alt="Meet Bhingradiya's Profile"
                            className="absolute inset-3 rounded-full object-cover"
                            width={180}
                            height={180}
                            loader={RemoteImageLoader}
                        />
                    </motion.div>

                    {/* Name and Role */}
                    <div className="space-y-4">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white"
                        >
                            Hi, I&apos;m <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Meet</span>
                        </motion.h1>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="h-12 flex items-center justify-center"
                        >
                            <span className="text-xl sm:text-2xl text-gray-300 mr-2">I&apos;m a</span>
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={currentRoleIndex}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.5 }}
                                    className="text-xl sm:text-2xl font-semibold bg-gradient-to-r from-pink-400 to-yellow-400 bg-clip-text text-transparent"
                                >
                                    {jobRoles[currentRoleIndex]}
                                </motion.span>
                            </AnimatePresence>
                        </motion.div>
                    </div>

                    {/* Description */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
                    >
                        Self-taught college student pursuing Diploma in IT from India.
                        Currently learning Next.js and exploring the tech industry.
                        Passionate about building innovative solutions and contributing to open source.
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                    >
                        <Link
                            href="/projects"
                            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
                        >
                            View My Work
                        </Link>
                        <Link
                            href="/contact"
                            className="px-8 py-3 border-2 border-purple-500 text-purple-400 font-semibold rounded-full hover:bg-purple-500 hover:text-white transition-all duration-300"
                        >
                            Get In Touch
                        </Link>
                    </motion.div>

                    {/* Social Links */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2 }}
                        className="flex justify-center space-x-6"
                    >
                        {SocialLinks.filter(link => link.isEnable).map((social, index) => (
                            <motion.a
                                key={social.Label}
                                href={social.URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                whileHover={{ scale: 1.2, rotate: 5 }}
                                whileTap={{ scale: 0.9 }}
                                className="text-gray-400 hover:text-white transition-colors duration-300 text-3xl"
                            >
                                {social.Component}
                            </motion.a>
                        ))}
                    </motion.div>
                </motion.div>

                {/* Technology Stack Section */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.4 }}
                    className="mt-20 w-full"
                >
                    <TechnologyGrid />
                </motion.div>
                {/* GitHub Stats Section */}
                <div className="mt-20">
                    <GitHubStatsComponent showExtended={true} />
                </div>

                {/* Current Goals Section */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.2 }}
                    className="mt-20 w-full max-w-4xl mb-20"
                >
                    <h2 className="text-3xl font-bold text-white text-center mb-12">
                        2025 Goals
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-gradient-to-br from-blue-500/20 to-purple-600/20 backdrop-blur-sm rounded-lg p-8 border border-blue-500/30">
                            <Bookmark className="text-4xl text-blue-400 mb-4" />
                            <h3 className="text-xl font-bold text-white mb-4">Portfolio Project</h3>
                            <p className="text-gray-300">Building a comprehensive portfolio to showcase my skills and projects to potential employers and collaborators.</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 backdrop-blur-sm rounded-lg p-8 border border-purple-500/30">
                            <Analytics className="text-4xl text-purple-400 mb-4" />
                            <h3 className="text-xl font-bold text-white mb-4">Industry Exploration</h3>
                            <p className="text-gray-300">Exploring different areas of the tech industry to find my passion and specialize in areas that excite me most.</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-r from-blue-600 to-purple-700 py-12"
        >
            <div className="max-w-6xl mx-auto px-4 text-center">
                <h2 className="text-3xl font-bold mb-4">Let&apos;s Build Something Amazing Together</h2>
                <p className="text-xl mb-8 text-blue-100">
                    Interested in collaborating? I&apos;m always open to discussing new opportunities.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <motion.a
                        href="/contact"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-full hover:bg-gray-100 transition-colors"
                    >
                        Get In Touch
                    </motion.a>
                    <motion.a
                        href="https://github.com/MeetBhingradiya"
                        target="_blank"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-8 py-3 border-2 border-white text-white font-semibold rounded-full hover:bg-white hover:text-blue-600 transition-colors"
                    >
                        View GitHub
                    </motion.a>
                </div>
            </div>
        </motion.div>
    </>
    );
}