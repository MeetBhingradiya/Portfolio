import { NextRequest, NextResponse } from "next/server";
import { Users_Model } from "@Models/Users";
import { OTPs_Model, OTPs } from "@Models/OneTimePass";
import { useEmptyFields } from "@Hooks/useEmptyFields";
import { dbConnect } from "@Utils/dbConnect";
import { log } from "@Utils";
import { OTP } from "@Utils/OTP";
import { createEmailTransport } from "@Utils/EmailSend";

// Send password reset email
async function sendPasswordResetEmail(email: string, otp: string, name: string): Promise<boolean> {
    try {
        const transporter = createEmailTransport();
        await transporter.verify();

        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">🔐 Password Reset Request</h1>
                </div>
                
                <div style="padding: 30px; background-color: #f8f9fa;">
                    <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #333; margin: 0 0 20px 0;">Hi ${name}!</h2>
                        <p style="color: #666; margin: 0 0 20px 0;">
                            We received a request to reset your password. If you made this request, please use the verification code below to proceed with resetting your password:
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; display: inline-block; border: 2px dashed #ff6b6b;">
                                <p style="margin: 0 0 10px 0; color: #333; font-weight: bold;">Password Reset Code:</p>
                                <div style="font-size: 32px; font-weight: bold; color: #ff6b6b; letter-spacing: 8px; font-family: monospace;">
                                    ${otp}
                                </div>
                            </div>
                        </div>
                        
                        <div style="background: #f8d7da; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
                            <h4 style="color: #721c24; margin: 0 0 10px 0;">🚨 Security Notice</h4>
                            <ul style="color: #721c24; margin: 0; padding-left: 20px;">
                                <li>If you didn't request this password reset, please ignore this email</li>
                                <li>Your account security may be at risk if you didn't request this</li>
                                <li>Consider changing your password if you suspect unauthorized access</li>
                            </ul>
                        </div>
                        
                        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                            <h4 style="color: #856404; margin: 0 0 10px 0;">⏰ Important Notes</h4>
                            <ul style="color: #856404; margin: 0; padding-left: 20px;">
                                <li>This reset code expires in <strong>10 minutes</strong></li>
                                <li>Use this code in the password reset form</li>
                                <li>Do not share this code with anyone</li>
                                <li>You can only use this code once</li>
                            </ul>
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
            from: `"Meet Bhingradiya" <${process.env.SMTP_EMAIL}>`,
            to: email,
            subject: `🔐 Password Reset Request - Verification Code: ${otp}`,
            html: emailHtml
        });

        return true;
    } catch (error) {
        log(`Failed to send password reset email: ${error}`);
        return false;
    }
}

// POST - Send password reset OTP
export async function POST(req: NextRequest) {
    try {
        const Request = await req.json();
        
        if (useEmptyFields({
            ReqiuredFields: ["email"],
            targetObject: Request
        }).isMissing) {
            return NextResponse.json({
                Status: 0,
                Message: 'Email is required',
                StatusCode: 400
            }, { status: 400 });
        }

        await dbConnect();

        // Check if user exists with this email
        const user = await Users_Model.findOne({
            'Emails.Email': Request.email.toLowerCase(),
            isDeleted: false
        });

        if (!user) {
            // For security, we don't reveal if email exists or not
            return NextResponse.json({
                Status: 1,
                Message: 'If an account with this email exists, you will receive a password reset code.',
                StatusCode: 200
            }, { status: 200 });
        }

        // Check if account is locked or suspended
        if (user.isLocked || user.isSuspended) {
            return NextResponse.json({
                Status: 0,
                Message: 'Account is locked or suspended. Please contact support.',
                StatusCode: 403
            }, { status: 403 });
        }

        // Generate OTP for password reset
        const otpCode = OTP({
            Length: 6,
            Digits: true,
            Uppercase: false,
            Lowercase: false,
            Special: false
        });

        // Delete any existing password reset OTPs for this user
        await OTPs_Model.deleteMany({
            Type: OTPs.PasswordReset,
            Data: { $regex: `"userID":"${user.UserID}"` }
        });

        // Store OTP in database with shorter expiry for security
        await OTPs_Model.create({
            Type: OTPs.PasswordReset,
            Data: JSON.stringify({
                email: Request.email.toLowerCase(),
                otp: otpCode,
                userID: user.UserID
            }),
            ExpiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
        });

        // Send password reset email
        const emailSent = await sendPasswordResetEmail(
            Request.email,
            otpCode,
            user.FirstName || 'User'
        );

        return NextResponse.json({
            Status: 1,
            Message: emailSent 
                ? 'Password reset code sent to your email' 
                : 'If an account with this email exists, you will receive a password reset code.',
            StatusCode: 200,
            Data: emailSent ? {
                email: Request.email,
                expiresIn: 10 * 60 // 10 minutes in seconds
            } : {}
        }, { status: 200 });

    } catch (error: any) {
        log(`Password reset request error: ${error?.message}`);
        return NextResponse.json({
            Status: 0,
            Message: 'Internal server error',
            StatusCode: 500
        }, { status: 500 });
    }
}
