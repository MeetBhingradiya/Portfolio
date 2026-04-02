"use client";

import React, { useEffect, useState, Suspense } from "react";
import { motion } from "framer-motion";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import BuildIcon from "@mui/icons-material/Build";
import ScheduleIcon from "@mui/icons-material/Schedule";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import SecurityIcon from "@mui/icons-material/Security";
import { useSearchParams } from "next/navigation";

// Inner component that safely uses useSearchParams (wrapped in Suspense below)
function MaintenanceContent() {
    const { palette } = useDesignTheme();
    const searchParams = useSearchParams();
    const [message, setMessage] = useState<string>("");
    const [dots, setDots] = useState(".");

    useEffect(() => {
        const queryMsg = searchParams.get("message");

        fetch("/api/maintenance-status")
            .then((r) => r.json())
            .then((d) => {
                // ── Maintenance is OFF — redirect the user away ───────────
                if (!d.maintenanceMode) {
                    const referrer = document.referrer;
                    let target = "/";

                    if (referrer) {
                        try {
                            const ref = new URL(referrer);
                            // Only follow same-origin referrers (security)
                            if (ref.origin === location.origin && ref.pathname !== "/maintenance") {
                                target = ref.pathname + ref.search;
                            }
                        } catch {
                            /* malformed referrer — fall back to home */
                        }
                    }

                    location.replace(target);
                    return;
                }

                // ── Maintenance is ON — show the message ─────────────────
                if (queryMsg) {
                    setMessage(decodeURIComponent(queryMsg));
                } else if (d.maintenanceMessage) {
                    setMessage(d.maintenanceMessage);
                }
            })
            .catch(() => {
                // API unreachable — show page normally with query message if any
                if (queryMsg) setMessage(decodeURIComponent(queryMsg));
            });
    }, [searchParams]);

    useEffect(() => {
        const interval = setInterval(() => {
            setDots((prev) => (prev.length < 3 ? prev + "." : "."));
        }, 600);
        return () => clearInterval(interval);
    }, []);

    const features = [
        {
            icon: <SecurityIcon style={{ fontSize: 24 }} />,
            label: "Secure Updates"
        },
        { icon: <ScheduleIcon style={{ fontSize: 24 }} />, label: "Back Soon" },
        {
            icon: <MailOutlineIcon style={{ fontSize: 24 }} />,
            label: "Contact Support"
        }
    ];

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
            style={{ background: palette.background }}>
            {/* Glow */}
            <div
                className="fixed inset-0 pointer-events-none"
                style={{
                    background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${palette.accent}1A 0%, transparent 70%)`
                }}
            />

            <motion.div
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative z-10 flex flex-col items-center gap-8 max-w-xl w-full text-center">
                {/* Icon */}
                <motion.div
                    animate={{ rotate: [0, -8, 8, -8, 0] }}
                    transition={{
                        duration: 2.4,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="flex items-center justify-center w-24 h-24 rounded-3xl"
                    style={{
                        background: `linear-gradient(135deg, ${palette.accent}33, ${palette.accent}11)`,
                        border: `2px solid ${palette.accent}44`,
                        boxShadow: `0 0 40px ${palette.accent}33`
                    }}>
                    <BuildIcon style={{ fontSize: 44, color: palette.accent }} />
                </motion.div>

                {/* Heading */}
                <div className="flex flex-col gap-3">
                    <h1
                        className="text-4xl font-bold tracking-tight"
                        style={{ color: palette.textPrimary }}>
                        Under Maintenance{dots}
                    </h1>
                    <p
                        className="text-base leading-relaxed"
                        style={{ color: palette.textSecondary }}>
                        {message || "We're performing scheduled maintenance. We'll be back soon!"}
                    </p>
                </div>

                {/* Divider */}
                <div
                    className="w-24 h-px rounded-full"
                    style={{
                        background: `linear-gradient(90deg, transparent, ${palette.accent}66, transparent)`
                    }}
                />

                {/* Feature chips */}
                <div className="flex flex-wrap items-center justify-center gap-3">
                    {features.map((f) => (
                        <motion.div
                            key={f.label}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                            style={{
                                background: `${palette.accent}15`,
                                border: `1px solid ${palette.accent}30`,
                                color: palette.textSecondary
                            }}>
                            <span style={{ color: palette.accent }}>{f.icon}</span>
                            {f.label}
                        </motion.div>
                    ))}
                </div>

                {/* Card */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35 }}
                    className="w-full rounded-2xl p-6 flex flex-col gap-4"
                    style={{
                        background: palette.surface,
                        border: `1px solid ${palette.border}`
                    }}>
                    <p
                        className="text-sm"
                        style={{ color: palette.textSecondary }}>
                        Our team is working hard to improve your experience. If you have an urgent matter, please reach out.
                    </p>
                    <a
                        href="mailto:contact@meetbhingradiya.in"
                        className="inline-flex items-center gap-2 self-center px-5 py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-80"
                        style={{
                            background: `linear-gradient(135deg, ${palette.accent}, ${palette.accent}cc)`,
                            color: "#fff"
                        }}>
                        <MailOutlineIcon style={{ fontSize: 18 }} />
                        Contact Support
                    </a>
                </motion.div>
            </motion.div>
        </div>
    );
}

export default function MaintenancePage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <BuildIcon style={{ fontSize: 48, opacity: 0.3 }} />
                </div>
            }>
            <MaintenanceContent />
        </Suspense>
    );
}
