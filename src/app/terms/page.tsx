/**
 * Terms of Service Page
 * Redesigned with dual-theme support
 */

"use client";

import React from "react";
import { motion } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { LiquidGlassCard } from "@Components/Atoms/LiquidGlass";
import { OneUICard, OneUIHeader } from "@Components/Atoms/OneUI";
import { Gavel, Security, Update, ContactSupport } from "@mui/icons-material";

const sections = [
    {
        icon: <Gavel />,
        title: "Terms of Use",
        content: "By accessing and using this portfolio website, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use this site."
    },
    {
        icon: <Security />,
        title: "Intellectual Property",
        content: "All content, code, designs, graphics, and materials on this website are the property of Meet Bhingradiya and are protected by copyright laws. Unauthorized use or reproduction is prohibited."
    },
    {
        icon: <Update />,
        title: "Updates & Changes",
        content: "We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to the website. Your continued use of the site constitutes acceptance of the modified terms."
    },
    {
        icon: <ContactSupport />,
        title: "Contact & Support",
        content: "If you have questions about these terms, please contact us through the contact page. We will respond to inquiries within 48 hours during business days."
    }
];

function TermsContent() {
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
                                    Terms of Service
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
                                    title="Terms of Service"
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
                                Welcome to my portfolio website. These terms and conditions outline the rules
                                and regulations for the use of this website. By accessing this website, we
                                assume you accept these terms and conditions in full. Do not continue to use
                                this website if you do not accept all of the terms and conditions stated on
                                this page.
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

                    {/* Additional Terms */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.8 }}
                        className="mt-12"
                    >
                        <Card
                            className={isApple ? "p-8" : "p-10"}
                            intensity={isApple ? "medium" : undefined}
                            elevated={!isApple}
                        >
                            <h2
                                className={`${isApple ? "text-2xl font-bold" : "text-3xl font-black"} mb-6`}
                                style={{ color: palette.textPrimary }}
                            >
                                Additional Information
                            </h2>
                            <div
                                className={`space-y-4 ${isApple ? "text-base" : "text-lg font-medium"}`}
                                style={{ color: palette.textSecondary }}
                            >
                                <p>
                                    <strong style={{ color: palette.textPrimary }}>Usage:</strong> This website
                                    is for informational and portfolio purposes. Any tools or utilities provided
                                    are offered as-is without warranty.
                                </p>
                                <p>
                                    <strong style={{ color: palette.textPrimary }}>Links:</strong> This website
                                    may contain links to external sites. We are not responsible for the content
                                    or practices of linked websites.
                                </p>
                                <p>
                                    <strong style={{ color: palette.textPrimary }}>Liability:</strong> We shall
                                    not be held liable for any damages arising from the use of this website or
                                    its contents.
                                </p>
                            </div>
                        </Card>
                    </motion.div>
                </div>
            </main>
        </>
    );
}

export default function TermsPage() {
    return <TermsContent />;
}
