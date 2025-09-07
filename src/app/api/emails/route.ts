import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@Utils/dbConnect";
import { Users_Model } from "@/Models/Willbe/Users";
import { OTPs_Model, OTPs } from "@Models/OneTimePass";
import { verifyJWT } from "@Utils/JWT";
import { log } from "@Utils";
import { createEmailTransport } from "@Utils/EmailSend";
import { OTP } from "@Utils/OTP";
import { Encrypt } from "@Utils/Crypto";

// Helper function to send verification email
async function sendVerificationEmail(
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
                    <h1 style="color: white; margin: 0;">🔐 Email Verification</h1>
                </div>
                
                <div style="padding: 30px; background-color: #f8f9fa;">
                    <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #333; margin: 0 0 20px 0;">Hi ${name}!</h2>
                        <p style="color: #666; margin: 0 0 20px 0;">
                            Please verify your email address by entering the verification code below:
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
                                <li>Enter this code in your dashboard to verify your email</li>
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
            subject: `🔐 Email Verification - Code: ${otp}`,
            html: emailHtml
        });

        return true;
    } catch (error) {
        log(`Failed to send verification email: ${error}`);
        return false;
    }
}

// Add email
export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get("authorization");
        const token =
            authHeader?.replace("Bearer ", "") ||
            request.cookies.get("auth-token")?.value;

        if (!token) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Authentication token required",
                    StatusCode: 401
                },
                { status: 401 }
            );
        }

        const decoded = await verifyJWT(token);
        if (!decoded) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Invalid authentication token",
                    StatusCode: 401
                },
                { status: 401 }
            );
        }

        const { email } = await request.json();

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Valid email address is required",
                    StatusCode: 400
                },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check if email already exists for this user or another user
        const existingUser = await Users_Model.findOne({
            "Emails.Email": email
        });

        if (existingUser) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Email address is already registered",
                    StatusCode: 409
                },
                { status: 409 }
            );
        }

        // Add email to user's account
        const updatedUser = await Users_Model.findOneAndUpdate(
            { UserID: decoded.userID },
            {
                $push: {
                    Emails: {
                        Email: email,
                        isPrimary: false,
                        isVerified: false,
                        addedAt: new Date()
                    }
                },
                updatedAt: new Date()
            },
            { new: true }
        ).select("Emails FirstName Credentials");

        if (!updatedUser) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "User not found",
                    StatusCode: 404
                },
                { status: 404 }
            );
        }

        // Get user's latest credentials for encryption
        const latestCredentials = updatedUser.Credentials?.filter(
            (cred: any) => cred.isActive
        )?.sort((a: any, b: any) => b.Rounds - a.Rounds)[0];
        if (!latestCredentials) {
            log(
                `User ${decoded.userID} added email: ${email} - no credentials for verification`
            );
            return NextResponse.json({
                Status: 1,
                Message: "Email added successfully",
                StatusCode: 200,
                Data: {
                    email: email,
                    message:
                        "Email added. Please verify manually using the verification option."
                }
            });
        }

        // Just add the email without automatically sending verification
        log(
            `User ${decoded.userID} added email: ${email} - verification can be requested manually`
        );
        return NextResponse.json({
            Status: 1,
            Message: "Email added successfully",
            StatusCode: 200,
            Data: {
                email: email,
                message:
                    "Email added successfully. Click verify to send verification code."
            }
        });
    } catch (error: any) {
        log(`Add email error: ${error.message}`);
        return NextResponse.json(
            {
                Status: 0,
                Message: "Failed to add email",
                StatusCode: 500
            },
            { status: 500 }
        );
    }
}

