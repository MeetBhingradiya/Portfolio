"use client";

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Email,
    Phone,
    LocationOn,
    GitHub,
    LinkedIn,
    Send,
    CheckCircle,
    Error,
    Code,
    Star,
    Coffee,
    Lightbulb,
    Schedule,
    Language,
    ConfirmationNumber
} from '@mui/icons-material';
import Aurora from "@Lib/Backgrounds/Aurora/Aurora";
import { SocialLinks } from "@Config/SocialLinks";
import { Axios } from "@Utils/Axios";

interface ContactFormData {
    name: string;
    email: string;
    subject: string;
    message: string;
    projectType: string;
}

interface FormStatus {
    type: 'idle' | 'loading' | 'success' | 'error';
    message: string;
}

type SubmissionMode = 'email' | 'ticket';

function ContactPage() {
    const [formData, setFormData] = useState<ContactFormData>({
        name: '',
        email: '',
        subject: '',
        message: '',
        projectType: 'general'
    });

    const [status, setStatus] = useState<FormStatus>({
        type: 'idle',
        message: ''
    });

    const [submissionMode, setSubmissionMode] = useState<SubmissionMode>('email');
    const [focusedField, setFocusedField] = useState<string>('');
    const formRef = useRef<HTMLFormElement>(null);

    const projectTypes = [
        { value: 'general', label: 'General Inquiry', icon: '💬' },
        { value: 'web-development', label: 'Web Development', icon: '🌐' },
        { value: 'mobile-app', label: 'Mobile App', icon: '📱' },
        { value: 'collaboration', label: 'Collaboration', icon: '🤝' },
        { value: 'consulting', label: 'Consulting', icon: '💡' },
        { value: 'other', label: 'Other', icon: '🚀' }
    ];

    const contactInfo = [
        {
            icon: Email,
            label: 'Email',
            value: 'meetbhingradiya36@gmail.com',
            href: 'mailto:meetbhingradiya36@gmail.com',
            color: 'text-blue-400'
        },
        {
            icon: GitHub,
            label: 'GitHub',
            value: '@MeetBhingradiya',
            href: 'https://github.com/MeetBhingradiya',
            color: 'text-gray-400'
        },
        {
            icon: LinkedIn,
            label: 'LinkedIn',
            value: '/in/meet-bhingradiya',
            href: 'https://linkedin.com/in/meet-bhingradiya',
            color: 'text-blue-500'
        },
        {
            icon: LocationOn,
            label: 'Location',
            value: 'India 🇮🇳',
            href: '#',
            color: 'text-green-400'
        }
    ];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    }; const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (submissionMode === 'email') {
            setStatus({ type: 'loading', message: 'Sending message...' });

            try {
                const emailResponse = await Axios.post('/api/contact', formData);

                const emailData = emailResponse.data;

                if (emailData.success) {
                    setStatus({
                        type: 'success',
                        message: 'Message sent successfully! I\'ll get back to you soon. An auto-reply has been sent to your email.'
                    });
                    setFormData({
                        name: '',
                        email: '',
                        subject: '',
                        message: '',
                        projectType: 'general'
                    });
                } else if (emailData.rateLimited) {
                    setStatus({
                        type: 'error',
                        message: 'Rate limit reached for direct email. Please try using the ticket system instead or wait before sending another message.'
                    });
                } else {
                    setStatus({
                        type: 'error',
                        message: emailData.error || 'Failed to send message. Please try the ticket system or contact me directly via email.'
                    });
                }
            } catch (error) {
                console.error('Contact form error:', error);
                setStatus({
                    type: 'error',
                    message: 'Failed to send message. Please try the ticket system or contact me directly via email.'
                });
            }
        } else {
            // Create ticket
            setStatus({ type: 'loading', message: 'Creating support ticket...' });

            try {
                const ticketResponse = await Axios.post('/api/tickets', formData);

                const ticketData = ticketResponse.data;

                if (ticketData.success) {
                    setStatus({
                        type: 'success',
                        message: `Support ticket ${ticketData.ticket.id} created successfully! You can track your ticket status at /tickets`
                    });
                    setFormData({
                        name: '',
                        email: '',
                        subject: '',
                        message: '',
                        projectType: 'general'
                    });
                } else {
                    setStatus({
                        type: 'error',
                        message: ticketData.error || 'Failed to create ticket. Please try again or contact me directly via email.'
                    });
                }
            } catch (error) {
                console.error('Ticket creation error:', error);
                setStatus({
                    type: 'error',
                    message: 'Failed to create ticket. Please try again later or contact me directly via email.'
                });
            }
        }
    };

    return (
        <>
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

                <div className="relative z-10 min-h-screen px-4 pt-60 sm:px-6 lg:px-8 py-20">
                    <div className="max-w-7xl mx-auto">
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
                                Let&apos;s <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Connect</span>
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-xl sm:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
                            >
                                Have a project in mind? Want to collaborate? Or just want to say hi?
                                I&apos;d love to hear from you!
                            </motion.p>

                            {/* Quick Stats */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="flex flex-wrap justify-center gap-6 mt-8"
                            >
                                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                                    <Schedule className="text-green-400" />
                                    <span className="text-gray-300">Usually responds in 24hrs</span>
                                </div>
                                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                                    <Language className="text-blue-400" />
                                    <span className="text-gray-300">Available worldwide</span>
                                </div>
                                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                                    <Coffee className="text-yellow-400" />
                                    <span className="text-gray-300">Always ready to code</span>
                                </div>
                            </motion.div>
                        </motion.div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                            {/* Contact Information */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.8 }}
                                className="space-y-8"
                            >
                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                                    <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
                                        <Code className="mr-3 text-blue-400" />
                                        Get In Touch
                                    </h2>
                                    <p className="text-gray-300 mb-8 text-lg leading-relaxed">
                                        I&apos;m always excited to work on new projects and collaborate with fellow developers.
                                        Whether you have a question, a project proposal, or just want to connect,
                                        feel free to reach out!
                                    </p>

                                    <div className="space-y-6">
                                        {contactInfo.map((contact, index) => (
                                            <motion.a
                                                key={contact.label}
                                                href={contact.href}
                                                target={contact.href.startsWith('http') ? '_blank' : '_self'}
                                                rel={contact.href.startsWith('http') ? 'noopener noreferrer' : ''}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 1 + index * 0.1 }}
                                                whileHover={{ scale: 1.02, x: 5 }}
                                                className="flex items-center space-x-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300 group"
                                            >
                                                <div className={`p-3 rounded-full bg-black/20 ${contact.color} group-hover:scale-110 transition-transform duration-300`}>
                                                    <contact.icon className="text-xl" />
                                                </div>
                                                <div>
                                                    <div className="text-gray-400 text-sm">{contact.label}</div>
                                                    <div className="text-white font-medium">{contact.value}</div>
                                                </div>
                                            </motion.a>
                                        ))}
                                    </div>

                                    {/* Social Links */}
                                    {/* <div className="mt-8 pt-6 border-t border-white/20">
                                        <h3 className="text-lg font-semibold text-white mb-4">Follow Me</h3>
                                        <div className="flex space-x-4">
                                            {SocialLinks.filter(link => link.isEnable).map((social, index) => (
                                                <motion.a
                                                    key={social.Label}
                                                    href={social.URL}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    whileHover={{ scale: 1.2, rotate: 5 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    className="text-gray-400 hover:text-white transition-colors duration-300 text-2xl p-3 bg-white/5 rounded-full border border-white/10 hover:bg-white/10"
                                                >
                                                    {social.Component}
                                                </motion.a>
                                            ))}
                                        </div>
                                    </div> */}
                                </div>

                                {/* Fun Facts */}
                                {/* <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1.2 }}
                                    className="bg-gradient-to-br from-blue-500/20 to-purple-600/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30"
                                >
                                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                        <Star className="mr-2 text-yellow-400" />
                                        Fun Facts About Me
                                    </h3>
                                    <ul className="space-y-3 text-gray-300">
                                        <li className="flex items-center">
                                            <span className="mr-2">☕</span>
                                            Coffee enthusiast - best ideas come at 2 AM
                                        </li>
                                        <li className="flex items-center">
                                            <span className="mr-2">🌙</span>
                                            Night owl programmer
                                        </li>
                                        <li className="flex items-center">
                                            <span className="mr-2">🎯</span>
                                            Goal: Contribute to open source daily
                                        </li>
                                        <li className="flex items-center">
                                            <span className="mr-2">📚</span>
                                            Self-taught and proud of it
                                        </li>
                                    </ul>
                                </motion.div> */}
                            </motion.div>

                            {/* Contact Form */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 1 }}
                                className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
                            >                                <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
                                    <Send className="mr-3 text-purple-400" />
                                    Send Message
                                </h2>

                                {/* Submission Mode Selector */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1.1 }}
                                    className="mb-6"
                                >
                                    <div className="flex space-x-4 p-1 bg-white/5 rounded-xl border border-white/20">
                                        <motion.button
                                            type="button"
                                            onClick={() => setSubmissionMode('email')}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg transition-all duration-300 ${submissionMode === 'email'
                                                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                                                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                                                }`}
                                        >
                                            <Email className="mr-2 text-sm" />
                                            <span className="font-medium">Direct Email</span>
                                        </motion.button>
                                        <motion.button
                                            type="button"
                                            onClick={() => setSubmissionMode('ticket')}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg transition-all duration-300 ${submissionMode === 'ticket'
                                                    ? 'bg-gradient-to-r from-green-500 to-blue-600 text-white shadow-lg'
                                                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                                                }`}
                                        >
                                            <ConfirmationNumber className="mr-2 text-sm" />
                                            <span className="font-medium">Create Ticket</span>
                                        </motion.button>
                                    </div>

                                    {/* Mode Description */}
                                    <div className="mt-3 text-sm text-gray-400 text-center">
                                        {submissionMode === 'email' ? (
                                            <span>💌 Send a direct email - perfect for quick questions and immediate responses</span>
                                        ) : (
                                            <span>🎫 Create a support ticket - trackable, organized, and perfect for project discussions</span>
                                        )}
                                    </div>
                                </motion.div>

                                <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                                    {/* Name & Email Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 1.2 }}
                                        >
                                            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                                                Name *
                                            </label>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                onFocus={() => setFocusedField('name')}
                                                onBlur={() => setFocusedField('')}
                                                required
                                                className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${focusedField === 'name' ? 'border-blue-500 bg-white/10' : 'border-white/20'
                                                    }`}
                                                placeholder="Your name"
                                            />
                                        </motion.div>

                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 1.3 }}
                                        >
                                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                                Email *
                                            </label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                onFocus={() => setFocusedField('email')}
                                                onBlur={() => setFocusedField('')}
                                                required
                                                className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${focusedField === 'email' ? 'border-blue-500 bg-white/10' : 'border-white/20'
                                                    }`}
                                                placeholder="your@email.com"
                                            />
                                        </motion.div>
                                    </div>

                                    {/* Project Type */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 1.4 }}
                                    >
                                        <label htmlFor="projectType" className="block text-sm font-medium text-gray-300 mb-2">
                                            Project Type
                                        </label>
                                        <select
                                            id="projectType"
                                            name="projectType"
                                            value={formData.projectType}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                                        >
                                            {projectTypes.map((type) => (
                                                <option key={type.value} value={type.value} className="bg-slate-800">
                                                    {type.icon} {type.label}
                                                </option>
                                            ))}
                                        </select>
                                    </motion.div>

                                    {/* Subject */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 1.5 }}
                                    >
                                        <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                                            Subject *
                                        </label>
                                        <input
                                            type="text"
                                            id="subject"
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleInputChange}
                                            onFocus={() => setFocusedField('subject')}
                                            onBlur={() => setFocusedField('')}
                                            required
                                            className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${focusedField === 'subject' ? 'border-blue-500 bg-white/10' : 'border-white/20'
                                                }`}
                                            placeholder="What's this about?"
                                        />
                                    </motion.div>

                                    {/* Message */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 1.6 }}
                                    >
                                        <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                                            Message *
                                        </label>
                                        <textarea
                                            id="message"
                                            name="message"
                                            value={formData.message}
                                            onChange={handleInputChange}
                                            onFocus={() => setFocusedField('message')}
                                            onBlur={() => setFocusedField('')}
                                            required
                                            rows={6}
                                            className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${focusedField === 'message' ? 'border-blue-500 bg-white/10' : 'border-white/20'
                                                }`}
                                            placeholder="Tell me about your project or just say hello..."
                                        />
                                    </motion.div>

                                    {/* Submit Button */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 1.7 }}
                                    >
                                        <motion.button
                                        type="submit"
                                        disabled={status.type === 'loading'}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`w-full px-8 py-4 bg-gradient-to-r ${submissionMode === 'email'
                                                ? 'from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                                                : 'from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700'
                                            } text-white font-semibold rounded-xl transition-all duration-300 transform ${status.type === 'loading'
                                                ? 'opacity-70 cursor-not-allowed'
                                                : 'hover:shadow-lg hover:shadow-purple-500/25'
                                            }`}
                                    >
                                            {status.type === 'loading' ? (
                                                <div className="flex items-center justify-center">
                                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                                    {submissionMode === 'email' ? 'Sending...' : 'Creating Ticket...'}
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center">
                                                    {submissionMode === 'email' ? (
                                                        <>
                                                            <Send className="mr-2" />
                                                            Send Message
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ConfirmationNumber className="mr-2" />
                                                            Create Ticket
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </motion.button>
                                    </motion.div>

                                    {/* Status Message */}
                                    <AnimatePresence>
                                        {status.type !== 'idle' && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className={`p-4 rounded-xl flex items-center ${status.type === 'success'
                                                        ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                                                        : status.type === 'error'
                                                            ? 'bg-red-500/20 border border-red-500/30 text-red-400'
                                                            : 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
                                                    }`}
                                            >
                                                {status.type === 'success' && <CheckCircle className="mr-2" />}
                                                {status.type === 'error' && <Error className="mr-2" />}
                                                {status.message}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </form>
                            </motion.div>
                        </div>                        {/* Additional CTA Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.8 }}
                            className="mt-20 text-center"
                        >
                            <div className="bg-gradient-to-r from-purple-500/20 to-pink-600/20 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30">
                                <h3 className="text-2xl font-bold text-white mb-4">
                                    Prefer a different way to connect?
                                </h3>
                                <p className="text-gray-300 mb-6">
                                    You can also reach out to me directly through any of these platforms or check your ticket status
                                </p>
                                <div className="flex flex-wrap justify-center gap-4">
                                    <a
                                        href="https://github.com/MeetBhingradiya"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full transition-all duration-300 transform hover:scale-105"
                                    >
                                        <GitHub className="inline mr-2" />
                                        GitHub
                                    </a>
                                    <a
                                        href="https://linkedin.com/in/meet-bhingradiya"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full transition-all duration-300 transform hover:scale-105"
                                    >
                                        <LinkedIn className="inline mr-2" />
                                        LinkedIn
                                    </a>
                                    <a
                                        href="mailto:meetbhingradiya36@gmail.com"
                                        className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full transition-all duration-300 transform hover:scale-105"
                                    >
                                        <Email className="inline mr-2" />
                                        Email
                                    </a>
                                    <a
                                        href="/tickets"
                                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border border-blue-500/30 text-white rounded-full transition-all duration-300 transform hover:scale-105"
                                    >
                                        <CheckCircle className="inline mr-2" />
                                        Check Ticket Status
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-gradient-to-r from-blue-600 to-purple-700 py-12"
            >
                <div className="max-w-6xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-4">Let&apos;s Build Something Amazing Together</h2>
                    <p className="text-xl mb-8 text-blue-100">
                        Interested in collaborating? I&apos;m always open to discussing new opportunities.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <motion.a
                            href="/contact"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-full hover:bg-gray-100 transition-colors"
                        >
                            Get In Touch
                        </motion.a>
                        <motion.a
                            href="https://github.com/MeetBhingradiya"
                            target="_blank"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-8 py-3 border-2 border-white text-white font-semibold rounded-full hover:bg-white hover:text-blue-600 transition-colors"
                        >
                            View GitHub
                        </motion.a>
                    </div>
                </div>
            </motion.div>
        </>
    );
};

export default ContactPage;