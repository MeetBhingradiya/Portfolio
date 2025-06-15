import { SignJWT, jwtVerify, importJWK } from 'jose';
import { Config } from '@Config';

const JWT_SECRET = Config.Env.JWT_SECRET || "your-super-secret-jwt-key";

export interface JWTPayload {
    [x: string]: any;
    userID: string;
    email: string;
    username: string;
    sessionID: string;
    iat?: number;
    exp?: number;
}

export async function generateAuthToken(payload: Omit<JWTPayload, 'iat' | 'exp'>, expiresIn: string = '30d'): Promise<string> {
    try {
        const secret = await importJWK({ kty: 'oct', k: JWT_SECRET });
        
        const jwt = await new SignJWT(payload)
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime(expiresIn)
            .sign(secret);
            
        return jwt;
    } catch (error) {
        throw new Error(`JWT generation failed: ${error}`);
    }
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
    try {
        const secret = await importJWK({ kty: 'oct', k: JWT_SECRET });
        
        const { payload } = await jwtVerify(token, secret);
        return payload as JWTPayload;
    } catch (error) {
        return null;
    }
}