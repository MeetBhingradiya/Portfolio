"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
    Code,
    Star,
    ForkRight,
    People,
    PersonAdd,
    Timeline,
    Refresh,
    GitHub
} from "@mui/icons-material";
import { GitHubAPI, GitHubStats } from "../../Utils/GitHubAPI";
import CountUp from "../../Lib/TextAnimations/CountUp/CountUp";

interface GitHubStatsComponentProps {
    showExtended?: boolean;
}

const GitHubStatsComponent: React.FC<GitHubStatsComponentProps> = ({
    showExtended = false
}) => {
    const [stats, setStats] = useState<GitHubStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const githubStats = await GitHubAPI.fetchGitHubStats();
            setStats(githubStats as GitHubStats);
        } catch (err) {
            setError("Failed to fetch GitHub data");
            console.error("Error fetching GitHub stats:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const basicStats = [
        {
            icon: <Code className="text-4xl text-blue-400 mx-auto mb-4" />,
            value: stats?.publicRepos || 0,
            label: "Repositories",
            color: "text-blue-400"
        },
        {
            icon: <Star className="text-4xl text-yellow-400 mx-auto mb-4" />,
            value: stats?.totalStars || 0,
            label: "Stars Earned",
            color: "text-yellow-400"
        },
        {
            icon: (
                <ForkRight className="text-4xl text-green-400 mx-auto mb-4" />
            ),
            value: stats?.totalForks || 0,
            label: "Forks",
            color: "text-green-400"
        }
    ];

    const extendedStats = [
        {
            icon: <People className="text-4xl text-purple-400 mx-auto mb-4" />,
            value: stats?.followers || 0,
            label: "Followers",
            color: "text-purple-400"
        },
        {
            icon: <PersonAdd className="text-4xl text-pink-400 mx-auto mb-4" />,
            value: stats?.following || 0,
            label: "Following",
            color: "text-pink-400"
        }
    ];

    const displayStats = showExtended
        ? [...basicStats, ...extendedStats]
        : basicStats;

    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2 }}
            className="w-full max-w-4xl">
            <div className="flex items-center justify-center gap-4 mb-12">
                <h2 className="text-3xl font-bold text-white text-center">
                    GitHub Activity
                </h2>
            </div>

            {loading && !stats ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 text-center">
                            <div className="animate-pulse">
                                <div className="w-12 h-12 bg-gray-400 rounded-full mx-auto mb-4"></div>
                                <div className="h-8 bg-gray-400 rounded mb-2"></div>
                                <div className="h-4 bg-gray-400 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : error || !stats ? (
                <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-500/30 text-center">
                    <p className="text-red-300 mb-4">
                        {error || "Failed to load GitHub data"}
                    </p>
                    <button
                        onClick={fetchStats}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 mx-auto">
                        <Refresh className="text-sm" />
                        Retry
                    </button>
                </div>
            ) : (
                <>
                    {showExtended ? (
                        <div className="space-y-8">
                            {/* First Row - 3 Basic Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {basicStats.map((stat, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            delay: 2.2 + index * 0.1
                                        }}
                                        className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 text-center hover:bg-white/15 transition-all duration-300 group">
                                        <div className="group-hover:scale-110 transition-transform duration-300">
                                            {stat.icon}
                                        </div>
                                        <h3 className="text-3xl font-bold text-white mb-2">
                                            <CountUp
                                                to={stat.value}
                                                duration={2}
                                                delay={2.4 + index * 0.1}
                                                className="text-3xl font-bold text-white"
                                                separator=","
                                                onStart={() => {}}
                                                onEnd={() => {}}
                                            />
                                        </h3>
                                        <p className="text-gray-300 text-lg">
                                            {stat.label}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Second Row - 2 Extended Stats Centered */}
                            <div className="flex justify-center">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl w-full">
                                    {extendedStats.map((stat, index) => (
                                        <motion.div
                                            key={index + 3}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{
                                                delay: 2.5 + index * 0.1
                                            }}
                                            className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 text-center hover:bg-white/15 transition-all duration-300 group">
                                            <div className="group-hover:scale-110 transition-transform duration-300">
                                                {stat.icon}
                                            </div>
                                            <h3 className="text-3xl font-bold text-white mb-2">
                                                <CountUp
                                                    to={stat.value}
                                                    duration={2}
                                                    delay={2.7 + index * 0.1}
                                                    className="text-3xl font-bold text-white"
                                                    separator=","
                                                    onStart={() => {}}
                                                    onEnd={() => {}}
                                                />
                                            </h3>
                                            <p className="text-gray-300 text-lg">
                                                {stat.label}
                                            </p>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {displayStats.map((stat, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 2.2 + index * 0.1 }}
                                    className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 text-center hover:bg-white/15 transition-all duration-300 group">
                                    <div className="group-hover:scale-110 transition-transform duration-300">
                                        {stat.icon}
                                    </div>
                                    <h3 className="text-3xl font-bold text-white mb-2">
                                        <CountUp
                                            to={stat.value}
                                            duration={2}
                                            delay={2.4 + index * 0.1}
                                            className="text-3xl font-bold text-white"
                                            separator=","
                                            onStart={() => {}}
                                            onEnd={() => {}}
                                        />
                                    </h3>
                                    <p className="text-gray-300 text-lg">
                                        {stat.label}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* GitHub Profile Link */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 3 }}
                        className="text-center mt-8">
                        <a
                            href="https://github.com/MeetBhingradiya"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-full transition-all duration-300 hover:scale-105 border border-gray-700">
                            <GitHub className="text-xl" />
                            View Profile
                        </a>
                    </motion.div>
                </>
            )}
        </motion.div>
    );
};

export default GitHubStatsComponent;
