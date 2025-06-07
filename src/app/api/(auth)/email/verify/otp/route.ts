import { NextRequest, NextResponse } from "next/server";
import { Users_Model } from "@Models/Users";
import { OTPs_Model, OTPs } from "@Models/OneTimePass";
import { useEmptyFields } from "@Hooks/useEmptyFields";
import { dbConnect } from "@Utils/dbConnect";
import { log } from "@Utils";
import { createEmailTransport } from "@Utils/EmailSend";
import { OTP } from "@Utils/OTP";
import { ControllerResponseMap } from "@Utils/ControllerResponseMap";
import { Decrypt } from "@Utils/Crypto";

async function sendOTPEmail(email: string, otp: string, name: string): Promise<boolean> {
    try {
        const transporter = createEmailTransport();
        await transporter.verify();

        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">🔐 Email Verification</h1>
                </div>
                
                <div style="padding: 30px; background-color: #f8f9fa;">
                    <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #333; margin: 0 0 20px 0;">Hi ${name}!</h2>
                        <p style="color: #666; margin: 0 0 20px 0;">
                            Thank you for signing up! Please verify your email address by entering the verification code below:
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; display: inline-block; border: 2px dashed #667eea;">
                                <p style="margin: 0 0 10px 0; color: #333; font-weight: bold;">Your Verification Code:</p>
                                <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: monospace;">
                                    ${otp}
                                </div>
                            </div>
                        </div>
                        
                        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                            <h4 style="color: #856404; margin: 0 0 10px 0;">⏰ Important Notes</h4>
                            <ul style="color: #856404; margin: 0; padding-left: 20px;">
                                <li>This verification code expires in <strong>15 minutes</strong></li>
                                <li>Enter this code in the signup form to verify your email</li>
                                <li>If you didn't request this, please ignore this email</li>
                                <li>Do not share this code with anyone</li>
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
            subject: `🔐 Verify Your Email - Verification Code: ${otp}`,
            html: emailHtml
        });

        return true;
    } catch (error) {
        log(`Failed to send OTP email: ${error}`);
        return false;
    }
}

// POST - Send OTP for email verification
export async function POST(req: NextRequest) {
    try {
        const Request = await req.json();
        
        if (useEmptyFields({
            ReqiuredFields: ["email"],
            targetObject: Request
        }).isMissing) {
            return NextResponse.json({
                Status: 0,
                Message: 'Missing required fields',
                StatusCode: 400
            }, { status: 400 });
        }

        await dbConnect();

        const user = await Users_Model.findOne({
            'Emails.Email': Request.email.toLowerCase(),
            'Emails.isVerified': false
        });

        if (!user) {
            return NextResponse.json({
                Status: 0,
                Message: 'User not found or email already verified',
                StatusCode: 404
            }, { status: 404 });
        }

        // Generate OTP
        const otpCode = OTP({
            Length: 6,
            Digits: true,
            Uppercase: false,
            Lowercase: false,
            Special: false
        });

        // Store OTP in database
        await OTPs_Model.create({
            Type: OTPs.Email,
            Data: JSON.stringify({
                email: Request.email.toLowerCase(),
                otp: otpCode,
                userID: user.UserID
            }),
            ExpiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
        });

        // Send OTP email
        const emailSent = await sendOTPEmail(
            Request.email,
            otpCode,
            user.FirstName || 'User'
        );

        if (!emailSent) {
            return NextResponse.json({
                Status: 0,
                Message: 'Failed to send verification email',
                StatusCode: 500
            }, { status: 500 });
        }

        return NextResponse.json({
            Status: 1,
            Message: 'Verification code sent to your email',
            StatusCode: 200,
            Data: {
                email: Request.email,
                expiresIn: 15 * 60 // 15 minutes in seconds
            }
        }, { status: 200 });

    } catch (error: any) {
        log(`OTP send error: ${error?.message}`);
        return NextResponse.json({
            Status: 0,
            Message: 'Internal server error',
            StatusCode: 500
        }, { status: 500 });
    }
}

// PUT - Verify OTP
export async function PUT(req: NextRequest) {
    try {
        const Request = await req.json();
        
        if (useEmptyFields({
            ReqiuredFields: ["email", "otp"],
            targetObject: Request
        }).isMissing) {
            return ControllerResponseMap({
                Status: 0,
                Message: 'Missing required fields',
                StatusCode: 400
            })
        }

        await dbConnect();

        const User = await Users_Model.findOne({
            'Emails.Email': Request.email.toLowerCase(),
            'Emails.isVerified': false
        });

        if (!User) {
            return ControllerResponseMap({
                Status: 0,
                Message: 'User not found or email already verified',
                StatusCode: 404
            });
        }

        // ? Extract Latest Credentials to Encrypt OTP & Match with OtpRecord.Data
        const latestCredentials = User.Credentials
            .filter(cred => cred.isActive)
            .sort((a, b) => b.Rounds - a.Rounds)[0];

        if (!latestCredentials) {
            return ControllerResponseMap({
                Status: 0,
                Message: 'Please set your password before verifying your email',
                StatusCode: 404
            });
        }

        const otpRecord = await OTPs_Model.findOne({
            Type: OTPs.Email,
            ExpiresAt: { $gt: new Date() }
        });

        if (!otpRecord) {
            return ControllerResponseMap({
                Status: 0,
                Message: 'Invalid Verification Code',
                StatusCode: 400
            });
        }

        const DecryptedOTP = await Decrypt(
            otpRecord.Data,
            latestCredentials.Secret,
            latestCredentials.Rounds
        );

        const isSameOTP = parseInt(DecryptedOTP) === parseInt(Request.otp)

        if (!isSameOTP) {
            return ControllerResponseMap({
                Status: 0,
                Message: 'Invalid Verification Code',
                StatusCode: 400
            });
        }

        await Users_Model.updateOne(
            { 
                UserID: User.UserID,
                'Emails.Email': Request.email.toLowerCase()
            },
            { 
                $set: { 'Emails.$.isVerified': true }
            }
        );

        await OTPs_Model.deleteOne({ _id: otpRecord._id });

        return ControllerResponseMap({
            Status: 1,
            Message: 'Email verified successfully',
            StatusCode: 200,
            Data: {
                userID: otpRecord.UserID,
                email: Request.email
            }
        });

    } catch (error: any) {
        log(`OTP verification error: ${error?.message}`);
        return ControllerResponseMap({
            Status: 0,
            Message: 'Internal server error',
            StatusCode: 500
        });
    }
}
