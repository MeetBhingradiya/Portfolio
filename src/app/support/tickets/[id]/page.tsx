/**
 * Ticket Detail & Messaging Page
 */
"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { useAuth } from "@Library/auth-client";
import { ArrowBack, Send, Circle, Star, StarOutline, Lock, LockOpen, Person, SupportAgent, AdminPanelSettings } from "@mui/icons-material";

interface Message {
    messageId: string;
    senderId: string;
    senderEmail: string;
    senderName: string;
    senderRole: "customer" | "employee" | "admin";
    content: string;
    isInternal: boolean;
    createdAt: string;
}

interface Ticket {
    _id: string;
    ticketId: string;
    subject: string;
    category: string;
    priority: string;
    status: string;
    userId: string;
    userEmail: string;
    userName: string;
    assignedEmail?: string;
    messages: Message[];
    lastRepliedAt: string;
    createdAt: string;
    satisfactionRating?: number;
}

const STATUS_CFG: Record<string, { label: string; color: string }> = {
    open: { label: "Open", color: "#34C759" },
    in_progress: { label: "In Progress", color: "#007AFF" },
    waiting_customer: { label: "Awaiting Your Reply", color: "#FF9500" },
    resolved: { label: "Resolved", color: "#5AC8FA" },
    closed: { label: "Closed", color: "#8E8E93" }
};

const ROLE_ICON: Record<string, React.ReactNode> = {
    customer: <Person style={{ fontSize: 14 }} />,
    employee: <SupportAgent style={{ fontSize: 14 }} />,
    admin: <AdminPanelSettings style={{ fontSize: 14 }} />
};

