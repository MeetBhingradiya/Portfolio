/**
 * Email OTP 2FA API Route
 * Sends verification codes via email for two-factor authentication
 */

import { auth } from "@/Library/auth";
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Create email transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

// Generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { action } = body;

        if (action === "send") {
            // Generate and send OTP
            const otp = generateOTP();
            const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

            // Store OTP in session or database
            // For now, we'll use a simple in-memory store (replace with database in production)
            // TODO: Store in MongoDB with expiration

            // Send email
            const transporter = createTransporter();
            await transporter.sendMail({
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
                to: session.user.email,
                subject: "Your Verification Code - Meet Bhingradiya Portfolio",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Verification Code</h2>
                        <p>Your verification code for two-factor authentication is:</p>
                        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                            ${otp}
                        </div>
                        <p style="color: #666;">This code will expire in 10 minutes.</p>
                        <p style="color: #666; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
                    </div>
                `,
            });

            return NextResponse.json({ 
                success: true,
                message: "Verification code sent to your email" 
            });

        } else if (action === "verify") {
            // Verify OTP
            const { code } = body;

            if (!code) {
                return NextResponse.json({ error: "Code is required" }, { status: 400 });
            }

            // TODO: Verify OTP from database
            // For now, return success (implement proper verification in production)

            return NextResponse.json({ 
                success: true,
                message: "Email verification enabled" 
            });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error: any) {
        console.error("Email OTP error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
