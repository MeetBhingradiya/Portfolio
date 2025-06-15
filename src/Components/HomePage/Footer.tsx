"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	ArrowUpward,
	Favorite,
	Email,
	LocationOn,
	Code,
	Coffee,
	GitHub,
	LinkedIn,
	Star,
	Visibility,
	Schedule,
	Language,
	Security,
	Build,
	Public,
	Copyright,
	Shield as Privacy,
	Description,
	Support,
	RssFeed,
	Analytics,
} from "@mui/icons-material";
import Link from "next/link";
import Image from "next/image";

interface FooterLink {
	label: string;
	href: string;
	external?: boolean;
	icon?: React.ReactNode;
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
				label: "Portfolio Platform",
				href: "https://github.com/MeetBhingradiya/Portfolio",
				external: true,
			},
			// {
			// 	label: "MS Rewards Bot",
			// 	href: "https://github.com/MeetBhingradiya/BingRewardsBots",
			// 	external: true,
			// },
			{
				label: "Express Router Plugin",
				href: "https://github.com/MeetBhingradiya/express-router-plugin",
				external: true,
			},
			{
				label: "TS to MP4 Converter",
				href: "https://github.com/MeetBhingradiya/TStoMP4",
				external: true,
			},
			{ label: "All Projects", href: "/projects" },
		],
	},
	{
		title: "Content",
		links: [
			{ label: "Technical Blog", href: "/blog" },
			{ label: "Case Studies", href: "/case-studies" },
			{ label: "Documentation", href: "https://notes.meetbhingradiya.tech" },
			// {
			// 	label: "RSS Feed",
			// 	href: "/rss.xml",
			// 	icon: <RssFeed className="text-xs" />,
			// },
			{ label: "Sitemap", href: "/api/sitemap" },
		],
	},
	{
		title: "Professional",
		links: [
			{
				label: "Resume",
				href: "https://rxresu.me/meetbhingradiya/resume",
				external: true,
			},
			{
				label: "LinkedIn",
				href: "https://linkedin.com/in/meetbhingradiya",
				external: true,
			},
			{
				label: "GitHub",
				href: "https://github.com/MeetBhingradiya",
				external: true,
			},
			// {
			// 	label: "Schedule Meeting",
			// 	href: "https://calendly.com/meetbhingradiya",
			// 	external: true,
			// },
			{ label: "Contact", href: "#contact" },
		],
	},
	{
		title: "Legal & Support",
		links: [
			{
				label: "Privacy Policy",
				href: "/privacy",
				icon: <Privacy className="text-xs" />,
			},
			{
				label: "Terms of Service",
				href: "/terms",
				icon: <Description className="text-xs" />,
			},
			{
				label: "Support",
				href: "/support",
				icon: <Support className="text-xs" />,
			},
		],
	},
];

const achievements = [
	{
		icon: <Security className="text-lg" />,
		label: "Security Expert",
		value: "96%",
	},
	{
		icon: <Build className="text-lg" />,
		label: "Automation",
		value: "98%",
	},
	{
		icon: <Public className="text-lg" />,
		label: "Open Source",
		value: "Active",
	},
	{
		icon: <Star className="text-lg" />,
		label: "Skill Score",
		value: "89.7/100",
	},
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
	"Docker",
];

