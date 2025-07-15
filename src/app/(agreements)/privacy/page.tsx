"use client";

import React from "react";
import { motion } from "framer-motion";
import {
    Security,
    Shield,
    Lock,
    Visibility,
    Cookie,
    Storage,
    Share,
    ContactMail,
    Update,
    ArrowBack,
    Inventory
} from "@mui/icons-material";
import Link from "next/link";

function PrivacyPolicyPage() {
    const sections = [
        {
            id: "products-covered",
            title: "Products Covered",
            icon: <Inventory className="text-2xl" />
        },
        {
            id: "information-collection",
            title: "Information We Collect",
            icon: <Storage className="text-2xl" />
        },
        {
            id: "information-use",
            title: "How We Use Your Information",
            icon: <Security className="text-2xl" />
        },
        {
            id: "information-sharing",
            title: "Information Sharing",
            icon: <Share className="text-2xl" />
        },
        {
            id: "data-security",
            title: "Data Security",
            icon: <Shield className="text-2xl" />
        },
        {
            id: "cookies",
            title: "Cookies and Tracking",
            icon: <Cookie className="text-2xl" />
        },
        {
            id: "your-rights",
            title: "Your Rights",
            icon: <Shield className="text-2xl" />
        },
        {
            id: "updates",
            title: "Policy Updates",
            icon: <Update className="text-2xl" />
        },
        {
            id: "contact",
            title: "Contact Us",
            icon: <ContactMail className="text-2xl" />
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <Link
                            href="/"
                            className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
                            <ArrowBack className="text-xl" />
                            <span>Back to Home</span>
                        </Link>
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <img
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
                className="relative py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 text-white overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='m0 40l40-40h-40v40zm40 0v-40h-40l40 40z'/%3E%3C/g%3E%3C/svg%3E")`
                        }}
                    />
                </div>

                <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    {" "}
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-8">
                        <Shield className="text-4xl" />
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="text-4xl md:text-6xl font-bold mb-6">
                        Privacy Policy
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
                        Your privacy is important to us. This policy explains
                        how we collect, use, and protect your information.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="text-blue-200">
                        <p>Last updated: June 19, 2025</p>
                    </motion.div>
                </div>
            </motion.div>

            {/* Table of Contents */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
                                    delay: index * 0.1
                                }}
                                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 group">
                                <div className="text-blue-500 group-hover:text-blue-600">
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

                {/* Products Covered */}
                <motion.section
                    id="services"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="text-blue-500">
                            <Inventory className="text-3xl" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Products Covered
                        </h2>
                    </div>
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                            This Privacy Policy applies to the following services or websites:
                        </p>
                        <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                            <li>Sneh Creation</li>
                            <li>Meet&apos;s Portfolio or its Related Domains</li>
                        </ul>
                    </div>
                </motion.section>

                {/* Information Collection */}
                <motion.section
                    id="information-collection"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="text-blue-500">
                            <Storage className="text-3xl" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Information We Collect
                        </h2>
                    </div>
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                            We collect information you provide directly to us,
                            such as when you create an account, contact us, or
                            use our services. This may include:
                        </p>
                        <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                            <li>Name and contact information</li>
                            <li>
                                Professional information and portfolio details
                            </li>
                            <li>Communication preferences</li>
                            <li>
                                Technical information about your device and
                                browser
                            </li>
                            <li>Usage data and analytics</li>
                        </ul>
                    </div>
                </motion.section>
                {/* Information Use */}
                <motion.section
                    id="information-use"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="text-blue-500">
                            <Security className="text-3xl" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                            How We Use Your Information
                        </h2>
                    </div>
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                            We use the information we collect to:
                        </p>
                        <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                            <li>Provide, maintain, and improve our services</li>
                            <li>Communicate with you about our services</li>
                            <li>Personalize your experience</li>
                            <li>
                                Analyze usage patterns and optimize performance
                            </li>
                            <li>Ensure security and prevent fraud</li>
                        </ul>
                    </div>
                </motion.section>
                {/* Information Sharing */}
                <motion.section
                    id="information-sharing"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="text-blue-500">
                            <Share className="text-3xl" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Information Sharing
                        </h2>
                    </div>
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                            We do not sell, trade, or otherwise transfer your
                            personal information to third parties without your
                            consent, except as described in this policy. We may
                            share information:
                        </p>
                        <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                            <li>With your explicit consent</li>
                            <li>To comply with legal obligations</li>
                            <li>To protect our rights and safety</li>
                            <li>
                                With trusted service providers who assist our
                                operations
                            </li>
                        </ul>
                    </div>
                </motion.section>
                {/* Data Security */}
                <motion.section
                    id="data-security"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="text-blue-500">
                            <Shield className="text-3xl" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Data Security
                        </h2>
                    </div>
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                            We implement appropriate security measures to
                            protect your personal information, including:
                        </p>
                        <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                            <li>Encryption of data in transit and at rest</li>
                            <li>Regular security audits and assessments</li>
                            <li>Access controls and authentication measures</li>
                            <li>
                                Secure coding practices and vulnerability
                                testing
                            </li>
                            <li>Regular security training for our team</li>
                        </ul>
                    </div>
                </motion.section>
                {/* Cookies */}
                <motion.section
                    id="cookies"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="text-blue-500">
                            <Cookie className="text-3xl" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Cookies and Tracking
                        </h2>
                    </div>
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                            We use cookies and similar technologies to enhance
                            your experience and collect analytics data. You can
                            control cookie settings in your browser preferences.
                        </p>
                    </div>
                </motion.section>
                {/* Your Rights */}
                <motion.section
                    id="your-rights"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
                    {" "}
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="text-blue-500">
                            <Shield className="text-3xl" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Your Rights
                        </h2>
                    </div>
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                            You have the right to:
                        </p>
                        <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                            <li>Access your personal information</li>
                            <li>Correct inaccurate or incomplete data</li>
                            <li>Delete your personal information</li>
                            <li>Object to processing of your data</li>
                            <li>Data portability</li>
                        </ul>
                    </div>
                </motion.section>
                {/* Policy Updates */}
                <motion.section
                    id="updates"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="text-blue-500">
                            <Update className="text-3xl" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Policy Updates
                        </h2>
                    </div>
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            {" "}
                            We may update this privacy policy from time to time.
                            We will notify you of any changes by posting the new
                            policy on this page and updating the &ldquo;last
                            updated&rdquo; date.
                        </p>
                    </div>
                </motion.section>{" "}
                {/* Contact */}
                <motion.section
                    id="contact"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-2xl shadow-xl p-8 text-center">
                    <div className="flex items-center justify-center space-x-3 mb-6">
                        <div className="text-blue-500">
                            <ContactMail className="text-3xl" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Privacy Questions or Concerns?
                        </h2>
                    </div>
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
                            {" "}
                            If you have any questions about this Privacy Policy,
                            need to exercise your privacy rights, or have
                            concerns about how your data is handled, please
                            don&apos;t hesitate to contact me.
                        </p>
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}>
                            <Link
                                href="/contact"
                                className="inline-flex items-center space-x-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                                <ContactMail className="text-xl" />
                                <span>Contact Me</span>
                            </Link>
                        </motion.div>
                    </div>
                </motion.section>
            </div>
        </div>
    );
}

export default PrivacyPolicyPage;
