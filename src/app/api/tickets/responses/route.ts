import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@Utils/dbConnect";
import { Tickets_Model } from "@Models/Tickets";
import { Users_Model } from "@Models/Users";
import { Sessions_Model } from "@Models/Sessions";
import { v4 } from "uuid";
import { createEmailTransport } from "@Utils/EmailSend";

// Type definitions
interface AddResponseData {
    ticketId: string;
    message: string;
    sessionID?: string; // Optional for authenticated users
    email?: string; // For anonymous users
}

function validateResponseInput(data: AddResponseData): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (!data.ticketId || data.ticketId.trim().length === 0) {
        errors.push("Ticket ID is required");
    }

    if (!data.message || data.message.trim().length < 5) {
        errors.push("Message must be at least 5 characters long");
    }

    if (data.message && data.message.length > 1000) {
        errors.push("Message is too long (max 1000 characters)");
    }

    return { valid: errors.length === 0, errors };
}

async function getUserFromSession(sessionID: string) {
    if (!sessionID) return null;

    const session = await Sessions_Model.findOne({ SessionID: sessionID });
    if (!session) return null;

    const user = await Users_Model.findOne({
        UserID: session.UserID,
        isDeleted: false,
        isLocked: false,
        isSuspended: false
    });

    return user;
}

async function sendNewResponseNotification(
    ticketId: string,
    customerName: string,
    responseMessage: string,
    isUserResponse: boolean = true
): Promise<boolean> {
    try {
        const transporter = createEmailTransport();

        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">💬 New Response to Your Ticket</h1>
                </div>
                
                <div style="padding: 30px; background-color: #f8f9fa;">
                    <div style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h2 style="color: #333; margin-top: 0;">Hi ${customerName}!</h2>
                        
                        <p style="color: #666; font-size: 16px; line-height: 1.6;">
                            ${isUserResponse ? "Your response has been added to" : "There's a new response to"} ticket <strong>${ticketId}</strong>.
                        </p>
                        
                        <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                            <h4 style="color: #333; margin: 0 0 10px 0;">${isUserResponse ? "Your Response:" : "New Response:"}</h4>
                            <p style="color: #555; margin: 0; font-style: italic;">"${responseMessage.substring(0, 200)}${responseMessage.length > 200 ? "..." : ""}"</p>
                        </div>
                        
                        <div style="text-align: center; margin-top: 30px;">
                            <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://meet-bhingradiya.vercel.app"}/tickets?id=${ticketId}" 
                               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                                🔍 View Full Conversation
                            </a>
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

        // Send to admin
        await transporter.sendMail({
            from: `"Meet Bhingradiya Support" <${process.env.SMTP_EMAIL}>`,
            to: process.env.SMTP_EMAIL, // Admin email
            subject: `💬 ${isUserResponse ? "New Customer Response" : "Response Added"} - ${ticketId}`,
            html: emailHtml
        });

        return true;
    } catch (error) {
        console.error("Failed to send response notification email:", error);
        return false;
    }
}

// Add a response to a ticket
export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const data: AddResponseData = await request.json();

        // Validate input
        const validation = validateResponseInput(data);
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

        // Find the ticket
        const ticket = await Tickets_Model.findOne({
            id: data.ticketId.toUpperCase()
        });
        if (!ticket) {
            return NextResponse.json(
                { success: false, error: "Ticket not found" },
                { status: 404 }
            );
        }

        // Check if ticket is closed
        if (ticket.status === "closed") {
            return NextResponse.json(
                {
                    success: false,
                    error: "Cannot add responses to closed tickets"
                },
                { status: 400 }
            );
        }

        let user = null;
        let isAuthorized = false;

        // Try to get user from session (for authenticated users)
        if (data.sessionID) {
            user = await getUserFromSession(data.sessionID);
            if (user) {
                // Check if user owns this ticket or if user email matches
                isAuthorized =
                    ticket.userID === user.UserID ||
                    ticket.email ===
                        user.Emails.find((e) => e.isPrimary)?.Email;
            }
        }

        // For anonymous users, verify email matches
        if (!user && data.email) {
            isAuthorized = ticket.email === data.email.toLowerCase();
        }

        if (!isAuthorized) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Access denied. You can only respond to your own tickets."
                },
                { status: 403 }
            );
        }

        // Create the response
        const responseId = v4();
        const newResponse = {
            id: responseId,
            message: data.message.trim(),
            isAdmin: false,
            createdAt: new Date()
        };

        // Add response to ticket
        ticket.responses.push(newResponse);
        ticket.updatedAt = new Date();

        // Update status if it was closed/resolved
        if (ticket.status === "resolved") {
            ticket.status = "in-progress";
        }

        await ticket.save();

        // Send notification email
        try {
            await sendNewResponseNotification(
                ticket.id,
                ticket.name,
                data.message.trim(),
                true
            );
        } catch (emailError) {
            console.error("Email notification failed:", emailError);
            // Don't fail the response if email fails
        }

        return NextResponse.json({
            success: true,
            message: "Response added successfully!",
            response: {
                id: responseId,
                message: newResponse.message,
                isAdmin: false,
                createdAt: newResponse.createdAt
            }
        });
    } catch (error) {
        console.error("Add response error:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to add response. Please try again later."
            },
            { status: 500 }
        );
    }
}
