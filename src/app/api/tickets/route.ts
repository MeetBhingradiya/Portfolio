import { NextRequest, NextResponse } from "next/server";
import { requestIp } from "@Lib";
import { dbConnect } from "@Utils/dbConnect";
import { Tickets_Model, ITicket } from "@Models/Tickets";
import { createEmailTransport } from "@Utils/EmailSend";

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
    projectType:
        | "general"
        | "web-development"
        | "mobile-app"
        | "collaboration"
        | "consulting"
        | "other";
}

function generateTicketId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `TICKET-${timestamp}-${random}`.toUpperCase();
}

function checkRateLimit(clientIP: string): {
    allowed: boolean;
    timeRemaining?: number;
} {
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

function validateTicketInput(data: CreateTicketData): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length < 2) {
        errors.push("Name must be at least 2 characters long");
    }

    if (!data.email || !EMAIL_REGEX.test(data.email)) {
        errors.push("Please provide a valid email address");
    }

    if (!data.subject || data.subject.trim().length < 5) {
        errors.push("Subject must be at least 5 characters long");
    }

    if (!data.message || data.message.trim().length < 10) {
        errors.push("Message must be at least 10 characters long");
    }

    if (data.name.length > 100) errors.push("Name is too long");
    if (data.subject.length > 200) errors.push("Subject is too long");
    if (data.message.length > 2000) errors.push("Message is too long");

    return { valid: errors.length === 0, errors };
}

function determineTicketPriority(
    projectType: string,
    message: string
): "low" | "medium" | "high" {
    const urgentKeywords = [
        "urgent",
        "asap",
        "emergency",
        "critical",
        "deadline"
    ];
    const businessKeywords = ["collaboration", "consulting", "business"];

    const messageText = message.toLowerCase();

    if (urgentKeywords.some((keyword) => messageText.includes(keyword))) {
        return "high";
    }

    if (
        businessKeywords.includes(projectType) ||
        businessKeywords.some((keyword) => messageText.includes(keyword))
    ) {
        return "medium";
    }

    return "low";
}

