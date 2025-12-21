/**
 * Privacy Policy Page
 * Redesigned with dual-theme support
 */

"use client";

import React from "react";
import { motion } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { LiquidGlassCard } from "@Components/Atoms/LiquidGlass";
import { OneUICard, OneUIHeader } from "@Components/Atoms/OneUI";
import { Security, Cookie, DataUsage, Shield, Lock, Visibility } from "@mui/icons-material";

const sections = [
    {
        icon: <DataUsage />,
        title: "Information We Collect",
        content: "We collect minimal information necessary for website functionality, including: IP addresses for analytics, device information for responsive design optimization, and contact form data when you reach out to us. We do not sell or share your personal information with third parties."
    },
    {
        icon: <Cookie />,
        title: "Cookies & Tracking",
        content: "We use cookies and local storage to enhance your experience, including: saving your theme preferences (Apple/Samsung, light/dark mode, accent colors), and anonymous analytics to improve the website. You can disable cookies in your browser settings at any time."
    },
    {
        icon: <Lock />,
        title: "Data Security",
        content: "We implement industry-standard security measures to protect your data. All data transmission is encrypted using HTTPS. Your theme preferences are stored locally on your device and are never transmitted to our servers without your explicit consent."
    },
    {
        icon: <Visibility />,
        title: "Third-Party Services",
        content: "This website may use third-party services for analytics (Google Analytics) and hosting. These services have their own privacy policies, which we encourage you to review. We only use services that comply with GDPR and other privacy regulations."
    },
    {
        icon: <Shield />,
        title: "Your Rights",
        content: "You have the right to: access your personal data, request deletion of your data, opt-out of analytics tracking, and update your preferences at any time. Contact us through the contact page to exercise these rights."
    },
    {
        icon: <Security />,
        title: "Updates to Policy",
        content: "We may update this privacy policy from time to time. We will notify users of any material changes by posting the new policy on this page with an updated date. We encourage you to review this policy periodically."
    }
];

function PrivacyContent() {
    const { designTheme, palette } = useDesignTheme();
    const isApple = designTheme === "apple";
    const Card = isApple ? LiquidGlassCard : OneUICard;

    return (
        <>
            
            <main
                className="min-h-screen py-24"
                style={{ background: palette.background }}
            >
                <div className="max-w-4xl mx-auto px-6">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-12"
                    >
                        {isApple ? (
                            <>
                                <h1
                                    className="text-5xl md:text-6xl font-bold mb-4"
                                    style={{ color: palette.textPrimary }}
                                >
                                    Privacy Policy
                                </h1>
                                <p
                                    className="text-lg"
                                    style={{ color: palette.textSecondary }}
                                >
                                    Last updated: November 21, 2025
                                </p>
                            </>
                        ) : (
                            <>
                                <OneUIHeader
                                    title="Privacy Policy"
                                    subtitle="Last updated: November 21, 2025"
                                />
                            </>
                        )}
                    </motion.div>

                    {/* Introduction */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="mb-8"
                    >
                        <Card
                            className={isApple ? "p-8" : "p-10"}
                            intensity={isApple ? "medium" : undefined}
                            elevated={!isApple}
                        >
                            <p
                                className={`${isApple ? "text-base leading-relaxed" : "text-lg font-medium leading-relaxed"}`}
                                style={{ color: palette.textSecondary }}
                            >
                                Your privacy is important to us. This privacy policy explains what information
                                we collect, how we use it, and your rights regarding your data. We are committed
                                to protecting your privacy and being transparent about our data practices.
                            </p>
                        </Card>
                    </motion.div>

                    {/* Sections */}
                    <div className="space-y-6">
                        {sections.map((section, index) => (
                            <motion.div
                                key={section.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                            >
                                <Card
                                    className={isApple ? "p-8" : "p-10"}
                                    intensity={isApple ? "medium" : undefined}
                                    elevated={!isApple}
                                >
                                    <div className="flex items-start gap-4">
                                        <div
                                            className={`${isApple ? "p-3 rounded-xl text-2xl" : "p-4 rounded-2xl text-3xl"} flex-shrink-0`}
                                            style={{
                                                background: palette.accentSubtle,
                                                color: palette.accent
                                            }}
                                        >
                                            {section.icon}
                                        </div>
                                        <div className="flex-1">
                                            <h2
                                                className={`${isApple ? "text-2xl font-bold" : "text-3xl font-black"} mb-3`}
                                                style={{ color: palette.textPrimary }}
                                            >
                                                {section.title}
                                            </h2>
                                            <p
                                                className={`${isApple ? "text-base leading-relaxed" : "text-lg font-medium leading-relaxed"}`}
                                                style={{ color: palette.textSecondary }}
                                            >
                                                {section.content}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    {/* Contact */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.9 }}
                        className="mt-12"
                    >
                        <Card
                            className={isApple ? "p-8" : "p-10"}
                            intensity={isApple ? "medium" : undefined}
                            elevated={!isApple}
                        >
                            <h2
                                className={`${isApple ? "text-2xl font-bold" : "text-3xl font-black"} mb-4`}
                                style={{ color: palette.textPrimary }}
                            >
                                Contact Us
                            </h2>
                            <p
                                className={`${isApple ? "text-base" : "text-lg font-medium"}`}
                                style={{ color: palette.textSecondary }}
                            >
                                If you have any questions about this privacy policy or your data, please contact
                                us through our{" "}
                                <a
                                    href="/contact"
                                    style={{ color: palette.accent }}
                                    className="font-bold hover:underline"
                                >
                                    contact page
                                </a>
                                . We will respond to your inquiry within 48 hours.
                            </p>
                        </Card>
                    </motion.div>
                </div>
            </main>
        </>
    );
}

export default function PrivacyPage() {
    return <PrivacyContent />;
}
