"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import Link from "next/link";
import {
    Home,
    Work,
    Article,
    Timeline,
    Build,
    Dashboard,
    Settings,
    ContactMail,
    Person,
    Policy,
    Description,
    AdminPanelSettings,
    Search,
    ExpandMore,
    ExpandLess,
    OpenInNew,
    Language,
    GridView,
    ViewList,
    ViewModule,
    Palette,
    Lock,
    Image,
    DataObject,
    VpnKey,
    PictureAsPdf,
    QrCode,
    Task,
    Tag,
    Password,
    School,
    CloudUpload,
    PhotoCamera,
    Tune,
    Group,
    AccountTree,
    Security,
    Key,
    Devices,
    PhonelinkLock,
    ErrorOutline,
    LockReset,
    WorkHistory,
    Star,
    Badge,
    Map,
    MenuBook,
    Code,
    BorderColor,
    Flag,
    BarChart,
    TrendingUp,
    ShoppingCart,
    Payment,
    Receipt,
    SupportAgent,
    ConfirmationNumber,
    Diversity1,
    Apps,
    HelpOutline,
    ToggleOn,
    EmojiEvents,
    MoneyOff,
    Shop
} from "@mui/icons-material";

interface SitemapLink {
    label: string;
    href: string;
    icon: React.ReactNode;
    description?: string;
    children?: SitemapLink[];
}

interface SitemapSection {
    title: string;
    icon: React.ReactNode;
    description: string;
    links: SitemapLink[];
}

