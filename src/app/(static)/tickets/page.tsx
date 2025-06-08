"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search,
    Schedule,
    CheckCircle,
    Error,
    Info,
    Warning,
    Email,
    AccessTime,
    Star
} from '@mui/icons-material';
import Header from "@Components/Header";
import Aurora from "@Lib/Backgrounds/Aurora/Aurora";
import LandingFooter from "@Components/Footer/LandingFooter";

interface Ticket {
    id: string;
    subject: string;
    message: string;
    projectType: string;
    status: 'open' | 'in-progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high';
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

const TicketStatusPage: React.FC = () => {
    const [ticketId, setTicketId] = useState('');
    const [email, setEmail] = useState('');
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'open':
                return <Info className="text-blue-400" />;
            case 'in-progress':
                return <Schedule className="text-yellow-400" />;
            case 'resolved':
                return <CheckCircle className="text-green-400" />;
            case 'closed':
                return <CheckCircle className="text-gray-400" />;
            default:
                return <Info className="text-blue-400" />;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'low':
                return 'text-green-400 bg-green-400/20 border-green-400/30';
            case 'medium':
                return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30';
            case 'high':
                return 'text-red-400 bg-red-400/20 border-red-400/30';
            default:
                return 'text-gray-400 bg-gray-400/20 border-gray-400/30';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open':
                return 'text-blue-400 bg-blue-400/20 border-blue-400/30';
            case 'in-progress':
                return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30';
            case 'resolved':
                return 'text-green-400 bg-green-400/20 border-green-400/30';
            case 'closed':
                return 'text-gray-400 bg-gray-400/20 border-gray-400/30';
            default:
                return 'text-gray-400 bg-gray-400/20 border-gray-400/30';
        }
    };

    const handleSearch = async () => {
        if (!ticketId.trim()) {
            setError('Please enter a ticket ID');
            return;
        }

        setLoading(true);
        setError('');
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
                setError(data.error || 'Failed to fetch ticket');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    return (
        <>
            <Header />
            <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
                {/* ReactBits Aurora Background */}
                <div className="absolute inset-0 opacity-30">
                    <Aurora />
                </div>

                {/* Background Animations */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-10 left-10 w-20 h-20 bg-blue-500 rounded-full animate-pulse"></div>
                    <div className="absolute top-40 right-20 w-16 h-16 bg-purple-500 rounded-full animate-bounce"></div>
                    <div className="absolute bottom-20 left-20 w-24 h-24 bg-pink-500 rounded-full animate-ping"></div>
                    <div className="absolute bottom-40 right-10 w-12 h-12 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="absolute top-1/2 left-1/4 w-8 h-8 bg-yellow-500 rounded-full animate-bounce"></div>
                    <div className="absolute top-3/4 right-1/3 w-14 h-14 bg-indigo-500 rounded-full animate-ping"></div>
                </div>

                <div className="relative z-10 min-h-screen px-4 pt-44 sm:px-6 lg:px-8 py-20">
                    <div className="max-w-4xl mx-auto">
                        {/* Hero Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="text-center mb-16"
                        >
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6"
                            >
                                Ticket <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Status</span>
                            </motion.h1>
                            
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-xl sm:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
                            >
                                Track your support ticket and see real-time updates on your request.
                            </motion.p>
                        </motion.div>

                        {/* Search Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 mb-8"
                        >
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                                <Search className="mr-3 text-blue-400" />
                                Find Your Ticket
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label htmlFor="ticketId" className="block text-sm font-medium text-gray-300 mb-2">
                                        Ticket ID *
                                    </label>
                                    <input
                                        type="text"
                                        id="ticketId"
                                        value={ticketId}
                                        onChange={(e) => setTicketId(e.target.value)}
                                        placeholder="TICKET-XXXXXXXXX"
                                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                        Email (Optional)
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <motion.button
                                onClick={handleSearch}
                                disabled={loading}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`w-full px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl transition-all duration-300 transform ${
                                    loading 
                                        ? 'opacity-70 cursor-not-allowed' 
                                        : 'hover:from-blue-600 hover:to-purple-700 hover:shadow-lg hover:shadow-purple-500/25'
                                }`}
                            >
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
                                        className="mt-4 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 flex items-center"
                                    >
                                        <Error className="mr-2" />
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {/* Ticket Details */}
                        <AnimatePresence>
                            {ticket && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-bold text-white flex items-center">
                                            <CheckCircle className="mr-3 text-green-400" />
                                            Ticket Details
                                        </h2>
                                        <div className="flex items-center space-x-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(ticket.priority)}`}>
                                                {ticket.priority.toUpperCase()} PRIORITY
                                            </span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(ticket.status)}`}>
                                                {ticket.status.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Ticket Info */}
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="text-lg font-semibold text-white mb-2">Ticket Information</h3>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-400">ID:</span>
                                                        <span className="text-white font-mono">{ticket.id}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-400">Project Type:</span>
                                                        <span className="text-white">{ticket.projectType}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-400">Created:</span>
                                                        <span className="text-white">{formatDate(ticket.createdAt)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-400">Last Updated:</span>
                                                        <span className="text-white">{formatDate(ticket.updatedAt)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="text-lg font-semibold text-white mb-2">Subject</h3>
                                                <p className="text-gray-300">{ticket.subject}</p>
                                            </div>

                                            <div>
                                                <h3 className="text-lg font-semibold text-white mb-2">Original Message</h3>
                                                <div className="bg-white/5 rounded-lg p-4">
                                                    <p className="text-gray-300 whitespace-pre-wrap">{ticket.message}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status & Responses */}
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                                    {getStatusIcon(ticket.status)}
                                                    <span className="ml-2">Current Status</span>
                                                </h3>
                                                <div className="bg-white/5 rounded-lg p-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="text-white font-semibold">{ticket.status.toUpperCase()}</span>
                                                        <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(ticket.priority)}`}>
                                                            {ticket.priority} priority
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-300 text-sm">
                                                        {ticket.status === 'open' && 'Your ticket has been received and is waiting to be reviewed.'}
                                                        {ticket.status === 'in-progress' && 'Your ticket is currently being worked on.'}
                                                        {ticket.status === 'resolved' && 'Your ticket has been resolved. Please check the responses below.'}
                                                        {ticket.status === 'closed' && 'Your ticket has been closed.'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Responses */}
                                            {ticket.responses && ticket.responses.length > 0 && (
                                                <div>
                                                    <h3 className="text-lg font-semibold text-white mb-4">Responses</h3>
                                                    <div className="space-y-4">
                                                        {ticket.responses.map((response, index) => (
                                                            <div
                                                                key={response.id}
                                                                className={`p-4 rounded-lg ${
                                                                    response.isAdmin 
                                                                        ? 'bg-blue-500/20 border border-blue-500/30' 
                                                                        : 'bg-white/5 border border-white/10'
                                                                }`}
                                                            >
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <span className={`text-sm font-semibold ${
                                                                        response.isAdmin ? 'text-blue-400' : 'text-gray-400'
                                                                    }`}>
                                                                        {response.isAdmin ? 'Support Team' : 'You'}
                                                                    </span>
                                                                    <span className="text-xs text-gray-400">
                                                                        {formatDate(response.createdAt)}
                                                                    </span>
                                                                </div>
                                                                <p className="text-gray-300 whitespace-pre-wrap">{response.message}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* No responses message */}
                                            {(!ticket.responses || ticket.responses.length === 0) && (
                                                <div className="bg-white/5 rounded-lg p-4 text-center">
                                                    <AccessTime className="text-gray-400 text-4xl mb-2" />
                                                    <p className="text-gray-400">No responses yet. We&apos;ll update you soon!</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Help Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.2 }}
                            className="mt-12 bg-gradient-to-r from-purple-500/20 to-pink-600/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30"
                        >
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                <Info className="mr-2 text-blue-400" />
                                Need Help?
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
                                <div>
                                    <p className="mb-2"><strong>Can&apos;t find your ticket?</strong></p>
                                    <ul className="text-sm space-y-1">
                                        <li>• Check your email for the ticket ID</li>
                                        <li>• Make sure you entered the correct ID</li>
                                        <li>• Try with your email address</li>
                                    </ul>
                                </div>
                                <div>
                                    <p className="mb-2"><strong>Response Times:</strong></p>
                                    <ul className="text-sm space-y-1">
                                        <li>• <span className="text-green-400">Low priority:</span> 2-3 days</li>
                                        <li>• <span className="text-yellow-400">Medium priority:</span> 1-2 days</li>
                                        <li>• <span className="text-red-400">High priority:</span> Within 24 hours</li>
                                    </ul>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
            <LandingFooter />
        </>
    );
};

export default TicketStatusPage;