// Update email (set primary)
export async function PATCH(request: NextRequest) {
    try {
        const authHeader = request.headers.get("authorization");
        const token =
            authHeader?.replace("Bearer ", "") ||
            request.cookies.get("auth-token")?.value;

        if (!token) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Authentication token required",
                    StatusCode: 401
                },
                { status: 401 }
            );
        }

        const decoded = await verifyJWT(token);
        if (!decoded) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Invalid authentication token",
                    StatusCode: 401
                },
                { status: 401 }
            );
        }

        const { email, setPrimary } = await request.json();

        if (!email) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Email address is required",
                    StatusCode: 400
                },
                { status: 400 }
            );
        }

        await dbConnect();
        if (setPrimary) {
            // Check if the email is verified before setting as primary
            const user = await Users_Model.findOne({
                "UserID": decoded.userID,
                "Emails.Email": email
            });

            if (!user) {
                return NextResponse.json(
                    {
                        Status: 0,
                        Message: "Email not found",
                        StatusCode: 404
                    },
                    { status: 404 }
                );
            }

            const emailData = user.Emails.find((e) => e.Email === email);
            if (!emailData?.isVerified) {
                return NextResponse.json(
                    {
                        Status: 0,
                        Message: "Cannot set unverified email as primary",
                        StatusCode: 400
                    },
                    { status: 400 }
                );
            }

            // First, unset all emails as primary
            await Users_Model.updateOne(
                { UserID: decoded.userID },
                { $set: { "Emails.$[].isPrimary": false } }
            );

            // Then set the specified email as primary
            const result = await Users_Model.updateOne(
                {
                    "UserID": decoded.userID,
                    "Emails.Email": email
                },
                {
                    $set: {
                        "Emails.$.isPrimary": true,
                        "updatedAt": new Date()
                    }
                }
            );

            if (result.matchedCount === 0) {
                return NextResponse.json(
                    {
                        Status: 0,
                        Message: "Email not found",
                        StatusCode: 404
                    },
                    { status: 404 }
                );
            }

            log(`User ${decoded.userID} set primary email: ${email}`);
        }

        return NextResponse.json({
            Status: 1,
            Message: "Email updated successfully",
            StatusCode: 200
        });
    } catch (error: any) {
        log(`Update email error: ${error.message}`);
        return NextResponse.json(
            {
                Status: 0,
                Message: "Failed to update email",
                StatusCode: 500
            },
            { status: 500 }
        );
    }
}

// Remove email
export async function DELETE(request: NextRequest) {
    try {
        const authHeader = request.headers.get("authorization");
        const token =
            authHeader?.replace("Bearer ", "") ||
            request.cookies.get("auth-token")?.value;

        if (!token) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Authentication token required",
                    StatusCode: 401
                },
                { status: 401 }
            );
        }

        const decoded = await verifyJWT(token);
        if (!decoded) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Invalid authentication token",
                    StatusCode: 401
                },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const email = searchParams.get("email");

        if (!email) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Email address is required",
                    StatusCode: 400
                },
                { status: 400 }
            );
        }

        await dbConnect();

        // Get user first to check if they have multiple emails
        const user = await Users_Model.findOne({
            UserID: decoded.userID
        }).select("Emails");

        if (!user || user.Emails.length <= 1) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Cannot remove the only email address",
                    StatusCode: 400
                },
                { status: 400 }
            );
        }

        // Check if trying to remove primary email
        const emailToRemove = user.Emails.find((e) => e.Email === email);
        if (emailToRemove?.isPrimary) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message:
                        "Cannot remove primary email. Set another email as primary first.",
                    StatusCode: 400
                },
                { status: 400 }
            );
        }

        // Remove the email
        const result = await Users_Model.updateOne(
            { UserID: decoded.userID },
            {
                $pull: { Emails: { Email: email } },
                updatedAt: new Date()
            }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Email not found",
                    StatusCode: 404
                },
                { status: 404 }
            );
        }

        log(`User ${decoded.userID} removed email: ${email}`);

        return NextResponse.json({
            Status: 1,
            Message: "Email removed successfully",
            StatusCode: 200
        });
    } catch (error: any) {
        log(`Remove email error: ${error.message}`);
        return NextResponse.json(
            {
                Status: 0,
                Message: "Failed to remove email",
                StatusCode: 500
            },
            { status: 500 }
        );
    }
}
