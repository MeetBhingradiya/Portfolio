"use client";

import React from 'react';
import { motion } from 'framer-motion';

// Technology Icons Component
const TechnologyIcon = ({ name, icon, category, index }: {
    name: string;
    icon: string;
    category: string;
    index: number;
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0, rotateY: 180 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ 
                delay: 0.1,
                duration: 0.3,
                type: "spring",
                stiffness: 100
            }}
            whileHover={{ 
                scale: 1.1, 
                y: -8,
                rotateY: 15,
                transition: { duration: 0.3 }
            }}
            whileTap={{ scale: 0.95 }}
            className="group relative flex flex-col items-center p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer"
        >
            {/* Glow Effect */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
            
            {/* Icon */}
            <div className="relative z-10 text-4xl mb-3 transform group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            
            {/* Name */}
            <span className="relative z-10 text-sm text-gray-300 text-center font-medium group-hover:text-white transition-colors duration-300">
                {name}
            </span>
            
            {/* Category Badge */}
            <span className="relative z-10 text-xs text-gray-500 mt-1 px-2 py-1 bg-black/20 rounded-full group-hover:bg-black/40 transition-colors duration-300">
                {category}
            </span>

            {/* Hover Tooltip */}
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
                {name}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/80"></div>
            </div>
        </motion.div>
    );
};

// Enhanced Technology Icons with better visual representations
export const technologies = [
    { name: "JavaScript", icon: "🟨", category: "Frontend", color: "#F7DF1E" },
    { name: "TypeScript", icon: "🔷", category: "Frontend", color: "#3178C6" },
    { name: "React", icon: "⚛️", category: "Frontend", color: "#61DAFB" },
    { name: "Next.js", icon: "▲", category: "Frontend", color: "#000000" },
    { name: "Node.js", icon: "🟢", category: "Backend", color: "#339933" },
    { name: "Python", icon: "🐍", category: "Backend", color: "#3776AB" },
    { name: "MongoDB", icon: "🍃", category: "Database", color: "#47A248" },
    { name: "Git", icon: "📦", category: "Tools", color: "#F05032" },
    { name: "VSCode", icon: "💙", category: "Tools", color: "#007ACC" },
    { name: "Tailwind CSS", icon: "🎨", category: "Frontend", color: "#06B6D4" },
    { name: "Bun", icon: "🥯", category: "Runtime", color: "#FBF0DF" },
    { name: "Bootstrap", icon: "🅱️", category: "Frontend", color: "#7952B3" },
    { name: "Cloudflare", icon: "☁️", category: "Cloud", color: "#F38020" },
    { name: "CSS3", icon: "🎭", category: "Frontend", color: "#1572B6" },
    { name: "HTML5", icon: "🏗️", category: "Frontend", color: "#E34F26" },
    { name: "Markdown", icon: "📝", category: "Documentation", color: "#000000" },
    { name: "NPM", icon: "📦", category: "Package Manager", color: "#CB3837" },
    { name: "PHP", icon: "🐘", category: "Backend", color: "#777BB4" },
    { name: "Bash", icon: "🖥️", category: "Scripting", color: "#4EAA25" },
    { name: "C", icon: "⚙️", category: "Programming", color: "#A8B9CC" },

    // Github Copilot other Ai Tools
    { name: "Github Copilot Pro", icon: "🤖", category: "AI", color: "#F9D000" },
    { name: "ChatGPT", icon: "💬", category: "AI", color: "#10A37F" },
    // { name: "Google Gemini", icon: "🔍", category: "AI", color: "#4285F4" },
];

// Technology Grid Component
const TechnologyGrid = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full max-w-7xl mx-auto"
        >
            <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-4xl font-bold text-white text-center mb-4"
            >
                Technologies I Work With
            </motion.h2>
            
            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-gray-300 text-center mb-12 text-lg"
            >
                A curated collection of tools and technologies I use to bring ideas to life
            </motion.p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {technologies.map((tech, index) => (
                    <TechnologyIcon
                        key={tech.name}
                        name={tech.name}
                        icon={tech.icon}
                        category={tech.category}
                        index={index}
                    />
                ))}
            </div>

            {/* Categories Legend */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1 }}
                className="mt-12 flex flex-wrap justify-center gap-4"
            >
                {Array.from(new Set(technologies.map(tech => tech.category))).map((category, index) => (
                    <motion.div
                        key={category}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.2 + index * 0.1 }}
                        className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-sm text-gray-300"
                    >
                        {category}
                    </motion.div>
                ))}
            </motion.div>
        </motion.div>
    );
};

export default TechnologyGrid;
