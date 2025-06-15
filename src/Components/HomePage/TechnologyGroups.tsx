"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Code,
	Security,
	Cloud,
	Speed,
	Build,
	Storage,
	Api,
	Devices,
	Psychology,
	AutoFixHigh,
} from "@mui/icons-material";

interface Technology {
	name: string;
	icon: string;
	color: string;
	proficiency: number;
	yearsOfExperience: number;
	projects: number;
}

interface TechnologyGroup {
	id: string;
	title: string;
	description: string;
	icon: React.ReactNode;
	color: string;
	technologies: Technology[];
	featured: boolean;
}

const technologyGroups: TechnologyGroup[] = [
	{
		id: "frontend",
		title: "Frontend Development",
		description:
			"Modern web interfaces with React, Next.js, and cutting-edge frameworks. Building responsive, accessible, and performant user experiences.",
		icon: <Code className="text-2xl" />,
		color: "from-blue-500 to-cyan-500",
		featured: true,
		technologies: [
			{
				name: "React",
				icon: "⚛️",
				color: "#61DAFB",
				proficiency: 90,
				yearsOfExperience: 3,
				projects: 15,
			},
			{
				name: "Next.js",
				icon: "▲",
				color: "#000000",
				proficiency: 95,
				yearsOfExperience: 2.5,
				projects: 12,
			},
			{
				name: "TypeScript",
				icon: "📘",
				color: "#3178C6",
				proficiency: 94,
				yearsOfExperience: 2,
				projects: 20,
			},
			{
				name: "Tailwind CSS",
				icon: "🎨",
				color: "#06B6D4",
				proficiency: 88,
				yearsOfExperience: 2,
				projects: 18,
			},
			{
				name: "Framer Motion",
				icon: "🎭",
				color: "#FF0055",
				proficiency: 85,
				yearsOfExperience: 1.5,
				projects: 8,
			},
			{
				name: "Sass/SCSS",
				icon: "💅",
				color: "#CC6699",
				proficiency: 87,
				yearsOfExperience: 3,
				projects: 14,
			},
		],
	},
	{
		id: "backend",
		title: "Backend & APIs",
		description:
			"Scalable server architectures with Node.js, Express, and modern database solutions. Building secure, performant, and maintainable backend systems.",
		icon: <Api className="text-2xl" />,
		color: "from-green-500 to-emerald-500",
		featured: true,
		technologies: [
			{
				name: "Node.js",
				icon: "🟢",
				color: "#339933",
				proficiency: 92,
				yearsOfExperience: 3,
				projects: 25,
			},
			{
				name: "Express.js",
				icon: "🚂",
				color: "#000000",
				proficiency: 95,
				yearsOfExperience: 3,
				projects: 22,
			},
			{
				name: "MongoDB",
				icon: "🍃",
				color: "#47A248",
				proficiency: 88,
				yearsOfExperience: 2.5,
				projects: 18,
			},
			{
				name: "Mongoose",
				icon: "🐻",
				color: "#880000",
				proficiency: 90,
				yearsOfExperience: 2.5,
				projects: 16,
			},
			{
				name: "REST APIs",
				icon: "🔗",
				color: "#FF6B6B",
				proficiency: 93,
				yearsOfExperience: 3,
				projects: 30,
			},
			{
				name: "JWT",
				icon: "🔐",
				color: "#000000",
				proficiency: 89,
				yearsOfExperience: 2,
				projects: 15,
			},
		],
	},
	{
		id: "security",
		title: "Security & Protection",
		description:
			"Enterprise-grade security implementations including threat intelligence, bot detection, rate limiting, and advanced protection mechanisms.",
		icon: <Security className="text-2xl" />,
		color: "from-red-500 to-pink-500",
		featured: true,
		technologies: [
			{
				name: "Threat Intelligence",
				icon: "🛡️",
				color: "#DC2626",
				proficiency: 96,
				yearsOfExperience: 2,
				projects: 5,
			},
			{
				name: "Rate Limiting",
				icon: "⏱️",
				color: "#7C3AED",
				proficiency: 94,
				yearsOfExperience: 2.5,
				projects: 12,
			},
			{
				name: "CSRF Protection",
				icon: "🔒",
				color: "#059669",
				proficiency: 92,
				yearsOfExperience: 2,
				projects: 10,
			},
			{
				name: "Bot Detection",
				icon: "🤖",
				color: "#DC2626",
				proficiency: 98,
				yearsOfExperience: 2,
				projects: 3,
			},
			{
				name: "Session Management",
				icon: "👤",
				color: "#7C2D12",
				proficiency: 91,
				yearsOfExperience: 2,
				projects: 8,
			},
			{
				name: "Encryption",
				icon: "🔐",
				color: "#1F2937",
				proficiency: 87,
				yearsOfExperience: 1.5,
				projects: 6,
			},
		],
	},
	{
		id: "devops",
		title: "DevOps & Deployment",
		description:
			"Modern deployment pipelines with CI/CD, containerization, and cloud services. Automating development workflows for reliable, scalable deployments.",
		icon: <Cloud className="text-2xl" />,
		color: "from-purple-500 to-indigo-500",
		featured: false,
		technologies: [
			{
				name: "Vercel",
				icon: "▲",
				color: "#000000",
				proficiency: 93,
				yearsOfExperience: 2,
				projects: 15,
			},
			{
				name: "GitHub Actions",
				icon: "⚡",
				color: "#2088FF",
				proficiency: 89,
				yearsOfExperience: 1.5,
				projects: 12,
			},
			{
				name: "Docker",
				icon: "🐳",
				color: "#2496ED",
				proficiency: 82,
				yearsOfExperience: 1,
				projects: 6,
			},
			{
				name: "Nginx",
				icon: "🔧",
				color: "#009639",
				proficiency: 78,
				yearsOfExperience: 1,
				projects: 4,
			},
			{
				name: "Git",
				icon: "📚",
				color: "#F05032",
				proficiency: 94,
				yearsOfExperience: 3,
				projects: 40,
			},
			{
				name: "Linux",
				icon: "🐧",
				color: "#FCC624",
				proficiency: 85,
				yearsOfExperience: 2,
				projects: 20,
			},
		],
	},
	{
		id: "automation",
		title: "Automation & Scripting",
		description:
			"Advanced automation systems with multi-threading, browser automation, and intelligent session management. Building tools that save time and increase efficiency.",
		icon: <Build className="text-2xl" />,
		color: "from-orange-500 to-red-500",
		featured: true,
		technologies: [
			{
				name: "Python",
				icon: "🐍",
				color: "#3776AB",
				proficiency: 94,
				yearsOfExperience: 3,
				projects: 20,
			},
			{
				name: "Selenium",
				icon: "🌐",
				color: "#43B02A",
				proficiency: 96,
				yearsOfExperience: 2.5,
				projects: 8,
			},
			{
				name: "Multi-threading",
				icon: "🧵",
				color: "#FF6B6B",
				proficiency: 93,
				yearsOfExperience: 2,
				projects: 6,
			},
			{
				name: "Browser Automation",
				icon: "🤖",
				color: "#4285F4",
				proficiency: 98,
				yearsOfExperience: 2.5,
				projects: 5,
			},
			{
				name: "Task Scheduling",
				icon: "⏰",
				color: "#8B5CF6",
				proficiency: 88,
				yearsOfExperience: 2,
				projects: 10,
			},
			{
				name: "Process Management",
				icon: "⚙️",
				color: "#059669",
				proficiency: 91,
				yearsOfExperience: 2,
				projects: 12,
			},
		],
	},
	{
		id: "ai-tools",
		title: "AI & Development Tools",
		description:
			"Cutting-edge AI-enhanced development workflows with modern tools like GitHub Copilot, Cursor, and advanced productivity systems.",
		icon: <Psychology className="text-2xl" />,
		color: "from-pink-500 to-rose-500",
		featured: true,
		technologies: [
			{
				name: "GitHub Copilot",
				icon: "🤖",
				color: "#2088FF",
				proficiency: 95,
				yearsOfExperience: 2,
				projects: 30,
			},
			{
				name: "Cursor AI",
				icon: "✨",
				color: "#FF6B6B",
				proficiency: 88,
				yearsOfExperience: 0.5,
				projects: 5,
			},
			{
				name: "ChatGPT",
				icon: "🧠",
				color: "#00A67E",
				proficiency: 90,
				yearsOfExperience: 1,
				projects: 15,
			},
			{
				name: "Code Generation",
				icon: "⚡",
				color: "#7C3AED",
				proficiency: 92,
				yearsOfExperience: 2,
				projects: 25,
			},
			{
				name: "AI Debugging",
				icon: "🐛",
				color: "#DC2626",
				proficiency: 87,
				yearsOfExperience: 1,
				projects: 20,
			},
			{
				name: "Productivity Tools",
				icon: "🚀",
				color: "#059669",
				proficiency: 94,
				yearsOfExperience: 3,
				projects: 35,
			},
		],
	},
];

