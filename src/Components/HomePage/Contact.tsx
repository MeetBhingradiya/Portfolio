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
    AttachMoney,
    Code,
    Security,
    Architecture,
    Groups
} from "@mui/icons-material";
import Link from "next/link";
import SpotlightCard from "@Lib/Components/SpotlightCard/SpotlightCard";

interface ContactMethod {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    link: string;
    type: "email" | "social" | "calendar" | "download" | "location";
    color: string;
    spotlightColor: `rgba(${number}, ${number}, ${number}, ${number})`;
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

interface ServicePricing {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    price: string;
    duration: string;
    features: string[];
    popular?: boolean;
    color: string;
    action: string;
}

const contactMethods: ContactMethod[] = [
    {
        id: "email",
        title: "Email Me",
        description: "Best for detailed discussions and project inquiries",
        icon: <Email className="text-2xl" />,
        link: "/contact",
        type: "email",
        color: "from-blue-500 to-blue-600",
        spotlightColor: "rgba(59, 130, 246, 0.15)",
        available: true,
        responseTime: "Usually responds within 12 hours"
    },
    {
        id: "linkedin",
        title: "LinkedIn",
        description: "Professional networking and career opportunities",
        icon: <LinkedIn className="text-2xl" />,
        link: "https://linkedin.com/in/meetbhingradiya",
        type: "social",
        color: "from-blue-600 to-blue-700",
        spotlightColor: "rgba(37, 99, 235, 0.15)",
        available: true,
        responseTime: "Typically responds within 24 hours"
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
        spotlightColor: "rgba(59, 130, 246, 0.15)",
        available: true,
        responseTime: "Check daily"
    },
    {
        id: "calendar",
        title: "Schedule a Meeting",
        description: "Book a technical discussion or project consultation",
        icon: <Calendar className="text-2xl" />,
        link: "https://calendly.com/meetbhingradiya",
        type: "calendar",
        color: "from-green-500 to-green-600",
        spotlightColor: "rgba(34, 197, 94, 0.15)",
        available: true,
        responseTime: "View Available Slots"
    },
    {
        id: "resume",
        title: "Download Resume",
        description: "Get my latest resume with all technical details",
        icon: <Download className="text-2xl" />,
        link: "https://rxresu.me/meetbhingradiya/resume",
        type: "download",
        color: "from-purple-500 to-purple-600",
        spotlightColor: "rgba(139, 92, 246, 0.15)",
        available: true
    },
    {
        id: "location",
        title: "Location",
        description: "Based in Surat, Gujarat, India (GMT+5:30)",
        icon: <LocationOn className="text-2xl" />,
        link: "https://maps.google.com/?q=Surat,Gujarat,India",
        type: "location",
        color: "from-red-500 to-red-600",
        spotlightColor: "rgba(239, 68, 68, 0.15)",
        available: true,
        responseTime: "Available for remote work globally"
    }
];

const quickActions: QuickAction[] = [
    {
        id: "hire-staff",
        title: "Hire for Staff Engineer Role",
        description:
            "I'm actively seeking Staff Engineer positions in security-focused companies",
        icon: <Work className="text-xl" />,
        action: "/contact?template=staff-engineer",
        color: "from-blue-500 to-purple-600"
    },
    {
        id: "project-collaboration",
        title: "Project Collaboration",
        description:
            "Let's build something amazing together - open source or commercial",
        icon: <Star className="text-xl" />,
        action: "/contact?template=collaboration",
        color: "from-green-500 to-blue-500"
    },
    {
        id: "technical-consultation",
        title: "Technical Consultation",
        description:
            "Need help with security, automation, or architecture? Let's discuss",
        icon: <VideoCall className="text-xl" />,
        action: "/contact?template=technical-consultation",
        color: "from-purple-500 to-pink-500"
    },
    {
        id: "mentorship",
        title: "Mentorship & Learning",
        description:
            "Interested in learning from my experience? Happy to share knowledge ",
        icon: <School className="text-xl" />,
        action: "/contact?template=mentorship",
        color: "from-orange-500 to-red-500"
    }
];

const servicePricing: ServicePricing[] = [
    {
        id: "consultation",
        title: "Technical Consultation",
        description:
            "One-on-one technical consultation for your specific needs",
        icon: <VideoCall className="text-2xl" />,
        price: "$75",
        duration: "per hour",
        features: [
            "Security Architecture Review",
            "System Design Consultation",
            "Code Review & Best Practices",
            "Performance Optimization",
            "Technology Stack Recommendations"
        ],
        color: "from-blue-500 to-purple-600",
        action: "/contact?template=technical-consultation"
    },
    {
        id: "development",
        title: "Custom Development",
        description: "Full-stack development services for your project",
        icon: <Code className="text-2xl" />,
        price: "$50",
        duration: "per hour",
        features: [
            "Full-Stack Web Development",
            "API Development & Integration",
            "Database Design & Optimization",
            "DevOps & CI/CD Setup",
            "Testing & Quality Assurance"
        ],
        popular: true,
        color: "from-green-500 to-blue-500",
        action: "/contact?template=custom-development"
    },
    {
        id: "security-audit",
        title: "Security Audit",
        description: "Comprehensive security assessment of your application",
        icon: <Security className="text-2xl" />,
        price: "$100",
        duration: "per hour",
        features: [
            "Vulnerability Assessment",
            "Penetration Testing",
            "Code Security Review",
            "Infrastructure Security Audit",
            "Detailed Security Report"
        ],
        color: "from-red-500 to-pink-500",
        action: "/contact?template=security-audit"
    },
    {
        id: "mentorship",
        title: "Technical Mentorship",
        description:
            "Long-term mentorship for career growth and skill development",
        icon: <Groups className="text-2xl" />,
        price: "$40",
        duration: "per session",
        features: [
            "Career Guidance & Planning",
            "Technical Skill Development",
            "Code Review & Feedback",
            "Interview Preparation",
            "Industry Best Practices"
        ],
        color: "from-orange-500 to-red-500",
        action: "/contact?template=mentorship"
    }
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
            timeZone: "Asia/Kolkata"
        });
    };

    const isBusinessHours = () => {
        const hour = new Date().getUTCHours() + 5.5; // Convert to India time
        return hour >= 10 && hour <= 18; // 10 AM to 6 PM India time
    };

    return (
        <section
            id="contact"
            className="py-20 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16">
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
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="inline-flex items-center space-x-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-full px-6 py-3 border border-gray-200 dark:border-gray-700">
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
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="mb-16">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
                        Quick Actions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {" "}
                        {quickActions.map((action, index) => (
                            <motion.div
                                key={action.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.6,
                                    delay: index * 0.1
                                }}
                                whileHover={{ scale: 1.05, y: -5 }}
                                whileTap={{ scale: 0.95 }}
                                className={`bg-gradient-to-r ${action.color} text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer`}>
                                <Link
                                    href={action.action}
                                    className="block">
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
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Service Pricing */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.15 }}
                    className="mb-16">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                        Service Pricing
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-center mb-8 max-w-2xl mx-auto">
                        Transparent pricing for professional services. All rates
                        are in USD and can be customized based on project scope.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {servicePricing.map((service, index) => (
                            <motion.div
                                key={service.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.6,
                                    delay: index * 0.1
                                }}
                                whileHover={{ scale: 1.03, y: -5 }}
                                className={`relative bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border ${
                                    service.popular
                                        ? "border-blue-500 ring-2 ring-blue-500/20"
                                        : "border-gray-200 dark:border-gray-700"
                                } hover:shadow-xl transition-all duration-300 group overflow-hidden`}>
                                {/* Popular Badge */}
                                {service.popular && (
                                    <div className="absolute -top-0 -right-1">
                                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-xl">
                                            POPULAR
                                        </div>
                                    </div>
                                )}

                                {/* Background Gradient */}
                                <div
                                    className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                                />

                                <div className="relative z-10">
                                    {/* Icon and Title */}
                                    <div className="flex items-center space-x-3 mb-4">
                                        <div
                                            className={`p-3 bg-gradient-to-r ${service.color} text-white rounded-lg group-hover:scale-110 transition-transform duration-300`}>
                                            {service.icon}
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                                                {service.title}
                                            </h4>
                                        </div>
                                    </div>
                                    {/* Price */}
                                    <div className="mb-4">
                                        <div className="flex items-baseline space-x-1">
                                            <span
                                                className={`text-3xl font-bold bg-gradient-to-r ${service.color} bg-clip-text text-transparent`}>
                                                {service.price}
                                            </span>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {service.duration}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Description */}
                                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 leading-relaxed">
                                        {service.description}
                                    </p>
                                    {/* Features */}
                                    <ul className="space-y-2 mb-6">
                                        {service.features.map(
                                            (feature, idx) => (
                                                <li
                                                    key={idx}
                                                    className="flex items-start space-x-2 text-sm">
                                                    <CheckCircle className="text-green-500 text-sm mt-0.5 flex-shrink-0" />
                                                    <span className="text-gray-600 dark:text-gray-300">
                                                        {feature}
                                                    </span>
                                                </li>
                                            )
                                        )}
                                    </ul>{" "}
                                    {/* CTA Button */}
                                    <Link
                                        href={service.action}
                                        className={`w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r ${service.color} text-white font-medium rounded-lg hover:shadow-lg transition-all duration-300 group-hover:scale-105`}>
                                        <span>Get Started</span>
                                        <Send className="ml-2 text-sm group-hover:translate-x-1 transition-transform duration-200" />
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Pricing Note */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="mt-8 text-center">
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 max-w-4xl mx-auto">
                            {" "}
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                <strong>Note:</strong> Rates may vary based on
                                project complexity, timeline, and specific
                                requirements. Enterprise packages and long-term
                                contracts available at discounted rates.
                                <Link
                                    href="/contact?template=custom-pricing"
                                    className="underline hover:no-underline ml-1">
                                    Contact for custom pricing
                                </Link>
                            </p>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Contact Methods */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2, opacity: 1 }}>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
                        Contact
                    </h3>{" "}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {contactMethods.map((method, index) => (
                            <motion.div
                                key={method.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.6,
                                    delay: index * 0.1
                                }}
                                whileHover={
                                    method.available
                                        ? { scale: 1.03, y: -5 }
                                        : {}
                                }
                                whileTap={
                                    method.available ? { scale: 0.97 } : {}
                                }
                                onHoverStart={() =>
                                    method.available &&
                                    setHoveredMethod(method.id)
                                }
                                onHoverEnd={() =>
                                    method.available && setHoveredMethod(null)
                                }>
                                <SpotlightCard
                                    className={`h-full border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 group relative overflow-hidden flex flex-col min-h-[240px] ${
                                        method.available
                                            ? "hover:shadow-xl cursor-pointer"
                                            : "opacity-60 cursor-not-allowed"
                                    }`}
                                    spotlightColor={method.spotlightColor}>
                                    {method.available ? (
                                        <a
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
                                            className="flex flex-col h-full">
                                            <div className="flex items-center justify-between mb-4">
                                                <div
                                                    className={`p-3 bg-gradient-to-r ${method.color} text-white rounded-lg transition-transform duration-300 group-hover:scale-110`}>
                                                    {method.icon}
                                                </div>
                                                <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                                                    <CheckCircle className="text-sm" />
                                                    <span className="text-xs font-medium">
                                                        Available
                                                    </span>
                                                </div>
                                            </div>

                                            <h4 className="text-xl font-bold mb-2 transition-all duration-300 text-gray-900 dark:text-white group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent">
                                                {method.title}
                                            </h4>

                                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 leading-relaxed flex-grow">
                                                {method.description}
                                            </p>

                                            {method.responseTime && (
                                                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mt-auto">
                                                    <Schedule className="text-sm" />
                                                    <span>
                                                        {method.responseTime}
                                                    </span>
                                                </div>
                                            )}
                                        </a>
                                    ) : (
                                        <div className="flex flex-col h-full">
                                            <div className="flex items-center justify-between mb-4">
                                                <div
                                                    className={`p-3 bg-gradient-to-r ${method.color} text-white rounded-lg transition-transform duration-300`}>
                                                    {method.icon}
                                                </div>
                                                <div className="flex items-center space-x-1 text-red-500 dark:text-red-400">
                                                    <Error className="text-sm" />
                                                    <span className="text-xs font-medium">
                                                        Currently Unavailable
                                                    </span>
                                                </div>
                                            </div>

                                            <h4 className="text-xl font-bold mb-2 transition-all duration-300 text-gray-900 dark:text-white">
                                                {method.title}
                                            </h4>

                                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 leading-relaxed flex-grow">
                                                {method.description}
                                            </p>

                                            {method.responseTime && (
                                                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mt-auto">
                                                    <Schedule className="text-sm" />
                                                    <span>
                                                        {method.responseTime}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </SpotlightCard>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Additional Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="mt-16 text-center">
                    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-8 border border-gray-200 dark:border-gray-700">
                        <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            Let&apos;s Build Something Amazing Together
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
                            Let&apos;s work together to bring your ideas to
                            life. Whether you&apos;re looking for a Full Stack
                            Engineer, need technical consultation, or want to
                            collaborate on an exciting project, I&apos;m here to
                            help. Let&apos;s discuss how we can create
                            innovative solutions together.
                        </p>{" "}
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
                        {/* Full Contact Page CTA */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.5 }}
                            className="mt-6">
                            <Link
                                href="/contact"
                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-300 hover:shadow-lg hover:scale-105">
                                <Message className="mr-2" />
                                View Full Contact Page
                                <Send className="ml-2 text-sm" />
                            </Link>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

export default ContactSection;
