import { NextRequest, NextResponse } from "next/server";
import { Users_Model, IUser } from "@Models/Users";
import { OTPs_Model, IOTP, OTPs } from "@Models/OneTimePass";
import { useEmptyFields } from "@Hooks/useEmptyFields";
import { Config } from "@Config";
import {
    Encrypt,
    generateSalt,
    generateRounds,
    generateSecret
} from "@Utils/Crypto";
import { dbConnect } from "@Utils/dbConnect";
import { log } from "@Utils";
import { OTP } from "@Utils/OTP";
import { createEmailTransport } from "@Utils/EmailSend";

async function sendOTPEmail(
    email: string,
    otp: string,
    name: string
): Promise<boolean> {
    try {
        const transporter = createEmailTransport();
        await transporter.verify();

        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">🎉 Welcome to Our Platform!</h1>
                </div>
                
                <div style="padding: 30px; background-color: #f8f9fa;">
                    <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #333; margin: 0 0 20px 0;">Hi ${name}!</h2>
                        <p style="color: #666; margin: 0 0 20px 0;">
                            Congratulations! Your account has been created successfully. To complete your registration, please verify your email address by entering the verification code below:
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; display: inline-block; border: 2px dashed #667eea;">
                                <p style="margin: 0 0 10px 0; color: #333; font-weight: bold;">Your Verification Code:</p>
                                <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: monospace;">
                                    ${otp}
                                </div>
                            </div>
                        </div>
                        
                        <div style="background: #d1ecf1; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17a2b8;">
                            <h4 style="color: #0c5460; margin: 0 0 10px 0;">🎯 Next Steps</h4>
                            <ul style="color: #0c5460; margin: 0; padding-left: 20px;">
                                <li>Enter this code in the verification form</li>
                                <li>Complete your profile setup</li>
                                <li>Start using our platform features</li>
                            </ul>
                        </div>
                        
                        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                            <h4 style="color: #856404; margin: 0 0 10px 0;">⏰ Important Notes</h4>
                            <ul style="color: #856404; margin: 0; padding-left: 20px;">
                                <li>This verification code expires in <strong>15 minutes</strong></li>
                                <li>If you didn't create this account, please ignore this email</li>
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
            subject: `🎉 Welcome! Verify Your Email - Verification Code: ${otp}`,
            html: emailHtml
        });

        return true;
    } catch (error) {
        log(`Failed to send OTP email: ${error}`);
        return false;
    }
}

export async function POST(req: NextRequest) {
    const rawBody = await req.json();
    const Body = {
        email: String(rawBody.email || ""),
        password: String(rawBody.password || ""),
        username: String(rawBody.username || ""),
        firstname: String(rawBody.firstname || ""),
        lastname: String(rawBody.lastname || ""),
        dateofbirth: String(rawBody.dateofbirth || ""),
        gender: String(rawBody.gender || "")
    };

    // ? Check if required fields are missing
    if (
        useEmptyFields({
            ReqiuredFields: [
                "email",
                "password",
                "firstname",
                "lastname",
                "gender",
                "dateofbirth"
            ],
            targetObject: Body
        }).isMissing
    ) {
        return NextResponse.json(
            {
                Status: 0,
                Message: "Missing required fields",
                StatusCode: 400
            },
            { status: 400 }
        );
    }

    // ^ TODO:  Validations
    // ? Email Regex & Domain Whitelist on State Collection
    // ? Email on Users Collection
    // ? Password Decrypt & Validate (Length, Special Characters, Uppercase, Lowercase, Digits)
    // ? Username Regex & Users Collection
    // ? Minimum Age Check on State Collection

    try {
        await dbConnect();

        // ? Check if email is already registered
        const FindUser = await Users_Model.findOne({
            "Emails.Email": Body.email.toLowerCase()
        });

        if (FindUser) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Account already exists with this email",
                    StatusCode: 400
                },
                { status: 400 }
            );
        }

        // ? Encrypt Password using the crypto system
        const salt = generateSalt();
        const rounds = generateRounds();
        const secret = generateSecret();

        const encryptedPassword = await Encrypt({
            Data: Body.password,
            Secret: secret,
            Salt: salt,
            Format: "both",
            Rounds: rounds
        });

        // ? Create new user
        const newUser = await Users_Model.create({
            Emails: [
                {
                    Email: Body.email.toLowerCase(),
                    isPrimary: true,
                    isVerified: false
                }
            ],
            Credentials: [
                {
                    Salt: salt,
                    Secret: secret,
                    Data: encryptedPassword,
                    Rounds: rounds,
                    isActive: true
                }
            ],
            Username: Body.username || Config.DatabaseBydefualt.SignupUsername,
            FirstName: Body.firstname,
            LastName: Body.lastname,
            DateOfBirth: new Date(Body.dateofbirth),
            Gender: Body.gender,
            isLocked: false,
            isSuspended: false,
            isDeleted: false
        });

        // ? Generate OTP for Email Verification
        const otpCode = OTP({
            Length: 6,
            Digits: true,
            Uppercase: false,
            Lowercase: false,
            Special: false
        });

        const encryptedOTP = await Encrypt({
            Data: otpCode,
            Secret: secret,
            Salt: salt,
            Format: "both",
            Rounds: rounds
        });

        await OTPs_Model.create({
            Type: OTPs.Email,
            Data: encryptedOTP, // ? This will Unlocked only with Latest Users Credentials
            UserID: newUser.UserID,
            ExpiresAt: new Date(Date.now() + 10 * 60 * 1000) // ? 10 minutes
        });

        const emailSent = await sendOTPEmail(
            Body.email,
            otpCode,
            Body.firstname
        );

        if (!emailSent) {
            log(
                `Failed to send verification email to ${Body.email} for user ${newUser.UserID}`
            );
        }

        return NextResponse.json(
            {
                Status: 1,
                Message: emailSent
                    ? "Account created successfully! Please check your email for verification code."
                    : "Account created successfully! Verification email failed to send - please request a new one.",
                StatusCode: 200,
                Data: {
                    UserID: newUser.UserID,
                    Email: Body.email,
                    EmailSent: emailSent,
                    OTPExpiresIn: 15 * 60 // 15 minutes in seconds
                }
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Signup error:", error);
        return NextResponse.json(
            {
                Status: 0,
                Message: "Internal server error",
                StatusCode: 500
            },
            { status: 500 }
        );
    }
}