// Define your sitemap structure here - just add pages to this object!
const sitemapData: SitemapSection[] = [
    {
        title: "Main",
        icon: <Home />,
        description: "Primary pages and main sections of the website",
        links: [
            {
                label: "Home",
                href: "/",
                icon: <Home />,
                description: "Homepage and landing page"
            },
            {
                label: "Projects",
                href: "/projects",
                icon: <Work />,
                description: "Portfolio of projects and work"
            },
            {
                label: "Blog",
                href: "/blogs",
                icon: <Article />,
                description: "Articles, tutorials, and thoughts",
                children: [
                    {
                        label: "New Blog",
                        href: "/blogs/new",
                        icon: <BorderColor />,
                        description: "Write a new blog post"
                    }
                ]
            },
            {
                label: "Timeline",
                href: "/timeline",
                icon: <Timeline />,
                description: "Professional journey and milestones"
            },
            {
                label: "Experience",
                href: "/experience",
                icon: <WorkHistory />,
                description: "Work experience and career history"
            },
            {
                label: "Contact",
                href: "/contact",
                icon: <ContactMail />,
                description: "Get in touch with me"
            },
            {
                label: "Dashboard",
                href: "/dashboard",
                icon: <Dashboard />,
                description: "Personal dashboard and analytics"
            },
            {
                label: "Profile",
                href: "/profile",
                icon: <Person />,
                description: "Public profile page"
            },
            {
                label: "Sitemap",
                href: "/sitemap",
                icon: <Map />,
                description: "Full site navigation map"
            }
        ]
    },
    {
        title: "Developer Tools",
        icon: <Build />,
        description: "Developer tools and utilities for coding and productivity",
        links: [
            {
                label: "Tools Hub",
                href: "/tools",
                icon: <Build />,
                description: "Collection of development utilities"
            },
            {
                label: "Colour Picker",
                href: "/tools/colour",
                icon: <Palette />,
                description: "Color picker and converter"
            },
            {
                label: "Encrypt / Decrypt",
                href: "/tools/encrypt",
                icon: <Lock />,
                description: "Text encryption and decryption"
            },
            {
                label: "Image Tools",
                href: "/tools/image",
                icon: <Image />,
                description: "Image manipulation and conversion"
            },
            {
                label: "JSON Formatter",
                href: "/tools/json",
                icon: <DataObject />,
                description: "Format, validate and minify JSON"
            },
            {
                label: "JWT Decoder",
                href: "/tools/jwt",
                icon: <VpnKey />,
                description: "Decode and inspect JWT tokens"
            },
            {
                label: "Markdown Editor",
                href: "/tools/markdown",
                icon: <MenuBook />,
                description: "Live markdown editor and preview"
            },
            {
                label: "Password Generator",
                href: "/tools/password",
                icon: <Password />,
                description: "Secure password generator"
            },
            {
                label: "PDF Tools",
                href: "/tools/pdf",
                icon: <PictureAsPdf />,
                description: "PDF viewing and manipulation"
            },
            {
                label: "QR Code",
                href: "/tools/qr",
                icon: <QrCode />,
                description: "Generate and scan QR codes"
            },
            {
                label: "RegExp Tester",
                href: "/tools/regexp",
                icon: <Code />,
                description: "Test and debug regular expressions"
            },
            {
                label: "Todo List",
                href: "/tools/todo",
                icon: <Task />,
                description: "Quick todo list manager"
            },
            {
                label: "UUID Generator",
                href: "/tools/uuid",
                icon: <Tag />,
                description: "Generate UUIDs / GUIDs"
            },
            {
                label: "Instagram Tools",
                href: "/tools/instagram",
                icon: <Image />,
                description: "Instagram-related utilities"
            }
        ]
    },
    {
        title: "Productivity Suite",
        icon: <Task />,
        description: "Productivity management tools - tasks, habits, goals, and reminders",
        links: [
            {
                label: "Productivity Hub",
                href: "/tools/productivity",
                icon: <Task />,
                description: "Full productivity management suite"
            },
            {
                label: "Tasks",
                href: "/tools/productivity/tasks",
                icon: <Task />,
                description: "Create and manage your tasks"
            },
            {
                label: "Habits",
                href: "/tools/productivity/habits",
                icon: <Star />,
                description: "Build and track daily habits"
            },
            {
                label: "Goals",
                href: "/tools/productivity/goals",
                icon: <Flag />,
                description: "Set and achieve your goals"
            },
            {
                label: "Reminders",
                href: "/tools/productivity/reminders",
                icon: <Tune />,
                description: "Get notified on important tasks"
            }
        ]
    },
    {
        title: "Trade Journal",
        icon: <BarChart />,
        description: "Trading journal and analytics for tracking trades",
        links: [
            {
                label: "Trade Journal",
                href: "/trade-journal",
                icon: <BarChart />,
                description: "Your trading journal and logs"
            },
            {
                label: "New Trade",
                href: "/trade-journal/new",
                icon: <BorderColor />,
                description: "Log a new trade"
            },
            {
                label: "Analytics",
                href: "/trade-journal/analytics",
                icon: <TrendingUp />,
                description: "View trading analytics and statistics"
            }
        ]
    },
    {
        title: "Shop & Commerce",
        icon: <Shop />,
        description: "Shop, products, orders, and checkout",
        links: [
            {
                label: "Shop",
                href: "/shop",
                icon: <Shop />,
                description: "Browse products and shop"
            },
            {
                label: "Shopping Cart",
                href: "/shop/cart",
                icon: <ShoppingCart />,
                description: "View and manage your shopping cart"
            },
            {
                label: "Checkout",
                href: "/shop/checkout",
                icon: <Payment />,
                description: "Complete your purchase"
            },
            {
                label: "My Orders",
                href: "/shop/orders",
                icon: <Receipt />,
                description: "View your order history"
            },
            {
                label: "Refunds",
                href: "/shop/refunds",
                icon: <MoneyOff />,
                description: "Request or check refund status"
            }
        ]
    },
    {
        title: "Support",
        icon: <SupportAgent />,
        description: "Support tickets and employee hub",
        links: [
            {
                label: "Support Center",
                href: "/support",
                icon: <SupportAgent />,
                description: "Get help and support"
            },
            {
                label: "Support Tickets",
                href: "/support/tickets",
                icon: <ConfirmationNumber />,
                description: "View and manage support tickets"
            },
            {
                label: "New Ticket",
                href: "/support/tickets/new",
                icon: <BorderColor />,
                description: "Create a new support ticket"
            },
            {
                label: "Employee Hub",
                href: "/employee",
                icon: <Diversity1 />,
                description: "Employee-only information and resources"
            }
        ]
    },
    {
        title: "Profile & Settings",
        icon: <Settings />,
        description: "Profile, settings, and account management",
        links: [
            {
                label: "Settings",
                href: "/settings",
                icon: <Settings />,
                description: "Account preferences and configuration",
                children: [
                    {
                        label: "Profile Settings",
                        href: "/settings/profile",
                        icon: <Person />,
                        description: "Update your personal information"
                    },
                    {
                        label: "Linked Accounts",
                        href: "/settings/linked-accounts",
                        icon: <AccountTree />,
                        description: "Manage connected OAuth accounts"
                    },
                    {
                        label: "CDN Settings",
                        href: "/settings/cdn",
                        icon: <CloudUpload />,
                        description: "Configure CDN and file uploads"
                    },
                    {
                        label: "Security",
                        href: "/settings/security",
                        icon: <Security />,
                        description: "Password and security options",
                        children: [
                            {
                                label: "Passkeys",
                                href: "/settings/security/passkeys",
                                icon: <Key />,
                                description: "Manage passkey authentication"
                            },
                            {
                                label: "Sessions",
                                href: "/settings/security/sessions",
                                icon: <Devices />,
                                description: "View and manage active sessions"
                            },
                            {
                                label: "Two-Factor Auth",
                                href: "/settings/security/two-factor",
                                icon: <PhonelinkLock />,
                                description: "Set up two-factor authentication"
                            }
                        ]
                    }
                ]
            }
        ]
    },
    {
        title: "Authentication",
        icon: <Lock />,
        description: "Sign in, sign up, and account recovery",
        links: [
            {
                label: "Sign In",
                href: "/auth/signin",
                icon: <Person />,
                description: "Log in to your account"
            },
            {
                label: "Sign Up",
                href: "/auth/signup",
                icon: <Person />,
                description: "Create a new account"
            },
            {
                label: "Forgot Password",
                href: "/auth/forgot-password",
                icon: <LockReset />,
                description: "Reset your password"
            },
            {
                label: "Auth Error",
                href: "/auth/error",
                icon: <ErrorOutline />,
                description: "Authentication error page"
            }
        ]
    },
    {
        title: "Admin Panel",
        icon: <AdminPanelSettings />,
        description: "Administrative management pages (Admin Only)",
        links: [
            {
                label: "Admin Dashboard",
                href: "/admin",
                icon: <AdminPanelSettings />,
                description: "Main admin control panel"
            },
            {
                label: "Core Management",
                href: "#",
                icon: <Build />,
                description: "Manage core system features",
                children: [
                    {
                        label: "Users",
                        href: "/admin/users",
                        icon: <Group />,
                        description: "Manage registered users"
                    },
                    {
                        label: "Roles & Permissions",
                        href: "/admin/roles",
                        icon: <Security />,
                        description: "Configure roles and permissions"
                    },
                    {
                        label: "Features",
                        href: "/admin/features",
                        icon: <ToggleOn />,
                        description: "Manage feature flags"
                    },
                    {
                        label: "Tool Settings",
                        href: "/admin/tool-settings",
                        icon: <Tune />,
                        description: "Configure tool visibility and defaults"
                    },
                    {
                        label: "AI Providers",
                        href: "/admin/ai-providers",
                        icon: <Code />,
                        description: "Configure AI provider integrations"
                    }
                ]
            },
            {
                label: "Content Management",
                href: "#",
                icon: <Article />,
                description: "Manage portfolio and content",
                children: [
                    {
                        label: "Blogs",
                        href: "/admin/blogs",
                        icon: <Article />,
                        description: "Manage blog posts"
                    },
                    {
                        label: "Projects",
                        href: "/admin/projects",
                        icon: <Work />,
                        description: "Manage portfolio projects"
                    },
                    {
                        label: "Skills",
                        href: "/admin/skills",
                        icon: <Star />,
                        description: "Manage skills and technologies"
                    },
                    {
                        label: "Education",
                        href: "/admin/education",
                        icon: <School />,
                        description: "Manage education entries"
                    },
                    {
                        label: "Experience",
                        href: "/admin/experience",
                        icon: <WorkHistory />,
                        description: "Manage work experience entries"
                    },
                    {
                        label: "Certificates",
                        href: "/admin/certificates",
                        icon: <Badge />,
                        description: "Manage certificates and credentials"
                    },
                    {
                        label: "Test Scores",
                        href: "/admin/test-scores",
                        icon: <EmojiEvents />,
                        description: "Manage academic test scores"
                    },
                    {
                        label: "Resume",
                        href: "/admin/resume",
                        icon: <Description />,
                        description: "Manage resume content"
                    },
                    {
                        label: "Sitemap",
                        href: "/admin/sitemap",
                        icon: <Map />,
                        description: "Manage sitemap entries"
                    }
                ]
            },
            {
                label: "Shop Management",
                href: "#",
                icon: <Shop />,
                description: "Manage shop and orders",
                children: [
                    {
                        label: "Products",
                        href: "/admin/products",
                        icon: <Tag />,
                        description: "Manage shop products"
                    },
                    {
                        label: "Orders",
                        href: "/admin/orders",
                        icon: <Receipt />,
                        description: "View and manage orders"
                    },
                    {
                        label: "Refunds",
                        href: "/admin/refunds",
                        icon: <MoneyOff />,
                        description: "Manage refund requests"
                    },
                    {
                        label: "FAQ",
                        href: "/admin/faq",
                        icon: <HelpOutline />,
                        description: "Manage FAQ entries"
                    }
                ]
            },
            {
                label: "Support Management",
                href: "#",
                icon: <SupportAgent />,
                description: "Manage support tickets",
                children: [
                    {
                        label: "Tickets",
                        href: "/admin/tickets",
                        icon: <ConfirmationNumber />,
                        description: "Manage support tickets"
                    }
                ]
            },
            {
                label: "CDN Management",
                href: "#",
                icon: <CloudUpload />,
                description: "Manage CDN and assets",
                children: [
                    {
                        label: "CDN Assets",
                        href: "/admin/cdn",
                        icon: <CloudUpload />,
                        description: "Manage CDN assets and files"
                    },
                    {
                        label: "CDN Requests",
                        href: "/admin/cdn/applications",
                        icon: <Apps />,
                        description: "View CDN access requests"
                    },
                    {
                        label: "API Keys",
                        href: "/admin/cdn/api-keys",
                        icon: <VpnKey />,
                        description: "Manage CDN API keys"
                    }
                ]
            },
            {
                label: "System Management",
                href: "#",
                icon: <Settings />,
                description: "System maintenance and configuration",
                children: [
                    {
                        label: "Maintenance",
                        href: "/admin/maintenance",
                        icon: <Settings />,
                        description: "Site maintenance mode control"
                    },
                    {
                        label: "Immich Access",
                        href: "/admin/immich-access",
                        icon: <PhotoCamera />,
                        description: "Manage Immich SSO access"
                    }
                ]
            }
        ]
    },
    {
        title: "Legal & Agreements",
        icon: <Policy />,
        description: "Terms, policies, and legal information",
        links: [
            {
                label: "Privacy Policy",
                href: "/privacy",
                icon: <Policy />,
                description: "Privacy policy and data protection"
            },
            {
                label: "Terms of Service",
                href: "/terms",
                icon: <Description />,
                description: "Terms and conditions of use"
            },
            {
                label: "Covered Products Privacy",
                href: "/agreements/covered-products-privacy",
                icon: <Policy />,
                description: "Privacy policy for covered products"
            },
            {
                label: "Covered Products Terms",
                href: "/agreements/covered-products-terms",
                icon: <Description />,
                description: "Terms of service for covered products"
            },
            {
                label: "Product Security Policy",
                href: "/agreements/security",
                icon: <Security />,
                description: "Security policies for products"
            }
        ]
    },
    {
        title: "System Pages",
        icon: <Settings />,
        description: "System and special pages",
        links: [
            {
                label: "Maintenance",
                href: "/maintenance",
                icon: <Settings />,
                description: "Site maintenance mode page"
            },
            {
                label: "Immich SSO",
                href: "/immich-sso",
                icon: <PhotoCamera />,
                description: "Immich single sign-on integration"
            },
            {
                label: "Developer CDN",
                href: "/developer/cdn",
                icon: <Code />,
                description: "Developer CDN management"
            },
            {
                label: "Sitemap XML",
                href: "/sitemap.xml",
                icon: <Language />,
                description: "Machine-readable XML sitemap"
            }
        ]
    }
];

