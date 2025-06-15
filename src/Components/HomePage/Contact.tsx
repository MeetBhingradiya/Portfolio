"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Email,
	GitHub,
	LinkedIn,
	LocationOn,
	Phone,
	Schedule,
	Send,
	CheckCircle,
	Error,
	CalendarViewDayRounded as Calendar,
	VideoCall,
	Message,
	Download,
	Language,
	Work,
	School,
	Star,
} from "@mui/icons-material";
import Link from "next/link";

interface ContactMethod {
	id: string;
	title: string;
	description: string;
	icon: React.ReactNode;
	link: string;
	type: "email" | "social" | "calendar" | "download" | "location";
	color: string;
	available: boolean;
	responseTime?: string;
}

interface QuickAction {
	id: string;
	title: string;
	description: string;
	icon: React.ReactNode;
	action: string;
	color: string;
}

const contactMethods: ContactMethod[] = [
	{
		id: "email",
		title: "Email Me",
		description: "Best for detailed discussions and project inquiries",
		icon: <Email className="text-2xl" />,
		link: "mailto:meetbhingradiya@outlook.com",
		type: "email",
		color: "from-blue-500 to-blue-600",
		available: true,
		responseTime: "Usually responds within 24 hours",
	},
	{
		id: "linkedin",
		title: "LinkedIn",
		description: "Professional networking and career opportunities",
		icon: <LinkedIn className="text-2xl" />,
		link: "https://linkedin.com/in/meetbhingradiya",
		type: "social",
		color: "from-blue-600 to-blue-700",
		available: true,
		responseTime: "Active daily",
	},
	{
		id: "github",
		title: "GitHub",
		description:
			"Explore my code, contribute to projects, or report issues",
		icon: <GitHub className="text-2xl" />,
		link: "https://github.com/MeetBhingradiya",
		type: "social",
		color: "from-gray-700 to-gray-800",
		available: true,
		responseTime: "Check daily",
	},
	{
		id: "calendar",
		title: "Schedule a Meeting",
		description: "Book a technical discussion or project consultation",
		icon: <Calendar className="text-2xl" />,
		link: "https://calendly.com/meetbhingradiya",
		type: "calendar",
		color: "from-green-500 to-green-600",
		available: true,
		responseTime: "Available slots shown",
	},
	{
		id: "resume",
		title: "Download Resume",
		description: "Get my latest resume with all technical details",
		icon: <Download className="text-2xl" />,
		link: "https://rxresu.me/meetbhingradiya/resume",
		type: "download",
		color: "from-purple-500 to-purple-600",
		available: true,
	},
	{
		id: "location",
		title: "Location",
		description: "Based in Surat, Gujarat, India (GMT+5:30)",
		icon: <LocationOn className="text-2xl" />,
		link: "https://maps.google.com/?q=Surat,Gujarat,India",
		type: "location",
		color: "from-red-500 to-red-600",
		available: true,
		responseTime: "Available for remote work globally",
	},
];

const quickActions: QuickAction[] = [
	{
		id: "hire-staff",
		title: "Hire for Staff Engineer Role",
		description:
			"I'm actively seeking Staff Engineer positions in security-focused companies",
		icon: <Work className="text-xl" />,
		action: "mailto:meetbhingradiya@outlook.com?subject=Staff Engineer Opportunity&body=Hi Meet, I'm interested in discussing a Staff Engineer position...",
		color: "from-blue-500 to-purple-600",
	},
	{
		id: "project-collaboration",
		title: "Project Collaboration",
		description:
			"Let's build something amazing together - open source or commercial",
		icon: <Star className="text-xl" />,
		action: "mailto:meetbhingradiya@outlook.com?subject=Project Collaboration&body=Hi Meet, I have an interesting project idea...",
		color: "from-green-500 to-blue-500",
	},
	{
		id: "technical-consultation",
		title: "Technical Consultation",
		description:
			"Need help with security, automation, or architecture? Let's discuss",
		icon: <VideoCall className="text-xl" />,
		action: "https://calendly.com/meetbhingradiya/technical-consultation",
		color: "from-purple-500 to-pink-500",
	},
	{
		id: "mentorship",
		title: "Mentorship & Learning",
		description:
			"Interested in learning from my experience? Happy to share knowledge",
		icon: <School className="text-xl" />,
		action: "mailto:meetbhingradiya@outlook.com?subject=Mentorship Request&body=Hi Meet, I'm interested in learning about...",
		color: "from-orange-500 to-red-500",
	},
];