function TechnologyGroups() {
	const [activeGroup, setActiveGroup] = useState<string | null>(null);
	const [randomizedGroups, setRandomizedGroups] = useState(technologyGroups);

	useEffect(() => {
		// Randomize the order and positions of technology groups
		const shuffled = [...technologyGroups].sort(() => Math.random() - 0.5);
		setRandomizedGroups(shuffled);
	}, []);

	const getProficiencyColor = (proficiency: number) => {
		if (proficiency >= 95) return "text-green-600 dark:text-green-400";
		if (proficiency >= 90) return "text-blue-600 dark:text-blue-400";
		if (proficiency >= 85) return "text-purple-600 dark:text-purple-400";
		if (proficiency >= 80) return "text-yellow-600 dark:text-yellow-400";
		return "text-gray-600 dark:text-gray-400";
	};

	const getProficiencyWidth = (proficiency: number) => ({
		width: `${proficiency}%`,
	});

	return (
		<section className="py-20 bg-white dark:bg-gray-900">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Section Header */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className="text-center mb-16"
				>
					<h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
						Technology{" "}
						<span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
							Expertise
						</span>
					</h2>
					<p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
						Comprehensive skill set spanning modern web development,
						enterprise security, automation systems, and AI-enhanced
						workflows.
					</p>
				</motion.div>

				{/* Technology Groups Grid */}
				<div className="space-y-16">
					{randomizedGroups.map((group, groupIndex) => (
						<motion.div
							key={group.id}
							initial={{ opacity: 0, y: 40 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{
								duration: 0.8,
								delay: groupIndex * 0.1,
							}}
							className={`relative ${groupIndex % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"} flex flex-col lg:flex gap-12 items-center`}
						>
							{/* Technology Icons Side */}
							<div className="lg:w-1/2 relative">
								<motion.div
									className="grid grid-cols-2 md:grid-cols-3 gap-6"
									initial={{ opacity: 0, scale: 0.8 }}
									whileInView={{ opacity: 1, scale: 1 }}
									transition={{ duration: 0.6, delay: 0.2 }}
								>
									{group.technologies.map(
										(tech, techIndex) => (
											<motion.div
												key={tech.name}
												initial={{ opacity: 0, y: 20 }}
												whileInView={{
													opacity: 1,
													y: 0,
												}}
												transition={{
													duration: 0.5,
													delay: techIndex * 0.1,
												}}
												whileHover={{
													scale: 1.05,
													y: -5,
												}}
												className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 cursor-pointer group"
												onClick={() =>
													setActiveGroup(
														activeGroup === group.id
															? null
															: group.id
													)
												}
											>
												<div className="text-center space-y-3">
													<div className="text-3xl mb-2">
														{tech.icon}
													</div>
													<h4 className="font-semibold text-gray-900 dark:text-white text-sm">
														{tech.name}
													</h4>
													<div
														className={`text-xs font-medium ${getProficiencyColor(tech.proficiency)}`}
													>
														{tech.proficiency}%
														Proficiency
													</div>

													{/* Proficiency Bar */}
													<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
														<motion.div
															className={`h-full bg-gradient-to-r ${group.color} rounded-full`}
															initial={{
																width: 0,
															}}
															whileInView={{
																width: `${tech.proficiency}%`,
															}}
															transition={{
																duration: 1,
																delay:
																	techIndex *
																	0.1,
															}}
														/>
													</div>

													{/* Additional Info on Hover */}
													<div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xs text-gray-600 dark:text-gray-400 space-y-1">
														<div>
															{
																tech.yearsOfExperience
															}{" "}
															years experience
														</div>
														<div>
															{tech.projects}{" "}
															projects
														</div>
													</div>
												</div>
											</motion.div>
										)
									)}
								</motion.div>

								{/* Floating Elements */}
								<motion.div
									className={`absolute -top-4 -left-4 w-20 h-20 bg-gradient-to-r ${group.color} rounded-full opacity-20 blur-xl`}
									animate={{
										scale: [1, 1.2, 1],
										opacity: [0.2, 0.3, 0.2],
									}}
									transition={{
										duration: 4,
										repeat: Infinity,
										delay: groupIndex * 0.5,
									}}
								/>
								<motion.div
									className={`absolute -bottom-4 -right-4 w-16 h-16 bg-gradient-to-r ${group.color} rounded-full opacity-15 blur-lg`}
									animate={{
										scale: [1.2, 1, 1.2],
										opacity: [0.15, 0.25, 0.15],
									}}
									transition={{
										duration: 3,
										repeat: Infinity,
										delay: groupIndex * 0.3,
									}}
								/>
							</div>

							{/* Description Side */}
							<div className="lg:w-1/2 space-y-6">
								<motion.div
									initial={{
										opacity: 0,
										x: groupIndex % 2 === 0 ? 20 : -20,
									}}
									whileInView={{ opacity: 1, x: 0 }}
									transition={{ duration: 0.6, delay: 0.3 }}
									className="space-y-4"
								>
									{/* Category Header */}
									<div className="flex items-center space-x-3">
										<div
											className={`w-12 h-12 bg-gradient-to-r ${group.color} rounded-lg flex items-center justify-center text-white`}
										>
											{group.icon}
										</div>
										<div>
											<h3 className="text-2xl font-bold text-gray-900 dark:text-white">
												{group.title}
											</h3>
											{group.featured && (
												<span className="inline-flex items-center space-x-1 text-xs font-medium text-blue-600 dark:text-blue-400">
													<AutoFixHigh className="text-xs" />
													<span>
														Featured Expertise
													</span>
												</span>
											)}
										</div>
									</div>

									{/* Description */}
									<p className="text-gray-600 dark:text-gray-300 leading-relaxed">
										{group.description}
									</p>

									{/* Stats */}
									<div className="grid grid-cols-2 gap-4">
										<div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
											<div className="text-2xl font-bold text-gray-900 dark:text-white">
												{group.technologies.length}
											</div>
											<div className="text-sm text-gray-600 dark:text-gray-400">
												Technologies
											</div>
										</div>
										<div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
											<div className="text-2xl font-bold text-gray-900 dark:text-white">
												{Math.round(
													group.technologies.reduce(
														(acc, tech) =>
															acc +
															tech.proficiency,
														0
													) /
														group.technologies
															.length
												)}
												%
											</div>
											<div className="text-sm text-gray-600 dark:text-gray-400">
												Avg. Proficiency
											</div>
										</div>
									</div>

									{/* Detailed View Toggle */}
									<motion.button
										onClick={() =>
											setActiveGroup(
												activeGroup === group.id
													? null
													: group.id
											)
										}
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.95 }}
										className={`w-full py-3 px-6 bg-gradient-to-r ${group.color} text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300`}
									>
										{activeGroup === group.id
											? "Hide Details"
											: "View Details"}
									</motion.button>
								</motion.div>

								{/* Expanded Details */}
								<AnimatePresence>
									{activeGroup === group.id && (
										<motion.div
											initial={{ opacity: 0, height: 0 }}
											animate={{
												opacity: 1,
												height: "auto",
											}}
											exit={{ opacity: 0, height: 0 }}
											transition={{ duration: 0.3 }}
											className="overflow-hidden"
										>
											<div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-4">
												<h4 className="font-semibold text-gray-900 dark:text-white mb-4">
													Detailed Proficiency
													Breakdown
												</h4>
												{group.technologies.map(
													(tech, index) => (
														<motion.div
															key={tech.name}
															initial={{
																opacity: 0,
																y: 10,
															}}
															animate={{
																opacity: 1,
																y: 0,
															}}
															transition={{
																duration: 0.3,
																delay:
																	index *
																	0.05,
															}}
															className="space-y-2"
														>
															<div className="flex justify-between items-center">
																<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
																	{tech.icon}{" "}
																	{tech.name}
																</span>
																<span
																	className={`text-sm font-medium ${getProficiencyColor(tech.proficiency)}`}
																>
																	{
																		tech.proficiency
																	}
																	%
																</span>
															</div>
															<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
																<motion.div
																	className={`h-2 bg-gradient-to-r ${group.color} rounded-full`}
																	initial={{
																		width: 0,
																	}}
																	animate={{
																		width: `${tech.proficiency}%`,
																	}}
																	transition={{
																		duration: 0.8,
																		delay:
																			index *
																			0.1,
																	}}
																/>
															</div>
															<div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
																<span>
																	{
																		tech.yearsOfExperience
																	}{" "}
																	years
																</span>
																<span>
																	{
																		tech.projects
																	}{" "}
																	projects
																</span>
															</div>
														</motion.div>
													)
												)}
											</div>
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
}

export default TechnologyGroups;
