"use client";

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import Link from "next/link";
import {
    Policy,
    Description,
    Security,
    CalendarToday,
    Update,
    Category,
    ArrowBack,
    Info,
    DataUsage,
    Cookie,
    Lock,
    Visibility,
    Shield,
    Gavel,
    ContactSupport,
    AdminPanelSettings,
    BugReport,
    Backup,
    VerifiedUser
} from "@mui/icons-material";
import ReactMarkdown from "react-markdown";

interface AgreementSection {
    icon: string;
    title: string;
    content: string;
}

interface Agreement {
    AgreementID: string;
    Type: string;
    Title: string;
    Slug: string;
    Content: string; // JSON stringified array of sections
    Version: string;
    ProductIDs: string[];
    Status: string;
    EffectiveDate?: string;
    PublishDate?: string;
    Metadata: {
        Description?: string;
        Keywords?: string[];
        Author?: string;
    };
    products?: Array<{
        ProductID: string;
        Name: string;
        Slug: string;
        Icon?: string;
        Status: string;
    }>;
    sections?: AgreementSection[];
}

interface AgreementContentProps {
    slug: string;
}

// Static agreement content based on slug
function getStaticAgreement(slug: string, allProducts: any[]): Agreement {
    const agreements: Record<string, Omit<Agreement, "products">> = {
        "covered-products-privacy": {
            AgreementID: "static-privacy",
            Type: "covered_products_privacy",
            Title: "Covered Products Privacy Policy",
            Slug: "covered-products-privacy",
            Content: JSON.stringify([
                {
                    icon: "DataUsage",
                    title: "Information We Collect",
                    content: "We collect minimal information necessary for website functionality, including: IP addresses for analytics, device information for responsive design optimization, and contact form data when you reach out to us. We do not sell or share your personal information with third parties."
                },
                {
                    icon: "Cookie",
                    title: "Cookies & Tracking",
                    content: "We use cookies and local storage to enhance your experience, including: saving your theme preferences (Apple/Samsung, light/dark mode, accent colors), and anonymous analytics to improve the website. You can disable cookies in your browser settings at any time."
                },
                {
                    icon: "Lock",
                    title: "Data Security",
                    content: "We implement industry-standard security measures to protect your data. All data transmission is encrypted using HTTPS. Your theme preferences are stored locally on your device and are never transmitted to our servers without your explicit consent."
                },
                {
                    icon: "Visibility",
                    title: "Third-Party Services",
                    content: "This website may use third-party services for analytics (Google Analytics) and hosting. These services have their own privacy policies, which we encourage you to review. We only use services that comply with GDPR and other privacy regulations."
                },
                {
                    icon: "Shield",
                    title: "Your Rights",
                    content: "You have the right to: access your personal data, request deletion of your data, opt-out of analytics tracking, and update your preferences at any time. Contact us through the contact page to exercise these rights."
                },
                {
                    icon: "Security",
                    title: "Updates to Policy",
                    content: "We may update this privacy policy from time to time. We will notify users of any material changes by posting the new policy on this page with an updated date. We encourage you to review this policy periodically."
                }
            ]),
            Version: "1.0.0",
            ProductIDs: [],
            Status: "published",
            EffectiveDate: "2024-12-14",
            PublishDate: "2024-12-14",
            Metadata: {
                Description: "Privacy policy for products and services covered under our database management system",
                Keywords: ["privacy", "data protection", "GDPR", "personal information"],
                Author: "Legal Team"
            }
        },
        "covered-products-terms": {
            AgreementID: "static-terms",
            Type: "covered_products_terms",
            Title: "Covered Products Terms of Service",
            Slug: "covered-products-terms",
            Content: JSON.stringify([
                {
                    icon: "Gavel",
                    title: "Terms of Use",
                    content: "By accessing and using our covered products, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use these products or services."
                },
                {
                    icon: "Security",
                    title: "Intellectual Property",
                    content: "All content, code, designs, graphics, and materials related to our products are protected by copyright laws. Unauthorized use or reproduction is prohibited without explicit written permission."
                },
                {
                    icon: "Update",
                    title: "Updates & Changes",
                    content: "We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use of the products constitutes acceptance of the modified terms."
                },
                {
                    icon: "ContactSupport",
                    title: "Contact & Support",
                    content: "If you have questions about these terms, please contact us through the contact page. We will respond to inquiries within 48 hours during business days."
                }
            ]),
            Version: "1.0.0",
            ProductIDs: [],
            Status: "published",
            EffectiveDate: "2024-12-14",
            PublishDate: "2024-12-14",
            Metadata: {
                Description: "Terms and conditions for using our covered products and services",
                Keywords: ["terms", "conditions", "agreement", "legal"],
                Author: "Legal Team"
            }
        },
        "security": {
            AgreementID: "static-security",
            Type: "security",
            Title: "Product Security Policy",
            Slug: "security",
            Content: JSON.stringify([
                {
                    icon: "Lock",
                    title: "Data Encryption",
                    content: "All data in transit is encrypted using TLS 1.3 protocol. Sensitive data at rest is encrypted using industry-standard AES-256 encryption algorithms to ensure maximum protection."
                },
                {
                    icon: "AdminPanelSettings",
                    title: "Access Controls",
                    content: "We implement multi-factor authentication (MFA), role-based access control (RBAC), and conduct regular access reviews and security audits to prevent unauthorized access."
                },
                {
                    icon: "Security",
                    title: "Infrastructure Security",
                    content: "Our infrastructure includes regular security patches, continuous monitoring and threat detection, DDoS protection, and rate limiting to maintain service integrity."
                },
                {
                    icon: "BugReport",
                    title: "Vulnerability Reporting",
                    content: "If you discover a security vulnerability, please report it responsibly to security@meetbhingradiya.com. Do not publicly disclose the issue and allow reasonable time for remediation. We may offer rewards for qualifying vulnerabilities."
                },
                {
                    icon: "Backup",
                    title: "Data Backup & Recovery",
                    content: "We maintain regular automated backups, disaster recovery procedures, and documented data retention policies to ensure business continuity and data availability."
                },
                {
                    icon: "VerifiedUser",
                    title: "Compliance & Standards",
                    content: "We comply with GDPR, CCPA, and are working towards SOC 2 certification. Our security practices align with industry standards and regulatory requirements."
                }
            ]),
            Version: "1.0.0",
            ProductIDs: [],
            Status: "published",
            EffectiveDate: "2024-12-14",
            PublishDate: "2024-12-14",
            Metadata: {
                Description: "Security policies and best practices for our product ecosystem",
                Keywords: ["security", "encryption", "vulnerability", "compliance"],
                Author: "Security Team"
            }
        }
    };

    const baseAgreement = agreements[slug];
    if (!baseAgreement) {
        throw new Error("Agreement not found");
    }

    // Return agreement with all products (you can filter by tags/categories if needed)
    return {
        ...baseAgreement,
        products: allProducts.map((p: any) => ({
            ProductID: p.ProductID,
            Name: p.Name,
            Slug: p.Slug,
            Icon: p.Icon,
            Status: p.Status
        }))
    };
}

