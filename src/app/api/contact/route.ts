import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { requestIp } from "@Lib"

// Rate limiting store (in production, use Redis or database)
const rateLimitStore = new Map<string, number>();
const RATE_LIMIT_DURATION = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Content validation (prevent spam patterns)
const SPAM_PATTERNS = [
    /\b(bitcoin|crypto|investment|loan|casino)\b/i,
    /\b(viagra|cialis|pharmacy)\b/i,
    /\b(click here|visit now|act now)\b/i,
    /(http:\/\/|https:\/\/|www\.)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g // URLs
];

interface ContactFormData {
    name: string;
    email: string;
    subject: string;
    message: string;
    projectType: string;
}

interface RateLimitResult {
    allowed: boolean;
    timeRemaining?: number;
}

function checkRateLimit(clientIP: string): RateLimitResult {
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

function validateInput(data: ContactFormData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic validation
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

    // Spam detection
    const fullText = `${data.name} ${data.subject} ${data.message}`.toLowerCase();
    for (const pattern of SPAM_PATTERNS) {
        if (pattern.test(fullText)) {
            errors.push('Message content appears to be spam');
            break;
        }
    }

    // Length limits
    if (data.name.length > 100) errors.push('Name is too long');
    if (data.subject.length > 200) errors.push('Subject is too long');
    if (data.message.length > 2000) errors.push('Message is too long');

    return { valid: errors.length === 0, errors };
}

function createEmailTransporter() {
    if (!process.env.SMTP_HOST || !process.env.SMTP_EMAIL || !process.env.SMTP_APP_PASS) {
        throw new Error('SMTP configuration is incomplete');
    }

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: 587,
        secure: false, // Use TLS
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_APP_PASS,
        },
        tls: {
            rejectUnauthorized: false
        }
    });
}

function formatTimeRemaining(milliseconds: number): string {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
}

export async function POST(request: NextRequest) {
    try {
        // Get client IP for rate limiting
        const clientIP = requestIp(request);

        // Check rate limit
        const rateLimitResult = checkRateLimit(clientIP as string);
        if (!rateLimitResult.allowed) {
            const timeRemaining = formatTimeRemaining(rateLimitResult.timeRemaining!);
            return NextResponse.json(
                {
                    success: false,
                    error: `Rate limit exceeded. Please wait ${timeRemaining} before sending another message.`,
                    rateLimited: true,
                    timeRemaining: rateLimitResult.timeRemaining
                },
                { status: 429 }
            );
        }

        // Parse request body
        const data: ContactFormData = await request.json();

        // Validate input
        const validation = validateInput(data);
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

        // Create email transporter
        const transporter = createEmailTransporter();

        // Verify SMTP connection
        await transporter.verify();

        // Prepare email content
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">New Contact Form Submission</h1>
                </div>
                
                <div style="padding: 30px; background-color: #f8f9fa;">
                    <div style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h2 style="color: #333; margin-top: 0;">Contact Details</h2>
                        
                        <div style="margin-bottom: 20px;">
                            <strong style="color: #666;">Name:</strong>
                            <p style="margin: 5px 0; color: #333;">${data.name}</p>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <strong style="color: #666;">Email:</strong>
                            <p style="margin: 5px 0; color: #333;">${data.email}</p>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <strong style="color: #666;">Project Type:</strong>
                            <p style="margin: 5px 0; color: #333;">${data.projectType}</p>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <strong style="color: #666;">Subject:</strong>
                            <p style="margin: 5px 0; color: #333;">${data.subject}</p>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <strong style="color: #666;">Message:</strong>
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0;">
                                <p style="margin: 0; color: #333; white-space: pre-wrap;">${data.message}</p>
                            </div>
                        </div>
                        
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        
                        <div style="font-size: 12px; color: #666;">
                            <p><strong>Sent from:</strong> Portfolio Contact Form</p>
                            <p><strong>IP Address:</strong> ${clientIP}</p>
                            <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                
                <div style="background: #333; padding: 20px; text-align: center; color: white; font-size: 12px;">
                    <p style="margin: 0;">This email was sent from your portfolio contact form.</p>
                </div>
            </div>
        `;

        // Send email
        const mailOptions = {
            from: `"Portfolio Contact" <${process.env.SMTP_EMAIL}>`,
            to: process.env.SMTP_EMAIL,
            replyTo: data.email,
            subject: `Portfolio Contact: ${data.subject}`,
            html: emailHtml,
            text: `
New Contact Form Submission

Name: ${data.name}
Email: ${data.email}
Project Type: ${data.projectType}
Subject: ${data.subject}

Message:
${data.message}

---
Sent from: Portfolio Contact Form
IP Address: ${clientIP}
Timestamp: ${new Date().toLocaleString()}
            `
        };

        await transporter.sendMail(mailOptions);

        // Send auto-reply to user
        const autoReplyHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">Thank You for Contacting Me!</h1>
                </div>
                
                <div style="padding: 30px; background-color: #f8f9fa;">
                    <div style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h2 style="color: #333; margin-top: 0;">Hi ${data.name}!</h2>
                        
                        <p style="color: #666; line-height: 1.6;">
                            Thank you for reaching out to me. I've received your message and will get back to you as soon as possible, 
                            usually within 24 hours.
                        </p>
                        
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <h3 style="color: #333; margin-top: 0;">Your Message Summary:</h3>
                            <p style="margin: 5px 0; color: #666;"><strong>Subject:</strong> ${data.subject}</p>
                            <p style="margin: 5px 0; color: #666;"><strong>Project Type:</strong> ${data.projectType}</p>
                        </div>
                        
                        <p style="color: #666; line-height: 1.6;">
                            In the meantime, feel free to check out my latest projects on 
                            <a href="https://github.com/MeetBhingradiya" style="color: #667eea;">GitHub</a> or 
                            connect with me on <a href="https://linkedin.com/in/meet-bhingradiya" style="color: #667eea;">LinkedIn</a>.
                        </p>
                        
                        <p style="color: #666; line-height: 1.6;">
                            Best regards,<br>
                            <strong>Meet Bhingradiya</strong>
                        </p>
                    </div>
                </div>
                
                <div style="background: #333; padding: 20px; text-align: center; color: white; font-size: 12px;">
                    <p style="margin: 0;">This is an automated response. Please do not reply to this email.</p>
                </div>
            </div>
        `;

        const autoReplyOptions = {
            from: `"Meet Bhingradiya" <${process.env.SMTP_EMAIL}>`,
            to: data.email,
            subject: `Re: ${data.subject} - Thank you for contacting me!`,
            html: autoReplyHtml,
            text: `
Hi ${data.name}!

Thank you for reaching out to me. I've received your message and will get back to you as soon as possible, usually within 24 hours.

Your Message Summary:
Subject: ${data.subject}
Project Type: ${data.projectType}

In the meantime, feel free to check out my latest projects on GitHub or connect with me on LinkedIn.

Best regards,
Meet Bhingradiya

---
This is an automated response. Please do not reply to this email.
            `
        };

        await transporter.sendMail(autoReplyOptions);

        return NextResponse.json({
            success: true,
            message: 'Message sent successfully! I\'ll get back to you soon.',
            autoReply: true
        });

    } catch (error) {
        console.error('Contact form error:', error);

        // Don't expose internal errors to client
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to send message. Please try again later or contact me directly.',
                internal: false
            },
            { status: 500 }
        );
    }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
