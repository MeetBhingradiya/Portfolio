import { NextRequest, NextResponse } from "next/server";
import { useEmptyFields } from "@Hooks/useEmptyFields";
import { Users_Model } from "@Models/Users";
import { Sessions_Model } from "@Models/Sessions";
import { Passkeys_Model } from "@Models/Passkeys";
import { Decrypt } from "@Utils/Crypto";
import { RSA } from "@Utils/RSA";
import { log } from "@Utils";
import { dbConnect } from "@Utils/dbConnect";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    try {
        let Request = await req.json();
        if (useEmptyFields({
            ReqiuredFields: [
                "email",
                "password"
            ],
            targetObject: Request
        }).isMissing) {
            return NextResponse.json({
                Status: 0,
                Message: 'Missing required fields',
                StatusCode: 400
            }, { status: 400 });
        }

        await dbConnect();

        // Find user by email
        const user = await Users_Model.findOne({
            'Emails.Email': Request.email.toLowerCase(),
            'Emails.isVerified': true,
            isDeleted: false,
            isLocked: false,
            isSuspended: false
        });

        if (!user) {
            return NextResponse.json({
                Status: 0,
                Message: 'Invalid email or password',
                StatusCode: 401
            }, { status: 401 });
        }

        // Verify password (you'll need to implement password verification)
        // For now, I'll create a basic implementation
        const isValidPassword = await verifyUserPassword(user, Request.password);
        
        if (!isValidPassword) {
            return NextResponse.json({
                Status: 0,
                Message: 'Invalid email or password',
                StatusCode: 401
            }, { status: 401 });
        }

        // Create session
        const sessionData = await createUserSession(user, req);

        return NextResponse.json({
            Status: 1,
            Message: 'Login successful',
            StatusCode: 200,
            Data: {
                user: {
                    UserID: user.UserID,
                    Username: user.Username,
                    FirstName: user.FirstName,
                    LastName: user.LastName,
                    Email: user.Emails.find(e => e.isPrimary)?.Email
                },
                session: sessionData
            }
        }, { status: 200 });

    } catch (error: any) {
        log(error?.message);
        return NextResponse.json({
            Status: 0,
            Message: 'Internal server error',
            StatusCode: 500
        }, {
            status: 500
        });
    }
}

// Helper function to verify password
async function verifyUserPassword(user: any, password: string): Promise<boolean> {
    try {
        // Get the active credential
        const activeCredential = user.Credentials?.find((cred: any) => cred.isActive);
        
        if (!activeCredential) {
            return false;
        }

        // Decrypt the stored password using the user's credential data
        const decryptedPassword = await Decrypt(
            activeCredential.Data,
            activeCredential.Secret,
            activeCredential.Rounds
        );

        // Compare the provided password with the decrypted stored password
        return password === decryptedPassword;
    } catch (error) {
        log(`Password verification error: ${error}`);
        return false;
    }
}

// Helper function to create user session
async function createUserSession(user: any, req: NextRequest) {
    try {        // Generate RSA key pairs for session encryption
        const localStorageRSAKey = RSA.CreateRSAKeys();
        const cookieRSAKey = RSA.CreateRSAKeys();

        // Create RSA key records in database for tracking permissions
        // const localStorageRSARecord = await RSAKeys_Model.create({
        //     Permissions: [RSAKeyPermissions.Local]
        // });

        // const cookieRSARecord = await RSAKeys_Model.create({
        //     Permissions: [RSAKeyPermissions.Cookies]
        // });

        // Generate access token
        const accessToken = crypto.randomBytes(64).toString('hex');

        // Get user agent and headers
        const userAgent = req.headers.get('user-agent') || 'Unknown';
        const unknownHeaders: any[] = [];
        
        // Parse user agent for platform and browser detection
        const platform = detectPlatform(userAgent);
        const browser = detectBrowser(userAgent);        // Create session with expiration
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        
        const session = await Sessions_Model.create({
            UserID: user.UserID,
            LocalStorage_RSAKeyID: "null",
            Cookie_RSAKeyID: "null",
            AccessToken: accessToken,
            UserAgent: userAgent,
            UnknownRequestHeaders: unknownHeaders,
            DetectedExtensions: [],
            Platform: platform,
            Browser: browser,
            IPDataMappedResponse: {
                IP: getClientIP(req),
                City: 'Unknown',
                Region: 'Unknown',
                RegionCode: 'Unknown',
                Country: 'Unknown'
            },
            ExpiresAt: expiresAt
        });        return {
            sessionID: session.SessionID,
            accessToken: accessToken,
            localStorageKey: localStorageRSAKey.publicKey,
            cookieKey: cookieRSAKey.publicKey,
            expiresAt: expiresAt
        };
    } catch (error) {
        log(`Session creation error: ${error}`);
        throw new Error('Failed to create session');
    }
}

// Helper function to detect platform from user agent
function detectPlatform(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'MacOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
    return 'Unknown';
}

// Helper function to detect browser from user agent
function detectBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    if (userAgent.includes('Arc')) return 'Arc';
    return 'Unknown';
}

// Helper function to get client IP
function getClientIP(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return req.headers.get('x-real-ip') || 'Unknown';
}