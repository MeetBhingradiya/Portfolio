import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken, extractToken } from "@Utils/JWT";
import { Users_Model } from "@Models/Users";
import { Sessions_Model } from "@Models/Sessions";
import { dbConnect } from "@Utils/dbConnect";
import { log } from "@Utils";

export interface AuthenticatedRequest extends NextRequest {
    user?: {
        UserID: string;
        Email: string;
        Username: string;
        FirstName: string;
        LastName: string;
        isAdmin: boolean;
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
 * Middleware to authenticate JWT tokens and validate user session
 * @param req NextRequest object
 * @param requireAdmin Whether admin privileges are required
 * @returns AuthResult with user and session data or error
 */
export async function authenticateJWT(req: NextRequest, requireAdmin: boolean = false): Promise<AuthResult> {
    try {
        await dbConnect();

        // Extract JWT token from Authorization header or cookies
        const authHeader = req.headers.get('Authorization');
        const cookieToken = req.cookies.get('auth-token')?.value;
        const token = extractToken(authHeader, cookieToken);

        if (!token) {
            return {
                success: false,
                error: 'No authentication token provided',
                statusCode: 401
            };
        }

        // Verify JWT token
        const payload = await verifyAuthToken(token);
        if (!payload) {
            return {
                success: false,
                error: 'Invalid or expired token',
                statusCode: 401
            };
        }

        // Find active session
        const session = await Sessions_Model.findOne({
            SessionID: payload.sessionID,
            ExpiresAt: { $gt: new Date() },
            isActive: true
        });

        if (!session) {
            return {
                success: false,
                error: 'Session not found or expired',
                statusCode: 401
            };
        }

        // Find user associated with session
        const user = await Users_Model.findOne({
            UserID: payload.userID,
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
            { SessionID: payload.sessionID },
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
        log(`JWT authentication error: ${error?.message}`);
        return {
            success: false,
            error: 'Internal server error during authentication',
            statusCode: 500
        };
    }
}

/**
 * Higher-order function to protect API routes with JWT authentication
 * @param handler The API route handler
 * @param requireAdmin Whether admin privileges are required
 * @returns Protected route handler
 */
export function withJWTAuth(
    handler: (req: AuthenticatedRequest, res?: NextResponse) => Promise<NextResponse>,
    requireAdmin: boolean = false
) {
    return async (req: NextRequest): Promise<NextResponse> => {
        const authResult = await authenticateJWT(req, requireAdmin);
        
        if (!authResult.success) {
            return NextResponse.json({
                Status: 0,
                Message: authResult.error,
                StatusCode: authResult.statusCode
            }, { status: authResult.statusCode || 500 });
        }

        // Attach user and session to request
        const authenticatedReq = req as AuthenticatedRequest;
        authenticatedReq.user = authResult.user;
        authenticatedReq.session = authResult.session;

        return handler(authenticatedReq);
    };
}

/**
 * Utility function to validate JWT token and get user data
 * Use this in API routes that need user information
 */
export async function validateJWTSession(token: string): Promise<AuthResult> {
    try {
        await dbConnect();

        if (!token) {
            return {
                success: false,
                error: 'Token is required',
                statusCode: 400
            };
        }

        const payload = await verifyAuthToken(token);
        if (!payload) {
            return {
                success: false,
                error: 'Invalid or expired token',
                statusCode: 401
            };
        }

        const session = await Sessions_Model.findOne({
            SessionID: payload.sessionID,
            ExpiresAt: { $gt: new Date() },
            isActive: true
        });

        if (!session) {
            return {
                success: false,
                error: 'Session not found or expired',
                statusCode: 401
            };
        }

        const user = await Users_Model.findOne({
            UserID: payload.userID,
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
        log(`JWT session validation error: ${error?.message}`);
        return {
            success: false,
            error: 'Internal server error during session validation',
            statusCode: 500
        };
    }
}