function Footer() {
	const [showScrollTop, setShowScrollTop] = useState(false);
	const [hoveredTech, setHoveredTech] = useState<string | null>(null);

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
						whileTap={{ scale: 0.9 }}
					>
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
							backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='m0 40l40-40h-40v40zm40 0v-40h-40l40 40z'/%3E%3C/g%3E%3C/svg%3E")`,
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
								className="lg:col-span-1 space-y-6"
							>
								<div className="flex items-center space-x-3">
									<div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
										{/* <Code className="text-white text-xl" /> */}
										<Image
											src="/favicon.ico"
											alt="Logo"
											width={48}
											height={48}
											className="w-full h-full rounded-lg"
										/>
									</div>
									<h3 className="text-2xl font-bold">
										Meet Bhingradiya
									</h3>
								</div>

								<p className="text-gray-300 leading-relaxed">
									Security-focused Staff Engineer with
									expertise in enterprise automation,
									framework development, and AI-enhanced
									workflows. Building the future of secure,
									scalable software systems.
								</p>

								{/* Quick Stats */}
								{/* <div className="grid grid-cols-2 gap-4">
									{achievements.map((achievement, index) => (
										<motion.div
											key={achievement.label}
											initial={{ opacity: 0, scale: 0.8 }}
											whileInView={{
												opacity: 1,
												scale: 1,
											}}
											transition={{
												duration: 0.6,
												delay: index * 0.1,
											}}
											className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center hover:bg-white/20 transition-colors duration-300"
										>
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
									))}
								</div> */}

								{/* Social Links */}
								<div className="flex space-x-4">
									<motion.a
										href="https://github.com/MeetBhingradiya"
										target="_blank"
										rel="noopener noreferrer"
										whileHover={{ scale: 1.2, y: -2 }}
										whileTap={{ scale: 0.9 }}
										className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors duration-300"
									>
										<GitHub className="text-xl" />
									</motion.a>
									<motion.a
										href="https://linkedin.com/in/meetbhingradiya"
										target="_blank"
										rel="noopener noreferrer"
										whileHover={{ scale: 1.2, y: -2 }}
										whileTap={{ scale: 0.9 }}
										className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors duration-300"
									>
										<LinkedIn className="text-xl" />
									</motion.a>
									<motion.a
										href="mailto:meetbhingradiya@outlook.com"
										whileHover={{ scale: 1.2, y: -2 }}
										whileTap={{ scale: 0.9 }}
										className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors duration-300"
									>
										<Email className="text-xl" />
									</motion.a>
								</div>
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
											delay: sectionIndex * 0.1,
										}}
										className="space-y-4"
									>
										<h4 className="text-lg font-semibold text-white">
											{section.title}
										</h4>
										<div className="space-y-3">
											{section.links.map(
												(link, linkIndex) => (
													<motion.div
														key={link.label}
														initial={{
															opacity: 0,
															x: -10,
														}}
														whileInView={{
															opacity: 1,
															x: 0,
														}}
														transition={{
															duration: 0.4,
															delay:
																linkIndex *
																0.05,
														}}
													>
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
															className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-200 text-sm group"
														>
															{link.icon && (
																<span className="text-gray-400 group-hover:text-white">
																	{link.icon}
																</span>
															)}
															<span className="group-hover:translate-x-1 transition-transform duration-200">
																{link.label}
															</span>
														</Link>
													</motion.div>
												)
											)}
										</div>
									</motion.div>
								))}
							</div>
						</div>

						{/* Technology Tags */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: 0.4 }}
							className="mb-12"
						>
							<h4 className="text-lg font-semibold text-white mb-6 text-center">
								Technologies & Expertise
							</h4>
							<div className="flex flex-wrap justify-center gap-3">
								{technologies.map((tech, index) => (
									<motion.span
										key={tech}
										initial={{ opacity: 0, scale: 0.8 }}
										whileInView={{ opacity: 1, scale: 1 }}
										transition={{
											duration: 0.4,
											delay: index * 0.05,
										}}
										whileHover={{ scale: 1.05, y: -2 }}
										onHoverStart={() =>
											setHoveredTech(tech)
										}
										onHoverEnd={() => setHoveredTech(null)}
										className={`px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-sm transition-all duration-300 cursor-default ${
											hoveredTech === tech
												? "ring-2 ring-blue-400"
												: ""
										}`}
									>
										{tech}
									</motion.span>
								))}
							</div>
						</motion.div>

						{/* Current Status */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: 0.5 }}
							className="bg-gradient-to-r from-blue-500/20 to-purple-600/20 backdrop-blur-sm rounded-xl p-6 mb-4 border border-white/10"
						>
							<div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
								<div className="flex items-center space-x-3">
									<div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
									<span className="font-semibold">
										Currently Available for Staff Engineer
										Positions
									</span>
								</div>
								<div className="flex items-center space-x-6 text-sm text-gray-300">
									<div className="flex items-center space-x-1">
										<LocationOn className="text-sm" />
										<span>Surat, India</span>
									</div>
									<div className="flex items-center space-x-1">
										<Schedule className="text-sm" />
										<span>GMT+5:30</span>
									</div>
									<div className="flex items-center space-x-1">
										<Language className="text-sm" />
										<span>Remote Friendly</span>
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
						className="border-t border-white/10 py-8"
					>
						<div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
							<div className="flex items-center space-x-2 text-gray-300">
								<Copyright className="text-lg" />
								<span>{currentYear} Meet Bhingradiya.</span>
								<span>All rights reserved.</span>
							</div>

							<div className="flex items-center space-x-6 text-sm text-gray-400">
								<div className="flex items-center space-x-1">
									<Analytics className="text-sm" />
									<span>Built with Next.js & TypeScript</span>
								</div>
								<div className="flex items-center space-x-1">
									<Security className="text-sm" />
									<span>Secured & Optimized</span>
								</div>
								{/* <div className="flex items-center space-x-1">
									<Coffee className="text-sm" />
									<span>Powered by dedication</span>
								</div> */}
							</div>
						</div>
					</motion.div>
				</div>
			</footer>
		</>
	);
}

export default Footer;