type ViewMode = "grid" | "list" | "compact";

function SitemapItem({
    link,
    isApple,
    palette,
    level = 0,
    viewMode = "list"
}: {
    link: SitemapLink;
    isApple: boolean;
    palette: any;
    level?: number;
    viewMode?: ViewMode;
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasChildren = link.children && link.children.length > 0;

    // Grid View (Card Style)
    if (viewMode === "grid") {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3 }}
            >
                <Link href={link.href}>
                    <motion.div
                        className={`${isApple ? "p-5 rounded-xl" : "p-6 rounded-2xl"} h-full relative overflow-hidden group cursor-pointer`}
                        style={{
                            background: isApple
                                ? `linear-gradient(135deg, ${palette.backgroundElevated} 0%, ${palette.backgroundSecondary} 100%)`
                                : `linear-gradient(135deg, ${palette.surface} 0%, ${palette.backgroundSecondary} 100%)`,
                            border: `1px solid ${palette.border}`,
                            backdropFilter: isApple ? "blur(20px) saturate(180%)" : "none",
                            WebkitBackdropFilter: isApple ? "blur(20px) saturate(180%)" : "none"
                        }}
                        whileHover={{
                            scale: 1.05,
                            y: -8,
                            borderColor: palette.accent,
                            boxShadow: isApple
                                ? `0 12px 40px ${palette.accent}25`
                                : `0 12px 32px ${palette.accent}25`
                        }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* Hover Gradient */}
                        <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{
                                background: `linear-gradient(135deg, ${palette.accent}15 0%, transparent 100%)`
                            }}
                        />

                        <div className="relative z-10 flex flex-col items-center text-center gap-4">
                            {/* Icon */}
                            <div
                                className={`${isApple ? "p-4 rounded-xl" : "p-5 rounded-2xl"}`}
                                style={{
                                    background: `${palette.accent}15`,
                                    color: palette.accent
                                }}
                            >
                                {link.icon}
                            </div>

                            {/* Content */}
                            <div>
                                <h3
                                    className={`${isApple ? "text-lg font-semibold" : "text-xl font-bold"} mb-2`}
                                    style={{ color: palette.textPrimary }}
                                >
                                    {link.label}
                                </h3>
                                {link.description && (
                                    <p
                                        className={`${isApple ? "text-sm" : "text-base"} mb-3 line-clamp-2`}
                                        style={{ color: palette.textSecondary }}
                                    >
                                        {link.description}
                                    </p>
                                )}
                                <p
                                    className={`${isApple ? "text-xs" : "text-sm"} font-mono`}
                                    style={{ color: palette.textTertiary }}
                                >
                                    {link.href}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </Link>
            </motion.div>
        );
    }

    // Compact View (Minimal)
    if (viewMode === "compact") {
        return (
            <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.2 }}
            >
                <Link href={link.href}>
                    <motion.div
                        className={`${isApple ? "p-3 rounded-lg" : "p-4 rounded-xl"} relative overflow-hidden group cursor-pointer`}
                        style={{
                            background: palette.surface,
                            border: `1px solid ${palette.border}`
                        }}
                        whileHover={{
                            borderColor: palette.accent,
                            backgroundColor: `${palette.accent}08`
                        }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="relative z-10 flex items-center gap-3">
                            {/* Icon */}
                            <div
                                className={`${isApple ? "p-1.5" : "p-2"} rounded-lg flex-shrink-0`}
                                style={{
                                    background: `${palette.accent}15`,
                                    color: palette.accent
                                }}
                            >
                                {link.icon}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <h3
                                    className={`${isApple ? "text-sm font-semibold" : "text-base font-bold"} truncate`}
                                    style={{ color: palette.textPrimary }}
                                >
                                    {link.label}
                                </h3>
                                <p
                                    className={`${isApple ? "text-xs" : "text-sm"} font-mono truncate`}
                                    style={{ color: palette.textTertiary }}
                                >
                                    {link.href}
                                </p>
                            </div>

                            <OpenInNew
                                className="text-sm opacity-0 group-hover:opacity-50 transition-opacity flex-shrink-0"
                                style={{ color: palette.textSecondary }}
                            />
                        </div>
                    </motion.div>
                </Link>
            </motion.div>
        );
    }

    // List View (Default - Detailed)
    return (
        <div className={level > 0 ? "ml-6" : ""}>
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3 }}
            >
                <Link href={link.href}>
                    <motion.div
                        className={`${isApple ? "p-4 rounded-xl" : "p-5 rounded-2xl"} mb-3 relative overflow-hidden group`}
                        style={{
                            background: isApple
                                ? `linear-gradient(135deg, ${palette.backgroundElevated} 0%, ${palette.backgroundSecondary} 100%)`
                                : `linear-gradient(135deg, ${palette.surface} 0%, ${palette.backgroundSecondary} 100%)`,
                            border: `1px solid ${palette.border}`,
                            backdropFilter: isApple ? "blur(20px) saturate(180%)" : "none",
                            WebkitBackdropFilter: isApple ? "blur(20px) saturate(180%)" : "none"
                        }}
                        whileHover={{
                            scale: 1.02,
                            borderColor: palette.accent,
                            boxShadow: isApple
                                ? `0 8px 32px ${palette.accent}20`
                                : `0 8px 24px ${palette.accent}20`
                        }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* Hover Gradient */}
                        <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{
                                background: `linear-gradient(135deg, ${palette.accent}10 0%, transparent 100%)`
                            }}
                        />

                        <div className="relative z-10 flex items-start gap-4">
                            {/* Icon */}
                            <div
                                className={`${isApple ? "p-2.5 rounded-lg" : "p-3 rounded-xl"} flex-shrink-0`}
                                style={{
                                    background: `${palette.accent}15`,
                                    color: palette.accent
                                }}
                            >
                                {link.icon}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3
                                        className={`${isApple ? "text-base font-semibold" : "text-lg font-bold"}`}
                                        style={{ color: palette.textPrimary }}
                                    >
                                        {link.label}
                                    </h3>
                                    <OpenInNew
                                        className="text-sm opacity-0 group-hover:opacity-50 transition-opacity"
                                        style={{ color: palette.textSecondary }}
                                    />
                                </div>
                                {link.description && (
                                    <p
                                        className={`${isApple ? "text-sm" : "text-base"}`}
                                        style={{ color: palette.textSecondary }}
                                    >
                                        {link.description}
                                    </p>
                                )}
                                <p
                                    className={`${isApple ? "text-xs" : "text-sm"} mt-2 font-mono`}
                                    style={{ color: palette.textTertiary }}
                                >
                                    {link.href}
                                </p>
                            </div>

                            {/* Expand Button for Children */}
                            {hasChildren && (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setIsExpanded(!isExpanded);
                                    }}
                                    className="flex-shrink-0"
                                    style={{ color: palette.textSecondary }}
                                >
                                    {isExpanded ? <ExpandLess /> : <ExpandMore />}
                                </button>
                            )}
                        </div>
                    </motion.div>
                </Link>
            </motion.div>

            {/* Child Links */}
            {hasChildren && isExpanded && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {link.children?.map((child, index) => (
                        <SitemapItem
                            key={index}
                            link={child}
                            isApple={isApple}
                            palette={palette}
                            level={level + 1}
                            viewMode={viewMode}
                        />
                    ))}
                </motion.div>
            )}
        </div>
    );
}