export default function AgreementContent({ slug }: AgreementContentProps) {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";
    const [agreement, setAgreement] = useState<Agreement | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchProducts() {
            try {
                // Fetch only products, agreement content is static
                const response = await fetch(`/api/products?status=active&limit=100`);
                const data = await response.json();

                // Always render agreement even if no products found
                const products = data.success ? data.data : [];
                const agreementData = getStaticAgreement(slug, products);
                setAgreement(agreementData);
            } catch (err) {
                // Even on error, render agreement with no products
                const agreementData = getStaticAgreement(slug, []);
                setAgreement(agreementData);
                console.warn("Failed to load products:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchProducts();
    }, [slug]);

    const getIcon = () => {
        if (slug.includes("privacy")) return <Policy className="text-4xl" />;
        if (slug.includes("terms")) return <Description className="text-4xl" />;
        if (slug.includes("security")) return <Security className="text-4xl" />;
        return <Policy className="text-4xl" />;
    };

    const getIconComponent = (iconName: string) => {
        const iconMap: Record<string, React.ReactElement> = {
            DataUsage: <DataUsage />,
            Cookie: <Cookie />,
            Lock: <Lock />,
            Visibility: <Visibility />,
            Shield: <Shield />,
            Security: <Security />,
            Gavel: <Gavel />,
            Update: <Update />,
            ContactSupport: <ContactSupport />,
            AdminPanelSettings: <AdminPanelSettings />,
            BugReport: <BugReport />,
            Backup: <Backup />,
            VerifiedUser: <VerifiedUser />
        };
        return iconMap[iconName] || <Policy />;
    };

    // Parse sections from Content if available
    const sections: AgreementSection[] = agreement ? (() => {
        try {
            return JSON.parse(agreement.Content);
        } catch {
            return [];
        }
    })() : [];

    if (loading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ background: palette.background }}
            >
                <div className="text-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        style={{ color: palette.accent }}
                    >
                        {getIcon()}
                    </motion.div>
                    <p
                        className={`${isApple ? "text-lg" : "text-xl font-medium"} mt-4`}
                        style={{ color: palette.textSecondary }}
                    >
                        Loading agreement...
                    </p>
                </div>
            </div>
        );
    }

    if (error || !agreement) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ background: palette.background }}
            >
                <div className="text-center max-w-md px-6">
                    <Info className="text-6xl mb-4" style={{ color: palette.textTertiary }} />
                    <h1
                        className={`${isApple ? "text-2xl font-bold" : "text-3xl font-black"} mb-4`}
                        style={{ color: palette.textPrimary }}
                    >
                        Agreement Not Found
                    </h1>
                    <p
                        className={`${isApple ? "text-base" : "text-lg"} mb-6`}
                        style={{ color: palette.textSecondary }}
                    >
                        {error || "The requested agreement could not be found."}
                    </p>
                    <Link href="/">
                        <motion.button
                            className={`${isApple ? "px-6 py-3 rounded-xl" : "px-8 py-4 rounded-2xl"} font-semibold`}
                            style={{
                                background: palette.accent,
                                color: palette.textOnAccent
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <ArrowBack className="mr-2" />
                            Go to Homepage
                        </motion.button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen"
            style={{
                background: isApple
                    ? isDark
                        ? `linear-gradient(180deg, ${palette.background} 0%, ${palette.backgroundSecondary} 100%)`
                        : `linear-gradient(180deg, ${palette.background} 0%, ${palette.backgroundElevated} 100%)`
                    : palette.background
            }}
        >
            {/* Header */}
            <div
                className="border-b"
                style={{
                    borderColor: palette.border,
                    background: isApple
                        ? isDark
                            ? "rgba(28, 28, 30, 0.8)"
                            : "rgba(255, 255, 255, 0.8)"
                        : palette.surface,
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)"
                }}
            >
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                    <Link href="/sitemap">
                        <motion.button
                            className={`${isApple ? "text-sm" : "text-base"} font-medium mb-6 flex items-center gap-2`}
                            style={{ color: palette.accent }}
                            whileHover={{ x: -4 }}
                        >
                            <ArrowBack />
                            Back to Sitemap
                        </motion.button>
                    </Link>

                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="flex items-start gap-4 mb-6">
                            <div
                                className={`${isApple ? "p-4 rounded-xl" : "p-5 rounded-2xl"}`}
                                style={{
                                    background: `${palette.accent}15`,
                                    color: palette.accent
                                }}
                            >
                                {getIcon()}
                            </div>
                            <div className="flex-1">
                                <h1
                                    className={`${isApple ? "text-3xl sm:text-4xl font-bold" : "text-4xl sm:text-5xl font-black"} mb-2`}
                                    style={{ color: palette.textPrimary }}
                                >
                                    {agreement.Title}
                                </h1>
                                {agreement.Metadata?.Description && (
                                    <p
                                        className={`${isApple ? "text-base sm:text-lg" : "text-lg sm:text-xl font-medium"}`}
                                        style={{ color: palette.textSecondary }}
                                    >
                                        {agreement.Metadata.Description}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Metadata */}
                        <div className="flex flex-wrap gap-4 sm:gap-6">
                            <div className="flex items-center gap-2">
                                <Update style={{ color: palette.textTertiary }} />
                                <span
                                    className={`${isApple ? "text-sm" : "text-base"}`}
                                    style={{ color: palette.textSecondary }}
                                >
                                    Version {agreement.Version}
                                </span>
                            </div>
                            {agreement.EffectiveDate && (
                                <div className="flex items-center gap-2">
                                    <CalendarToday style={{ color: palette.textTertiary }} />
                                    <span
                                        className={`${isApple ? "text-sm" : "text-base"}`}
                                        style={{ color: palette.textSecondary }}
                                    >
                                        Effective: {new Date(agreement.EffectiveDate).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                            {agreement.products && agreement.products.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <Category style={{ color: palette.textTertiary }} />
                                    <span
                                        className={`${isApple ? "text-sm" : "text-base"}`}
                                        style={{ color: palette.textSecondary }}
                                    >
                                        {agreement.products.length} {agreement.products.length === 1 ? "Product" : "Products"}
                                    </span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                {/* Covered Products */}
                {agreement.products && agreement.products.length > 0 && (
                    <motion.div
                        className="mb-8 sm:mb-12"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <h2
                            className={`${isApple ? "text-xl font-bold" : "text-2xl font-black"} mb-4`}
                            style={{ color: palette.textPrimary }}
                        >
                            Covered Products
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            {agreement.products.map((product) => (
                                <div
                                    key={product.ProductID}
                                    className={`${isApple ? "p-4 rounded-xl" : "p-5 rounded-2xl"}`}
                                    style={{
                                        background: palette.surface,
                                        border: `1px solid ${palette.border}`
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        {product.Icon && (
                                            <div
                                                className={`${isApple ? "p-2 rounded-lg" : "p-3 rounded-xl"}`}
                                                style={{
                                                    background: `${palette.accent}15`,
                                                    color: palette.accent
                                                }}
                                            >
                                                <span className="text-xl">{product.Icon}</span>
                                            </div>
                                        )}
                                        <div>
                                            <h3
                                                className={`${isApple ? "text-base font-semibold" : "text-lg font-bold"}`}
                                                style={{ color: palette.textPrimary }}
                                            >
                                                {product.Name}
                                            </h3>
                                            <span
                                                className={`${isApple ? "text-xs" : "text-sm"} uppercase`}
                                                style={{ color: palette.textTertiary }}
                                            >
                                                {product.Status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Introduction */}
                {agreement.Metadata?.Description && (
                    <motion.div
                        className="mb-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <div
                            className={`${isApple ? "p-6 sm:p-8 rounded-xl" : "p-8 sm:p-10 rounded-2xl"}`}
                            style={{
                                background: palette.surface,
                                border: `1px solid ${palette.border}`
                            }}
                        >
                            <p
                                className={`${isApple ? "text-base leading-relaxed" : "text-lg font-medium leading-relaxed"}`}
                                style={{ color: palette.textSecondary }}
                            >
                                {agreement.Metadata.Description}
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* Agreement Sections */}
                <div className="space-y-6">
                    {sections.map((section, index) => (
                        <motion.div
                            key={section.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                        >
                            <div
                                className={`${isApple ? "p-6 sm:p-8 rounded-xl" : "p-8 sm:p-10 rounded-2xl"}`}
                                style={{
                                    background: palette.surface,
                                    border: `1px solid ${palette.border}`
                                }}
                            >
                                <div className="flex items-start gap-4">
                                    <div
                                        className={`${isApple ? "p-3 rounded-xl text-2xl" : "p-4 rounded-2xl text-3xl"} flex-shrink-0`}
                                        style={{
                                            background: palette.accentSubtle,
                                            color: palette.accent
                                        }}
                                    >
                                        {getIconComponent(section.icon)}
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
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Last Updated */}
                <motion.div
                    className="mt-8 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <p
                        className={`${isApple ? "text-sm" : "text-base"}`}
                        style={{ color: palette.textTertiary }}
                    >
                        Last updated: {new Date(agreement.PublishDate || agreement.EffectiveDate || "").toLocaleDateString()}
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
