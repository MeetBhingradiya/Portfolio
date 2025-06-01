export interface ContactFormResponse {
    success: boolean;
    message: string;
    rateLimited?: boolean;
    timeRemaining?: number;
    ticket?: {
        id: string;
        status: string;
        priority: string;
        createdAt: Date;
    };
}

export interface TicketStatusResponse {
    success: boolean;
    ticket?: {
        id: string;
        subject: string;
        message: string;
        projectType: string;
        status: 'open' | 'in-progress' | 'resolved' | 'closed';
        priority: 'low' | 'medium' | 'high';
        createdAt: string;
        updatedAt: string;
        responses: TicketResponse[];
    };
    error?: string;
}

export interface TicketResponse {
    id: string;
    message: string;
    isAdmin: boolean;
    createdAt: string;
}

export const formatTimeRemaining = (milliseconds: number): string => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
};

export const validateEmailFormat = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const sanitizeInput = (input: string): string => {
    return input.trim().replace(/[<>]/g, '');
};

export const getProjectTypeLabel = (value: string): string => {
    const projectTypes = {
        'general': 'General Inquiry',
        'web-development': 'Web Development',
        'mobile-app': 'Mobile App',
        'collaboration': 'Collaboration',
        'consulting': 'Consulting',
        'other': 'Other'
    };
    return projectTypes[value as keyof typeof projectTypes] || value;
};

export const getPriorityColor = (priority: string): string => {
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

export const getStatusColor = (status: string): string => {
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
