"use client";

import React from "react";
import { motion } from "framer-motion";
import {
	Description,
	Gavel,
	Security,
	Warning,
	AccountBalance,
	Copyright,
	Block,
	Update,
	ContactMail,
	CheckCircle,
	Cancel,
	ArrowBack,
} from "@mui/icons-material";
import Link from "next/link";
import Image from "next/image";

function TermsOfServicePage() {
	const sections = [
		{
			id: "acceptance",
			title: "Acceptance of Terms",
			icon: <CheckCircle className="text-2xl" />,
		},
		{
			id: "services",
			title: "Description of Services",
			icon: <Description className="text-2xl" />,
		},
		{
			id: "user-conduct",
			title: "User Conduct",
			icon: <Gavel className="text-2xl" />,
		},
		{
			id: "intellectual-property",
			title: "Intellectual Property",
			icon: <Copyright className="text-2xl" />,
		},
		{
			id: "prohibited-uses",
			title: "Prohibited Uses",
			icon: <Block className="text-2xl" />,
		},
		{
			id: "disclaimers",
			title: "Disclaimers",
			icon: <Warning className="text-2xl" />,
		},
		{
			id: "limitation-liability",
			title: "Limitation of Liability",
			icon: <AccountBalance className="text-2xl" />,
		},
		{
			id: "termination",
			title: "Termination",
			icon: <Cancel className="text-2xl" />,
		},
		{
			id: "changes",
			title: "Changes to Terms",
			icon: <Update className="text-2xl" />,
		},
		{
			id: "contact",
			title: "Contact Information",
			icon: <ContactMail className="text-2xl" />,
		},
	];

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
			{/* Header */}
			<div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
					<div className="flex items-center justify-between">
						<Link
							href="/"
							className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
						>
							<ArrowBack className="text-xl" />
							<span>Back to Home</span>
						</Link>
						<div className="flex items-center space-x-3">
							<div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
								<Image
									src="/favicon.ico"
									alt="Logo"
									width={40}
									height={40}
									className="w-full h-full rounded-lg"
								/>
							</div>
							<span className="text-lg font-semibold text-gray-900 dark:text-white">
								Meet Bhingradiya
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Hero Section */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6 }}
				className="relative py-20 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800 text-white overflow-hidden"
			>
				{/* Background Pattern */}
				<div className="absolute inset-0 opacity-10">
					<div
						className="absolute inset-0"
						style={{
							backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='m0 40l40-40h-40v40zm40 0v-40h-40l40 40z'/%3E%3C/g%3E%3C/svg%3E")`,
						}}
					/>
				</div>

				<div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<motion.div
						initial={{ scale: 0.8 }}
						animate={{ scale: 1 }}
						transition={{ duration: 0.6, delay: 0.2 }}
						className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-8"
					>
						<Description className="text-4xl" />
					</motion.div>
					<motion.h1
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.3 }}
						className="text-4xl md:text-6xl font-bold mb-6"
					>
						Terms of Service
					</motion.h1>
					<motion.p
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.4 }}
						className="text-xl md:text-2xl text-purple-100 mb-8 max-w-3xl mx-auto"
					>
						Please read these terms carefully before using our
						services. By accessing our website, you agree to these
						terms.
					</motion.p>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.5 }}
						className="text-purple-200"
					>
						<p>Last updated: June 19, 2025</p>
					</motion.div>
				</div>
			</motion.div>

			{/* Table of Contents */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				whileInView={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6 }}
				className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
			>
				<div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-12">
					<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
						Table of Contents
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{sections.map((section, index) => (
							<motion.a
								key={section.id}
								href={`#${section.id}`}
								initial={{ opacity: 0, x: -20 }}
								whileInView={{ opacity: 1, x: 0 }}
								transition={{
									duration: 0.4,
									delay: index * 0.1,
								}}
								className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 group"
							>
								<div className="text-purple-500 group-hover:text-purple-600">
									{section.icon}
								</div>
								<span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
									{section.title}
								</span>
							</motion.a>
						))}
					</div>
				</div>
			</motion.div>

			{/* Content Sections */}
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
				{/* Acceptance of Terms */}
				<motion.section
					id="acceptance"
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8"
				>
					<div className="flex items-center space-x-3 mb-6">
						<div className="text-purple-500">
							<CheckCircle className="text-3xl" />
						</div>
						<h2 className="text-3xl font-bold text-gray-900 dark:text-white">
							Acceptance of Terms
						</h2>
					</div>
					<div className="prose prose-lg dark:prose-invert max-w-none">
						<p className="text-gray-600 dark:text-gray-300 leading-relaxed">
							By accessing and using this website, you accept and
							agree to be bound by the terms and provision of this
							agreement. These terms apply to all visitors, users,
							and others who access or use the service. If you do
							not agree to abide by the above, please do not use
							this service.
						</p>
					</div>
				</motion.section>
				{/* Description of Services */}
				<motion.section
					id="services"
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8"
				>
					<div className="flex items-center space-x-3 mb-6">
						<div className="text-purple-500">
							<Description className="text-3xl" />
						</div>
						<h2 className="text-3xl font-bold text-gray-900 dark:text-white">
							Description of Services
						</h2>
					</div>
					<div className="prose prose-lg dark:prose-invert max-w-none">
						<p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
							This website serves as a professional portfolio and
							blog platform for Meet Bhingradiya, offering:
						</p>
						<ul className="text-gray-600 dark:text-gray-300 space-y-2">
							<li>Professional portfolio showcase</li>
							<li>Technical blog posts and articles</li>
							<li>Project demonstrations and case studies</li>
							<li>Contact and networking opportunities</li>
							<li>Educational content and resources</li>
						</ul>
					</div>
				</motion.section>
				{/* User Conduct */}
				<motion.section
					id="user-conduct"
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8"
				>
					<div className="flex items-center space-x-3 mb-6">
						<div className="text-purple-500">
							<Gavel className="text-3xl" />
						</div>
						<h2 className="text-3xl font-bold text-gray-900 dark:text-white">
							User Conduct
						</h2>
					</div>
					<div className="prose prose-lg dark:prose-invert max-w-none">
						<p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
							You agree to use our services only for lawful
							purposes and in accordance with these terms. You
							agree not to:
						</p>
						<ul className="text-gray-600 dark:text-gray-300 space-y-2">
							<li>
								Violate any applicable local, state, national,
								or international law
							</li>
							<li>
								Transmit any content that is unlawful, harmful,
								or offensive
							</li>
							<li>
								Attempt to gain unauthorized access to our
								systems
							</li>
							<li>Interfere with or disrupt our services</li>
							<li>
								Use our services for any commercial purposes
								without permission
							</li>
						</ul>
					</div>
				</motion.section>
				{/* Intellectual Property */}
				<motion.section
					id="intellectual-property"
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8"
				>
					<div className="flex items-center space-x-3 mb-6">
						<div className="text-purple-500">
							<Copyright className="text-3xl" />
						</div>
						<h2 className="text-3xl font-bold text-gray-900 dark:text-white">
							Intellectual Property Rights
						</h2>
					</div>
					<div className="prose prose-lg dark:prose-invert max-w-none">
						<p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
							The service and its original content, features, and
							functionality are and will remain the exclusive
							property of Meet Bhingradiya and its licensors. The
							service is protected by copyright, trademark, and
							other laws. Our trademarks and trade dress may not
							be used in connection with any product or service
							without our prior written consent.
						</p>
					</div>
				</motion.section>
				{/* Prohibited Uses */}
				<motion.section
					id="prohibited-uses"
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8"
				>
					<div className="flex items-center space-x-3 mb-6">
						<div className="text-purple-500">
							<Block className="text-3xl" />
						</div>
						<h2 className="text-3xl font-bold text-gray-900 dark:text-white">
							Prohibited Uses
						</h2>
					</div>
					<div className="prose prose-lg dark:prose-invert max-w-none">
						<p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
							You may not use our service:
						</p>
						<ul className="text-gray-600 dark:text-gray-300 space-y-2">
							<li>
								For any unlawful purpose or to solicit others to
								perform unlawful acts
							</li>
							<li>
								To violate any international, federal,
								provincial, or state regulations, rules, laws,
								or local ordinances
							</li>
							<li>
								To infringe upon or violate our intellectual
								property rights or the intellectual property
								rights of others
							</li>
							<li>
								To harass, abuse, insult, harm, defame, slander,
								disparage, intimidate, or discriminate
							</li>
							<li>To submit false or misleading information</li>
						</ul>
					</div>
				</motion.section>
				{/* Disclaimers */}
				<motion.section
					id="disclaimers"
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8"
				>
					<div className="flex items-center space-x-3 mb-6">
						<div className="text-purple-500">
							<Warning className="text-3xl" />
						</div>
						<h2 className="text-3xl font-bold text-gray-900 dark:text-white">
							Disclaimers
						</h2>
					</div>
					<div className="prose prose-lg dark:prose-invert max-w-none">
						{" "}
						<p className="text-gray-600 dark:text-gray-300 leading-relaxed">
							The information on this website is provided on an
							&ldquo;as is&rdquo; basis. To the fullest extent
							permitted by law, this Company excludes all
							representations, warranties, conditions and terms
							relating to our website and the use of this website.
							Nothing in this disclaimer will limit any of our or
							your liabilities in any way that is not permitted
							under applicable law.
						</p>
					</div>
				</motion.section>
				{/* Limitation of Liability */}
				<motion.section
					id="limitation-liability"
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8"
				>
					<div className="flex items-center space-x-3 mb-6">
						<div className="text-purple-500">
							<AccountBalance className="text-3xl" />
						</div>
						<h2 className="text-3xl font-bold text-gray-900 dark:text-white">
							Limitation of Liability
						</h2>
					</div>
					<div className="prose prose-lg dark:prose-invert max-w-none">
						<p className="text-gray-600 dark:text-gray-300 leading-relaxed">
							In no event shall Meet Bhingradiya, nor its
							directors, employees, partners, agents, suppliers,
							or affiliates, be liable for any indirect,
							incidental, special, consequential, or punitive
							damages, including without limitation, loss of
							profits, data, use, goodwill, or other intangible
							losses, resulting from your use of the service.
						</p>
					</div>
				</motion.section>
				{/* Termination */}
				<motion.section
					id="termination"
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8"
				>
					<div className="flex items-center space-x-3 mb-6">
						<div className="text-purple-500">
							<Cancel className="text-3xl" />
						</div>
						<h2 className="text-3xl font-bold text-gray-900 dark:text-white">
							Termination
						</h2>
					</div>
					<div className="prose prose-lg dark:prose-invert max-w-none">
						<p className="text-gray-600 dark:text-gray-300 leading-relaxed">
							We may terminate or suspend your access immediately,
							without prior notice or liability, for any reason
							whatsoever, including without limitation if you
							breach the Terms. Upon termination, your right to
							use the service will cease immediately.
						</p>
					</div>
				</motion.section>
				{/* Changes to Terms */}
				<motion.section
					id="changes"
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8"
				>
					<div className="flex items-center space-x-3 mb-6">
						<div className="text-purple-500">
							<Update className="text-3xl" />
						</div>
						<h2 className="text-3xl font-bold text-gray-900 dark:text-white">
							Changes to Terms
						</h2>
					</div>
					<div className="prose prose-lg dark:prose-invert max-w-none">
						<p className="text-gray-600 dark:text-gray-300 leading-relaxed">
							We reserve the right, at our sole discretion, to
							modify or replace these Terms at any time. If a
							revision is material, we will try to provide at
							least 30 days notice prior to any new terms taking
							effect. What constitutes a material change will be
							determined at our sole discretion.
						</p>
					</div>
				</motion.section>{" "}
				{/* Contact Information */}
				<motion.section
					id="contact"
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 dark:from-purple-500/20 dark:to-blue-500/20 rounded-2xl shadow-xl p-8 text-center"
				>
					<div className="flex items-center justify-center space-x-3 mb-6">
						<div className="text-purple-500">
							<ContactMail className="text-3xl" />
						</div>
						<h2 className="text-3xl font-bold text-gray-900 dark:text-white">
							Questions About These Terms?
						</h2>
					</div>
					<div className="prose prose-lg dark:prose-invert max-w-none">
						{" "}
						<p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
							If you have any questions about these Terms of
							Service or need clarification on any points,
							I&apos;m here to help. Feel free to reach out
							through my contact page.
						</p>
						<motion.div
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
						>
							<Link
								href="/contact"
								className="inline-flex items-center space-x-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
							>
								<ContactMail className="text-xl" />
								<span>Get in Touch</span>
							</Link>
						</motion.div>
					</div>
				</motion.section>
			</div>
		</div>
	);
}

export default TermsOfServicePage;
