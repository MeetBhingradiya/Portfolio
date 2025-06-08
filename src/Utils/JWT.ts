import * as jose from 'jose';
import { Config } from '@Config';
import { log } from '@Utils';

/**
 * JWT utility functions for token generation and verification
 */

interface AuthJWTPayload {
    userID: string;
    email: string;
    username: string;
    sessionID: string;
    iat?: number;
    exp?: number;
    iss?: string;
    aud?: string;
}

/**
 * Generate a JWT token for authenticated user
 * @param payload User data to include in token
 * @param expiresIn Token expiration (default: 30 days)
 * @returns Signed JWT token
 */
export async function generateAuthToken(
    payload: Omit<AuthJWTPayload, 'iat' | 'exp' | 'iss' | 'aud'>,
    expiresIn: string = '30d'
): Promise<string> {
    try {
        const secret = new TextEncoder().encode(Config.Env.JWT_SECRET || 'fallback-secret');
        
        const token = await new jose.SignJWT({
            userID: payload.userID,
            email: payload.email,
            username: payload.username,
            sessionID: payload.sessionID
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setIssuer('meetbhingradiya-auth')
            .setAudience('meetbhingradiya-client')
            .setExpirationTime(expiresIn)
            .sign(secret);
            
        return token;
    } catch (error: any) {
        log(`JWT generation error: ${error?.message}`);
        throw new Error('Failed to generate authentication token');
    }
}

/**
 * Verify and decode a JWT token
 * @param token JWT token to verify
 * @returns Decoded payload if valid, null if invalid
 */
export async function verifyAuthToken(token: string): Promise<AuthJWTPayload | null> {
    try {
        if (!token) return null;
        
        const secret = new TextEncoder().encode(Config.Env.JWT_SECRET || 'fallback-secret');
        const { payload } = await jose.jwtVerify(token, secret, {
            issuer: 'meetbhingradiya-auth',
            audience: 'meetbhingradiya-client'
        });        
        return payload as unknown as AuthJWTPayload;
    } catch (error: any) {
        log(`JWT verification error: ${error?.message}`);
        return null;
    }
}

/**
 * Check if a JWT token is expired
 * @param token JWT token to check
 * @returns Boolean indicating if token is expired
 */
export async function isTokenExpired(token: string): Promise<boolean> {
    try {
        const payload = await verifyAuthToken(token);
        if (!payload || !payload.exp) return true;
        
        return Date.now() >= payload.exp * 1000;
    } catch (error) {
        return true;
    }
}

/**
 * Extract token from Authorization header or cookies
 * @param authHeader Authorization header value
 * @param cookieToken Token from cookies
 * @returns Extracted token or null
 */
export function extractToken(authHeader?: string | null, cookieToken?: string): string | null {
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    
    return cookieToken || null;
}

/**
 * Check if a JWT token should be considered expired due to inactivity
 * @param sessionID Session ID from JWT payload
 * @returns Boolean indicating if token is expired due to inactivity
 */
export async function isTokenExpiredDueToInactivity(sessionID: string): Promise<boolean> {
    try {
        const { dbConnect } = await import('@Utils/dbConnect');
        const { Sessions_Model } = await import('@Models/Sessions');
        
        await dbConnect();
        
        const session = await Sessions_Model.findOne({
            SessionID: sessionID,
            isActive: true
        });
        
        if (!session) return true;
          // Check if last activity was more than 7 days ago
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const lastActivity = session.LastActivity || (session as any).createdAt;
        
        return lastActivity < sevenDaysAgo;
    } catch (error) {
        log(`Inactivity check error: ${error}`);
        return true; // Treat errors as expired for security
    }
}

/**
 * Update session activity timestamp
 * @param sessionID Session ID to update
 */
export async function updateSessionActivity(sessionID: string): Promise<void> {
    try {
        const { dbConnect } = await import('@Utils/dbConnect');
        const { Sessions_Model } = await import('@Models/Sessions');
        
        await dbConnect();
        
        await Sessions_Model.updateOne(
            { SessionID: sessionID },
            { 
                LastActivity: new Date(),
                $inc: { ActivityCount: 1 } // Track usage frequency
            }
        );
    } catch (error) {
        log(`Session activity update error: ${error}`);
    }
}
