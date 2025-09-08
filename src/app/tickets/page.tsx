"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    Search,
    Schedule,
    CheckCircle,
    Error,
    Info,
    Warning,
    Email,
    AccessTime,
    Star,
    Support,
    Visibility,
    Message,
    TrendingUp,
    Security,
    CalendarToday,
    Person,
    Business,
    // Priority
    ResetTv as Priority
} from "@mui/icons-material";

interface Ticket {
    id: string;
    subject: string;
    message: string;
    projectType: string;
    status: "open" | "in-progress" | "resolved" | "closed";
    priority: "low" | "medium" | "high";
    createdAt: string;
    updatedAt: string;
    responses: TicketResponse[];
}

interface TicketResponse {
    id: string;
    message: string;
    isAdmin: boolean;
    createdAt: string;
}

function TicketStatusPage() {
    const [ticketId, setTicketId] = useState("");
    const [email, setEmail] = useState("");
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "open":
                return {
                    icon: <Info className="text-lg" />,
                    color: "from-blue-500 to-blue-600",
                    bgColor: "bg-blue-50 dark:bg-blue-900/20",
                    borderColor: "border-blue-200 dark:border-blue-800",
                    textColor: "text-blue-700 dark:text-blue-400",
                    label: "Open",
                    description:
                        "Your ticket has been received and is waiting to be reviewed"
                };
            case "in-progress":
                return {
                    icon: <Schedule className="text-lg" />,
                    color: "from-yellow-500 to-orange-500",
                    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
                    borderColor: "border-yellow-200 dark:border-yellow-800",
                    textColor: "text-yellow-700 dark:text-yellow-400",
                    label: "In Progress",
                    description:
                        "Your ticket is currently being worked on by our team"
                };
            case "resolved":
                return {
                    icon: <CheckCircle className="text-lg" />,
                    color: "from-green-500 to-emerald-500",
                    bgColor: "bg-green-50 dark:bg-green-900/20",
                    borderColor: "border-green-200 dark:border-green-800",
                    textColor: "text-green-700 dark:text-green-400",
                    label: "Resolved",
                    description:
                        "Your ticket has been resolved. Please check the responses below"
                };
            case "closed":
                return {
                    icon: <CheckCircle className="text-lg" />,
                    color: "from-gray-500 to-gray-600",
                    bgColor: "bg-gray-50 dark:bg-gray-800/20",
                    borderColor: "border-gray-200 dark:border-gray-700",
                    textColor: "text-gray-700 dark:text-gray-400",
                    label: "Closed",
                    description: "Your ticket has been closed"
                };
            default:
                return {
                    icon: <Info className="text-lg" />,
                    color: "from-gray-500 to-gray-600",
                    bgColor: "bg-gray-50 dark:bg-gray-800/20",
                    borderColor: "border-gray-200 dark:border-gray-700",
                    textColor: "text-gray-700 dark:text-gray-400",
                    label: "Unknown",
                    description: "Status unknown"
                };
        }
    };

    const getPriorityConfig = (priority: string) => {
        switch (priority) {
            case "low":
                return {
                    icon: <TrendingUp className="text-sm" />,
                    color: "text-green-600 dark:text-green-400",
                    bgColor: "bg-green-100 dark:bg-green-900/30",
                    label: "Low Priority"
                };
            case "medium":
                return {
                    icon: <Warning className="text-sm" />,
                    color: "text-yellow-600 dark:text-yellow-400",
                    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
                    label: "Medium Priority"
                };
            case "high":
                return {
                    icon: <Priority className="text-sm" />,
                    color: "text-red-600 dark:text-red-400",
                    bgColor: "bg-red-100 dark:bg-red-900/30",
                    label: "High Priority"
                };
            default:
                return {
                    icon: <Info className="text-sm" />,
                    color: "text-gray-600 dark:text-gray-400",
                    bgColor: "bg-gray-100 dark:bg-gray-900/30",
                    label: "Unknown Priority"
                };
        }
    };

    const handleSearch = async () => {
        if (!ticketId.trim()) {
            setError("Please enter a ticket ID");
            return;
        }

        setLoading(true);
        setError("");
        setTicket(null);

        try {
            const params = new URLSearchParams({
                id: ticketId.trim(),
                ...(email.trim() && { email: email.trim() })
            });

            const response = await fetch(`/api/tickets?${params}`);
            const data = await response.json();

            if (data.success) {
                setTicket(data.ticket);
            } else {
                setError(data.error || "Failed to fetch ticket");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const getProjectTypeIcon = (type: string) => {
        switch (type) {
            case "staff-engineer":
                return <Business className="text-sm" />;
            case "consulting":
                return <Security className="text-sm" />;
            case "collaboration":
                return <Star className="text-sm" />;
            case "freelance":
                return <Message className="text-sm" />;
            case "mentorship":
                return <Support className="text-sm" />;
            default:
                return <Info className="text-sm" />;
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900">

            {/* Hero Section */}
            <section className="pt-20 pb-16 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-12">
                        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                            Ticket{" "}
                            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Status
                            </span>
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                            Track your support ticket and see real-time updates
                            on your request. Get instant access to responses and
                            status changes.
                        </p>
                    </motion.div>

                    {/* Search Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Search className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Find Your Ticket
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <label
                                    htmlFor="ticketId"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Ticket ID *
                                </label>
                                <input
                                    type="text"
                                    id="ticketId"
                                    value={ticketId}
                                    onChange={(e) =>
                                        setTicketId(e.target.value)
                                    }
                                    placeholder="TICKET-XXXXXXXXX"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Email (Optional)
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                />
                            </div>
                        </div>

                        <motion.button
                            onClick={handleSearch}
                            disabled={loading}
                            whileHover={{ scale: loading ? 1 : 1.02 }}
                            whileTap={{ scale: loading ? 1 : 0.98 }}
                            className={`w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg transition-all duration-300 ${
                                loading
                                    ? "opacity-70 cursor-not-allowed"
                                    : "hover:shadow-lg hover:from-blue-700 hover:to-purple-700"
                            }`}>
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    Searching...
                                </div>
                            ) : (
                                <div className="flex items-center justify-center">
                                    <Search className="mr-2" />
                                    Search Ticket
                                </div>
                            )}
                        </motion.button>

                        {/* Error Message */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="mt-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 flex items-center">
                                    <Error className="mr-2 flex-shrink-0" />
                                    <span>{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </section>

            {/* Ticket Details */}
            <section className="py-16 bg-white dark:bg-gray-900">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <AnimatePresence>
                        {ticket && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-8">
                                {/* Ticket Header */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                                        <div className="flex items-center space-x-3 mb-4 md:mb-0">
                                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                                <CheckCircle className="text-green-600 dark:text-green-400" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                                Ticket Found
                                            </h2>
                                        </div>

                                        <div className="flex flex-wrap gap-3">
                                            {/* Status Badge */}
                                            <div
                                                className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium ${getStatusConfig(ticket.status).bgColor} ${getStatusConfig(ticket.status).borderColor} border`}>
                                                {
                                                    getStatusConfig(
                                                        ticket.status
                                                    ).icon
                                                }
                                                <span
                                                    className={
                                                        getStatusConfig(
                                                            ticket.status
                                                        ).textColor
                                                    }>
                                                    {
                                                        getStatusConfig(
                                                            ticket.status
                                                        ).label
                                                    }
                                                </span>
                                            </div>

                                            {/* Priority Badge */}
                                            <div
                                                className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium ${getPriorityConfig(ticket.priority).bgColor}`}>
                                                {
                                                    getPriorityConfig(
                                                        ticket.priority
                                                    ).icon
                                                }
                                                <span
                                                    className={
                                                        getPriorityConfig(
                                                            ticket.priority
                                                        ).color
                                                    }>
                                                    {
                                                        getPriorityConfig(
                                                            ticket.priority
                                                        ).label
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Info Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <Visibility className="text-sm text-gray-500 dark:text-gray-400" />
                                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                                    Ticket ID
                                                </span>
                                            </div>
                                            <span className="text-sm font-mono text-gray-900 dark:text-white">
                                                {ticket.id}
                                            </span>
                                        </div>

                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                            <div className="flex items-center space-x-2 mb-2">
                                                {getProjectTypeIcon(
                                                    ticket.projectType
                                                )}
                                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                                    Project Type
                                                </span>
                                            </div>
                                            <span className="text-sm text-gray-900 dark:text-white capitalize">
                                                {ticket.projectType.replace(
                                                    "-",
                                                    " "
                                                )}
                                            </span>
                                        </div>

                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <CalendarToday className="text-sm text-gray-500 dark:text-gray-400" />
                                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                                    Created
                                                </span>
                                            </div>
                                            <span className="text-sm text-gray-900 dark:text-white">
                                                {formatDate(ticket.createdAt)}
                                            </span>
                                        </div>

                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <AccessTime className="text-sm text-gray-500 dark:text-gray-400" />
                                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                                    Last Updated
                                                </span>
                                            </div>
                                            <span className="text-sm text-gray-900 dark:text-white">
                                                {formatDate(ticket.updatedAt)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Ticket Content */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Ticket Details */}
                                    <div className="lg:col-span-2 space-y-6">
                                        {/* Subject & Message */}
                                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                                Subject
                                            </h3>
                                            <p className="text-gray-700 dark:text-gray-300 mb-6">
                                                {ticket.subject}
                                            </p>

                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                                Original Message
                                            </h3>
                                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                                    {ticket.message}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Responses */}
                                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                                                Conversation (
                                                {ticket.responses?.length || 0}{" "}
                                                responses)
                                            </h3>

                                            {ticket.responses &&
                                            ticket.responses.length > 0 ? (
                                                <div className="space-y-4">
                                                    {ticket.responses.map(
                                                        (response, index) => (
                                                            <motion.div
                                                                key={
                                                                    response.id
                                                                }
                                                                initial={{
                                                                    opacity: 0,
                                                                    y: 20
                                                                }}
                                                                animate={{
                                                                    opacity: 1,
                                                                    y: 0
                                                                }}
                                                                transition={{
                                                                    duration: 0.4,
                                                                    delay:
                                                                        index *
                                                                        0.1
                                                                }}
                                                                className={`p-4 rounded-lg border ${
                                                                    response.isAdmin
                                                                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                                                                        : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                                                                }`}>
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <div className="flex items-center space-x-2">
                                                                        <div
                                                                            className={`p-1.5 rounded-full ${
                                                                                response.isAdmin
                                                                                    ? "bg-blue-100 dark:bg-blue-800"
                                                                                    : "bg-gray-200 dark:bg-gray-600"
                                                                            }`}>
                                                                            {response.isAdmin ? (
                                                                                <Support className="text-sm text-blue-600 dark:text-blue-400" />
                                                                            ) : (
                                                                                <Person className="text-sm text-gray-600 dark:text-gray-400" />
                                                                            )}
                                                                        </div>
                                                                        <span
                                                                            className={`text-sm font-medium ${
                                                                                response.isAdmin
                                                                                    ? "text-blue-700 dark:text-blue-400"
                                                                                    : "text-gray-700 dark:text-gray-300"
                                                                            }`}>
                                                                            {response.isAdmin
                                                                                ? "Support Team"
                                                                                : "You"}
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                        {formatDate(
                                                                            response.createdAt
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                                                    {
                                                                        response.message
                                                                    }
                                                                </p>
                                                            </motion.div>
                                                        )
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8">
                                                    <AccessTime className="text-gray-400 text-4xl mb-4" />
                                                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                                        No responses yet
                                                    </h4>
                                                    <p className="text-gray-600 dark:text-gray-400">
                                                        We&apos;ll update you as
                                                        soon as there&apos;s a
                                                        response to your ticket.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status Sidebar */}
                                    <div className="space-y-6">
                                        {/* Current Status */}
                                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                                {
                                                    getStatusConfig(
                                                        ticket.status
                                                    ).icon
                                                }
                                                <span className="ml-2">
                                                    Current Status
                                                </span>
                                            </h3>

                                            <div
                                                className={`p-4 rounded-lg ${getStatusConfig(ticket.status).bgColor} ${getStatusConfig(ticket.status).borderColor} border`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span
                                                        className={`font-semibold ${getStatusConfig(ticket.status).textColor}`}>
                                                        {
                                                            getStatusConfig(
                                                                ticket.status
                                                            ).label
                                                        }
                                                    </span>
                                                    <span
                                                        className={`text-xs px-2 py-1 rounded-full ${getPriorityConfig(ticket.priority).bgColor} ${getPriorityConfig(ticket.priority).color}`}>
                                                        {ticket.priority}
                                                    </span>
                                                </div>
                                                <p
                                                    className={`text-sm ${getStatusConfig(ticket.status).textColor} opacity-90`}>
                                                    {
                                                        getStatusConfig(
                                                            ticket.status
                                                        ).description
                                                    }
                                                </p>
                                            </div>
                                        </div>

                                        {/* Response Times */}
                                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                                Expected Response Times
                                            </h3>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                                                        Low Priority:
                                                    </span>
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                                        2-3 days
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                                                        Medium Priority:
                                                    </span>
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                                        1-2 days
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                                                        High Priority:
                                                    </span>
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                                        Within 24 hours
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Need Help */}
                                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                                <Info className="mr-2 text-blue-600 dark:text-blue-400" />
                                                Need Help?
                                            </h3>
                                            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                                                <p>
                                                    <strong>
                                                        Can&apos;t find your
                                                        ticket?
                                                    </strong>
                                                </p>
                                                <ul className="list-disc list-inside space-y-1 ml-2">
                                                    <li>
                                                        Check your email for the
                                                        ticket ID
                                                    </li>
                                                    <li>
                                                        Make sure you entered
                                                        the correct ID
                                                    </li>
                                                    <li>
                                                        Try with your email
                                                        address
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </section>
        </div>
    );
}

export default TicketStatusPage;
