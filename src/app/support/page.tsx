/**
 * Support Hub — FAQ + Help Center + Ticket Portal
 */
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import {
    HelpOutline,
    ConfirmationNumber,
    Search,
    ExpandMore,
    ThumbUp,
    ThumbDown,
    Add,
    ShoppingBag,
    Email,
    ChatBubble,
} from "@mui/icons-material";

interface FAQ {
    _id: string;
    faqId: string;
    question: string;
    answer: string;
    category: string;
    helpful: number;
    notHelpful: number;
    order: number;
}

interface FAQsByCategory {
    [category: string]: FAQ[];
}

export default function SupportPage() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";

    const [faqs, setFaqs] = useState<FAQsByCategory>({});
    const [search, setSearch] = useState("");
    const [openFaq, setOpenFaq] = useState<string | null>(null);
    const [voted, setVoted] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    const cardBg = isApple
        ? isDark ? "rgba(28,28,32,0.75)" : "rgba(255,255,255,0.75)"
        : isDark ? "rgba(24,24,28,0.98)" : "#fff";
    const border = `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`;
    const br = isApple ? 20 : 24;

    const fetchFAQs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/faq");
            const json = await res.json();
            if (json.success) {
                const grouped: FAQsByCategory = {};
                for (const faq of json.data as FAQ[]) {
                    if (!grouped[faq.category]) grouped[faq.category] = [];
                    grouped[faq.category].push(faq);
                }
                setFaqs(grouped);
            }
        } catch { /* silent */ }
        setLoading(false);
    }, []);

    useEffect(() => { fetchFAQs(); }, [fetchFAQs]);

    const handleVote = async (id: string, type: "helpful" | "notHelpful") => {
        if (voted.has(id)) return;
        setVoted(prev => new Set(prev).add(id));
        await fetch(`/api/faq/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ vote: type }),
        });
        fetchFAQs();
    };

    const allFaqs = Object.values(faqs).flat();
    const filteredFaqs = search
        ? allFaqs.filter(f =>
            f.question.toLowerCase().includes(search.toLowerCase()) ||
            f.answer.toLowerCase().includes(search.toLowerCase())
        )
        : null;

    const quickLinks = [
        { icon: <ShoppingBag />, label: "My Orders", href: "/shop/orders", color: "#007AFF" },
        { icon: <ConfirmationNumber />, label: "Support Tickets", href: "/support/tickets", color: "#34C759" },
        { icon: <ChatBubble />, label: "New Ticket", href: "/support/tickets/new", color: "#AF52DE" },
        { icon: <Email />, label: "Contact", href: "/contact", color: "#FF9500" },
    ];

    return (
        <div className="min-h-screen py-12 px-4 md:px-8" style={{ background: palette.background }}>
            <div className="max-w-5xl mx-auto">
                {/* Hero */}
                <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                    <div
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-4"
                        style={{ background: `${palette.accent}18`, color: palette.accent }}
                    >
                        <HelpOutline fontSize="small" /> Help Center
                    </div>
                    <h1
                        className={`${isApple ? "text-4xl font-semibold" : "text-5xl font-black"} mb-4`}
                        style={{ color: palette.textPrimary }}
                    >
                        How can we help?
                    </h1>

                    {/* Search */}
                    <div
                        className="flex items-center gap-3 max-w-xl mx-auto px-5 py-3.5 rounded-2xl"
                        style={{ background: cardBg, border, backdropFilter: isApple ? "blur(20px)" : "none" }}
                    >
                        <Search style={{ color: palette.textSecondary }} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search frequently asked questions…"
                            className="flex-1 bg-transparent outline-none"
                            style={{ color: palette.textPrimary, fontSize: 16 }}
                        />
                    </div>
                </motion.div>

                {/* Quick Links */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
                    {quickLinks.map((ql, i) => (
                        <motion.div
                            key={ql.href}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                        >
                            <Link href={ql.href}>
                                <motion.div
                                    whileHover={{ y: -3 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="flex flex-col items-center gap-3 py-5 px-4 rounded-2xl cursor-pointer text-center"
                                    style={{ background: cardBg, border, backdropFilter: isApple ? "blur(20px)" : "none" }}
                                >
                                    <div
                                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                        style={{ background: `${ql.color}18` }}
                                    >
                                        <span style={{ color: ql.color }}>{ql.icon}</span>
                                    </div>
                                    <span className="text-sm font-bold" style={{ color: palette.textPrimary }}>{ql.label}</span>
                                </motion.div>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* FAQ content */}
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />
                        ))}
                    </div>
                ) : search && filteredFaqs ? (
                    /* Search results */
                    <div>
                        <p className="text-sm font-semibold mb-4" style={{ color: palette.textSecondary }}>
                            {filteredFaqs.length} result{filteredFaqs.length !== 1 ? "s" : ""} for "{search}"
                        </p>
                        {filteredFaqs.length === 0 ? (
                            <div className="text-center py-16">
                                <HelpOutline style={{ fontSize: 56, color: palette.textTertiary, opacity: 0.3 }} />
                                <p className="mt-4 font-bold" style={{ color: palette.textSecondary }}>No results found</p>
                                <Link href="/support/tickets/new">
                                    <motion.button
                                        whileTap={{ scale: 0.96 }}
                                        className="mt-4 px-5 py-2.5 rounded-xl font-bold text-white text-sm"
                                        style={{ background: palette.accent }}
                                    >
                                        Open a Support Ticket
                                    </motion.button>
                                </Link>
                            </div>
                        ) : (
                            <FAQList faqs={filteredFaqs} openFaq={openFaq} setOpenFaq={setOpenFaq} voted={voted} onVote={handleVote} palette={palette} isApple={isApple} isDark={isDark} cardBg={cardBg} border={border} br={br} />
                        )}
                    </div>
                ) : (
                    /* Category view */
                    <div className="space-y-8">
                        {Object.entries(faqs).map(([cat, catFaqs]) => (
                            <div key={cat}>
                                <h2
                                    className={`${isApple ? "text-xl font-semibold" : "text-2xl font-black"} mb-4`}
                                    style={{ color: palette.textPrimary }}
                                >
                                    {cat}
                                </h2>
                                <FAQList faqs={catFaqs} openFaq={openFaq} setOpenFaq={setOpenFaq} voted={voted} onVote={handleVote} palette={palette} isApple={isApple} isDark={isDark} cardBg={cardBg} border={border} br={br} />
                            </div>
                        ))}

                        {/* Still need help? */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-8 rounded-3xl text-center"
                            style={{ background: `${palette.accent}12`, border: `1px solid ${palette.accent}30` }}
                        >
                            <p className={`${isApple ? "text-xl font-semibold" : "text-2xl font-black"} mb-2`} style={{ color: palette.textPrimary }}>
                                Still need help?
                            </p>
                            <p className="text-sm mb-5" style={{ color: palette.textSecondary }}>
                                Can't find the answer you're looking for? Open a support ticket and we'll get back to you.
                            </p>
                            <Link href="/support/tickets/new">
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold mx-auto"
                                    style={{ background: palette.accent, color: "#fff" }}
                                >
                                    <Add /> Open a Ticket
                                </motion.button>
                            </Link>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
}

function FAQList({
    faqs, openFaq, setOpenFaq, voted, onVote, palette, isApple, isDark, cardBg, border, br
}: {
    faqs: FAQ[];
    openFaq: string | null;
    setOpenFaq: (id: string | null) => void;
    voted: Set<string>;
    onVote: (id: string, type: "helpful" | "notHelpful") => void;
    palette: any;
    isApple: boolean;
    isDark: boolean;
    cardBg: string;
    border: string;
    br: number;
}) {
    return (
        <div className="space-y-2">
            {faqs.map(faq => {
                const isOpen = openFaq === faq._id;
                const hasVoted = voted.has(faq._id);
                return (
                    <div key={faq._id} style={{ background: cardBg, border, borderRadius: br, backdropFilter: isApple ? "blur(20px)" : "none" }}>
                        <motion.button
                            onClick={() => setOpenFaq(isOpen ? null : faq._id)}
                            className="w-full flex items-center justify-between gap-4 p-5 text-left"
                        >
                            <span className="font-semibold text-sm leading-snug" style={{ color: palette.textPrimary }}>
                                {faq.question}
                            </span>
                            <motion.div
                                animate={{ rotate: isOpen ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                                className="flex-shrink-0"
                            >
                                <ExpandMore style={{ color: palette.textSecondary }} />
                            </motion.div>
                        </motion.button>

                        <AnimatePresence>
                            {isOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25 }}
                                    className="overflow-hidden"
                                >
                                    <div className="px-5 pb-4 space-y-3">
                                        <div
                                            className="h-px"
                                            style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }}
                                        />
                                        <p className="text-sm leading-relaxed" style={{ color: palette.textSecondary }}>
                                            {faq.answer}
                                        </p>
                                        <div className="flex items-center gap-3 pt-1">
                                            <span className="text-xs" style={{ color: palette.textTertiary }}>
                                                Was this helpful?
                                            </span>
                                            <motion.button
                                                whileTap={{ scale: 0.9 }}
                                                disabled={hasVoted}
                                                onClick={() => onVote(faq._id, "helpful")}
                                                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg"
                                                style={{
                                                    background: isDark ? "rgba(52,199,89,0.1)" : "rgba(52,199,89,0.08)",
                                                    color: "#34C759",
                                                    opacity: hasVoted ? 0.5 : 1,
                                                }}
                                            >
                                                <ThumbUp style={{ fontSize: 12 }} /> {faq.helpful}
                                            </motion.button>
                                            <motion.button
                                                whileTap={{ scale: 0.9 }}
                                                disabled={hasVoted}
                                                onClick={() => onVote(faq._id, "notHelpful")}
                                                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg"
                                                style={{
                                                    background: isDark ? "rgba(255,59,48,0.1)" : "rgba(255,59,48,0.08)",
                                                    color: "#FF3B30",
                                                    opacity: hasVoted ? 0.5 : 1,
                                                }}
                                            >
                                                <ThumbDown style={{ fontSize: 12 }} /> {faq.notHelpful}
                                            </motion.button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </div>
    );
}
