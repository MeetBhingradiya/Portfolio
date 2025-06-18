import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@Utils/dbConnect";
import { Users_Model } from "@Models/Users";
import { OTPs_Model, OTPs } from "@Models/OneTimePass";
import { verifyJWT } from "@Utils/JWT";
import { log } from "@Utils";
import { createEmailTransport } from "@Utils/EmailSend";
import { OTP } from "@Utils/OTP";
import { Encrypt, Decrypt } from "@Utils/Crypto";
import { ControllerResponseMap } from "@Utils/ControllerResponseMap";

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
			subject: `🔐 Verify Your Email - Verification Code: ${otp}`,
			html: emailHtml,
		});

		return true;
	} catch (error) {
		log(`Failed to send OTP email: ${error}`);
		return false;
	}
}

// POST - Send OTP for email verification
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
					StatusCode: 401,
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
					StatusCode: 401,
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
					StatusCode: 400,
				},
				{ status: 400 }
			);
		}

		await dbConnect();

		// Check if email belongs to the user and is unverified
		const user = await Users_Model.findOne({
			UserID: decoded.userID,
			"Emails.Email": email,
			"Emails.isVerified": false,
		});

		if (!user) {
			return NextResponse.json(
				{
					Status: 0,
					Message: "Email not found or already verified",
					StatusCode: 404,
				},
				{ status: 404 }
			);
		}

		// Get user's latest credentials for encryption
		const latestCredentials = user.Credentials?.filter(
			(cred) => cred.isActive
		)?.sort((a, b) => b.Rounds - a.Rounds)[0];

		if (!latestCredentials) {
			return NextResponse.json(
				{
					Status: 0,
					Message: "User credentials not found",
					StatusCode: 404,
				},
				{ status: 404 }
			);
		}

		// Generate OTP
		const otpCode = OTP({
			Length: 6,
			Digits: true,
			Uppercase: false,
			Lowercase: false,
			Special: false,
		});

		// Encrypt OTP
		const encryptedOTP = await Encrypt({
			Data: String(otpCode),
			Secret: latestCredentials.Secret,
			Salt: latestCredentials.Salt || latestCredentials.Secret,
			Format: "both",
			Rounds: latestCredentials.Rounds,
		});

		// Store OTP in database
		await OTPs_Model.create({
			Type: OTPs.Email,
			Data: encryptedOTP,
			UserID: decoded.userID,
			ExpiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
		});

		// Send OTP email
		const emailSent = await sendOTPEmail(
			email,
			otpCode,
			user.FirstName || "User"
		);

		if (!emailSent) {
			return NextResponse.json(
				{
					Status: 0,
					Message: "Failed to send verification email",
					StatusCode: 500,
				},
				{ status: 500 }
			);
		}

		return NextResponse.json({
			Status: 1,
			Message: "Verification code sent to your email",
			StatusCode: 200,
			Data: {
				email: email,
				expiresIn: 15 * 60, // 15 minutes in seconds
			},
		});
	} catch (error: any) {
		log(`Send verification OTP error: ${error.message}`);
		return NextResponse.json(
			{
				Status: 0,
				Message: "Failed to send verification code",
				StatusCode: 500,
			},
			{ status: 500 }
		);
	}
}

// PUT - Verify OTP
export async function PUT(request: NextRequest) {
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
					StatusCode: 401,
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
					StatusCode: 401,
				},
				{ status: 401 }
			);
		}

		const { email, otp } = await request.json();

		if (!email || !otp) {
			return NextResponse.json(
				{
					Status: 0,
					Message: "Email and OTP are required",
					StatusCode: 400,
				},
				{ status: 400 }
			);
		}

		await dbConnect();

		// Check if email belongs to the user and is unverified
		const user = await Users_Model.findOne({
			UserID: decoded.userID,
			"Emails.Email": email,
			"Emails.isVerified": false,
		});

		if (!user) {
			return NextResponse.json(
				{
					Status: 0,
					Message: "Email not found or already verified",
					StatusCode: 404,
				},
				{ status: 404 }
			);
		}

		// Find valid OTP record
		const otpRecord = await OTPs_Model.findOne({
			Type: OTPs.Email,
			UserID: decoded.userID,
			ExpiresAt: { $gt: new Date() },
		});

		if (!otpRecord) {
			return NextResponse.json(
				{
					Status: 0,
					Message: "Invalid or expired verification code",
					StatusCode: 400,
				},
				{ status: 400 }
			);
		}

		const latestCredentials = user.Credentials?.filter(
			(cred) => cred.isActive
		)?.sort((a, b) => b.Rounds - a.Rounds)[0];

		if (!otpRecord) {
			return ControllerResponseMap({
				Status: 0,
				Message: "Invalid or expired verification code",
				StatusCode: 400,
			});
		}

		let isOTPValid = false;

		try {
			// Try to parse as JSON first (plain text format)
			const jsonData = JSON.parse(otpRecord.Data);
			if (jsonData.encrypted === false) {
				// Plain text OTP
				isOTPValid =
					jsonData.otp === otp &&
					jsonData.email === email.toLowerCase() &&
					jsonData.userID === user.UserID;
			} else {
				throw new Error("Not plain text format");
			}
		} catch (parseError) {
			// Must be encrypted format
			if (!latestCredentials) {
				return ControllerResponseMap({
					Status: 0,
					Message: "Cannot verify encrypted OTP without credentials",
					StatusCode: 400,
				});
			}

			try {
				const decryptedOTP = await Decrypt(
					otpRecord.Data,
					latestCredentials.Secret,
					latestCredentials.Rounds
				);

				// Handle both string and object results from decryption
				let actualOTP: string;
				if (typeof decryptedOTP === "string") {
					actualOTP = decryptedOTP;
				} else if (typeof decryptedOTP === "number") {
					actualOTP = String(decryptedOTP);
				} else if (
					typeof decryptedOTP === "object" &&
					decryptedOTP?.otp
				) {
					actualOTP = decryptedOTP.otp;
				} else {
					log(
						`Unexpected decrypted OTP format: ${JSON.stringify(decryptedOTP)}`
					);
					actualOTP = String(decryptedOTP);
				}

				isOTPValid = actualOTP === otp;
				log(
					`Encrypted OTP validation result: ${isOTPValid} (expected: ${otp}, actual: ${actualOTP})`
				);
			} catch (decryptError) {
				log(`OTP decryption error: ${decryptError}`);
				return ControllerResponseMap({
					Status: 0,
					Message: "Invalid verification code format",
					StatusCode: 400,
				});
			}
		}

		if (!isOTPValid) {
			return NextResponse.json(
				{
					Status: 0,
					Message: "Invalid verification code",
					StatusCode: 400,
				},
				{ status: 400 }
			);
		}

		// Update email as verified
		await Users_Model.updateOne(
			{
				UserID: decoded.userID,
				"Emails.Email": email,
			},
			{
				$set: {
					"Emails.$.isVerified": true,
					updatedAt: new Date(),
				},
			}
		);

		// Delete the used OTP
		await OTPs_Model.deleteOne({ _id: otpRecord._id });

		return NextResponse.json({
			Status: 1,
			Message: "Email verified successfully",
			StatusCode: 200,
			Data: {
				email: email,
			},
		});
	} catch (error: any) {
		log(`Verify OTP error: ${error.message}`);
		return NextResponse.json(
			{
				Status: 0,
				Message: "Failed to verify email",
				StatusCode: 500,
			},
			{ status: 500 }
		);
	}
}