export default function TicketDetailPage({ params }: { params?: { id?: string } }) {
    const routeParams = useParams<{ id: string }>();
    const ticketId = (routeParams?.id as string) || (typeof params?.id === "string" ? params.id : "");
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);
    const [reply, setReply] = useState("");
    const [sending, setSending] = useState(false);
    const [isInternal, setIsInternal] = useState(false);
    const { user } = useAuth();
    const [rating, setRating] = useState(0);
    const [error, setError] = useState("");
    const [accessError, setAccessError] = useState("");
    const [secretCode, setSecretCode] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [accessToken, setAccessToken] = useState("");
    const [accessLoading, setAccessLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const cardBg = isApple ? (isDark ? "rgba(28,28,32,0.75)" : "rgba(255,255,255,0.75)") : isDark ? "rgba(24,24,28,0.98)" : "#fff";
    const border = `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`;
    const br = isApple ? 20 : 24;

    const fetchTicket = async () => {
        if (!ticketId) return;
        setLoading(true);
        setError("");
        try {
            const headers: Record<string, string> = {};
            if (accessToken) headers["x-ticket-access-token"] = accessToken;
            const res = await fetch(`/api/support/tickets/${ticketId}`, {
                headers
            });
            const json = await res.json();
            if (json.success) setTicket(json.data);
            else {
                setTicket(null);
                setError(json.error || "Unable to load ticket.");
            }
        } catch {
            setTicket(null);
            setError("Network error. Please try again.");
        }
        setLoading(false);
    };

    useEffect(() => {
        if (!ticketId) return;
        const token = typeof window !== "undefined" ? localStorage.getItem(`support-ticket-token:${ticketId}`) || "" : "";
        if (token) setAccessToken(token);
        const savedSecret = typeof window !== "undefined" ? localStorage.getItem(`support-ticket-secret:${ticketId}`) || "" : "";
        if (savedSecret) setSecretCode(savedSecret);
    }, [ticketId]);

    useEffect(() => {
        if (ticketId) {
            fetchTicket();
        }
    }, [ticketId, accessToken]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [ticket?.messages]);

    const handleSendReply = async () => {
        if (!reply.trim() || !ticketId) return;
        setSending(true);
        try {
            const res = await fetch(`/api/support/tickets/${ticketId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    ...(accessToken ? { "x-ticket-access-token": accessToken } : {})
                },
                body: JSON.stringify({ reply, isInternal })
            });
            const json = await res.json();
            if (json.success) {
                setTicket(json.data);
                setReply("");
            } else {
                setError(json.error || "Failed to send reply.");
            }
        } catch {
            setError("Network error. Please try again.");
        }
        setSending(false);
    };

    const handleRating = async (r: number) => {
        if (!ticketId) return;
        setRating(r);
        await fetch(`/api/support/tickets/${ticketId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                ...(accessToken ? { "x-ticket-access-token": accessToken } : {})
            },
            body: JSON.stringify({ satisfactionRating: r })
        });
        fetchTicket();
    };

    const requestOtp = async () => {
        if (!secretCode.trim() || !ticketId) return;
        setAccessLoading(true);
        setAccessError("");
        try {
            const res = await fetch(`/api/support/tickets/access/${ticketId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ secretCode })
            });
            const json = await res.json();
            if (json.success) {
                setOtpSent(true);
            } else {
                setAccessError(json.error || "Unable to send OTP.");
            }
        } catch {
            setAccessError("Network error. Please try again.");
        }
        setAccessLoading(false);
    };

    const verifyOtp = async () => {
        if (!secretCode.trim() || !otp.trim() || !ticketId) return;
        setAccessLoading(true);
        setAccessError("");
        try {
            const res = await fetch(`/api/support/tickets/access/${ticketId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ secretCode, otp })
            });
            const json = await res.json();
            if (json.success && json.data?.accessToken) {
                setAccessToken(json.data.accessToken);
                if (typeof window !== "undefined") {
                    localStorage.setItem(`support-ticket-token:${ticketId}`, json.data.accessToken);
                }
                setTicket(json.data.ticket);
            } else {
                setAccessError(json.error || "OTP verification failed.");
            }
        } catch {
            setAccessError("Network error. Please try again.");
        }
        setAccessLoading(false);
    };

    if (loading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ background: palette.background }}>
                <div
                    className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                    style={{
                        borderColor: palette.accent,
                        borderTopColor: "transparent"
                    }}
                />
            </div>
        );
    }

    if (!ticket) {
        return (
            <div
                className="min-h-screen flex flex-col items-center justify-center gap-4"
                style={{ background: palette.background }}>
                <p
                    className="text-lg font-bold"
                    style={{ color: palette.textPrimary }}>
                    Ticket not found
                </p>
                {!!error && (
                    <p
                        className="text-sm"
                        style={{ color: "#FF3B30" }}>
                        {error}
                    </p>
                )}
                {["Unauthorized", "Forbidden", "Invalid ticket credentials."].includes(error) && (
                    <div
                        className="w-full max-w-md p-4 rounded-2xl space-y-3"
                        style={{ background: cardBg, border }}>
                        <p
                            className="text-sm font-semibold"
                            style={{ color: palette.textPrimary }}>
                            Access this ticket with secret code + OTP
                        </p>
                        {!!accessError && (
                            <p className="text-xs" style={{ color: "#FF3B30" }}>
                                {accessError}
                            </p>
                        )}
                        <input
                            value={secretCode}
                            onChange={(e) => setSecretCode(e.target.value)}
                            placeholder="Ticket secret code"
                            className="w-full px-3 py-2 rounded-xl bg-transparent outline-none text-sm"
                            style={{ color: palette.textPrimary, border }}
                        />
                        {otpSent && (
                            <input
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="6-digit OTP sent to ticket email"
                                className="w-full px-3 py-2 rounded-xl bg-transparent outline-none text-sm"
                                style={{ color: palette.textPrimary, border }}
                            />
                        )}
                        <div className="flex gap-2">
                            <button
                                onClick={requestOtp}
                                disabled={accessLoading || !secretCode.trim()}
                                className="px-4 py-2 rounded-xl font-semibold text-sm"
                                style={{
                                    background: palette.accent,
                                    color: "#fff",
                                    opacity: accessLoading ? 0.7 : 1
                                }}>
                                Send OTP
                            </button>
                            {otpSent && (
                                <button
                                    onClick={verifyOtp}
                                    disabled={accessLoading || !otp.trim()}
                                    className="px-4 py-2 rounded-xl font-semibold text-sm"
                                    style={{
                                        background: "#34C759",
                                        color: "#fff",
                                        opacity: accessLoading ? 0.7 : 1
                                    }}>
                                    Verify & Open
                                </button>
                            )}
                        </div>
                    </div>
                )}
                <Link href="/support/tickets">
                    <button
                        className="px-5 py-2.5 rounded-xl font-bold text-white"
                        style={{ background: palette.accent }}>
                        Back to Tickets
                    </button>
                </Link>
            </div>
        );
    }

    const statusCfg = STATUS_CFG[ticket.status] ?? {
        label: ticket.status,
        color: "#888"
    };
    const isClosed = ["resolved", "closed"].includes(ticket.status);

    return (
        <div
            className="min-h-screen py-12 px-4 md:px-8"
            style={{ background: palette.background }}>
            <div className="max-w-3xl mx-auto flex flex-col gap-5">
                {/* Header */}
                <div className="flex items-start gap-3">
                    <Link href="/support/tickets">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="p-2 rounded-xl mt-1"
                            style={{
                                background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)"
                            }}>
                            <ArrowBack style={{ color: palette.textSecondary }} />
                        </motion.button>
                    </Link>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1
                                className={`${isApple ? "text-xl font-semibold" : "text-2xl font-black"}`}
                                style={{ color: palette.textPrimary }}>
                                {ticket.subject}
                            </h1>
                            <span
                                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                                style={{
                                    background: `${statusCfg.color}20`,
                                    color: statusCfg.color
                                }}>
                                <Circle style={{ fontSize: 8 }} /> {statusCfg.label}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span
                                className="text-xs font-semibold"
                                style={{ color: palette.textTertiary }}>
                                {ticket.ticketId}
                            </span>
                            <span
                                className="text-xs capitalize"
                                style={{ color: palette.textTertiary }}>
                                {ticket.category}
                            </span>
                            <span
                                className="text-xs capitalize"
                                style={{ color: palette.textTertiary }}>
                                {ticket.priority} priority
                            </span>
                            <span
                                className="text-xs"
                                style={{ color: palette.textTertiary }}>
                                Opened {new Date(ticket.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Admin/Employee Controls */}
                {((user as any)?.role === "admin" || (user as any)?.role === "employee" || (user as any)?.isEmployee || (user as any)?.isAdmin) && (
                    <div
                        className="p-4 rounded-2xl"
                        style={{
                            background: isDark ? "rgba(255, 45, 85, 0.05)" : "rgba(255, 45, 85, 0.02)",
                            border: `1px solid rgba(255, 45, 85, 0.2)`
                        }}>
                        <p className="text-sm font-bold mb-3" style={{ color: "#FF2D55" }}>
                            Admin Controls
                        </p>
                        <div className="flex gap-2 flex-wrap">
                            <select
                                value={ticket.status}
                                onChange={async (e) => {
                                    const newStatus = e.target.value;
                                    const res = await fetch(`/api/support/tickets/${ticketId}`, {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ status: newStatus })
                                    });
                                    if (res.ok) setTicket({ ...ticket, status: newStatus });
                                }}
                                className="px-3 py-1.5 rounded-lg text-sm bg-transparent outline-none cursor-pointer"
                                style={{ border, color: palette.textPrimary }}>
                                <option value="open">Open</option>
                                <option value="in_progress">In Progress</option>
                                <option value="waiting_customer">Waiting Customer</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                            </select>
                            
                            <select
                                value={ticket.priority}
                                onChange={async (e) => {
                                    const newPri = e.target.value;
                                    const res = await fetch(`/api/support/tickets/${ticketId}`, {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ priority: newPri })
                                    });
                                    if (res.ok) setTicket({ ...ticket, priority: newPri });
                                }}
                                className="px-3 py-1.5 rounded-lg text-sm bg-transparent outline-none cursor-pointer"
                                style={{ border, color: palette.textPrimary }}>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Messages thread */}
                <div
                    className="p-5 space-y-4 max-h-[60vh] overflow-y-auto"
                    style={{ background: cardBg, border, borderRadius: br }}>
                    <AnimatePresence>
                        {ticket.messages.map((msg, i) => {
                            const isMyMsg = msg.senderRole === "customer";
                            return (
                                <motion.div
                                    key={msg.messageId}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    className={`flex gap-3 ${isMyMsg ? "flex-row-reverse" : ""}`}>
                                    {/* Avatar */}
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                                        style={{
                                            background: isMyMsg
                                                ? `${palette.accent}20`
                                                : isDark
                                                  ? "rgba(255,255,255,0.1)"
                                                  : "rgba(0,0,0,0.07)",
                                            color: isMyMsg ? palette.accent : palette.textSecondary
                                        }}>
                                        {ROLE_ICON[msg.senderRole]}
                                    </div>
                                    <div className={`flex-1 max-w-[80%] ${isMyMsg ? "items-end" : "items-start"} flex flex-col`}>
                                        <div className={`flex items-center gap-1.5 mb-1 ${isMyMsg ? "flex-row-reverse" : ""}`}>
                                            <span
                                                className="text-xs font-bold"
                                                style={{
                                                    color: palette.textPrimary
                                                }}>
                                                {msg.senderName}
                                            </span>
                                            <span
                                                className="text-xs capitalize px-1.5 py-0.5 rounded-full"
                                                style={{
                                                    background:
                                                        msg.senderRole === "admin"
                                                            ? "#FF2D5520"
                                                            : msg.senderRole === "employee"
                                                              ? "#007AFF20"
                                                              : `${palette.accent}15`,
                                                    color:
                                                        msg.senderRole === "admin"
                                                            ? "#FF2D55"
                                                            : msg.senderRole === "employee"
                                                              ? "#007AFF"
                                                              : palette.accent
                                                }}>
                                                {msg.senderRole}
                                            </span>
                                            {msg.isInternal && (
                                                <span
                                                    className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full"
                                                    style={{
                                                        background: "#FF950020",
                                                        color: "#FF9500"
                                                    }}>
                                                    <Lock style={{ fontSize: 10 }} /> Internal
                                                </span>
                                            )}
                                            <span
                                                className="text-xs"
                                                style={{
                                                    color: palette.textTertiary
                                                }}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit"
                                                })}
                                            </span>
                                        </div>
                                        <div
                                            className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                                            style={{
                                                background: isMyMsg
                                                    ? `${palette.accent}20`
                                                    : msg.isInternal
                                                      ? "#FF950015"
                                                      : isDark
                                                        ? "rgba(255,255,255,0.06)"
                                                        : "rgba(0,0,0,0.04)",
                                                color: palette.textPrimary,
                                                borderRadius: isMyMsg ? "18px 4px 18px 18px" : "4px 18px 18px 18px"
                                            }}>
                                            {msg.content}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>

                {/* Rating (for resolved/closed) */}
                {isClosed && !ticket.satisfactionRating && (
                    <div
                        className="p-4 text-center space-y-2"
                        style={{
                            background: cardBg,
                            border,
                            borderRadius: br
                        }}>
                        <p
                            className="text-sm font-bold"
                            style={{ color: palette.textPrimary }}>
                            How was your experience?
                        </p>
                        <div className="flex justify-center gap-1">
                            {[1, 2, 3, 4, 5].map((r) => (
                                <motion.button
                                    key={r}
                                    whileTap={{ scale: 0.85 }}
                                    onClick={() => handleRating(r)}
                                    style={{
                                        color: r <= (rating || ticket.satisfactionRating || 0) ? "#FFCC00" : palette.textTertiary
                                    }}>
                                    {r <= (rating || ticket.satisfactionRating || 0) ? (
                                        <Star style={{ fontSize: 28 }} />
                                    ) : (
                                        <StarOutline style={{ fontSize: 28 }} />
                                    )}
                                </motion.button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Reply box */}
                {!isClosed && (
                    <div
                        className="p-4 space-y-3"
                        style={{
                            background: cardBg,
                            border,
                            borderRadius: br
                        }}>
                        {!!error && (
                            <p
                                className="text-xs px-3 py-2 rounded-xl"
                                style={{
                                    color: "#FF3B30",
                                    background: "#FF3B3014"
                                }}>
                                {error}
                            </p>
                        )}
                        {((user as any)?.role === "admin" || (user as any)?.role === "employee" || (user as any)?.isEmployee || (user as any)?.isAdmin) && (
                            <div className="flex items-center gap-2 px-1 pb-1">
                                <input
                                    type="checkbox"
                                    checked={isInternal}
                                    onChange={(e) => setIsInternal(e.target.checked)}
                                    className="accent-orange-500"
                                />
                                <span className="text-sm font-semibold" style={{ color: palette.textSecondary }}>
                                    Internal Reply (Hidden from customer)
                                </span>
                            </div>
                        )}
                        <textarea
                            rows={4}
                            placeholder="Type your reply…"
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                            className="w-full bg-transparent outline-none text-sm resize-none"
                            style={{ color: palette.textPrimary }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSendReply();
                            }}
                        />
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span
                                className="text-xs"
                                style={{ color: palette.textTertiary }}>
                                Ctrl+Enter to send
                            </span>
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={handleSendReply}
                                disabled={sending || !reply.trim()}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm"
                                style={{
                                    background: palette.accent,
                                    color: "#fff",
                                    opacity: sending || !reply.trim() ? 0.6 : 1
                                }}>
                                {sending ? (
                                    "Sending…"
                                ) : (
                                    <>
                                        <Send style={{ fontSize: 16 }} /> Send
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
