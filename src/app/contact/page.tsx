"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useSearchParams } from "next/navigation";
import {
    Email,
    GitHub,
    LinkedIn,
    LocationOn,
    Send,
    CheckCircle,
    Error,
    Schedule,
    Language,
    ConfirmationNumber,
    VideoCall,
    Download,
    Work,
    Star,
    Security,
    Build,
    Phone,
    CalendarMonth as Calendar,
    Message,
    Support,
    Analytics,
    Code,
    Coffee,
    AccessTime,
    Public,
    AttachMoney,
    TrendingUp,
    Business
} from "@mui/icons-material";
import GitHubStyleHeader from "@Components/HomePage/Header";
import { Axios } from "@Utils/Axios";
import { Config } from "@Config";

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

type SubmissionMode = "email" | "ticket";

const projectTypes = [
    {
        value: "staff-engineer",
        label: "Staff Engineer Position",
        icon: "💼",
        description: "Full-time senior engineering role",
        emailTemplate:
            "Hi Meet,%0A%0AI represent [Company Name] and I'm interested in discussing a Staff Engineer position with you.%0A%0ACompany: [Company Name]%0ARole: Staff Engineer%0ALocation: [Remote/Location]%0ASalary Range: $[Range]%0A%0APlease let me know your availability for a discussion.%0A%0ABest regards"
    },
    {
        value: "technical-consultation",
        label: "Technical Consultation",
        icon: "🧠",
        description: "One-on-one technical consultation ($75/hour)",
        emailTemplate:
            "Hi Meet,%0A%0AI need technical consultation for:%0A%0AProject Type: [Describe your project]%0ASpecific Areas: [Security/Architecture/Performance/etc.]%0ATimeline: [When do you need this]%0APreferred Meeting: [Video call/Email discussion]%0A%0APlease let me know your availability.%0A%0ABest regards"
    },
    {
        value: "custom-development",
        label: "Custom Development",
        icon: "🚀",
        description: "Full-stack development services ($50/hour)",
        emailTemplate:
            "Hi Meet,%0A%0AI need custom development services for:%0A%0AProject: [Project Name]%0ATechnology Stack: [Technologies needed]%0AProject Scope: [Brief description]%0ATimeline: [Project timeline]%0ABudget: $[Budget range]%0A%0APlease provide a quote and timeline.%0A%0ABest regards"
    },
    {
        value: "security-audit",
        label: "Security Audit",
        icon: "�",
        description: "Comprehensive security assessment ($100/hour)",
        emailTemplate:
            "Hi Meet,%0A%0AI need a security audit for:%0A%0AApplication/System: [What needs to be audited]%0ACurrent Stack: [Technology stack]%0ASpecific Concerns: [Security concerns if any]%0ATimeline: [When do you need this completed]%0A%0APlease provide a detailed proposal.%0A%0ABest regards"
    },
    {
        value: "mentorship",
        label: "Technical Mentorship",
        icon: "📚",
        description: "Long-term mentorship for career growth ($40/session)",
        emailTemplate:
            "Hi Meet,%0A%0AI'm interested in technical mentorship for:%0A%0ACurrent Role: [Your current position]%0AExperience Level: [Years of experience]%0AAreas of Interest: [What you want to learn]%0AGoals: [Career goals]%0APreferred Schedule: [How often]%0A%0ALooking forward to learning from you.%0A%0ABest regards"
    },
    {
        value: "collaboration",
        label: "Open Source Collaboration",
        icon: "🤝",
        description: "Contributing to projects together",
        emailTemplate:
            "Hi Meet,%0A%0AI have an open source project idea:%0A%0AProject: [Project Name]%0ATechnology: [Tech Stack]%0AGoal: [Project Goal]%0ARepository: [GitHub link if exists]%0A%0AHow can we collaborate?%0A%0ABest regards"
    },
    {
        value: "general",
        label: "General Inquiry",
        icon: "💬",
        description: "Questions or general discussion",
        emailTemplate:
            "Hi Meet,%0A%0AI wanted to reach out regarding:%0A%0A[Your message here]%0A%0ABest regards"
    }
];

