"use client";

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import Link from "next/link";
import { Config } from "@Config/Client";
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
    VerifiedUser,
    ChildCare,
    Delete,
    Public,
    MobileFriendly,
    Payment,
    Block,
    Warning,
    PersonAdd,
    CheckCircle
} from "@mui/icons-material";
import ReactMarkdown from "react-markdown";
import { EmailConfig } from "@Config/type";

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
    const emailConfig = Config.Emails as EmailConfig;

    const agreements: Record<string, Omit<Agreement, "products">> = {
        "privacy": {
            AgreementID: "static-main-privacy",
            Type: "privacy_policy",
            Title: "Privacy Policy",
            Slug: "privacy",
            Content: JSON.stringify([
                {
                    icon: "DataUsage",
                    title: "Information We Collect",
                    content:
                        "We collect minimal information necessary for website functionality, including: IP addresses for analytics, device information for responsive design optimization, and contact form data when you reach out to us. We do not sell or share your personal information with third parties."
                },
                {
                    icon: "Cookie",
                    title: "Cookies & Tracking",
                    content:
                        "We use cookies and local storage to enhance your experience, including: saving your theme preferences (Apple/Samsung, light/dark mode, accent colors), and anonymous analytics to improve the website. You can disable cookies in your browser settings at any time."
                },
                {
                    icon: "Lock",
                    title: "Data Security",
                    content:
                        "We implement industry-standard security measures to protect your data. All data transmission is encrypted using HTTPS. Your theme preferences are stored locally on your device and are never transmitted to our servers without your explicit consent."
                },
                {
                    icon: "Visibility",
                    title: "Third-Party Services",
                    content:
                        "This website may use third-party services for analytics (Google Analytics) and hosting. These services have their own privacy policies, which we encourage you to review. We only use services that comply with GDPR and other privacy regulations."
                },
                {
                    icon: "Shield",
                    title: "Your Rights",
                    content:
                        "You have the right to: access your personal data, request deletion of your data, opt-out of analytics tracking, and update your preferences at any time. Contact us through the contact page to exercise these rights."
                },
                {
                    icon: "Security",
                    title: "Updates to Policy",
                    content:
                        "We may update this privacy policy from time to time. We will notify users of any material changes by posting the new policy on this page with an updated date. We encourage you to review this policy periodically."
                }
            ]),
            Version: "1.0.0",
            ProductIDs: [],
            Status: "published",
            EffectiveDate: "2024-11-21",
            PublishDate: "2024-11-21",
            Metadata: {
                Description: "Privacy policy for this portfolio website explaining how we collect, use, and protect your data",
                Keywords: ["privacy", "data protection", "portfolio", "website"],
                Author: "Meet Bhingradiya"
            }
        },
        "terms": {
            AgreementID: "static-main-terms",
            Type: "terms_of_service",
            Title: "Terms of Service",
            Slug: "terms",
            Content: JSON.stringify([
                {
                    icon: "Gavel",
                    title: "Terms of Use",
                    content:
                        "By accessing and using this portfolio website, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use this site."
                },
                {
                    icon: "Security",
                    title: "Intellectual Property",
                    content:
                        "All content, code, designs, graphics, and materials on this website are the property of Meet Bhingradiya and are protected by copyright laws. Unauthorized use or reproduction is prohibited."
                },
                {
                    icon: "Update",
                    title: "Updates & Changes",
                    content:
                        "We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to the website. Your continued use of the site constitutes acceptance of the modified terms."
                },
                {
                    icon: "ContactSupport",
                    title: "Contact & Support",
                    content:
                        "If you have questions about these terms, please contact us through the contact page. We will respond to inquiries within 48 hours during business days."
                }
            ]),
            Version: "1.0.0",
            ProductIDs: [],
            Status: "published",
            EffectiveDate: "2024-11-21",
            PublishDate: "2024-11-21",
            Metadata: {
                Description: "Terms and conditions for using this portfolio website",
                Keywords: ["terms", "conditions", "portfolio", "website"],
                Author: "Meet Bhingradiya"
            }
        },
        "covered-products-privacy": {
            AgreementID: "static-privacy",
            Type: "covered_products_privacy",
            Title: "Covered Products Privacy Policy",
            Slug: "covered-products-privacy",
            Content: JSON.stringify([
                {
                    icon: "Info",
                    title: "Developer Information",
                    content: `Developer: Meet Bhingradiya • Email: ${emailConfig.contact} • Privacy Email: ${emailConfig.privacy} • Location: India • This privacy policy applies to all applications, extensions, and services developed by Meet Bhingradiya, including those distributed through Google Play Store, Chrome Web Store, and other platforms.`
                },
                {
                    icon: "DataUsage",
                    title: "Information We Collect",
                    content:
                        "We collect minimal information necessary for functionality: • Personal Information: Email addresses, names (when you create an account or contact us) • Usage Data: IP addresses for analytics, device information (OS, browser, screen size), app usage statistics, crash reports • User Content: Data you create or upload within our applications • Device Permissions: Only permissions explicitly requested and approved by you (storage, camera, location when applicable) • We do not sell or share your personal information with third parties for marketing purposes."
                },
                {
                    icon: "Category",
                    title: "How We Use Your Data",
                    content:
                        "Your data is used to: • Provide and maintain our services • Improve user experience and app functionality • Send important updates and notifications (if opted-in) • Analyze usage patterns to fix bugs and improve performance • Comply with legal obligations • Prevent fraud and abuse • We process data only for legitimate purposes and with your consent where required by law."
                },
                {
                    icon: "Cookie",
                    title: "Cookies & Local Storage",
                    content:
                        "We use cookies and local storage to: • Save your preferences (theme, language, settings) • Maintain login sessions • Collect anonymous analytics data • Cache data for offline functionality • You can disable cookies in your browser/device settings. Note: Disabling cookies may limit certain features. We use Google Analytics with IP anonymization enabled."
                },
                {
                    icon: "Visibility",
                    title: "Third-Party Services & SDKs",
                    content:
                        "Our services may integrate with: • Google Analytics (analytics) - https://policies.google.com/privacy • Google Firebase (authentication, database, storage) - https://firebase.google.com/support/privacy • Google Ads (advertising) - https://policies.google.com/technologies/ads • Vercel (hosting) - https://vercel.com/legal/privacy-policy • These services have their own privacy policies. We only share data necessary for their operation and require them to maintain strict confidentiality."
                },
                {
                    icon: "AdminPanelSettings",
                    title: "Mobile App & Extension Permissions",
                    content:
                        "Our mobile apps and browser extensions may request: • Storage: To save user preferences and offline data • Internet: To sync data and provide online features • Camera/Photos: Only for features that explicitly require media upload • Location: Only for location-based features (with your explicit permission) • Notifications: To send updates (can be disabled in settings) • Permissions are requested only when needed and can be revoked anytime through your device settings."
                },
                {
                    icon: "Lock",
                    title: "Data Security & Retention",
                    content:
                        "We implement industry-standard security measures: • All data transmission uses HTTPS/TLS encryption • Passwords are hashed using bcrypt with salt • Database access is restricted and monitored • Regular security audits and vulnerability assessments • Data Retention: Active account data is retained while your account is active. Inactive accounts may be deleted after 2 years. Analytics data is retained for 14 months. You can request immediate deletion at any time."
                },
                {
                    icon: "ChildCare",
                    title: "Children's Privacy (COPPA Compliance)",
                    content: `Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent/guardian and believe your child has provided us with personal information, please contact us immediately at ${emailConfig.contact}, and we will delete such information within 30 days.`
                },
                {
                    icon: "Shield",
                    title: "Your Rights & Data Control",
                    content: `You have the right to: • Access: Request a copy of your personal data • Rectification: Correct inaccurate data • Deletion: Request deletion of your data (Right to be Forgotten) • Portability: Receive your data in a structured format • Opt-out: Disable analytics, marketing communications • Object: Object to data processing • To exercise these rights, email ${emailConfig.contact} with subject "Data Request". We will respond within 30 days.`
                },
                {
                    icon: "Delete",
                    title: "Account & Data Deletion",
                    content: `To delete your account and all associated data: • Log into your account and go to Settings > Account > Delete Account, OR • Email ${emailConfig.contact} with subject "Account Deletion Request" • Upon deletion: All personal data will be permanently removed within 30 days. Anonymized analytics data may be retained. Backups are deleted within 90 days. This action is irreversible.`
                },
                {
                    icon: "Public",
                    title: "International Data Transfers",
                    content:
                        "Your data may be transferred to and processed in countries outside your residence, including India and the United States. We ensure adequate protection through: • Standard Contractual Clauses (SCCs) • Compliance with GDPR, CCPA, and local regulations • By using our services, you consent to these transfers."
                },
                {
                    icon: "Gavel",
                    title: "Legal Compliance & Disclosure",
                    content:
                        "We may disclose your data when required by law: • Court orders or legal processes • Protecting rights and safety of users • Preventing fraud or illegal activities • Compliance with Google Play Store, Chrome Web Store policies • We will notify you of such disclosures unless prohibited by law."
                },
                {
                    icon: "Security",
                    title: "Policy Updates",
                    content:
                        "We may update this privacy policy periodically. Material changes will be notified via: • Email notification (if you have an account) • In-app notification • Banner on our website/app • Effective date of changes will be clearly stated. Continued use after updates constitutes acceptance. Last updated: December 21, 2025."
                },
                {
                    icon: "ContactSupport",
                    title: "Contact & Privacy Inquiries",
                    content: `For privacy questions, concerns, or data requests, contact us: • Email: ${emailConfig.contact} (Primary) • Privacy Email: ${emailConfig.privacy} • Website: https://${emailConfig.domain}/contact • Response Time: Within 48 hours for general inquiries, 30 days for data requests • Physical address available upon request for legal purposes.`
                }
            ]),
            Version: "2.0.0",
            ProductIDs: [],
            Status: "published",
            EffectiveDate: "2024-12-21",
            PublishDate: "2024-12-21",
            Metadata: {
                Description:
                    "Comprehensive privacy policy for covered products compliant with GDPR, CCPA, COPPA, Google Play Store, and Chrome Web Store requirements",
                Keywords: ["privacy", "data protection", "GDPR", "COPPA", "Google Play", "Chrome Web Store", "mobile apps", "extensions"],
                Author: "Meet Bhingradiya"
            }
        },
        "covered-products-terms": {
            AgreementID: "static-terms",
            Type: "covered_products_terms",
            Title: "Covered Products Terms of Service",
            Slug: "covered-products-terms",
            Content: JSON.stringify([
                {
                    icon: "Info",
                    title: "Service Provider Information",
                    content: `Service Provider: Meet Bhingradiya • Email: ${emailConfig.contact} • Legal Email: ${emailConfig.legal} • Location: India • These terms apply to all applications, extensions, and services developed by Meet Bhingradiya, including those available on Google Play Store, Chrome Web Store, and other platforms.`
                },
                {
                    icon: "Gavel",
                    title: "Acceptance of Terms",
                    content:
                        "By accessing, installing, or using our services, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree with any part of these terms, you must not use our services. For mobile apps and extensions, installing the software constitutes acceptance. For minors under 18, parental/guardian consent is required."
                },
                {
                    icon: "PersonAdd",
                    title: "User Accounts & Eligibility",
                    content:
                        "To use certain features, you may need to create an account. You must: • Be at least 13 years old (18 in some jurisdictions) • Provide accurate and complete information • Maintain the security of your account credentials • Not share your account with others • Notify us immediately of any unauthorized access • We reserve the right to suspend or terminate accounts that violate these terms."
                },
                {
                    icon: "CheckCircle",
                    title: "Acceptable Use Policy",
                    content:
                        "You agree NOT to: • Violate any laws or regulations • Infringe on intellectual property rights • Upload malicious code or viruses • Attempt to hack, reverse engineer, or compromise our services • Use the service for spam, phishing, or fraud • Impersonate others or provide false information • Harass, abuse, or harm other users • Use automated tools (bots) without permission • Distribute or resell our services without authorization • Violations may result in immediate termination."
                },
                {
                    icon: "Security",
                    title: "Intellectual Property Rights",
                    content:
                        "All content, code, designs, logos, trademarks, and materials are owned by Meet Bhingradiya and protected by copyright and intellectual property laws. You are granted a limited, non-exclusive, non-transferable license to use our services. You may not: • Copy, modify, or create derivative works • Sell, rent, lease, or sublicense our software • Remove copyright or proprietary notices • User-generated content remains yours, but you grant us a license to use, display, and distribute it as needed to provide our services."
                },
                {
                    icon: "MobileFriendly",
                    title: "Mobile Apps & Browser Extensions",
                    content:
                        "For apps on Google Play Store and extensions on Chrome Web Store: • Installation grants you a personal, revocable license • Updates may be installed automatically • Features may require in-app purchases or subscriptions • We are not responsible for third-party app store policies • Device compatibility is not guaranteed • Uninstalling removes the license • Google Play and Chrome Web Store have additional terms that also apply."
                },
                {
                    icon: "Payment",
                    title: "Payments & Subscriptions",
                    content:
                        "Some services may require payment: • Prices are displayed clearly before purchase • Payments are processed through secure third-party providers (Google Play Billing, Stripe, etc.) • Subscriptions auto-renew unless canceled 24 hours before renewal • Refunds follow our Refund Policy and applicable store policies • We reserve the right to change pricing with 30 days notice • Taxes may apply based on your location • Promotional offers may have additional terms."
                },
                {
                    icon: "Block",
                    title: "Termination & Suspension",
                    content:
                        "We may suspend or terminate your access: • For violation of these terms • For illegal or fraudulent activity • For prolonged inactivity (after notice) • If required by law or regulation • You may terminate your account at any time through account settings or by contacting us. Upon termination: Access to paid features ends immediately. Your data will be deleted per our Privacy Policy. Outstanding payments remain due."
                },
                {
                    icon: "Warning",
                    title: "Disclaimers & Limitations",
                    content:
                        'OUR SERVICES ARE PROVIDED "AS IS" WITHOUT WARRANTIES: • We do not guarantee uninterrupted or error-free service • We are not responsible for data loss (maintain backups) • Third-party services and links are not under our control • Features may change or be discontinued with notice • TO THE MAXIMUM EXTENT PERMITTED BY LAW: We are not liable for indirect, incidental, or consequential damages. Total liability is limited to the amount you paid in the last 12 months. Some jurisdictions do not allow these limitations.'
                },
                {
                    icon: "Gavel",
                    title: "Google Play & Chrome Web Store Compliance",
                    content:
                        "Our mobile apps and extensions comply with: • Google Play Developer Program Policies • Chrome Web Store Developer Agreement • User Data Privacy requirements • Content Rating guidelines • We collect and handle data according to Google's policies. Store-specific terms may override these terms where applicable. Violations can be reported to the respective platform."
                },
                {
                    icon: "Public",
                    title: "Governing Law & Disputes",
                    content:
                        "These terms are governed by the laws of India. Disputes will be resolved through: • Good faith negotiation (30 days) • Binding arbitration in India (if negotiation fails) • Small claims court for eligible disputes • You waive the right to class action lawsuits. European users have additional rights under EU law. California users have rights under CCPA."
                },
                {
                    icon: "Update",
                    title: "Changes to Terms",
                    content:
                        "We may update these terms at any time. You will be notified of material changes via: • Email (if you have an account) • In-app/website notification • Updated effective date on this page • Continued use after changes constitutes acceptance. If you disagree with changes, you must stop using our services. We recommend reviewing these terms periodically."
                },
                {
                    icon: "ContactSupport",
                    title: "Contact Information",
                    content: `For questions, support, or legal inquiries: • Email: ${emailConfig.contact} (General) • Legal Email: ${emailConfig.legal} • Website: https://${emailConfig.domain}/contact • Response Time: 48-72 hours for general inquiries • For DMCA takedown requests, email ${emailConfig.dmca} • Physical address available upon request for legal purposes.`
                }
            ]),
            Version: "2.0.0",
            ProductIDs: [],
            Status: "published",
            EffectiveDate: "2024-12-21",
            PublishDate: "2024-12-21",
            Metadata: {
                Description:
                    "Comprehensive terms of service for covered products compliant with Google Play Store and Chrome Web Store requirements",
                Keywords: ["terms", "conditions", "agreement", "legal", "Google Play", "Chrome Web Store", "mobile apps", "extensions"],
                Author: "Meet Bhingradiya"
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
                    content:
                        "All data in transit is encrypted using TLS 1.3 protocol. Sensitive data at rest is encrypted using industry-standard AES-256 encryption algorithms to ensure maximum protection. We regularly review and update our encryption standards to maintain the highest level of security."
                },
                {
                    icon: "AdminPanelSettings",
                    title: "Access Controls",
                    content:
                        "We implement multi-factor authentication (MFA), role-based access control (RBAC), and conduct regular access reviews and security audits to prevent unauthorized access. Administrative access is strictly limited and logged for audit purposes."
                },
                {
                    icon: "Security",
                    title: "Infrastructure Security",
                    content:
                        "Our infrastructure includes: • Regular security patches and updates • Continuous monitoring and threat detection • DDoS protection and rate limiting • Firewall and intrusion prevention systems • Network segmentation and isolation • Regular penetration testing and security assessments"
                },
                {
                    icon: "Warning",
                    title: "Data Breach Response Protocol",
                    content:
                        "In the event of a detected data breach, we implement immediate protective measures: • IMMEDIATE: All user sessions are instantly revoked across all devices • SECURE: Password hashes are regenerated using non-similar cryptographic salts for all accounts to prevent credential stuffing attacks • MANDATORY: All users are required to change their passwords upon next login • UPGRADE: Encryption algorithms and security keys are rotated immediately • NOTIFY: Affected users are notified within 72 hours via email and in-app notifications • INVESTIGATE: Full forensic analysis is conducted to identify the breach source and extent • REPORT: Regulatory authorities are notified as required by GDPR, CCPA, and applicable laws"
                },
                {
                    icon: "Shield",
                    title: "Account Protection Measures",
                    content:
                        "To protect your account during and after a security incident: • Automatic session termination on all devices • Account temporarily locked until password reset is completed • Login attempts are monitored and suspicious activity is flagged • Two-factor authentication is strongly recommended and may be enforced • Account recovery requires additional verification steps • Security notifications are sent for all critical account changes"
                },
                {
                    icon: "BugReport",
                    title: "Vulnerability Reporting",
                    content: `If you discover a security vulnerability, please report it responsibly to ${emailConfig.security}. • Do not publicly disclose the issue • Allow reasonable time (90 days) for remediation • Provide detailed reproduction steps • Note: We do not provide rewards or public security credits as this is not a corporate website`
                },
                {
                    icon: "Backup",
                    title: "Data Backup & Recovery",
                    content:
                        "Important: We currently do not maintain regular backup systems. Users are responsible for maintaining their own backups of important data. We recommend regularly exporting your data and storing it securely. In the event of data loss, we may not be able to recover your information. Future updates may include automated backup capabilities."
                },
                {
                    icon: "Category",
                    title: "Incident Response",
                    content:
                        "As these are hobby and startup projects, we do not maintain formal incident response timelines. However, we take security seriously and will: • Investigate reported issues as quickly as possible • Notify affected users when we become aware of security incidents • Implement fixes and security patches on a best-effort basis • Communicate updates through email and in-app notifications when applicable"
                },
                {
                    icon: "VerifiedUser",
                    title: "Compliance & Standards",
                    content:
                        "We strive to follow security best practices including GDPR and CCPA guidelines, and OWASP Top 10 security recommendations. However, as hobby and startup projects, we do not currently maintain: • ISO 27001 certification • SOC 2 compliance • PCI DSS certification (payment processing handled by third-party providers) • Formal third-party security audits • We follow industry best practices on a voluntary basis and continuously improve our security posture."
                },
                {
                    icon: "ContactSupport",
                    title: "Security Contact & Reporting",
                    content: `For security concerns, incidents, or questions: • Security Email: ${emailConfig.security} • General Contact: ${emailConfig.contact} • Response Time: Best effort, typically within 48-72 hours for general issues • Note: This is a hobby/startup project without 24/7 support or dedicated security team • We appreciate responsible disclosure and will address security issues as resources permit`
                }
            ]),
            Version: "2.0.0",
            ProductIDs: [],
            Status: "published",
            EffectiveDate: "2024-12-21",
            PublishDate: "2024-12-21",
            Metadata: {
                Description: "Comprehensive security policies including data breach response protocol and user protection measures",
                Keywords: ["security", "encryption", "vulnerability", "compliance", "data breach", "incident response"],
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
            Info: <Info />,
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
            VerifiedUser: <VerifiedUser />,
            ChildCare: <ChildCare />,
            Delete: <Delete />,
            Public: <Public />,
            MobileFriendly: <MobileFriendly />,
            Payment: <Payment />,
            Block: <Block />,
            Warning: <Warning />,
            PersonAdd: <PersonAdd />,
            CheckCircle: <CheckCircle />,
            Category: <Category />
        };
        return iconMap[iconName] || <Policy />;
    };

    // Parse sections from Content if available
    const sections: AgreementSection[] = agreement
        ? (() => {
              try {
                  return JSON.parse(agreement.Content);
              } catch {
                  return [];
              }
          })()
        : [];

    if (loading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ background: palette.background }}>
                <div className="text-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        style={{ color: palette.accent }}>
                        {getIcon()}
                    </motion.div>
                    <p
                        className={`${isApple ? "text-lg" : "text-xl font-medium"} mt-4`}
                        style={{ color: palette.textSecondary }}>
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
                style={{ background: palette.background }}>
                <div className="text-center max-w-md px-6">
                    <Info
                        className="text-6xl mb-4"
                        style={{ color: palette.textTertiary }}
                    />
                    <h1
                        className={`${isApple ? "text-2xl font-bold" : "text-3xl font-black"} mb-4`}
                        style={{ color: palette.textPrimary }}>
                        Agreement Not Found
                    </h1>
                    <p
                        className={`${isApple ? "text-base" : "text-lg"} mb-6`}
                        style={{ color: palette.textSecondary }}>
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
                            whileTap={{ scale: 0.95 }}>
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
            }}>
            {/* Header */}
            <div
                className="border-b"
                style={{
                    borderColor: palette.border,
                    background: isApple ? (isDark ? "rgba(28, 28, 30, 0.8)" : "rgba(255, 255, 255, 0.8)") : palette.surface,
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)"
                }}>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                    <Link href="/sitemap">
                        <motion.button
                            className={`${isApple ? "text-sm" : "text-base"} font-medium mb-6 flex items-center gap-2`}
                            style={{ color: palette.accent }}
                            whileHover={{ x: -4 }}>
                            <ArrowBack />
                            Back to Sitemap
                        </motion.button>
                    </Link>

                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}>
                        <div className="flex items-start gap-4 mb-6">
                            <div
                                className={`${isApple ? "p-4 rounded-xl" : "p-5 rounded-2xl"}`}
                                style={{
                                    background: `${palette.accent}15`,
                                    color: palette.accent
                                }}>
                                {getIcon()}
                            </div>
                            <div className="flex-1">
                                <h1
                                    className={`${isApple ? "text-3xl sm:text-4xl font-bold" : "text-4xl sm:text-5xl font-black"} mb-2`}
                                    style={{ color: palette.textPrimary }}>
                                    {agreement.Title}
                                </h1>
                                {agreement.Metadata?.Description && (
                                    <p
                                        className={`${isApple ? "text-base sm:text-lg" : "text-lg sm:text-xl font-medium"}`}
                                        style={{
                                            color: palette.textSecondary
                                        }}>
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
                                    style={{ color: palette.textSecondary }}>
                                    Version {agreement.Version}
                                </span>
                            </div>
                            {agreement.EffectiveDate && (
                                <div className="flex items-center gap-2">
                                    <CalendarToday style={{ color: palette.textTertiary }} />
                                    <span
                                        className={`${isApple ? "text-sm" : "text-base"}`}
                                        style={{
                                            color: palette.textSecondary
                                        }}>
                                        Effective: {new Date(agreement.EffectiveDate).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                            {agreement.products && agreement.products.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <Category
                                        style={{
                                            color: palette.textTertiary
                                        }}
                                    />
                                    <span
                                        className={`${isApple ? "text-sm" : "text-base"}`}
                                        style={{
                                            color: palette.textSecondary
                                        }}>
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
                        transition={{ duration: 0.5, delay: 0.1 }}>
                        <h2
                            className={`${isApple ? "text-xl font-bold" : "text-2xl font-black"} mb-4`}
                            style={{ color: palette.textPrimary }}>
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
                                    }}>
                                    <div className="flex items-center gap-3">
                                        {product.Icon && (
                                            <div
                                                className={`${isApple ? "p-2 rounded-lg" : "p-3 rounded-xl"}`}
                                                style={{
                                                    background: `${palette.accent}15`,
                                                    color: palette.accent
                                                }}>
                                                <span className="text-xl">{product.Icon}</span>
                                            </div>
                                        )}
                                        <div>
                                            <h3
                                                className={`${isApple ? "text-base font-semibold" : "text-lg font-bold"}`}
                                                style={{
                                                    color: palette.textPrimary
                                                }}>
                                                {product.Name}
                                            </h3>
                                            <span
                                                className={`${isApple ? "text-xs" : "text-sm"} uppercase`}
                                                style={{
                                                    color: palette.textTertiary
                                                }}>
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
                        transition={{ duration: 0.5, delay: 0.2 }}>
                        <div
                            className={`${isApple ? "p-6 sm:p-8 rounded-xl" : "p-8 sm:p-10 rounded-2xl"}`}
                            style={{
                                background: palette.surface,
                                border: `1px solid ${palette.border}`
                            }}>
                            <p
                                className={`${isApple ? "text-base leading-relaxed" : "text-lg font-medium leading-relaxed"}`}
                                style={{ color: palette.textSecondary }}>
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
                            transition={{
                                duration: 0.6,
                                delay: 0.3 + index * 0.1
                            }}>
                            <div
                                className={`${isApple ? "p-6 sm:p-8 rounded-xl" : "p-8 sm:p-10 rounded-2xl"}`}
                                style={{
                                    background: palette.surface,
                                    border: `1px solid ${palette.border}`
                                }}>
                                <div className="flex items-start gap-4">
                                    <div
                                        className={`${isApple ? "p-3 rounded-xl text-2xl" : "p-4 rounded-2xl text-3xl"} flex-shrink-0`}
                                        style={{
                                            background: palette.accentSubtle,
                                            color: palette.accent
                                        }}>
                                        {getIconComponent(section.icon)}
                                    </div>
                                    <div className="flex-1">
                                        <h2
                                            className={`${isApple ? "text-xl sm:text-2xl font-bold" : "text-2xl sm:text-3xl font-black"} mb-3`}
                                            style={{
                                                color: palette.textPrimary
                                            }}>
                                            {section.title}
                                        </h2>
                                        <div
                                            className={`${isApple ? "text-sm sm:text-base leading-relaxed" : "text-base sm:text-lg font-medium leading-relaxed"}`}
                                            style={{
                                                color: palette.textSecondary
                                            }}>
                                            {section.content.split("•").map((part, idx) => {
                                                if (idx === 0) {
                                                    // First part (before any bullet)
                                                    return part.trim() ? (
                                                        <p
                                                            key={idx}
                                                            className="mb-2">
                                                            {part.trim()}
                                                        </p>
                                                    ) : null;
                                                }
                                                // Bullet points
                                                return (
                                                    <div
                                                        key={idx}
                                                        className="flex gap-2 mt-1.5 ml-1">
                                                        <span
                                                            style={{
                                                                color: palette.accent
                                                            }}
                                                            className="font-bold">
                                                            •
                                                        </span>
                                                        <span className="flex-1">{part.trim()}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
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
                    transition={{ duration: 0.5, delay: 0.3 }}>
                    <p
                        className={`${isApple ? "text-sm" : "text-base"}`}
                        style={{ color: palette.textTertiary }}>
                        Last updated: {new Date(agreement.PublishDate || agreement.EffectiveDate || "").toLocaleDateString()}
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
