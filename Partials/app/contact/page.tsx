/**
 * Contact Page
 * Redesigned with dual-theme support
 */

"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { useDesignTheme } from "../../Hooks/useDesignTheme";
import { LiquidGlassCard, LiquidGlassButton } from "../../Components/LiquidGlass";
import { OneUICard, OneUIButton } from "../../Components/OneUI";
import {
    Email,
    GitHub,
    LinkedIn,
    LocationOn,
    Send,
    CheckCircle,
    Error as ErrorIcon,
    Phone,
    Language,
    Schedule,
    Business,
    Code,
    AttachMoney,
    CalendarMonth
} from "@mui/icons-material";
import { Axios } from "../../Utils/Axios";
import { Config } from "../../Config";
import Link from "next/link";

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

function ContactContent() {
    const { designTheme, palette } = useDesignTheme();
    const isApple = designTheme === "apple";
    const Card = isApple ? LiquidGlassCard : OneUICard;
    const Button = isApple ? LiquidGlassButton : OneUIButton;

    const [formData, setFormData] = useState<ContactFormData>({
        name: "",
        email: "",
        subject: "",
        message: "",
        projectType: "general",
        budget: "",
        timeline: "",
        company: ""
    });

    const [status, setStatus] = useState<FormStatus>({
        type: "idle",
        message: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus({ type: "loading", message: "Sending message..." });

        try {
            const response = await Axios.post("/api/contact", formData);
            
            if (response.data.Status === 1) {
                setStatus({
                    type: "success",
                    message: "Message sent successfully! I'll get back to you soon."
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
            } else {
                setStatus({
                    type: "error",
                    message: response.data.Message || "Failed to send message. Please try again."
                });
            }
        } catch (error) {
            setStatus({
                type: "error",
                message: "Failed to send message. Please try again later."
            });
        }

        setTimeout(() => {
            setStatus({ type: "idle", message: "" });
        }, 5000);
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const contactMethods = [
        {
            icon: <Email />,
            label: "Email",
            value: Config.Env.CONTACT_EMAIL,
            href: `mailto:${Config.Env.CONTACT_EMAIL}`,
            description: "Best for detailed inquiries"
        },
        {
            icon: <GitHub />,
            label: "GitHub",
            value: "@Meetbhingradiya",
            href: "https://github.com/MeetBhingradiya",
            description: "Check out my projects"
        },
        {
            icon: <LinkedIn />,
            label: "LinkedIn",
            value: "Meet Bhingradiya",
            href: "https://www.linkedin.com/in/meetbhingradiya/",
            description: "Professional network"
        },
        {
            icon: <LocationOn />,
            label: "Location",
            value: "Gujarat, India",
            href: null,
            description: "Available remotely"
        }
    ];

    const projectTypes = [
        { value: "general", label: "General Inquiry", icon: <Email /> },
        { value: "freelance", label: "Freelance Project", icon: <Code /> },
        { value: "consulting", label: "Consulting", icon: <Business /> },
        { value: "fulltime", label: "Full-time Opportunity", icon: <Schedule /> },
        { value: "collaboration", label: "Collaboration", icon: <Language /> }
    ];

    const availability = [
        { label: "Response Time", value: "< 24 hours", icon: <Schedule /> },
        { label: "Availability", value: "Open to opportunities", icon: <CheckCircle /> },
        { label: "Time Zone", value: "IST (UTC+5:30)", icon: <Language /> }
    ];

    return (
        <>
            <main
                className="min-h-screen py-24"
                style={{ background: palette.background }}
            >
                <div className="max-w-7xl mx-auto px-6">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-12 text-center"
                    >
                        <h1
                            className={`${isApple ? "text-5xl md:text-6xl font-bold" : "text-6xl md:text-7xl font-black"} mb-4`}
                            style={{ color: palette.textPrimary }}
                        >
                            Get In Touch
                        </h1>
                        <p
                            className={`${isApple ? "text-lg" : "text-xl font-medium"} max-w-2xl mx-auto`}
                            style={{ color: palette.textSecondary }}
                        >
                            Have a project in mind or want to collaborate? I&apos;d love to hear from you. 
                            Let&apos;s build something amazing together!
                        </p>
                    </motion.div>

                    {/* Availability Cards */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="grid md:grid-cols-3 gap-4 mb-12"
                    >
                        {availability.map((item, index) => (
                            <Card
                                key={item.label}
                                className={isApple ? "p-6" : "p-8"}
                                intensity={isApple ? "medium" : undefined}
                                elevated={!isApple}
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className={`${isApple ? "p-3 rounded-xl" : "p-4 rounded-2xl"}`}
                                        style={{
                                            background: palette.accentSubtle,
                                            color: palette.accent
                                        }}
                                    >
                                        {item.icon}
                                    </div>
                                    <div>
                                        <p
                                            className={`${isApple ? "text-sm" : "text-base font-semibold"}`}
                                            style={{ color: palette.textSecondary }}
                                        >
                                            {item.label}
                                        </p>
                                        <p
                                            className={`${isApple ? "text-lg font-bold" : "text-xl font-black"}`}
                                            style={{ color: palette.textPrimary }}
                                        >
                                            {item.value}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </motion.div>

                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Contact Form */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <Card
                                className={isApple ? "p-8" : "p-10"}
                                intensity={isApple ? "strong" : undefined}
                                elevated={!isApple}
                            >
                                <h2
                                    className={`${isApple ? "text-2xl font-bold" : "text-3xl font-black"} mb-6`}
                                    style={{ color: palette.textPrimary }}
                                >
                                    Send Me a Message
                                </h2>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Name */}
                                    <div>
                                        <label
                                            className={`block ${isApple ? "text-sm font-medium" : "text-base font-bold"} mb-2`}
                                            style={{ color: palette.textSecondary }}
                                        >
                                            Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className={`w-full ${isApple ? "px-4 py-3 rounded-xl" : "px-5 py-4 rounded-2xl"} outline-none transition-all`}
                                            style={{
                                                background: palette.surfaceSecondary,
                                                color: palette.textPrimary,
                                                border: `2px solid ${palette.border}`
                                            }}
                                            placeholder="Your name"
                                        />
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label
                                            className={`block ${isApple ? "text-sm font-medium" : "text-base font-bold"} mb-2`}
                                            style={{ color: palette.textSecondary }}
                                        >
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className={`w-full ${isApple ? "px-4 py-3 rounded-xl" : "px-5 py-4 rounded-2xl"} outline-none transition-all`}
                                            style={{
                                                background: palette.surfaceSecondary,
                                                color: palette.textPrimary,
                                                border: `2px solid ${palette.border}`
                                            }}
                                            placeholder="your.email@example.com"
                                        />
                                    </div>

                                    {/* Company (Optional) */}
                                    <div>
                                        <label
                                            className={`block ${isApple ? "text-sm font-medium" : "text-base font-bold"} mb-2`}
                                            style={{ color: palette.textSecondary }}
                                        >
                                            Company (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            name="company"
                                            value={formData.company}
                                            onChange={handleChange}
                                            className={`w-full ${isApple ? "px-4 py-3 rounded-xl" : "px-5 py-4 rounded-2xl"} outline-none transition-all`}
                                            style={{
                                                background: palette.surfaceSecondary,
                                                color: palette.textPrimary,
                                                border: `2px solid ${palette.border}`
                                            }}
                                            placeholder="Your company name"
                                        />
                                    </div>

                                    {/* Project Type */}
                                    <div>
                                        <label
                                            className={`block ${isApple ? "text-sm font-medium" : "text-base font-bold"} mb-2`}
                                            style={{ color: palette.textSecondary }}
                                        >
                                            Project Type *
                                        </label>
                                        <select
                                            name="projectType"
                                            value={formData.projectType}
                                            onChange={handleChange}
                                            required
                                            className={`w-full ${isApple ? "px-4 py-3 rounded-xl" : "px-5 py-4 rounded-2xl"} outline-none cursor-pointer transition-all`}
                                            style={{
                                                background: palette.surfaceSecondary,
                                                color: palette.textPrimary,
                                                border: `2px solid ${palette.border}`
                                            }}
                                        >
                                            {projectTypes.map(type => (
                                                <option key={type.value} value={type.value}>
                                                    {type.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Budget & Timeline */}
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label
                                                className={`block ${isApple ? "text-sm font-medium" : "text-base font-bold"} mb-2`}
                                                style={{ color: palette.textSecondary }}
                                            >
                                                Budget (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                name="budget"
                                                value={formData.budget}
                                                onChange={handleChange}
                                                className={`w-full ${isApple ? "px-4 py-3 rounded-xl" : "px-5 py-4 rounded-2xl"} outline-none transition-all`}
                                                style={{
                                                    background: palette.surfaceSecondary,
                                                    color: palette.textPrimary,
                                                    border: `2px solid ${palette.border}`
                                                }}
                                                placeholder="$5,000 - $10,000"
                                            />
                                        </div>
                                        <div>
                                            <label
                                                className={`block ${isApple ? "text-sm font-medium" : "text-base font-bold"} mb-2`}
                                                style={{ color: palette.textSecondary }}
                                            >
                                                Timeline (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                name="timeline"
                                                value={formData.timeline}
                                                onChange={handleChange}
                                                className={`w-full ${isApple ? "px-4 py-3 rounded-xl" : "px-5 py-4 rounded-2xl"} outline-none transition-all`}
                                                style={{
                                                    background: palette.surfaceSecondary,
                                                    color: palette.textPrimary,
                                                    border: `2px solid ${palette.border}`
                                                }}
                                                placeholder="2-3 months"
                                            />
                                        </div>
                                    </div>

                                    {/* Subject */}
                                    <div>
                                        <label
                                            className={`block ${isApple ? "text-sm font-medium" : "text-base font-bold"} mb-2`}
                                            style={{ color: palette.textSecondary }}
                                        >
                                            Subject *
                                        </label>
                                        <input
                                            type="text"
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            required
                                            className={`w-full ${isApple ? "px-4 py-3 rounded-xl" : "px-5 py-4 rounded-2xl"} outline-none transition-all`}
                                            style={{
                                                background: palette.surfaceSecondary,
                                                color: palette.textPrimary,
                                                border: `2px solid ${palette.border}`
                                            }}
                                            placeholder="What's your project about?"
                                        />
                                    </div>

                                    {/* Message */}
                                    <div>
                                        <label
                                            className={`block ${isApple ? "text-sm font-medium" : "text-base font-bold"} mb-2`}
                                            style={{ color: palette.textSecondary }}
                                        >
                                            Message *
                                        </label>
                                        <textarea
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            required
                                            rows={6}
                                            className={`w-full ${isApple ? "px-4 py-3 rounded-xl" : "px-5 py-4 rounded-2xl"} outline-none transition-all resize-none`}
                                            style={{
                                                background: palette.surfaceSecondary,
                                                color: palette.textPrimary,
                                                border: `2px solid ${palette.border}`
                                            }}
                                            placeholder="Tell me more about your project..."
                                        />
                                    </div>

                                    {/* Status Messages */}
                                    {status.type !== "idle" && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`${isApple ? "p-4 rounded-xl" : "p-5 rounded-2xl"} flex items-center gap-3`}
                                            style={{
                                                background:
                                                    status.type === "success"
                                                        ? "rgba(34, 197, 94, 0.1)"
                                                        : status.type === "error"
                                                        ? "rgba(239, 68, 68, 0.1)"
                                                        : palette.surfaceSecondary,
                                                border: `1px solid ${
                                                    status.type === "success"
                                                        ? "rgba(34, 197, 94, 0.3)"
                                                        : status.type === "error"
                                                        ? "rgba(239, 68, 68, 0.3)"
                                                        : palette.border
                                                }`
                                            }}
                                        >
                                            {status.type === "success" && (
                                                <CheckCircle style={{ color: "rgb(34, 197, 94)" }} />
                                            )}
                                            {status.type === "error" && (
                                                <ErrorIcon style={{ color: "rgb(239, 68, 68)" }} />
                                            )}
                                            {status.type === "loading" && (
                                                <div
                                                    className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                                                    style={{ borderColor: palette.accent }}
                                                />
                                            )}
                                            <span
                                                className={isApple ? "text-sm" : "text-base font-semibold"}
                                                style={{
                                                    color:
                                                        status.type === "success"
                                                            ? "rgb(34, 197, 94)"
                                                            : status.type === "error"
                                                            ? "rgb(239, 68, 68)"
                                                            : palette.textPrimary
                                                }}
                                            >
                                                {status.message}
                                            </span>
                                        </motion.div>
                                    )}

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={status.type === "loading"}
                                        className={`w-full flex items-center justify-center gap-2 ${isApple ? "px-6 py-3 rounded-full" : "px-8 py-4 rounded-full"} font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
                                        style={{
                                            background: palette.accent,
                                            color: palette.textOnAccent,
                                            border: "none",
                                            boxShadow: `0 4px 16px ${palette.liquidGlow}`
                                        }}
                                    >
                                        <Send />
                                        <span>{status.type === "loading" ? "Sending..." : "Send Message"}</span>
                                    </button>
                                </form>
                            </Card>
                        </motion.div>

                        {/* Contact Info */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="space-y-6"
                        >
                            {/* Quick Contact Methods */}
                            <Card
                                className={isApple ? "p-8" : "p-10"}
                                intensity={isApple ? "medium" : undefined}
                                elevated={!isApple}
                            >
                                <h2
                                    className={`${isApple ? "text-2xl font-bold" : "text-3xl font-black"} mb-6`}
                                    style={{ color: palette.textPrimary }}
                                >
                                    Contact Methods
                                </h2>
                                <div className="space-y-4">
                                    {contactMethods.map((method, index) => (
                                        <motion.div
                                            key={method.label}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                                        >
                                            {method.href ? (
                                                <a
                                                    href={method.href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`block ${isApple ? "p-4 rounded-xl" : "p-5 rounded-2xl"} transition-all hover:scale-105`}
                                                    style={{
                                                        background: palette.surfaceSecondary,
                                                        border: `1px solid ${palette.border}`
                                                    }}
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div
                                                            className={`${isApple ? "p-2 rounded-lg" : "p-3 rounded-xl"}`}
                                                            style={{
                                                                background: palette.accentSubtle,
                                                                color: palette.accent
                                                            }}
                                                        >
                                                            {method.icon}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h3
                                                                className={`${isApple ? "text-base font-bold" : "text-lg font-black"} mb-1`}
                                                                style={{ color: palette.textPrimary }}
                                                            >
                                                                {method.label}
                                                            </h3>
                                                            <p
                                                                className={`${isApple ? "text-sm" : "text-base font-medium"} mb-1`}
                                                                style={{ color: palette.accent }}
                                                            >
                                                                {method.value}
                                                            </p>
                                                            <p
                                                                className={`${isApple ? "text-xs" : "text-sm font-medium"}`}
                                                                style={{ color: palette.textTertiary }}
                                                            >
                                                                {method.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </a>
                                            ) : (
                                                <div
                                                    className={`block ${isApple ? "p-4 rounded-xl" : "p-5 rounded-2xl"}`}
                                                    style={{
                                                        background: palette.surfaceSecondary,
                                                        border: `1px solid ${palette.border}`
                                                    }}
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div
                                                            className={`${isApple ? "p-2 rounded-lg" : "p-3 rounded-xl"}`}
                                                            style={{
                                                                background: palette.accentSubtle,
                                                                color: palette.accent
                                                            }}
                                                        >
                                                            {method.icon}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h3
                                                                className={`${isApple ? "text-base font-bold" : "text-lg font-black"} mb-1`}
                                                                style={{ color: palette.textPrimary }}
                                                            >
                                                                {method.label}
                                                            </h3>
                                                            <p
                                                                className={`${isApple ? "text-sm" : "text-base font-medium"} mb-1`}
                                                                style={{ color: palette.textSecondary }}
                                                            >
                                                                {method.value}
                                                            </p>
                                                            <p
                                                                className={`${isApple ? "text-xs" : "text-sm font-medium"}`}
                                                                style={{ color: palette.textTertiary }}
                                                            >
                                                                {method.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </Card>

                            {/* FAQ Card */}
                            <Card
                                className={isApple ? "p-8" : "p-10"}
                                intensity={isApple ? "medium" : undefined}
                                elevated={!isApple}
                            >
                                <h2
                                    className={`${isApple ? "text-2xl font-bold" : "text-3xl font-black"} mb-6`}
                                    style={{ color: palette.textPrimary }}
                                >
                                    Quick Info
                                </h2>
                                <div className="space-y-4">
                                    <div>
                                        <h3
                                            className={`${isApple ? "text-sm font-bold" : "text-base font-black"} mb-2`}
                                            style={{ color: palette.textPrimary }}
                                        >
                                            Response Time
                                        </h3>
                                        <p
                                            className={`${isApple ? "text-sm" : "text-base font-medium"}`}
                                            style={{ color: palette.textSecondary }}
                                        >
                                            I typically respond within 24 hours during weekdays. For urgent matters, 
                                            please email me directly.
                                        </p>
                                    </div>
                                    <div>
                                        <h3
                                            className={`${isApple ? "text-sm font-bold" : "text-base font-black"} mb-2`}
                                            style={{ color: palette.textPrimary }}
                                        >
                                            Project Inquiries
                                        </h3>
                                        <p
                                            className={`${isApple ? "text-sm" : "text-base font-medium"}`}
                                            style={{ color: palette.textSecondary }}
                                        >
                                            I&apos;m currently open to freelance projects and full-time opportunities. 
                                            Let&apos;s discuss how we can work together!
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </main>
        </>
    );
}

export default function ContactPage() {
    return <ContactContent />;
}