const budgetRanges = [
    { value: "not-specified", label: "Prefer not to say" },
    { value: "under-1k", label: "Under $1,000" },
    { value: "1k-5k", label: "$1,000 - $5,000" },
    { value: "5k-15k", label: "$5,000 - $15,000" },
    { value: "15k-50k", label: "$15,000 - $50,000" },
    { value: "50k-100k", label: "$50,000 - $100,000" },
    { value: "100k+", label: "$100,000+" },
    { value: "hourly-consultation", label: "Hourly Consultation ($75/hr)" },
    { value: "hourly-development", label: "Hourly Development ($50/hr)" },
    { value: "hourly-security", label: "Security Audit ($100/hr)" },
    { value: "hourly-mentorship", label: "Mentorship ($40/session)" },
    { value: "salary", label: "Full-time Salary Discussion" }
];

const timelineOptions = [
    { value: "asap", label: "ASAP" },
    { value: "1-2weeks", label: "1-2 weeks" },
    { value: "1month", label: "1 month" },
    { value: "2-3months", label: "2-3 months" },
    { value: "3months+", label: "3+ months" },
    { value: "flexible", label: "Flexible" }
];

const contactMethods = [
    {
        id: "email-primary",
        title: "Email (Primary)",
        description: "Best for detailed discussions and project proposals",
        icon: <Email className="text-2xl" />,
        value: "meetbhingradiya@outlook.com",
        link: "?template=technical-consultation",
        color: "from-blue-500 to-blue-600",
        available: Config.ContactOptions.Email,
        responseTime: "< 24 hours",
        type: "primary"
    },
    {
        id: "calendar",
        title: "Schedule a Call",
        description: "Book a technical discussion or project consultation",
        icon: <Calendar className="text-2xl" />,
        value: "Book 30-60 min slot",
        link: "https://calendly.com/meetbhingradiya",
        color: "from-green-500 to-emerald-600",
        available: Config.ContactOptions.Calendly,
        responseTime: "Available slots shown",
        type: "meeting"
    },
    {
        id: "linkedin",
        title: "LinkedIn",
        description: "Professional networking and career opportunities",
        icon: <LinkedIn className="text-2xl" />,
        value: "/in/meetbhingradiya",
        link: "https://linkedin.com/in/meetbhingradiya",
        color: "from-blue-600 to-blue-700",
        available: Config.ContactOptions.LinkedIn,
        responseTime: "Active daily",
        type: "social"
    },
    {
        id: "github",
        title: "GitHub",
        description: "Code discussions, contributions, and technical queries",
        icon: <GitHub className="text-2xl" />,
        value: "@MeetBhingradiya",
        link: "https://github.com/MeetBhingradiya",
        color: "from-gray-700 to-gray-800",
        available: Config.ContactOptions.GitHub,
        responseTime: "Check daily",
        type: "social"
    }
];

const quickActions = [
    {
        id: "hire-staff",
        title: "Hire for Staff Engineer",
        description:
            "I'm actively seeking Staff Engineer positions with competitive compensation",
        icon: <Business className="text-xl" />,
        action: "staff-engineer",
        color: "from-blue-600 to-purple-600",
        priority: "high"
    },
    {
        id: "technical-consultation",
        title: "Technical Consultation",
        description:
            "Expert guidance on security, architecture, and system design ($75/hour)",
        icon: <Security className="text-xl" />,
        action: "technical-consultation",
        color: "from-red-500 to-pink-600",
        priority: "high"
    },
    {
        id: "custom-development",
        title: "Custom Development",
        description:
            "Full-stack development services with modern tech stack ($50/hour)",
        icon: <Build className="text-xl" />,
        action: "custom-development",
        color: "from-orange-500 to-red-500",
        priority: "medium"
    },
    {
        id: "open-source",
        title: "Open Source Collaboration",
        description:
            "Let's build something amazing together for the developer community",
        icon: <Public className="text-xl" />,
        action: "collaboration",
        color: "from-green-500 to-blue-500",
        priority: "medium"
    }
];

// Template mapping for URL parameters from homepage
const templateMapping: Record<
    string,
    { projectType: string; subject: string; message: string }
