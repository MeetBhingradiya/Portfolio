/**
 * Contact Static Data
 * Centralized contact information, quick actions, and service offerings
 * Reusable across Contact Page, Homepage Section, and other components
 */

import { Email, GitHub, LinkedIn, LocationOn, CalendarMonth, Download, Work, Code, Security, School, VideoCall } from "@mui/icons-material";

export interface ContactMethod {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    link: string;
    type: "email" | "social" | "calendar" | "download" | "location";
    color: string;
    available: boolean;
    responseTime?: string;
}

export interface QuickAction {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    action: string;
    color: string;
}

export interface ServiceCard {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    price: string;
    duration: string;
    features: string[];
    popular?: boolean;
    color: string;
    action: string;
}

export const contactMethods: ContactMethod[] = [
    {
        id: "email",
        title: "Email Me",
        description: "Best for detailed discussions and project inquiries",
        icon: <Email />,
        link: "/contact",
        type: "email",
        color: "#007AFF",
        available: true,
        responseTime: "Usually responds within 12 hours"
    },
    {
        id: "linkedin",
        title: "LinkedIn",
        description: "Professional networking and career opportunities",
        icon: <LinkedIn />,
        link: "https://linkedin.com/in/meetbhingradiya",
        type: "social",
        color: "#0A66C2",
        available: true,
        responseTime: "Typically responds within 24 hours"
    },
    {
        id: "github",
        title: "GitHub",
        description: "Explore my code, contribute to projects, or report issues",
        icon: <GitHub />,
        link: "https://github.com/MeetBhingradiya",
        type: "social",
        color: "#6E5494",
        available: true,
        responseTime: "Check daily"
    },
    {
        id: "calendar",
        title: "Schedule a Meeting",
        description: "Book a technical discussion or project consultation",
        icon: <CalendarMonth />,
        link: "https://calendly.com/meetbhingradiya",
        type: "calendar",
        color: "#34C759",
        available: true,
        responseTime: "View Available Slots"
    },
    {
        id: "resume",
        title: "Download Resume",
        description: "Get my latest resume with all technical details",
        icon: <Download />,
        link: "https://rxresu.me/meetbhingradiya/resume",
        type: "download",
        color: "#AF52DE",
        available: true
    },
    {
        id: "location",
        title: "Location",
        description: "Based in Surat, Gujarat, India (GMT+5:30)",
        icon: <LocationOn />,
        link: "https://maps.google.com/?q=Surat,Gujarat,India",
        type: "location",
        color: "#FF3B30",
        available: true,
        responseTime: "Available for remote work globally"
    }
];

export const quickActions: QuickAction[] = [
    {
        id: "hire-staff",
        title: "Hire for Full Stack Role",
        description: "I'm actively seeking Full Stack positions in product-focused companies",
        icon: <Work />,
        action: "/contact?template=staff-engineer",
        color: "#007AFF"
    },
    {
        id: "project-collaboration",
        title: "Project Collaboration",
        description: "Let's build something amazing together - open source or commercial",
        icon: <Code />,
        action: "/contact?template=collaboration",
        color: "#34C759"
    },
    {
        id: "technical-consultation",
        title: "Technical Consultation",
        description: "Need help with architecture, security, or automation? Let's discuss",
        icon: <VideoCall />,
        action: "/contact?template=technical-consultation",
        color: "#AF52DE"
    },
    {
        id: "mentorship",
        title: "Mentorship & Learning",
        description: "Interested in learning from my experience? Happy to share knowledge",
        icon: <School />,
        action: "/contact?template=mentorship",
        color: "#FF9500"
    }
];

export const services: ServiceCard[] = [
    {
        id: "consultation",
        title: "Technical Consultation",
        description: "One-on-one technical consultation for your specific needs",
        icon: <VideoCall />,
        price: "$75",
        duration: "per hour",
        features: [
            "Security Architecture Review",
            "System Design Consultation",
            "Code Review & Best Practices",
            "Performance Optimization"
        ],
        color: "#007AFF",
        action: "/contact?template=technical-consultation"
    },
    {
        id: "development",
        title: "Custom Development",
        description: "Full-stack development services for your project",
        icon: <Code />,
        price: "$50",
        duration: "per hour",
        features: ["Full-Stack Web Development", "API Development & Integration", "Database Design & Optimization", "DevOps & CI/CD Setup"],
        popular: true,
        color: "#34C759",
        action: "/contact?template=custom-development"
    },
    {
        id: "security-audit",
        title: "Security Audit",
        description: "Comprehensive security assessment of your application",
        icon: <Security />,
        price: "$100",
        duration: "per hour",
        features: ["Vulnerability Assessment", "Penetration Testing", "Code Security Review", "Detailed Security Report"],
        color: "#FF3B30",
        action: "/contact?template=security-audit"
    }
];

// Contact form templates
export const contactTemplates = {
    "staff-engineer": {
        subject: "Hiring Inquiry - Full Stack Engineer Position",
        defaultMessage: "Hi Meet,\n\nI'm interested in discussing a Full Stack Engineer opportunity with our team.\n\n"
    },
    "collaboration": {
        subject: "Project Collaboration Inquiry",
        defaultMessage: "Hi Meet,\n\nI have a project idea I'd like to collaborate on with you.\n\n"
    },
    "technical-consultation": {
        subject: "Technical Consultation Request",
        defaultMessage: "Hi Meet,\n\nI need technical consultation for:\n\n"
    },
    "mentorship": {
        subject: "Mentorship Request",
        defaultMessage: "Hi Meet,\n\nI'm interested in learning from your experience in:\n\n"
    },
    "custom-development": {
        subject: "Custom Development Project",
        defaultMessage: "Hi Meet,\n\nI'd like to discuss a custom development project:\n\n"
    },
    "security-audit": {
        subject: "Security Audit Request",
        defaultMessage: "Hi Meet,\n\nI need a security audit for:\n\n"
    }
};

// Personal Information
export const personalInfo = {
    name: "Meet Bhingradiya",
    title: "Full Stack Developer",
    location: "Surat, Gujarat, India",
    timezone: "Asia/Kolkata",
    timezoneOffset: "+5:30",
    email: "contact@meetbhingradiya.shop",
    workingHours: {
        start: 10, // 10 AM
        end: 18 // 6 PM
    }
};
