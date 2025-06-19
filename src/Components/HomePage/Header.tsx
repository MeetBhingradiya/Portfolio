"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
	Home as HomeIcon,
	Work,
	Article,
	ContactMail,
	Menu,
	Close,
	GitHub,
	LinkedIn,
	Code,
	Star,
	Visibility,
} from "@mui/icons-material";
import { useTheme } from "@Hooks/useTheme";
import Image from "next/image";

interface NavLink {
	href: string;
	label: string;
	icon: React.ReactNode;
}

function Header() {
	const pathname = usePathname();
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);

	const navLinks: NavLink[] = [
		{ href: "/", label: "Home", icon: <HomeIcon className="text-lg" /> },
		{
			href: "#showcase",
			label: "Projects",
			icon: <Work className="text-lg" />,
		},
		{
			href: "/blogs",
			label: "Blogs",
			icon: <Article className="text-lg" />,
		},
		{
			href: "/contact",
			label: "Contact",
			icon: <ContactMail className="text-lg" />,
		},
	];

	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 50);
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	useEffect(() => {
		setIsMobileMenuOpen(false);
	}, [pathname]);

	return (
		<>
			<motion.header
				className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
					isScrolled
						? "bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm"
						: "bg-transparent"
				}`}
				initial={{ y: -100, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ duration: 0.6, ease: "easeOut" }}
			>
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						{/* Logo/Brand */}
						<motion.div
							className="flex items-center space-x-3"
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
						>
							<Link
								href="/"
								className="flex items-center space-x-3"
							>
								<div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center p-[1px]">
									<Image
										src="/favicon.ico"
										alt="Meet Bhingradiya Logo"
										width={40}
										height={40}
										className="rounded-lg"
									/>
								</div>
								<span
									className={`font-bold text-lg transition-colors duration-300 ${
										isScrolled
											? "text-gray-900 dark:text-white"
											: "text-white"
									}`}
								>
									Meet Bhingradiya
								</span>
							</Link>
						</motion.div>

						{/* Desktop Navigation */}
						<nav className="hidden md:flex items-center space-x-1">
							{navLinks.map((link) => {
								const isActive = pathname === link.href;
								return (
									<motion.div
										key={link.href}
										whileHover={{ y: -1 }}
										whileTap={{ y: 0 }}
									>
										<Link
											href={link.href}
											className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
												isActive
													? isScrolled
														? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
														: "bg-white/20 text-white"
													: isScrolled
														? "text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
														: "text-gray-200 hover:text-white hover:bg-white/10"
											}`}
										>
											{link.icon}
											<span>{link.label}</span>
										</Link>
									</motion.div>
								);
							})}
						</nav>

						{/* Social Links & Mobile Menu */}
						<div className="flex items-center space-x-4">
							{/* GitHub & LinkedIn */}
							<div className="hidden sm:flex items-center space-x-3">
								<motion.a
									href="https://github.com/MeetBhingradiya"
									target="_blank"
									rel="noopener noreferrer"
									whileHover={{ scale: 1.1 }}
									whileTap={{ scale: 0.9 }}
									className={`transition-colors duration-300 ${
										isScrolled
											? "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
											: "text-gray-200 hover:text-white"
									}`}
								>
									<GitHub className="text-xl" />
								</motion.a>
								<motion.a
									href="https://linkedin.com/in/meetbhingradiya"
									target="_blank"
									rel="noopener noreferrer"
									whileHover={{ scale: 1.1 }}
									whileTap={{ scale: 0.9 }}
									className={`transition-colors duration-300 ${
										isScrolled
											? "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
											: "text-gray-200 hover:text-white"
									}`}
								>
									<LinkedIn className="text-xl" />
								</motion.a>
							</div>

							{/* Mobile Menu Button */}
							<motion.button
								className={`md:hidden transition-colors duration-300 ${
									isScrolled
										? "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
										: "text-gray-200 hover:text-white"
								}`}
								onClick={() =>
									setIsMobileMenuOpen(!isMobileMenuOpen)
								}
								whileTap={{ scale: 0.9 }}
							>
								<AnimatePresence mode="wait">
									<motion.div
										key={
											isMobileMenuOpen ? "close" : "menu"
										}
										initial={{ rotate: -90, opacity: 0 }}
										animate={{ rotate: 0, opacity: 1 }}
										exit={{ rotate: 90, opacity: 0 }}
										transition={{ duration: 0.2 }}
									>
										{isMobileMenuOpen ? (
											<Close />
										) : (
											<Menu />
										)}
									</motion.div>
								</AnimatePresence>
							</motion.button>
						</div>
					</div>
				</div>

				{/* Mobile Navigation */}
				<AnimatePresence>
					{isMobileMenuOpen && (
						<motion.div
							className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700"
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							transition={{ duration: 0.3 }}
						>
							<div className="px-4 py-4 space-y-2">
								{navLinks.map((link, index) => {
									const isActive = pathname === link.href;
									return (
										<motion.div
											key={link.href}
											initial={{ opacity: 0, x: -20 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{ delay: index * 0.1 }}
										>
											<Link
												href={link.href}
												className={`flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
													isActive
														? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
														: "text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
												}`}
											>
												{link.icon}
												<span>{link.label}</span>
											</Link>
										</motion.div>
									);
								})}
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</motion.header>

			{/* Mobile menu backdrop */}
			<AnimatePresence>
				{isMobileMenuOpen && (
					<motion.div
						className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={() => setIsMobileMenuOpen(false)}
					/>
				)}
			</AnimatePresence>
		</>
	);
}

export default Header;