> = {
    "staff-engineer": {
        projectType: "staff-engineer",
        subject: "Staff Engineer Position Inquiry",
        message: `Hi Meet,

I represent [Company Name] and I'm interested in discussing a Staff Engineer position with you.

Company: [Company Name]
Role: Staff Engineer
Location: [Remote/Location]
Salary Range: $[Range]
Team Size: [Team Size]
Technology Stack: [Technologies]

Please let me know your availability for a discussion.

Best regards,
[Your Name]`
    },
    "collaboration": {
        projectType: "collaboration",
        subject: "Open Source Collaboration Inquiry",
        message: `Hi Meet,

I have an open source project idea and would love to collaborate:

Project: [Project Name]
Technology: [Tech Stack]
Goal: [Project Goal]
Repository: [GitHub link if exists]
Timeline: [Expected timeline]

How can we work together on this?

Best regards,
[Your Name]`
    },
    "technical-consultation": {
        projectType: "technical-consultation",
        subject: "Technical Consultation Request",
        message: `Hi Meet,

I need technical consultation for:

Project Type: [Describe your project]
Specific Areas: [Security/Architecture/Performance/etc.]
Current Challenges: [What specific problems you're facing]
Timeline: [When do you need this]
Preferred Meeting: [Video call/Email discussion]
Budget: [Budget range]

Please let me know your availability and approach.

Best regards,
[Your Name]`
    },
    "custom-development": {
        projectType: "custom-development",
        subject: "Custom Development Project Inquiry",
        message: `Hi Meet,

I need custom development services for:

Project: [Project Name]
Technology Stack: [Technologies needed]
Project Scope: [Brief description]
Key Features: [Main features needed]
Timeline: [Project timeline]
Budget: $[Budget range]

Please provide a quote and development timeline.

Best regards,
[Your Name]`
    },
    "security-audit": {
        projectType: "security-audit",
        subject: "Security Audit Request",
        message: `Hi Meet,

I need a comprehensive security audit for:

Application/System: [What needs to be audited]
Current Stack: [Technology stack]
User Base: [Number of users/scale]
Specific Concerns: [Security concerns if any]
Timeline: [When do you need this completed]
Compliance Requirements: [Any compliance standards]

Please provide a detailed proposal and timeline.

Best regards,
[Your Name]`
    },
    "mentorship": {
        projectType: "mentorship",
        subject: "Technical Mentorship Request",
        message: `Hi Meet,

I'm interested in technical mentorship for:

Current Role: [Your current position]
Experience Level: [Years of experience]
Areas of Interest: [What you want to learn]
Goals: [Career goals]
Preferred Schedule: [How often]
Learning Style: [How you prefer to learn]

Looking forward to learning from your experience.

Best regards,
[Your Name]`
    },
    "custom-pricing": {
        projectType: "general",
        subject: "Custom Pricing Inquiry",
        message: `Hi Meet,

I'm interested in discussing custom pricing for:

Project Type: [Type of project]
Scope: [Project scope and complexity]
Timeline: [Project duration]
Team Requirements: [If you need to work with a team]
Long-term Partnership: [Ongoing vs one-time project]

Please provide information about enterprise packages and long-term contract options.

Best regards,
[Your Name]`
    }
};

function ContactPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-300">
                            Loading contact form...
                        </p>
                    </div>
                </div>
            }>
            <ContactPageContent />
        </Suspense>
    );
}

