import { NextRequest, NextResponse } from "next/server";
import { Sessions_Model } from "@Models/Sessions";
import { Users_Model } from "@Models/Users";
import { dbConnect } from "@Utils/dbConnect";
import { log } from "@Utils";

export interface AuthenticatedRequest extends NextRequest {
    user?: {
        UserID: string;
        Email: string;
        FirstName: string;
        LastName: string;
        Username: string;
        isAdmin?: boolean;
    };
    session?: {
        SessionID: string;
        Platform: string;
        Browser: string;
        ExpiresAt: Date;
    };
}

export interface AuthResult {
    success: boolean;
    user?: AuthenticatedRequest['user'];
    session?: AuthenticatedRequest['session'];
    error?: string;
    statusCode?: number;
}

/**
 * Middleware to authenticate user session
 * @param req NextRequest object
 * @param requireAdmin Whether admin privileges are required
 * @returns AuthResult with user and session data or error
 */
export async function authenticateUser(req: NextRequest, requireAdmin: boolean = false): Promise<AuthResult> {
    try {
        await dbConnect();

        // Get session token from cookies or Authorization header
        const sessionToken = req.cookies.get('session-token')?.value || 
                           req.headers.get('Authorization')?.replace('Bearer ', '');

        if (!sessionToken) {
            return {
                success: false,
                error: 'No session token provided',
                statusCode: 401
            };
        }

        // Find active session
        const session = await Sessions_Model.findOne({
            SessionID: sessionToken,
            ExpiresAt: { $gt: new Date() },
            isActive: true
        });

        if (!session) {
            return {
                success: false,
                error: 'Invalid or expired session',
                statusCode: 401
            };
        }

        // Find user associated with session
        const user = await Users_Model.findOne({
            UserID: session.UserID,
            isDeleted: false
        });

        if (!user) {
            return {
                success: false,
                error: 'User not found',
                statusCode: 404
            };
        }

        // Check if user account is locked or suspended
        if (user.isLocked || user.isSuspended) {
            return {
                success: false,
                error: 'Account is locked or suspended',
                statusCode: 403
            };
        }

        // Check admin requirement
        if (requireAdmin && !user.isAdmin) {
            return {
                success: false,
                error: 'Admin privileges required',
                statusCode: 403
            };
        }

        // Update session last activity
        await Sessions_Model.updateOne(
            { SessionID: sessionToken },
            { LastActivity: new Date() }
        );

        return {
            success: true,
            user: {
                UserID: user.UserID,
                Email: user.Emails.find(email => email.isPrimary)?.Email || user.Emails[0]?.Email || '',
                FirstName: user.FirstName,
                LastName: user.LastName,
                Username: user.Username,
                isAdmin: user.isAdmin
            },
            session: {
                SessionID: session.SessionID,
                Platform: session.Platform,
                Browser: session.Browser,
                ExpiresAt: session.ExpiresAt
            }
        };

    } catch (error: any) {
        log(`Authentication error: ${error?.message}`);
        return {
            success: false,
            error: 'Internal server error during authentication',
            statusCode: 500
        };
    }
}

/**
 * Higher-order function to create authenticated route handlers
 * @param handler The route handler function
 * @param requireAdmin Whether admin privileges are required
 * @returns Wrapped handler with authentication
 */
export function withAuth(
    handler: (req: AuthenticatedRequest, ...args: any[]) => Promise<NextResponse>,
    requireAdmin: boolean = false
) {
    return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
        const authResult = await authenticateUser(req, requireAdmin);

        if (!authResult.success) {
            return NextResponse.json({
                Status: 0,
                Message: authResult.error,
                StatusCode: authResult.statusCode
            }, { status: authResult.statusCode });
        }

        // Attach user and session data to request
        const authenticatedReq = req as AuthenticatedRequest;
        authenticatedReq.user = authResult.user;
        authenticatedReq.session = authResult.session;

        return handler(authenticatedReq, ...args);
    };
}

/**
 * Utility function to validate session and get user data
 * Use this in API routes that need user information
 */
export async function validateSession(sessionToken: string): Promise<AuthResult> {
    try {
        await dbConnect();

        if (!sessionToken) {
            return {
                success: false,
                error: 'Session token is required',
                statusCode: 400
            };
        }

        const session = await Sessions_Model.findOne({
            SessionID: sessionToken,
            ExpiresAt: { $gt: new Date() },
            isActive: true
        });

        if (!session) {
            return {
                success: false,
                error: 'Invalid or expired session',
                statusCode: 401
            };
        }

        const user = await Users_Model.findOne({
            UserID: session.UserID,
            isDeleted: false
        });

        if (!user) {
            return {
                success: false,
                error: 'User not found',
                statusCode: 404
            };
        }

        if (user.isLocked || user.isSuspended) {
            return {
                success: false,
                error: 'Account is locked or suspended',
                statusCode: 403
            };
        }

        return {
            success: true,
            user: {
                UserID: user.UserID,
                Email: user.Emails.find(email => email.isPrimary)?.Email || user.Emails[0]?.Email || '',
                FirstName: user.FirstName,
                LastName: user.LastName,
                Username: user.Username,
                isAdmin: user.isAdmin
            },
            session: {
                SessionID: session.SessionID,
                Platform: session.Platform,
                Browser: session.Browser,
                ExpiresAt: session.ExpiresAt
            }
        };

    } catch (error: any) {
        log(`Session validation error: ${error?.message}`);
        return {
            success: false,
            error: 'Internal server error during session validation',
            statusCode: 500
        };
    }
}
