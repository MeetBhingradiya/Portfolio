import { NextRequest, NextResponse } from 'next/server';
import { requestIp } from "@Lib"
import { dbConnect } from '@Utils/dbConnect';
import { Tickets_Model, ITicket } from '@Models/Tickets';
import { v4 } from 'uuid';

// Rate limiting store (consider moving to Redis in production)
const rateLimitStore = new Map<string, number>();

const RATE_LIMIT_DURATION = 3 * 60 * 60 * 1000; // 3 hours
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Type definitions
interface CreateTicketData {
    name: string;
    email: string;
    subject: string;
    message: string;
    projectType: 'general' | 'web-development' | 'mobile-app' | 'collaboration' | 'consulting' | 'other';
}

function generateTicketId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `TICKET-${timestamp}-${random}`.toUpperCase();
}

function checkRateLimit(clientIP: string): { allowed: boolean; timeRemaining?: number } {
    const now = Date.now();
    const lastRequest = rateLimitStore.get(clientIP);
    
    if (lastRequest) {
        const timeElapsed = now - lastRequest;
        if (timeElapsed < RATE_LIMIT_DURATION) {
            const timeRemaining = RATE_LIMIT_DURATION - timeElapsed;
            return { allowed: false, timeRemaining };
        }
    }
    
    rateLimitStore.set(clientIP, now);
    return { allowed: true };
}

function validateTicketInput(data: CreateTicketData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data.name || data.name.trim().length < 2) {
        errors.push('Name must be at least 2 characters long');
    }
    
    if (!data.email || !EMAIL_REGEX.test(data.email)) {
        errors.push('Please provide a valid email address');
    }
    
    if (!data.subject || data.subject.trim().length < 5) {
        errors.push('Subject must be at least 5 characters long');
    }
    
    if (!data.message || data.message.trim().length < 10) {
        errors.push('Message must be at least 10 characters long');
    }
    
    if (data.name.length > 100) errors.push('Name is too long');
    if (data.subject.length > 200) errors.push('Subject is too long');
    if (data.message.length > 2000) errors.push('Message is too long');
    
    return { valid: errors.length === 0, errors };
}

function determineTicketPriority(projectType: string, message: string): 'low' | 'medium' | 'high' {
    const urgentKeywords = ['urgent', 'asap', 'emergency', 'critical', 'deadline'];
    const businessKeywords = ['collaboration', 'consulting', 'business'];
    
    const messageText = message.toLowerCase();
    
    if (urgentKeywords.some(keyword => messageText.includes(keyword))) {
        return 'high';
    }
    
    if (businessKeywords.includes(projectType) || businessKeywords.some(keyword => messageText.includes(keyword))) {
        return 'medium';
    }
    
    return 'low';
}

// Create a new ticket
export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const clientIP = await requestIp(request);
        
        // Check rate limit
        const rateLimitResult = checkRateLimit(clientIP as string);
        if (!rateLimitResult.allowed) {
            const timeRemaining = Math.ceil((rateLimitResult.timeRemaining! / (1000 * 60)));
            return NextResponse.json(
                { 
                    success: false, 
                    error: `Rate limit exceeded. Please wait ${timeRemaining} minutes before creating another ticket.`,
                    rateLimited: true
                },
                { status: 429 }
            );
        }
        
        const data: CreateTicketData = await request.json();
        
        // Validate input
        const validation = validateTicketInput(data);
        if (!validation.valid) {
            return NextResponse.json(
                { 
                    success: false, 
                    error: 'Validation failed', 
                    details: validation.errors 
                },
                { status: 400 }
            );
        }
        
        // Create ticket
        const ticketId = generateTicketId();
        const priority = determineTicketPriority(data.projectType, data.message);
        
        const newTicket = new Tickets_Model({
            id: ticketId,
            name: data.name.trim(),
            email: data.email.trim().toLowerCase(),
            subject: data.subject.trim(),
            message: data.message.trim(),
            projectType: data.projectType,
            status: 'open',
            priority,
            clientIP,
            responses: []
        });
        
        await newTicket.save();
        
        return NextResponse.json({
            success: true,
            message: 'Support ticket created successfully!',
            ticket: {
                id: ticketId,
                status: newTicket.status,
                priority: newTicket.priority,
                createdAt: newTicket.createdAt
            }
        });
        
    } catch (error) {
        console.error('Ticket creation error:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: 'Failed to create ticket. Please try again later.' 
            },
            { status: 500 }
        );
    }
}

// Get ticket by ID
export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const ticketId = searchParams.get('id');
        const email = searchParams.get('email');
        
        if (!ticketId) {
            return NextResponse.json(
                { success: false, error: 'Ticket ID is required' },
                { status: 400 }
            );
        }
        
        const ticket = await Tickets_Model.findOne({ id: ticketId.toUpperCase() });
        
        if (!ticket) {
            return NextResponse.json(
                { success: false, error: 'Ticket not found' },
                { status: 404 }
            );
        }
        
        // Verify email matches (for security)
        if (email && ticket.email !== email.toLowerCase()) {
            return NextResponse.json(
                { success: false, error: 'Access denied' },
                { status: 403 }
            );
        }
        
        // Return ticket without sensitive information
        const safeTicket = {
            id: ticket.id,
            subject: ticket.subject,
            message: ticket.message,
            projectType: ticket.projectType,
            status: ticket.status,
            priority: ticket.priority,
            createdAt: ticket.createdAt,
            updatedAt: ticket.updatedAt,
            responses: ticket.responses.map((response: any) => ({
                id: response.id,
                message: response.message,
                isAdmin: response.isAdmin,
                createdAt: response.createdAt
            }))
        };
        
        return NextResponse.json({
            success: true,
            ticket: safeTicket
        });
        
    } catch (error) {
        console.error('Ticket retrieval error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to retrieve ticket' },
            { status: 500 }
        );
    }
}