async function sendTicketConfirmationEmail(
    ticketId: string,
    customerEmail: string,
    customerName: string,
    subject: string,
    priority: string
): Promise<boolean> {
    try {
        const transporter = createEmailTransport();

        // Verify SMTP connection
        await transporter.verify();

        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">🎫 Support Ticket Created</h1>
                </div>
                
                <div style="padding: 30px; background-color: #f8f9fa;">
                    <div style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h2 style="color: #333; margin-top: 0;">Hi ${customerName}!</h2>
                        
                        <p style="color: #666; font-size: 16px; line-height: 1.6;">
                            Your support ticket has been successfully created. We've received your request and will get back to you soon.
                        </p>
                        
                        <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                            <h3 style="color: #333; margin: 0 0 15px 0;">Ticket Details</h3>
                            <p style="margin: 8px 0;"><strong>Ticket ID:</strong> <span style="background: #667eea; color: white; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${ticketId}</span></p>
                            <p style="margin: 8px 0;"><strong>Subject:</strong> ${subject}</p>
                            <p style="margin: 8px 0;"><strong>Priority:</strong> <span style="text-transform: capitalize; color: ${priority === "high" ? "#e74c3c" : priority === "medium" ? "#f39c12" : "#27ae60"};">${priority}</span></p>
                            <p style="margin: 8px 0;"><strong>Status:</strong> <span style="color: #27ae60;">Open</span></p>
                        </div>
                        
                        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                            <h4 style="color: #856404; margin: 0 0 10px 0;">📝 Important Information</h4>
                            <ul style="color: #856404; margin: 0; padding-left: 20px;">
                                <li>Save your <strong>Ticket ID</strong> for future reference</li>
                                <li>You can track your ticket status at any time</li>
                                <li>We'll notify you when there are updates</li>
                                <li>Typical response time: 24-48 hours</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center; margin-top: 30px;">
                            <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://meet-bhingradiya.vercel.app"}/tickets?id=${ticketId}&email=${encodeURIComponent(customerEmail)}" 
                               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                                🔍 Track Your Ticket
                            </a>
                        </div>
                        
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                            <p style="color: #999; font-size: 14px; margin: 0;">
                                Need help? Reply to this email or contact us directly.
                            </p>
                        </div>
                    </div>
                </div>
                
                <div style="background: #343a40; padding: 20px; text-align: center;">
                    <p style="color: #adb5bd; margin: 0; font-size: 14px;">
                        © ${new Date().getFullYear()} Meet Bhingradiya. All rights reserved.
                    </p>
                </div>
            </div>
        `;

        await transporter.sendMail({
            from: `"Meet Bhingradiya Support" <${process.env.SMTP_EMAIL}>`,
            to: customerEmail,
            subject: `🎫 Ticket Created: ${ticketId} - ${subject}`,
            html: emailHtml
        });

        return true;
    } catch (error) {
        console.error("Failed to send ticket confirmation email:", error);
        return false;
    }
}

// Create a new ticket
export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const clientIP = await requestIp(request);

        // Check rate limit
        // const rateLimitResult = checkRateLimit(clientIP as string);
        // if (!rateLimitResult.allowed) {
        //     const timeRemaining = Math.ceil((rateLimitResult.timeRemaining! / (1000 * 60)));
        //     return NextResponse.json(
        //         {
        //             success: false,
        //             error: `Rate limit exceeded. Please wait ${timeRemaining} minutes before creating another ticket.`,
        //             rateLimited: true
        //         },
        //         { status: 429 }
        //     );
        // }

        const data: CreateTicketData = await request.json();

        // Validate input
        const validation = validateTicketInput(data);
        if (!validation.valid) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Validation failed",
                    details: validation.errors
                },
                { status: 400 }
            );
        }

        // Create ticket
        const ticketId = generateTicketId();
        const priority = determineTicketPriority(
            data.projectType,
            data.message
        );
        const newTicket = new Tickets_Model({
            id: ticketId,
            name: data.name.trim(),
            email: data.email.trim().toLowerCase(),
            subject: data.subject.trim(),
            message: data.message.trim(),
            projectType: data.projectType,
            status: "open",
            priority,
            clientIP,
            responses: [] // Explicitly set empty array to avoid subdocument index issues
        });
        await newTicket.save();

        // Send confirmation email to the customer
        let emailSent = false;
        try {
            emailSent = await sendTicketConfirmationEmail(
                ticketId,
                data.email.trim().toLowerCase(),
                data.name.trim(),
                data.subject.trim(),
                priority
            );
        } catch (emailError) {
            console.error("Email sending failed:", emailError);
        }

        return NextResponse.json({
            success: true,
            message: "Support ticket created successfully!",
            ticket: {
                id: ticketId,
                status: newTicket.status,
                priority: newTicket.priority,
                createdAt: newTicket.createdAt
            },
            emailSent: emailSent
        });
    } catch (error) {
        console.error("Ticket creation error:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to create ticket. Please try again later."
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
        const ticketId = searchParams.get("id");
        const email = searchParams.get("email");

        if (!ticketId) {
            return NextResponse.json(
                { success: false, error: "Ticket ID is required" },
                { status: 400 }
            );
        }

        const ticket = await Tickets_Model.findOne({
            id: ticketId.toUpperCase()
        });

        if (!ticket) {
            return NextResponse.json(
                { success: false, error: "Ticket not found" },
                { status: 404 }
            );
        }

        // Verify email matches (for security)
        if (email && ticket.email !== email.toLowerCase()) {
            return NextResponse.json(
                { success: false, error: "Access denied" },
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
        console.error("Ticket retrieval error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to retrieve ticket" },
            { status: 500 }
        );
    }
}