export default function SitemapContent() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<ViewMode>("list");
    const [sortBy, setSortBy] = useState<"name" | "section">("section");

    // Filter and sort sitemap based on search and sort options
    const filteredSitemap = searchQuery
        ? sitemapData.map(section => ({
            ...section,
            links: section.links.filter(link =>
                link.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                link.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                link.href.toLowerCase().includes(searchQuery.toLowerCase())
            )
        })).filter(section => section.links.length > 0)
        : sitemapData;

    // Sort links alphabetically if needed
    const sortedSitemap = sortBy === "name"
        ? filteredSitemap.map(section => ({
            ...section,
            links: [...section.links].sort((a, b) => a.label.localeCompare(b.label))
        }))
        : filteredSitemap;

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
                <div className="max-w-6xl mx-auto px-6 py-12">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1
                            className={`${isApple ? "text-4xl md:text-5xl font-bold" : "text-5xl md:text-6xl font-black"} mb-4`}
                            style={{ color: palette.textPrimary }}
                        >
                            Sitemap
                        </h1>
                        <p
                            className={`${isApple ? "text-lg" : "text-xl font-medium"} max-w-2xl`}
                            style={{ color: palette.textSecondary }}
                        >
                            Navigate through all pages and sections of the website. Use the search to quickly find what you're looking for.
                        </p>
                    </motion.div>

                    {/* Search Bar & Controls */}
                    <motion.div
                        className="mt-8 space-y-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        {/* Search Input */}
                        <div
                            className={`${isApple ? "rounded-xl" : "rounded-2xl"} overflow-hidden`}
                            style={{
                                background: palette.surface,
                                border: `1px solid ${palette.border}`
                            }}
                        >
                            <div className="flex items-center gap-3 px-4 py-3">
                                <Search style={{ color: palette.textSecondary }} />
                                <input
                                    type="text"
                                    placeholder="Search pages..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`flex-1 bg-transparent outline-none ${isApple ? "text-base" : "text-lg"}`}
                                    style={{ color: palette.textPrimary }}
                                />
                            </div>
                        </div>

                        {/* View Controls */}
                        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                            {/* View Mode Switcher */}
                            <div className="flex items-center gap-2">
                                <span
                                    className={`${isApple ? "text-sm" : "text-base"} font-medium mr-2`}
                                    style={{ color: palette.textSecondary }}
                                >
                                    View:
                                </span>
                                {[
                                    { mode: "grid" as ViewMode, icon: <GridView />, label: "Grid" },
                                    { mode: "list" as ViewMode, icon: <ViewList />, label: "List" },
                                    { mode: "compact" as ViewMode, icon: <ViewModule />, label: "Compact" }
                                ].map(({ mode, icon, label }) => (
                                    <motion.button
                                        key={mode}
                                        onClick={() => setViewMode(mode)}
                                        className={`${isApple ? "p-2.5 rounded-lg" : "p-3 rounded-xl"} relative overflow-hidden`}
                                        style={{
                                            background: viewMode === mode
                                                ? `${palette.accent}20`
                                                : palette.surface,
                                            border: `1px solid ${viewMode === mode ? palette.accent : palette.border}`,
                                            color: viewMode === mode ? palette.accent : palette.textSecondary
                                        }}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        title={label}
                                    >
                                        {icon}
                                    </motion.button>
                                ))}
                            </div>

                            {/* Sort Controls */}
                            <div className="flex items-center gap-2">
                                <span
                                    className={`${isApple ? "text-sm" : "text-base"} font-medium mr-2`}
                                    style={{ color: palette.textSecondary }}
                                >
                                    Sort:
                                </span>
                                <div className="flex gap-2">
                                    {[
                                        { key: "section" as const, label: "By Section" },
                                        { key: "name" as const, label: "Alphabetical" }
                                    ].map(({ key, label }) => (
                                        <motion.button
                                            key={key}
                                            onClick={() => setSortBy(key)}
                                            className={`${isApple ? "px-3 py-2 text-sm rounded-lg" : "px-4 py-2.5 text-base rounded-xl"} font-medium whitespace-nowrap`}
                                            style={{
                                                background: sortBy === key
                                                    ? `${palette.accent}20`
                                                    : palette.surface,
                                                border: `1px solid ${sortBy === key ? palette.accent : palette.border}`,
                                                color: sortBy === key ? palette.accent : palette.textSecondary
                                            }}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            {label}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                {filteredSitemap.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16"
                    >
                        <Search
                            className="text-6xl mb-4 mx-auto"
                            style={{ color: palette.textTertiary }}
                        />
                        <p
                            className={`${isApple ? "text-lg" : "text-xl font-medium"}`}
                            style={{ color: palette.textSecondary }}
                        >
                            No pages found matching "{searchQuery}"
                        </p>
                    </motion.div>
                ) : (
                    <div className="space-y-8 sm:space-y-12">
                        {sortedSitemap.map((section, index) => (
                            <motion.section
                                key={section.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                {/* Section Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                                    <div
                                        className={`${isApple ? "p-3 rounded-xl" : "p-4 rounded-2xl"} w-fit`}
                                        style={{
                                            background: `${palette.accent}15`,
                                            color: palette.accent
                                        }}
                                    >
                                        {section.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h2
                                            className={`${isApple ? "text-xl sm:text-2xl font-bold" : "text-2xl sm:text-3xl font-black"}`}
                                            style={{ color: palette.textPrimary }}
                                        >
                                            {section.title}
                                        </h2>
                                        <p
                                            className={`${isApple ? "text-sm" : "text-base"}`}
                                            style={{ color: palette.textSecondary }}
                                        >
                                            {section.description}
                                        </p>
                                    </div>
                                    <div
                                        className={`${isApple ? "px-3 py-1.5 rounded-lg text-sm" : "px-4 py-2 rounded-xl text-base"} font-semibold w-fit`}
                                        style={{
                                            background: `${palette.accent}15`,
                                            color: palette.accent
                                        }}
                                    >
                                        {section.links.length} {section.links.length === 1 ? "page" : "pages"}
                                    </div>
                                </div>

                                {/* Section Links */}
                                <div
                                    className={
                                        viewMode === "grid"
                                            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
                                            : viewMode === "compact"
                                                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3"
                                                : "space-y-0"
                                    }
                                >
                                    {section.links.map((link, linkIndex) => (
                                        <SitemapItem
                                            key={linkIndex}
                                            link={link}
                                            isApple={isApple}
                                            palette={palette}
                                            viewMode={viewMode}
                                        />
                                    ))}
                                </div>
                            </motion.section>
                        ))}
                    </div>
                )}

                {/* Stats */}
                <motion.div
                    className="mt-12 sm:mt-16"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {/* Total Pages */}
                        <div
                            className={`${isApple ? "p-6 rounded-xl" : "p-8 rounded-2xl"} text-center`}
                            style={{
                                background: isApple
                                    ? `linear-gradient(135deg, ${palette.accent}15 0%, ${palette.accent}05 100%)`
                                    : `${palette.accent}10`,
                                border: `1px solid ${palette.accent}30`
                            }}
                        >
                            <p
                                className={`${isApple ? "text-3xl sm:text-4xl font-bold" : "text-4xl sm:text-5xl font-black"} mb-2`}
                                style={{ color: palette.accent }}
                            >
                                {sitemapData.reduce((acc, section) => acc + section.links.length, 0)}
                            </p>
                            <p
                                className={`${isApple ? "text-sm" : "text-base font-medium"}`}
                                style={{ color: palette.textSecondary }}
                            >
                                Total Pages
                            </p>
                        </div>

                        {/* Sections */}
                        <div
                            className={`${isApple ? "p-6 rounded-xl" : "p-8 rounded-2xl"} text-center`}
                            style={{
                                background: isApple
                                    ? `linear-gradient(135deg, ${palette.accent}15 0%, ${palette.accent}05 100%)`
                                    : `${palette.accent}10`,
                                border: `1px solid ${palette.accent}30`
                            }}
                        >
                            <p
                                className={`${isApple ? "text-3xl sm:text-4xl font-bold" : "text-4xl sm:text-5xl font-black"} mb-2`}
                                style={{ color: palette.accent }}
                            >
                                {sitemapData.length}
                            </p>
                            <p
                                className={`${isApple ? "text-sm" : "text-base font-medium"}`}
                                style={{ color: palette.textSecondary }}
                            >
                                Sections
                            </p>
                        </div>

                        {/* View Mode */}
                        <div
                            className={`${isApple ? "p-6 rounded-xl" : "p-8 rounded-2xl"} text-center`}
                            style={{
                                background: isApple
                                    ? `linear-gradient(135deg, ${palette.accent}15 0%, ${palette.accent}05 100%)`
                                    : `${palette.accent}10`,
                                border: `1px solid ${palette.accent}30`
                            }}
                        >
                            <div className="flex justify-center mb-2">
                                {viewMode === "grid" ? (
                                    <GridView className="text-3xl sm:text-4xl" style={{ color: palette.accent }} />
                                ) : viewMode === "list" ? (
                                    <ViewList className="text-3xl sm:text-4xl" style={{ color: palette.accent }} />
                                ) : (
                                    <ViewModule className="text-3xl sm:text-4xl" style={{ color: palette.accent }} />
                                )}
                            </div>
                            <p
                                className={`${isApple ? "text-sm" : "text-base font-medium"} capitalize`}
                                style={{ color: palette.textSecondary }}
                            >
                                {viewMode} View
                            </p>
                        </div>

                        {/* Filtered Results */}
                        <div
                            className={`${isApple ? "p-6 rounded-xl" : "p-8 rounded-2xl"} text-center`}
                            style={{
                                background: isApple
                                    ? `linear-gradient(135deg, ${palette.accent}15 0%, ${palette.accent}05 100%)`
                                    : `${palette.accent}10`,
                                border: `1px solid ${palette.accent}30`
                            }}
                        >
                            <p
                                className={`${isApple ? "text-3xl sm:text-4xl font-bold" : "text-4xl sm:text-5xl font-black"} mb-2`}
                                style={{ color: palette.accent }}
                            >
                                {sortedSitemap.reduce((acc, section) => acc + section.links.length, 0)}
                            </p>
                            <p
                                className={`${isApple ? "text-sm" : "text-base font-medium"}`}
                                style={{ color: palette.textSecondary }}
                            >
                                Showing
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