function ContactSection() {
	const [hoveredMethod, setHoveredMethod] = useState<string | null>(null);
	const [currentTime, setCurrentTime] = useState(new Date());

	React.useEffect(() => {
		const timer = setInterval(() => setCurrentTime(new Date()), 1000);
		return () => clearInterval(timer);
	}, []);

	const getLocalTime = () => {
		// India timezone (GMT+5:30)
		const indiaTime = new Date(
			currentTime.getTime() + 5.5 * 60 * 60 * 1000
		);
		return indiaTime.toLocaleTimeString("en-US", {
			hour12: true,
			hour: "2-digit",
			minute: "2-digit",
			timeZone: "Asia/Kolkata",
		});
	};

	const isBusinessHours = () => {
		const hour = new Date().getUTCHours() + 5.5; // Convert to India time
		return hour >= 9 && hour <= 18; // 9 AM to 6 PM India time
	};

	return (
		<section
			id="contact"
			className="py-20 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900"
		>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Section Header */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className="text-center mb-16"
				>
					<h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
						Let&apos;s
						<span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
							Connect
						</span>
					</h2>
					<p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-6">
						Ready to discuss Staff Engineer opportunities, technical
						projects, or collaboration? I&apos;m always open to
						interesting conversations about technology and
						innovation.
					</p>

					{/* Current Status */}
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						whileInView={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.6, delay: 0.2 }}
						className="inline-flex items-center space-x-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-full px-6 py-3 border border-gray-200 dark:border-gray-700"
					>
						<div
							className={`w-3 h-3 rounded-full ${isBusinessHours() ? "bg-green-500 animate-pulse" : "bg-yellow-500"}`}
						/>
						<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
							{isBusinessHours()
								? "Available Now"
								: "Outside Business Hours"}
							• {getLocalTime()} IST
						</span>
						<LocationOn className="text-sm text-gray-500 dark:text-gray-400" />
						<span className="text-sm text-gray-500 dark:text-gray-400">
							Surat, India
						</span>
					</motion.div>
				</motion.div>

				{/* Quick Actions */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.1 }}
					className="mb-16"
				>
					<h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
						Quick Actions
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
						{quickActions.map((action, index) => (
							<motion.a
								key={action.id}
								href={action.action}
								target={
									action.action.startsWith("http")
										? "_blank"
										: "_self"
								}
								rel={
									action.action.startsWith("http")
										? "noopener noreferrer"
										: ""
								}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{
									duration: 0.6,
									delay: index * 0.1,
								}}
								whileHover={{ scale: 1.05, y: -5 }}
								whileTap={{ scale: 0.95 }}
								className={`bg-gradient-to-r ${action.color} text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group`}
							>
								<div className="flex items-center space-x-3 mb-3">
									<div className="p-2 bg-white/20 rounded-lg">
										{action.icon}
									</div>
									<h4 className="font-semibold text-lg">
										{action.title}
									</h4>
								</div>
								<p className="text-white/90 text-sm leading-relaxed">
									{action.description}
								</p>
								<div className="flex items-center justify-end mt-4">
									<Send className="text-lg group-hover:translate-x-1 transition-transform duration-200" />
								</div>
							</motion.a>
						))}
					</div>
				</motion.div>

				{/* Contact Methods */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.2 }}
				>
					<h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
						Contact Methods
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{contactMethods.map((method, index) => (
							<motion.a
								key={method.id}
								href={method.link}
								target={
									method.link.startsWith("http")
										? "_blank"
										: "_self"
								}
								rel={
									method.link.startsWith("http")
										? "noopener noreferrer"
										: ""
								}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{
									duration: 0.6,
									delay: index * 0.1,
								}}
								whileHover={{ scale: 1.03, y: -5 }}
								whileTap={{ scale: 0.97 }}
								onHoverStart={() => setHoveredMethod(method.id)}
								onHoverEnd={() => setHoveredMethod(null)}
								className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
							>
								{/* Background Gradient */}
								<div
									className={`absolute inset-0 bg-gradient-to-br ${method.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
								/>

								<div className="relative z-10">
									{/* Status Indicator */}
									<div className="flex items-center justify-between mb-4">
										<div
											className={`p-3 bg-gradient-to-r ${method.color} text-white rounded-lg group-hover:scale-110 transition-transform duration-300`}
										>
											{method.icon}
										</div>
										{method.available && (
											<div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
												<CheckCircle className="text-sm" />
												<span className="text-xs font-medium">
													Available
												</span>
											</div>
										)}
									</div>

									{/* Content */}
									<h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
										{method.title}
									</h4>
									<p className="text-gray-600 dark:text-gray-300 text-sm mb-4 leading-relaxed">
										{method.description}
									</p>

									{/* Response Time */}
									{method.responseTime && (
										<div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
											<Schedule className="text-sm" />
											<span>{method.responseTime}</span>
										</div>
									)}

									{/* Hover Effect */}
									<AnimatePresence>
										{hoveredMethod === method.id && (
											<motion.div
												initial={{
													opacity: 0,
													scale: 0.8,
												}}
												animate={{
													opacity: 1,
													scale: 1,
												}}
												exit={{
													opacity: 0,
													scale: 0.8,
												}}
												className="absolute bottom-4 right-4"
											>
												<div
													className={`p-2 bg-gradient-to-r ${method.color} text-white rounded-full shadow-lg`}
												>
													<Send className="text-sm" />
												</div>
											</motion.div>
										)}
									</AnimatePresence>
								</div>
							</motion.a>
						))}
					</div>
				</motion.div>

				{/* Additional Info */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.4 }}
					className="mt-16 text-center"
				>
					<div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-8 border border-gray-200 dark:border-gray-700">
						<h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
							Let&apos;s Build Something Amazing Together
						</h4>
						<p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
							Whether you&apos;re looking for a Staff Engineer, need
							technical consultation, or want to collaborate on an
							exciting project, I&apos;m here to help. Let&apos;s discuss
							how we can create innovative solutions together.
						</p>

						<div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
							<div className="flex items-center space-x-1">
								<Language className="text-sm" />
								<span>English, Hindi, Gujarati</span>
							</div>
							<div className="flex items-center space-x-1">
								<Schedule className="text-sm" />
								<span>GMT+5:30 (India Standard Time)</span>
							</div>
							<div className="flex items-center space-x-1">
								<Work className="text-sm" />
								<span>Available for immediate hiring</span>
							</div>
						</div>
					</div>
				</motion.div>
			</div>
		</section>
	);
}

export default ContactSection;
