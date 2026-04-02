"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { LiquidGlassCard, LiquidGlassButton } from "@Components/Atoms/LiquidGlass/index";
import { OneUICard, OneUIButton, OneUIBadge } from "@Components/Atoms/OneUI/index";
import { Schedule, Send, Email, CalendarMonth, ArrowForward, AccessTime } from "@mui/icons-material";
import Link from "next/link";
import { contactMethods, quickActions, services, personalInfo } from "@Static";

export default function ContactSection() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [currentTime, setCurrentTime] = useState(new Date());
    const [hoveredCard, setHoveredCard] = useState<string | null>(null);

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

    const getLocalTime = () => {
        return currentTime.toLocaleTimeString("en-US", {
            hour12: true,
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Kolkata"
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

    const Card = isApple ? LiquidGlassCard : OneUICard;
    const Button = isApple ? LiquidGlassButton : OneUIButton;

    return (
        <section
            id="contact"
            className="relative py-24 md:py-32 overflow-hidden"
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
                            className="absolute w-[500px] h-[500px] rounded-full opacity-15"
                            style={{
                                background: `radial-gradient(circle, ${palette.accent} 0%, transparent 70%)`,
                                filter: "blur(80px)",
                                top: "20%",
                                right: "-10%"
                            }}
                            animate={{
                                scale: [1, 1.3, 1],
                                opacity: [0.15, 0.25, 0.15]
                            }}
                            transition={{
                                duration: 10,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                        <motion.div
                            className="absolute w-[400px] h-[400px] rounded-full opacity-10"
                            style={{
                                background: `radial-gradient(circle, ${palette.accentLight} 0%, transparent 70%)`,
                                filter: "blur(60px)",
                                bottom: "10%",
                                left: "-5%"
                            }}
                            animate={{
                                scale: [1.2, 1, 1.2],
                                opacity: [0.1, 0.2, 0.1]
                            }}
                            transition={{
                                duration: 12,
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
                            backgroundSize: "80px 80px"
                        }}
                    />
                )}
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16">
                    <motion.div
                        className="inline-flex items-center gap-2 mb-6"
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
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
                                    Let's Connect
                                </span>
                            </div>
                        ) : (
                            <OneUIBadge variant="accent">Let's Connect</OneUIBadge>
                        )}
                    </motion.div>

                    <h2
                        className={`${isApple ? "text-4xl md:text-5xl font-semibold" : "text-4xl md:text-5xl font-black"} mb-4`}
                        style={{ color: palette.textPrimary }}>
                        Get In Touch
                    </h2>
                    <p
                        className={`${isApple ? "text-lg" : "text-xl font-medium"} max-w-2xl mx-auto`}
                        style={{ color: palette.textSecondary }}>
                        Have a project in mind, want to collaborate, or just say hello? I'd love to hear from you.
                    </p>

                    {/* Availability Status */}
                    <motion.div
                        className="flex items-center justify-center gap-4 mt-6"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
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

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="mb-20">
                    <h3
                        className={`${isApple ? "text-xl font-medium" : "text-xl font-bold"} mb-8 text-center`}
                        style={{ color: palette.textPrimary }}>
                        Looking to...
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        {quickActions.map((action, index) => (
                            <motion.div
                                key={action.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{
                                    duration: 0.5,
                                    delay: index * 0.1
                                }}>
                                <Link href={action.action}>
                                    <Card
                                        className="h-full cursor-pointer group"
                                        intensity={isApple ? "subtle" : undefined}
                                        elevated={!isApple}>
                                        <div className="flex flex-col h-full">
                                            <div
                                                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                                                style={{
                                                    background: `${action.color}20`,
                                                    color: action.color
                                                }}>
                                                {action.icon}
                                            </div>
                                            <h4
                                                className={`${isApple ? "font-medium text-base" : "font-bold"} mb-2`}
                                                style={{
                                                    color: palette.textPrimary
                                                }}>
                                                {action.title}
                                            </h4>
                                            <p
                                                className="text-sm flex-grow leading-relaxed"
                                                style={{
                                                    color: palette.textSecondary
                                                }}>
                                                {action.description}
                                            </p>
                                            <div
                                                className="flex items-center gap-1 mt-4 text-sm font-medium"
                                                style={{ color: action.color }}>
                                                Get Started
                                                <ArrowForward className="text-sm transition-transform group-hover:translate-x-1" />
                                            </div>
                                        </div>
                                    </Card>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Contact Methods */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mb-20">
                    <h3
                        className={`${isApple ? "text-xl font-medium" : "text-xl font-bold"} mb-8 text-center`}
                        style={{ color: palette.textPrimary }}>
                        Connect With Me
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {contactMethods.map((method, index) => (
                            <motion.div
                                key={method.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{
                                    duration: 0.5,
                                    delay: index * 0.08
                                }}
                                onMouseEnter={() => setHoveredCard(method.id)}
                                onMouseLeave={() => setHoveredCard(null)}>
                                <Link
                                    href={method.link}
                                    target={method.link.startsWith("http") ? "_blank" : undefined}
                                    rel={method.link.startsWith("http") ? "noopener noreferrer" : undefined}>
                                    <Card
                                        className="h-full cursor-pointer group"
                                        intensity={isApple ? "medium" : undefined}
                                        elevated={!isApple}>
                                        <div className="flex items-start gap-4">
                                            <motion.div
                                                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
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
                                                    className={`${isApple ? "font-medium" : "font-bold"} mb-1`}
                                                    style={{
                                                        color: palette.textPrimary
                                                    }}>
                                                    {method.title}
                                                </h4>
                                                <p
                                                    className="text-sm mb-2"
                                                    style={{
                                                        color: palette.textSecondary
                                                    }}>
                                                    {method.description}
                                                </p>
                                                {method.responseTime && (
                                                    <p
                                                        className="text-xs flex items-center gap-1"
                                                        style={{
                                                            color: palette.textTertiary
                                                        }}>
                                                        <Schedule className="text-xs" />
                                                        {method.responseTime}
                                                    </p>
                                                )}
                                            </div>
                                            <ArrowForward
                                                className="text-lg transition-transform group-hover:translate-x-1"
                                                style={{
                                                    color: palette.textTertiary
                                                }}
                                            />
                                        </div>
                                    </Card>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Services Section */}
                {/* <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="mb-20"
                >
                    <div className="text-center mb-10">
                        <h3
                            className={`${isApple ? "text-2xl font-semibold" : "text-2xl font-black"} mb-3`}
                            style={{ color: palette.textPrimary }}
                        >
                            Services & Pricing
                        </h3>
                        <p
                            className="text-sm"
                            style={{ color: palette.textSecondary }}
                        >
                            Transparent pricing for professional services
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {services.map((service, index) => (
                            <motion.div
                                key={service.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="relative"
                            >
                                {service.popular && (
                                    <div
                                        className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-4 py-1 rounded-full text-xs font-bold"
                                        style={{
                                            background: service.color,
                                            color: "#FFFFFF"
                                        }}
                                    >
                                        Most Popular
                                    </div>
                                )}
                                <Card
                                    className={`h-full ${service.popular ? `ring-2 ring-[${service.color}]` : ""}`}
                                    intensity={isApple ? (service.popular ? "strong" : "medium") : undefined}
                                    elevated={!isApple}
                                >
                                    <div className="flex flex-col h-full">
                                        <div
                                            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                                            style={{
                                                background: `${service.color}20`,
                                                color: service.color
                                            }}
                                        >
                                            {service.icon}
                                        </div>
                                        <h4
                                            className={`${isApple ? "text-lg font-medium" : "text-lg font-bold"} mb-2`}
                                            style={{ color: palette.textPrimary }}
                                        >
                                            {service.title}
                                        </h4>
                                        <p
                                            className="text-sm mb-4"
                                            style={{ color: palette.textSecondary }}
                                        >
                                            {service.description}
                                        </p>
                                        <div className="flex items-baseline gap-1 mb-4">
                                            <span
                                                className={`${isApple ? "text-3xl font-semibold" : "text-3xl font-black"}`}
                                                style={{ color: service.color }}
                                            >
                                                {service.price}
                                            </span>
                                            <span
                                                className="text-sm"
                                                style={{ color: palette.textTertiary }}
                                            >
                                                {service.duration}
                                            </span>
                                        </div>
                                        <ul className="space-y-2 mb-6 flex-grow">
                                            {service.features.map((feature, i) => (
                                                <li
                                                    key={i}
                                                    className="flex items-center gap-2 text-sm"
                                                    style={{ color: palette.textSecondary }}
                                                >
                                                    <div
                                                        className="w-1.5 h-1.5 rounded-full"
                                                        style={{ backgroundColor: service.color }}
                                                    />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                        <Link href={service.action}>
                                            <Button
                                                variant={service.popular ? "primary" : "secondary"}
                                                className="w-full"
                                            >
                                                Get Started
                                            </Button>
                                        </Link>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </motion.div> */}

                {/* CTA Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 }}>
                    <Card
                        className="text-center"
                        intensity={isApple ? "strong" : undefined}
                        elevated={!isApple}>
                        <div className="py-8 px-4">
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                                style={{
                                    background: `${palette.accent}20`,
                                    color: palette.accent
                                }}>
                                <Send className="text-2xl" />
                            </div>
                            <h3
                                className={`${isApple ? "text-2xl font-semibold" : "text-2xl font-black"} mb-3`}
                                style={{ color: palette.textPrimary }}>
                                Ready to Start a Project?
                            </h3>
                            <p
                                className={`${isApple ? "text-base" : "text-lg"} max-w-xl mx-auto mb-8`}
                                style={{ color: palette.textSecondary }}>
                                Let's discuss your ideas and create something extraordinary together. I'm always excited to work on new
                                challenges.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link href="/contact">
                                    <Button
                                        variant="primary"
                                        icon={<Email />}>
                                        Send a Message
                                    </Button>
                                </Link>
                                <Link
                                    href="https://calendly.com/meetbhingradiya"
                                    target="_blank">
                                    <Button
                                        variant="secondary"
                                        icon={<CalendarMonth />}>
                                        Schedule a Call
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            </div>
        </section>
    );
}
