/**
 * Contact Page
 * Full-featured contact page with form, templates, and contact methods
 * Supports both Apple Liquid Glass and Samsung One UI 7 themes
 */

"use client";

import React, { useState, useEffect, Suspense } from "react";
import { motion } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { LiquidGlassCard, LiquidGlassButton } from "@Components/Atoms/LiquidGlass/index";
import { OneUICard, OneUIButton, OneUIBadge } from "@Components/Atoms/OneUI/index";
import { Send, CheckCircle, Error as ErrorIcon, Business, AttachMoney, Schedule, ArrowForward, AccessTime } from "@mui/icons-material";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { contactMethods, quickActions, contactTemplates, personalInfo } from "@Static/Contact_Data";
import { CustomSelect } from "@Components/Atoms/CustomSelect";
import ResumeDownloadModal from "@Components/Tools/ResumeDownloadModal";

interface ContactFormData {
    name: string;
    email: string;
    subject: string;
    message: string;
    projectType: string;
    budget?: string;
    timeline?: string;
    company?: string;
}

interface FormStatus {
    type: "idle" | "loading" | "success" | "error";
    message: string;
}

function ContactPageContent() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const searchParams = useSearchParams();
    const template = searchParams.get("template") as keyof typeof contactTemplates | null;

    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [currentTime, setCurrentTime] = useState(new Date());
    const [hoveredCard, setHoveredCard] = useState<string | null>(null);
    const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
    const [formData, setFormData] = useState<ContactFormData>({
        name: "",
        email: "",
        subject: template && contactTemplates[template] ? contactTemplates[template].subject : "",
        message: template && contactTemplates[template] ? contactTemplates[template].defaultMessage : "",
        projectType: template || "general",
        budget: "",
        timeline: "",
        company: ""
    });
    const [status, setStatus] = useState<FormStatus>({
        type: "idle",
        message: ""
    });

    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({
                x: (e.clientX / window.innerWidth) * 100,
                y: (e.clientY / window.innerHeight) * 100
            });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    useEffect(() => {
        if (template && contactTemplates[template]) {
            setFormData((prev) => ({
                ...prev,
                subject: contactTemplates[template].subject,
                message: contactTemplates[template].defaultMessage,
                projectType: template
            }));
        }
    }, [template]);

    const getLocalTime = () => {
        return currentTime.toLocaleTimeString("en-US", {
            hour12: true,
            hour: "2-digit",
            minute: "2-digit",
            timeZone: personalInfo.timezone
        });
    };

    const isBusinessHours = () => {
        const indiaHour = new Date().toLocaleString("en-US", {
            hour: "numeric",
            hour12: false,
            timeZone: personalInfo.timezone
        });
        const hour = parseInt(indiaHour);
        return hour >= personalInfo.workingHours.start && hour <= personalInfo.workingHours.end;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus({ type: "loading", message: "Sending message..." });

        try {
            // Build message with metadata if provided
            let fullMessage = formData.message.trim();
            const metaLines: string[] = [];
            if (formData.projectType && formData.projectType !== "general") metaLines.push(`Project Type: ${formData.projectType}`);
            if (formData.company?.trim()) metaLines.push(`Company: ${formData.company.trim()}`);
            if (formData.budget?.trim()) metaLines.push(`Budget: ${formData.budget.trim()}`);
            if (formData.timeline?.trim()) metaLines.push(`Timeline: ${formData.timeline.trim()}`);
            
            if (metaLines.length > 0) {
                fullMessage += `\n\n--- Project Details ---\n${metaLines.join("\n")}`;
            }

            const res = await fetch("/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    email: formData.email.trim(),
                    subject: formData.subject.trim(),
                    message: fullMessage,
                    services: formData.projectType && formData.projectType !== "general" ? [formData.projectType] : undefined
                })
            });

            const json = await res.json();

            if (res.ok && json.success) {
                setStatus({
                    type: "success",
                    message: json.message || "Message sent successfully! I'll get back to you shortly."
                });
                setFormData({
                    name: "",
                    email: "",
                    subject: "",
                    message: "",
                    projectType: "general",
                    budget: "",
                    timeline: "",
                    company: ""
                });
            } else if (res.status === 429) {
                setStatus({
                    type: "error",
                    message: json.error || "Rate limit reached. Please wait before sending another message."
                });
            } else {
                setStatus({
                    type: "error",
                    message: json.error || "Failed to send message. Please try again or email me directly."
                });
            }
        } catch (error: any) {
            setStatus({
                type: "error",
                message: "Network error. Please check your connection and try again."
            });
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const Card = isApple ? LiquidGlassCard : OneUICard;
    const Button = isApple ? LiquidGlassButton : OneUIButton;

    return (
        <main
            className="relative min-h-screen py-24 md:py-32 overflow-hidden"
            style={{
                background: isApple
                    ? `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, ${palette.accentSubtle} 0%, ${palette.background} 50%)`
                    : palette.background
            }}>
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {isApple ? (
                    <>
                        <motion.div
                            className="absolute w-[600px] h-[600px] rounded-full opacity-15"
                            style={{
                                background: `radial-gradient(circle, ${palette.accent} 0%, transparent 70%)`,
                                filter: "blur(100px)",
                                top: "10%",
                                right: "-15%"
                            }}
                            animate={{
                                scale: [1, 1.3, 1],
                                opacity: [0.15, 0.25, 0.15]
                            }}
                            transition={{
                                duration: 12,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                        <motion.div
                            className="absolute w-[500px] h-[500px] rounded-full opacity-10"
                            style={{
                                background: `radial-gradient(circle, ${palette.accentLight} 0%, transparent 70%)`,
                                filter: "blur(80px)",
                                bottom: "5%",
                                left: "-10%"
                            }}
                            animate={{
                                scale: [1.2, 1, 1.2],
                                opacity: [0.1, 0.2, 0.1]
                            }}
                            transition={{
                                duration: 14,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                    </>
                ) : (
                    <div
                        className="absolute inset-0 opacity-[0.02]"
                        style={{
                            backgroundImage: `
                                linear-gradient(${palette.textPrimary} 1px, transparent 1px),
                                linear-gradient(90deg, ${palette.textPrimary} 1px, transparent 1px)
                            `,
                            backgroundSize: "100px 100px"
                        }}
                    />
                )}
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6">
                {/* Page Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16">
                    <motion.div
                        className="inline-flex items-center gap-2 mb-6"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}>
                        {isApple ? (
                            <div
                                className="px-4 py-2 rounded-full"
                                style={{
                                    background: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                                    backdropFilter: "blur(20px)"
                                }}>
                                <span
                                    className="text-sm font-medium"
                                    style={{ color: palette.accent }}>
                                    Let's Work Together
                                </span>
                            </div>
                        ) : (
                            <OneUIBadge variant="accent">Let's Work Together</OneUIBadge>
                        )}
                    </motion.div>

                    <h1
                        className={`${isApple ? "text-5xl md:text-6xl font-semibold" : "text-5xl md:text-6xl font-black"} mb-6`}
                        style={{ color: palette.textPrimary }}>
                        Get In Touch
                    </h1>
                    <p
                        className={`${isApple ? "text-xl" : "text-2xl font-medium"} max-w-3xl mx-auto mb-6`}
                        style={{ color: palette.textSecondary }}>
                        Have a project in mind? Need technical consultation? Or just want to say hi? I'd love to hear from you.
                    </p>

                    {/* Availability Status */}
                    <motion.div
                        className="flex items-center justify-center gap-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}>
                        <div className="flex items-center gap-2">
                            <div
                                className="w-2.5 h-2.5 rounded-full animate-pulse"
                                style={{
                                    backgroundColor: isBusinessHours() ? "#34C759" : "#FF9500"
                                }}
                            />
                            <span
                                className="text-sm"
                                style={{ color: palette.textTertiary }}>
                                {isBusinessHours() ? "Currently Available" : "Away"}
                            </span>
                        </div>
                        <div
                            className="w-px h-4"
                            style={{ backgroundColor: palette.border }}
                        />
                        <div className="flex items-center gap-2">
                            <AccessTime
                                className="text-sm"
                                style={{ color: palette.textTertiary }}
                            />
                            <span
                                className="text-sm"
                                style={{ color: palette.textTertiary }}>
                                {getLocalTime()} IST
                            </span>
                        </div>
                    </motion.div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
                    {/* Contact Form - Left Column (2/3) */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="lg:col-span-2">
                        <Card
                            intensity={isApple ? "strong" : undefined}
                            elevated={!isApple}>
                            <h2
                                className={`${isApple ? "text-2xl font-semibold" : "text-2xl font-black"} mb-6`}
                                style={{ color: palette.textPrimary }}>
                                Send Me a Message
                            </h2>

                            <form
                                onSubmit={handleSubmit}
                                className="space-y-6">
                                {/* Name and Email Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label
                                            className={`block ${isApple ? "text-sm font-medium" : "text-sm font-bold"} mb-2`}
                                            style={{
                                                color: palette.textSecondary
                                            }}>
                                            Your Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 rounded-2xl border-none outline-none"
                                            style={{
                                                background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
                                                color: palette.textPrimary,
                                                fontSize: "16px"
                                            }}
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div>
                                        <label
                                            className={`block ${isApple ? "text-sm font-medium" : "text-sm font-bold"} mb-2`}
                                            style={{
                                                color: palette.textSecondary
                                            }}>
                                            Your Email *
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 rounded-2xl border-none outline-none"
                                            style={{
                                                background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
                                                color: palette.textPrimary,
                                                fontSize: "16px"
                                            }}
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                </div>

                                {/* Company and Project Type Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label
                                            className={`block ${isApple ? "text-sm font-medium" : "text-sm font-bold"} mb-2`}
                                            style={{
                                                color: palette.textSecondary
                                            }}>
                                            Company (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            name="company"
                                            value={formData.company}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 rounded-2xl border-none outline-none"
                                            style={{
                                                background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
                                                color: palette.textPrimary,
                                                fontSize: "16px"
                                            }}
                                            placeholder="Your Company"
                                        />
                                    </div>
                                    <div>
                                        <label
                                            className={`block ${isApple ? "text-sm font-medium" : "text-sm font-bold"} mb-2`}
                                            style={{
                                                color: palette.textSecondary
                                            }}>
                                            Project Type *
                                        </label>
                                        <CustomSelect
                                            value={formData.projectType}
                                            onChange={(v) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    projectType: v
                                                }))
                                            }
                                            options={[
                                                {
                                                    value: "general",
                                                    label: "General Inquiry"
                                                },
                                                {
                                                    value: "staff-engineer",
                                                    label: "Hiring - Full Stack Role"
                                                },
                                                {
                                                    value: "collaboration",
                                                    label: "Project Collaboration"
                                                },
                                                {
                                                    value: "technical-consultation",
                                                    label: "Technical Consultation"
                                                },
                                                {
                                                    value: "custom-development",
                                                    label: "Custom Development"
                                                },
                                                {
                                                    value: "security-audit",
                                                    label: "Security Audit"
                                                },
                                                {
                                                    value: "mentorship",
                                                    label: "Mentorship"
                                                }
                                            ]}
                                            placeholder="Select Project Type"
                                        />
                                    </div>
                                </div>

                                {/* Budget and Timeline Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label
                                            className={`block ${isApple ? "text-sm font-medium" : "text-sm font-bold"} mb-2`}
                                            style={{
                                                color: palette.textSecondary
                                            }}>
                                            Budget (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            name="budget"
                                            value={formData.budget}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 rounded-2xl border-none outline-none"
                                            style={{
                                                background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
                                                color: palette.textPrimary,
                                                fontSize: "16px"
                                            }}
                                            placeholder="$5,000 - $10,000"
                                        />
                                    </div>
                                    <div>
                                        <label
                                            className={`block ${isApple ? "text-sm font-medium" : "text-sm font-bold"} mb-2`}
                                            style={{
                                                color: palette.textSecondary
                                            }}>
                                            Timeline (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            name="timeline"
                                            value={formData.timeline}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 rounded-2xl border-none outline-none"
                                            style={{
                                                background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
                                                color: palette.textPrimary,
                                                fontSize: "16px"
                                            }}
                                            placeholder="2-3 months"
                                        />
                                    </div>
                                </div>

                                {/* Subject */}
                                <div>
                                    <label
                                        className={`block ${isApple ? "text-sm font-medium" : "text-sm font-bold"} mb-2`}
                                        style={{
                                            color: palette.textSecondary
                                        }}>
                                        Subject *
                                    </label>
                                    <input
                                        type="text"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-3 rounded-2xl border-none outline-none"
                                        style={{
                                            background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
                                            color: palette.textPrimary,
                                            fontSize: "16px"
                                        }}
                                        placeholder="How can I help you?"
                                    />
                                </div>

                                {/* Message */}
                                <div>
                                    <label
                                        className={`block ${isApple ? "text-sm font-medium" : "text-sm font-bold"} mb-2`}
                                        style={{
                                            color: palette.textSecondary
                                        }}>
                                        Message *
                                    </label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        required
                                        rows={6}
                                        className="w-full px-4 py-3 rounded-2xl border-none outline-none resize-none"
                                        style={{
                                            background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
                                            color: palette.textPrimary,
                                            fontSize: "16px"
                                        }}
                                        placeholder="Tell me about your project..."
                                    />
                                </div>

                                {/* Status Message */}
                                {status.type !== "idle" && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex items-center gap-3 p-4 rounded-2xl ${
                                            status.type === "success"
                                                ? "bg-green-500/10"
                                                : status.type === "error"
                                                  ? "bg-red-500/10"
                                                  : "bg-blue-500/10"
                                        }`}>
                                        {status.type === "success" && <CheckCircle style={{ color: "#34C759" }} />}
                                        {status.type === "error" && <ErrorIcon style={{ color: "#FF3B30" }} />}
                                        <span
                                            style={{
                                                color: palette.textPrimary
                                            }}>
                                            {status.message}
                                        </span>
                                    </motion.div>
                                )}

                                {/* Submit Button */}
                                <Button
                                    variant="primary"
                                    className="w-full"
                                    icon={<Send />}>
                                    {status.type === "loading" ? "Sending..." : "Send Message"}
                                </Button>
                            </form>
                        </Card>
                    </motion.div>

                    {/* Contact Methods - Right Column (1/3) */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="space-y-6">
                        <h3
                            className={`${isApple ? "text-xl font-medium" : "text-xl font-bold"} mb-6`}
                                            style={{ color: palette.textPrimary }}>
                            Other Ways to Connect
                        </h3>

                        {contactMethods.map((method, index) => {
                            const cardContent = (
                                <Card
                                    className="cursor-pointer group"
                                    intensity={isApple ? "subtle" : undefined}
                                    elevated={!isApple}>
                                    <div className="flex items-start gap-3">
                                        <motion.div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                            style={{
                                                background: hoveredCard === method.id ? method.color : `${method.color}20`,
                                                color: hoveredCard === method.id ? "#FFFFFF" : method.color
                                            }}
                                            animate={{
                                                scale: hoveredCard === method.id ? 1.05 : 1
                                            }}
                                            transition={{ duration: 0.2 }}>
                                            {method.icon}
                                        </motion.div>
                                        <div className="flex-grow">
                                            <h4
                                                className={`${isApple ? "font-medium text-sm" : "font-bold text-sm"} mb-1`}
                                                style={{
                                                    color: palette.textPrimary
                                                }}>
                                                {method.title}
                                            </h4>
                                            {method.responseTime && (
                                                <p
                                                    className="text-xs"
                                                    style={{
                                                        color: palette.textTertiary
                                                    }}>
                                                    {method.responseTime}
                                                </p>
                                            )}
                                        </div>
                                        <ArrowForward
                                            className="text-sm transition-transform group-hover:translate-x-1"
                                            style={{
                                                color: palette.textTertiary
                                            }}
                                        />
                                    </div>
                                </Card>
                            );

                            return (
                                <motion.div
                                    key={method.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        duration: 0.5,
                                        delay: 0.4 + index * 0.1
                                    }}
                                    onMouseEnter={() => setHoveredCard(method.id)}
                                    onMouseLeave={() => setHoveredCard(null)}>
                                    {method.id === "resume" ? (
                                        <div onClick={() => setIsResumeModalOpen(true)} className="cursor-pointer h-full">
                                            {cardContent}
                                        </div>
                                    ) : (
                                        <Link
                                            href={method.link}
                                            target={method.link.startsWith("http") ? "_blank" : undefined}
                                            rel={method.link.startsWith("http") ? "noopener noreferrer" : undefined}>
                                            {cardContent}
                                        </Link>
                                    )}
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>

                {/* Support Hub Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.45 }}
                    className="mb-8">
                    <div
                        className="rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
                        style={{
                            background: isApple
                                ? `linear-gradient(135deg, ${palette.accent}18 0%, ${palette.accent}08 100%)`
                                : `${palette.accent}12`,
                            border: `1px solid ${palette.accent}30`,
                            backdropFilter: isApple ? "blur(20px)" : "none"
                        }}>
                        <div>
                            <p
                                className={`${isApple ? "text-lg font-semibold" : "text-xl font-black"} mb-1`}
                                style={{ color: palette.textPrimary }}>
                                Need product support?
                            </p>
                            <p
                                className="text-sm"
                                style={{ color: palette.textSecondary }}>
                                Visit the Help Center for FAQs, or open a tracked support ticket for faster assistance.
                            </p>
                        </div>
                        <div className="flex gap-3 flex-shrink-0">
                            <Link href="/support">
                                <motion.button
                                    whileTap={{ scale: 0.96 }}
                                    className="px-4 py-2.5 rounded-xl text-sm font-bold"
                                    style={{
                                        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                                        color: palette.textPrimary,
                                        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`
                                    }}>
                                    Help Center
                                </motion.button>
                            </Link>
                            <Link href="/support/tickets/new">
                                <motion.button
                                    whileTap={{ scale: 0.96 }}
                                    className="px-4 py-2.5 rounded-xl text-sm font-bold"
                                    style={{
                                        background: palette.accent,
                                        color: "#fff"
                                    }}>
                                    Open a Ticket
                                </motion.button>
                            </Link>
                        </div>
                    </div>
                </motion.div>

                {/* Quick Templates */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}>
                    <h3
                        className={`${isApple ? "text-xl font-medium" : "text-xl font-bold"} mb-6 text-center`}
                        style={{ color: palette.textPrimary }}>
                        Quick Templates
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        {quickActions.map((action, index) => (
                            <motion.div
                                key={action.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.5,
                                    delay: 0.6 + index * 0.1
                                }}>
                                <Link href={action.action}>
                                    <Card
                                        className="h-full cursor-pointer group"
                                        intensity={isApple ? "subtle" : undefined}
                                        elevated={!isApple}>
                                        <div className="flex flex-col h-full">
                                            <div
                                                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                                                style={{
                                                    background: `${action.color}20`,
                                                    color: action.color
                                                }}>
                                                {action.icon}
                                            </div>
                                            <h4
                                                className={`${isApple ? "font-medium text-sm" : "font-bold text-sm"} mb-2`}
                                                style={{
                                                    color: palette.textPrimary
                                                }}>
                                                {action.title}
                                            </h4>
                                            <p
                                                className="text-xs flex-grow leading-relaxed"
                                                style={{
                                                    color: palette.textSecondary
                                                }}>
                                                {action.description}
                                            </p>
                                            <div
                                                className="flex items-center gap-1 mt-3 text-xs font-medium"
                                                style={{ color: action.color }}>
                                                Use Template
                                                <ArrowForward className="text-xs transition-transform group-hover:translate-x-1" />
                                            </div>
                                        </div>
                                    </Card>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>

            <ResumeDownloadModal isOpen={isResumeModalOpen} onClose={() => setIsResumeModalOpen(false)} />
        </main>
    );
}

export default function ContactPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
                        <p>Loading contact page...</p>
                    </div>
                </div>
            }>
            <ContactPageContent />
        </Suspense>
    );
}