function ContactPageContent() {
    const searchParams = useSearchParams();
    const [formData, setFormData] = useState<ContactFormData>({
        name: "",
        email: "",
        subject: "",
        message: "",
        projectType: "general",
        budget: "not-specified",
        timeline: "flexible",
        company: ""
    });

    const [status, setStatus] = useState<FormStatus>({
        type: "idle",
        message: ""
    });

    const [submissionMode, setSubmissionMode] =
        useState<SubmissionMode>("email");
    const [showAdvancedFields, setShowAdvancedFields] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const formRef = useRef<HTMLFormElement>(null);

    React.useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    React.useEffect(() => {
        // Show advanced fields for certain project types
        const businessTypes = ["staff-engineer", "consulting", "freelance"];
        setShowAdvancedFields(businessTypes.includes(formData.projectType));
    }, [formData.projectType]); // Handle URL parameters for auto-filling form
    React.useEffect(() => {
        const template = searchParams.get("template");

        if (template && templateMapping[template]) {
            const templateData = templateMapping[template];
            setFormData((prev) => ({
                ...prev,
                projectType: templateData.projectType,
                subject: templateData.subject,
                message: templateData.message.replace(
                    /\[Your Name\]/g,
                    prev.name || "[Your Name]"
                )
            }));

            // Scroll to form after a short delay
            setTimeout(() => {
                formRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }, 500);
        }
    }, [searchParams]);

    const getLocalTime = () => {
        return currentTime.toLocaleTimeString("en-US", {
            hour12: true,
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Kolkata"
        });
    };

    const isBusinessHours = () => {
        const hour = new Date().getUTCHours() + 5.5; // Convert to India time
        return hour >= 9 && hour <= 18; // 9 AM to 6 PM India time
    };
    const handleInputChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));

        // Auto-populate email template when project type changes
        if (name === "projectType") {
            const selectedProject = projectTypes.find(
                (type) => type.value === value
            );
            if (selectedProject && selectedProject.emailTemplate) {
                // Convert URL encoded template to readable text
                const decodedTemplate = decodeURIComponent(
                    selectedProject.emailTemplate
                )
                    .replace(/%0A/g, "\n")
                    .replace(/\[([^\]]+)\]/g, "[Please fill: $1]");

                setFormData((prev) => ({
                    ...prev,
                    [name]: value,
                    message: decodedTemplate,
                    subject: `${selectedProject.label} Inquiry`
                }));
            }
        }
    };

    const handleQuickAction = (actionType: string) => {
        const projectType = projectTypes.find(
            (type) => type.value === actionType
        );
        if (projectType) {
            const decodedTemplate = decodeURIComponent(
                projectType.emailTemplate
            )
                .replace(/%0A/g, "\n")
                .replace(/\[([^\]]+)\]/g, "[Please fill: $1]");

            setFormData((prev) => ({
                ...prev,
                projectType: actionType,
                message: decodedTemplate,
                subject: `${projectType.label} Inquiry`
            }));

            // Scroll to form
            formRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (submissionMode === "email") {
            if (Config.ContactOptions.Email === false) {
                setStatus({
                    type: "error",
                    message: "Email contact is currently disabled. Please use the ticket system if available."
                });
                return;
            }
            setStatus({ type: "loading", message: "Sending message..." });

            try {
                const emailResponse = await Axios.post(
                    "/api/contact",
                    formData
                );
                const emailData = emailResponse.data;

                if (emailData.success) {
                    setStatus({
                        type: "success",
                        message:
                            "Message sent successfully! I'll get back to you within 24 hours. Check your email for a confirmation."
                    });
                    // Reset form
                    setFormData({
                        name: "",
                        email: "",
                        subject: "",
                        message: "",
                        projectType: "general",
                        budget: "not-specified",
                        timeline: "flexible",
                        company: ""
                    });
                } else if (emailData.rateLimited) {
                    setStatus({
                        type: "error",
                        message:
                            "Rate limit reached. Please try the ticket system or wait before sending another message."
                    });
                } else {
                    setStatus({
                        type: "error",
                        message:
                            emailData.error ||
                            "Failed to send message. Please try the ticket system or contact me directly."
                    });
                }
            } catch (error) {
                console.error("Contact form error:", error);
                setStatus({
                    type: "error",
                    message:
                        "Failed to send message. Please try the ticket system or contact me directly via email."
                });
            }
        } else {
            if (Config.ContactOptions.Tickets === false) {
                setStatus({
                    type: "error",
                    message: "Ticket contact is currently disabled. Please use the email system if available."
                });
                return;
            }
            setStatus({
                type: "loading",
                message: "Creating support ticket..."
            });

            try {
                const ticketResponse = await Axios.post(
                    "/api/tickets",
                    formData
                );
                const ticketData = ticketResponse.data;

                if (ticketData.success) {
                    setStatus({
                        type: "success",
                        message: `Support ticket #${ticketData.ticket.id} created! Track your ticket at /tickets`
                    });
                    // Reset form
                    setFormData({
                        name: "",
                        email: "",
                        subject: "",
                        message: "",
                        projectType: "general",
                        budget: "not-specified",
                        timeline: "flexible",
                        company: ""
                    });
                } else {
                    setStatus({
                        type: "error",
                        message:
                            ticketData.error ||
                            "Failed to create ticket. Please try again or contact me directly."
                    });
                }
            } catch (error) {
                console.error("Ticket creation error:", error);
                setStatus({
                    type: "error",
                    message:
                        "Failed to create ticket. Please try again later or contact me directly."
                });
            }
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900">
            {/* Header */}
            <GitHubStyleHeader />
            {/* Hero Section */}
            <section className="pt-20 pb-16 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16">
                        {/* Availability Status */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="inline-flex items-center space-x-3 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-full px-6 py-3 border border-gray-200 dark:border-gray-700 mb-8">
                            <div
                                className={`w-3 h-3 rounded-full ${isBusinessHours() ? "bg-green-500 animate-pulse" : "bg-yellow-500"}`}
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {isBusinessHours()
                                    ? "Available Now"
                                    : "Outside Business Hours"}{" "}
                                • {getLocalTime()} IST
                            </span>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                •
                            </div>
                            <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                                Open to Full Stack Developer Roles
                            </span>
                        </motion.div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                            Let&apos;s{" "}
                            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Connect
                            </span>
                        </h1>

                        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed mb-8">
                            Whether you&apos;re looking to hire a{" "}
                            <strong>Staff Engineer</strong>, need{" "}
                            <strong>security consulting</strong>, or want to
                            collaborate on <strong>innovative projects</strong>{" "}
                            – I&apos;m here to help build amazing things
                            together.
                        </p>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                            {[
                                {
                                    icon: <AccessTime className="text-lg" />,
                                    label: "< 24h",
                                    desc: "Response Time"
                                },
                                // {
                                //     icon: <TrendingUp className="text-lg" />,
                                //     label: "89.7/100",
                                //     desc: "Skill Score"
                                // },
                                {
                                    icon: <Public className="text-lg" />,
                                    label: "Global",
                                    desc: "Remote Ready"
                                },
                                {
                                    icon: <Star className="text-lg" />,
                                    label: "3+ Years",
                                    desc: "Experience"
                                }
                            ].map((stat, index) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        duration: 0.6,
                                        delay: 0.3 + index * 0.1
                                    }}
                                    className="text-center p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700">
                                    <div className="text-blue-600 dark:text-blue-400 mb-2 flex justify-center">
                                        {stat.icon}
                                    </div>
                                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                                        {stat.label}
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400">
                                        {stat.desc}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>
            {/* Quick Actions Section */}
            <section className="py-16 bg-white dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            Quick{" "}
                            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Actions
                            </span>
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-300">
                            Choose the action that best fits your needs for
                            faster communication
                        </p>
                    </motion.div>{" "}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                        {quickActions.map((action, index) => (
                            <motion.button
                                key={action.id}
                                onClick={() => handleQuickAction(action.action)}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.6,
                                    delay: index * 0.1
                                }}
                                whileHover={{ scale: 1.05, y: -5 }}
                                whileTap={{ scale: 0.95 }}
                                className={`relative bg-gradient-to-r ${action.color} text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden text-left w-full`}>
                                {action.priority === "high" && (
                                    <div className="absolute top-3 right-3">
                                        <Star className="text-yellow-300 text-lg" />
                                    </div>
                                )}

                                <div className="flex items-center space-x-3 mb-3">
                                    <div className="p-2 bg-white/20 rounded-lg">
                                        {action.icon}
                                    </div>
                                    <h3 className="font-semibold text-lg">
                                        {action.title}
                                    </h3>
                                </div>

                                <p className="text-white/90 text-sm leading-relaxed mb-4">
                                    {action.description}
                                </p>

                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-white/70">
                                        Click to auto-fill form
                                    </span>
                                    <Send className="text-lg group-hover:translate-x-1 transition-transform duration-200" />
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </div>
            </section>
            {/* Main Contact Section */}
            <section className="py-16 bg-gray-50 dark:bg-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Contact Methods */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            className="space-y-8">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                    Contact Methods
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-8">
                                    Choose your preferred way to get in touch.
                                    Each method is monitored regularly and
                                    you&apos;ll receive a prompt response.
                                </p>
                            </div>

                            <div className="space-y-4">
                                {contactMethods.map((method, index) => {
                                    if (!method.available) return null;

                                    return (
                                        <motion.a
                                            key={method.id}
                                            href={method.link}
                                            target={
                                                method.link.startsWith("http")
                                                    ? "_blank"
                                                    : "_self"
                                            }
                                            rel={
                                                method.link.startsWith("http")
                                                    ? "noopener noreferrer"
                                                    : ""
                                            }
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            transition={{
                                                duration: 0.6,
                                                delay: index * 0.1
                                            }}
                                            whileHover={{ scale: 1.02, x: 5 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="flex items-center space-x-4 p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 group">
                                            <div
                                                className={`p-3 bg-gradient-to-r ${method.color} text-white rounded-lg group-hover:scale-110 transition-transform duration-300`}>
                                                {method.icon}
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                                                        {method.title}
                                                    </h4>
                                                    {method.available && (
                                                        <span className="inline-flex items-center space-x-1 text-xs font-medium text-green-600 dark:text-green-400">
                                                            <CheckCircle className="text-sm" />
                                                            <span>Available</span>
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                                                    {method.description}
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-800 dark:text-gray-200 font-medium text-sm">
                                                        {method.value}
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {method.responseTime}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 transition-colors duration-300">
                                                <Send className="text-lg" />
                                            </div>
                                        </motion.a>
                                    )
                                })}
                            </div>

                            {/* Additional Info */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.4 }}
                                className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                                    <Analytics className="mr-2 text-blue-600 dark:text-blue-400" />
                                    Professional Info
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
                                    {
                                        Config.ContactOptions.Location && (
                                            <div className="flex items-center space-x-2">
                                                <LocationOn className="text-xs text-gray-500" />
                                                <span>
                                                    Surat, Gujarat, India (GMT+5:30)
                                                </span>
                                            </div>
                                        )
                                    }
                                    <div className="flex items-center space-x-2">
                                        <Language className="text-xs text-gray-500" />
                                        <span>English, Hindi, Gujarati</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Work className="text-xs text-gray-500" />
                                        <span>
                                            Available for immediate hiring
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Public className="text-xs text-gray-500" />
                                        <span>Remote work preferred</span>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* Contact Form */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
                            {" "}
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                                <Message className="mr-3 text-blue-600 dark:text-blue-400" />
                                Send Message
                            </h3>
                            {/* Pricing Information */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.1 }}
                                className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center text-sm">
                                    <AttachMoney className="mr-2 text-blue-600 dark:text-blue-400" />
                                    Service Pricing Reference
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-600 dark:text-gray-300">
                                    <div className="text-center p-2 bg-white/50 dark:bg-gray-800/50 rounded">
                                        <div className="font-semibold text-blue-600 dark:text-blue-400">
                                            $75/hr
                                        </div>
                                        <div>Consultation</div>
                                    </div>
                                    <div className="text-center p-2 bg-white/50 dark:bg-gray-800/50 rounded">
                                        <div className="font-semibold text-green-600 dark:text-green-400">
                                            $50/hr
                                        </div>
                                        <div>Development</div>
                                    </div>
                                    <div className="text-center p-2 bg-white/50 dark:bg-gray-800/50 rounded">
                                        <div className="font-semibold text-red-600 dark:text-red-400">
                                            $100/hr
                                        </div>
                                        <div>Security Audit</div>
                                    </div>
                                    <div className="text-center p-2 bg-white/50 dark:bg-gray-800/50 rounded">
                                        <div className="font-semibold text-orange-600 dark:text-orange-400">
                                            $40/session
                                        </div>
                                        <div>Mentorship</div>
                                    </div>
                                </div>
                            </motion.div>
                            {/* Submission Mode Selector */}
                            <div className="mb-6">
                                <div className="flex space-x-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                    <motion.button
                                        type="button"
                                        onClick={() =>
                                            setSubmissionMode("email")
                                        }
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`flex-1 flex items-center justify-center px-4 py-3 rounded-md transition-all duration-300 text-sm font-medium ${submissionMode === "email"
                                            ? "bg-blue-600 text-white shadow-lg"
                                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
                                            }`}>
                                        <Email className="mr-2 text-sm" />
                                        Direct Email
                                    </motion.button>
                                    <motion.button
                                        type="button"
                                        onClick={() =>
                                            setSubmissionMode("ticket")
                                        }
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`flex-1 flex items-center justify-center px-4 py-3 rounded-md transition-all duration-300 text-sm font-medium ${submissionMode === "ticket"
                                            ? "bg-green-600 text-white shadow-lg"
                                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
                                            }`}>
                                        <ConfirmationNumber className="mr-2 text-sm" />
                                        Support Ticket
                                    </motion.button>
                                </div>
                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                                    {submissionMode === "email"
                                        ? "📧 Direct email for immediate response and personal communication"
                                        : "🎫 Trackable ticket system for organized project discussions"}
                                </p>
                            </div>
                            <form
                                ref={formRef}
                                onSubmit={handleSubmit}
                                className="space-y-6">
                                {/* Basic Info Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label
                                            htmlFor="name"
                                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Name *
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                            placeholder="Your full name"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="email"
                                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                            placeholder="your@email.com"
                                        />
                                    </div>
                                </div>

                                {/* Project Type */}
                                <div>
                                    <label
                                        htmlFor="projectType"
                                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        What can I help you with? *
                                    </label>
                                    <select
                                        id="projectType"
                                        name="projectType"
                                        value={formData.projectType}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                                        {projectTypes.map((type) => (
                                            <option
                                                key={type.value}
                                                value={type.value}
                                                className="bg-white dark:bg-gray-800">
                                                {type.icon} {type.label}
                                            </option>
                                        ))}
                                    </select>
                                    {formData.projectType !== "general" && (
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            {
                                                projectTypes.find(
                                                    (type) =>
                                                        type.value ===
                                                        formData.projectType
                                                )?.description
                                            }
                                        </p>
                                    )}
                                </div>

                                {/* Advanced Fields for Business Inquiries */}
                                <AnimatePresence>
                                    {showAdvancedFields && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{
                                                opacity: 1,
                                                height: "auto"
                                            }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
                                            <div>
                                                <label
                                                    htmlFor="budget"
                                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Budget Range
                                                </label>
                                                <select
                                                    id="budget"
                                                    name="budget"
                                                    value={formData.budget}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                                                    {budgetRanges.map(
                                                        (budget) => (
                                                            <option
                                                                key={
                                                                    budget.value
                                                                }
                                                                value={
                                                                    budget.value
                                                                }
                                                                className="bg-white dark:bg-gray-800">
                                                                {budget.label}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                            </div>

                                            <div>
                                                <label
                                                    htmlFor="timeline"
                                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Timeline
                                                </label>
                                                <select
                                                    id="timeline"
                                                    name="timeline"
                                                    value={formData.timeline}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                                                    {timelineOptions.map(
                                                        (timeline) => (
                                                            <option
                                                                key={
                                                                    timeline.value
                                                                }
                                                                value={
                                                                    timeline.value
                                                                }
                                                                className="bg-white dark:bg-gray-800">
                                                                {timeline.label}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                            </div>

                                            <div>
                                                <label
                                                    htmlFor="company"
                                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Company
                                                </label>
                                                <input
                                                    type="text"
                                                    id="company"
                                                    name="company"
                                                    value={formData.company}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                    placeholder="Company name"
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Subject */}
                                <div>
                                    <label
                                        htmlFor="subject"
                                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Subject *
                                    </label>
                                    <input
                                        type="text"
                                        id="subject"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        placeholder="Brief subject line"
                                    />
                                </div>

                                {/* Message */}
                                <div>
                                    <label
                                        htmlFor="message"
                                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Message *
                                    </label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        required
                                        rows={6}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        placeholder={
                                            formData.projectType ===
                                                "staff-engineer"
                                                ? "Please include: company name, role details, compensation range, location/remote policy, and any specific requirements..."
                                                : formData.projectType ===
                                                    "consulting"
                                                    ? "Please describe your technical challenges, current architecture, and what specific help you need..."
                                                    : "Tell me about your project, goals, and how I can help..."
                                        }
                                    />
                                </div>

                                {/* Submit Button */}
                                <motion.button
                                    type="submit"
                                    disabled={status.type === "loading"}
                                    whileHover={{
                                        scale:
                                            status.type === "loading" ? 1 : 1.02
                                    }}
                                    whileTap={{
                                        scale:
                                            status.type === "loading" ? 1 : 0.98
                                    }}
                                    className={`w-full px-8 py-4 bg-gradient-to-r ${submissionMode === "email"
                                        ? "from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                        : "from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                                        } text-white font-semibold rounded-lg transition-all duration-300 ${status.type === "loading"
                                            ? "opacity-70 cursor-not-allowed"
                                            : "hover:shadow-lg"
                                        }`}>
                                    {status.type === "loading" ? (
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                            {submissionMode === "email"
                                                ? "Sending..."
                                                : "Creating Ticket..."}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center">
                                            {submissionMode === "email" ? (
                                                <>
                                                    <Send className="mr-2" />
                                                    Send Message
                                                </>
                                            ) : (
                                                <>
                                                    <ConfirmationNumber className="mr-2" />
                                                    Create Ticket
                                                </>
                                            )}{" "}
                                        </div>
                                    )}
                                </motion.button>

                                {/* Direct Email Button */}
                                <motion.button
                                    type="button"
                                    onClick={() => {
                                        const selectedProject =
                                            projectTypes.find(
                                                (type) =>
                                                    type.value ===
                                                    formData.projectType
                                            );
                                        const emailTemplate =
                                            selectedProject?.emailTemplate ||
                                            projectTypes[
                                                projectTypes.length - 1
                                            ].emailTemplate;
                                        const subject =
                                            formData.subject ||
                                            `${selectedProject?.label || "General"} Inquiry`;
                                        const body =
                                            formData.message ||
                                            decodeURIComponent(
                                                emailTemplate
                                            ).replace(/%0A/g, "\n");

                                        const mailtoLink = `mailto:meetbhingradiya@outlook.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                                        window.open(mailtoLink);
                                    }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full flex items-center justify-center px-6 py-3 rounded-lg font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 border border-gray-300 dark:border-gray-600">
                                    <Email className="mr-2" />
                                    Open in Email Client
                                </motion.button>

                                {/* Status Message */}
                                <AnimatePresence>
                                    {status.type !== "idle" && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className={`p-4 rounded-lg flex items-start space-x-3 ${status.type === "success"
                                                ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
                                                : status.type === "error"
                                                    ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
                                                    : "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400"
                                                }`}>
                                            {status.type === "success" && (
                                                <CheckCircle className="text-lg mt-0.5 flex-shrink-0" />
                                            )}
                                            {status.type === "error" && (
                                                <Error className="text-lg mt-0.5 flex-shrink-0" />
                                            )}
                                            <span className="text-sm leading-relaxed">
                                                {status.message}
                                            </span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </section>
            {/* Alternative Contact CTA */}
            <section className="py-16 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}>
                        <h3 className="text-3xl font-bold text-white mb-4">
                            Prefer a Different Approach?
                        </h3>
                        <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
                            You can also reach out directly through social
                            media, schedule a call, or check the status of any
                            existing tickets.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            {
                                Config.ContactOptions.Calendly && (
                                    <motion.a
                                        href="https://calendly.com/meetbhingradiya"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-200 flex items-center space-x-2">
                                        <VideoCall className="text-lg" />
                                        <span>Schedule a Call</span>
                                    </motion.a>
                                )
                            }
                            {
                                Config.ContactOptions.Tickets && (
                                    <motion.a
                                        href="/tickets"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center space-x-2">
                                        <Support className="text-lg" />
                                        <span>Check Ticket Status</span>
                                    </motion.a>
                                )
                            }
                            {
                                Config.ContactOptions.Resume && (
                                    <motion.a
                                        href="https://rxresu.me/meetbhingradiya/resume"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center space-x-2">
                                        <Download className="text-lg" />
                                        <span>Download Resume</span>
                                    </motion.a>
                                )
                            }
                            {
                                !Config.ContactOptions.Resume &&
                                !Config.ContactOptions.Calendly &&
                                !Config.ContactOptions.Tickets && (
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="px-6 py-3 bg-white/10 hover:bg-white/20 border border white/30 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center space-x-2">
                                        <Error className="text-lg" />
                                        <span>
                                            Currently no alternative contact options available.
                                        </span>
                                    </motion.div>
                                )
                            }
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}

export default ContactPage;
