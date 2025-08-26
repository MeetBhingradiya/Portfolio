import { importJWK, SignJWT, jwtVerify, EncryptJWT, jwtDecrypt } from "jose";

// Edge Runtime compatible crypto utilities using Web Crypto API and jose

interface EncryptOptions {
    Data: Record<string, any> | string;
    Secret: string;
    Salt?: string;
    Format?: "string" | "base64" | "hex" | "both";
    Rounds?: number;
}

interface DecryptOptions {
    Data: string;
    Secret: string;
    Rounds?: number;
}

/**
 * Encrypt data using JWE (JSON Web Encryption) - Edge Runtime compatible
 */
export async function EdgeEncrypt(options: EncryptOptions): Promise<string> {
    try {
        const { Data, Secret, Format = "string" } = options;
        
        // Convert data to string if it's an object
        const dataString = typeof Data === "object" ? JSON.stringify(Data) : String(Data);
        
        // Create a JWK from the secret
        const secret = await importJWK({ 
            kty: "oct", 
            k: btoa(Secret).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, ''),
            alg: "A256GCM"
        });

        // Encrypt using JWE
        const jwe = await new EncryptJWT({ data: dataString })
            .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
            .setIssuedAt()
            .setExpirationTime('24h')
            .encrypt(secret);

        return jwe;
    } catch (error) {
        throw new Error(`Edge encryption failed: ${error}`);
    }
}

/**
 * Decrypt JWE encrypted data - Edge Runtime compatible
 */
export async function EdgeDecrypt(data: string, secret: string): Promise<string> {
    try {
        // Create a JWK from the secret
        const secretKey = await importJWK({ 
            kty: "oct", 
            k: btoa(secret).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, ''),
            alg: "A256GCM"
        });

        // Decrypt the JWE
        const { payload } = await jwtDecrypt(data, secretKey);
        
        return payload.data as string;
    } catch (error) {
        throw new Error(`Edge decryption failed: ${error}`);
    }
}

/**
 * Generate a cryptographically secure random string - Edge Runtime compatible
 */
export function generateSalt(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate random rounds for additional security
 */
export function generateRounds(): number {
    const array = new Uint8Array(1);
    crypto.getRandomValues(array);
    return 10 + (array[0] % 6); // Random between 10-15
}

/**
 * Generate a secret key
 */
export function generateSecret(length: number = 64): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a password using Web Crypto API - Edge Runtime compatible
 */
export async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
    const actualSalt = salt || generateSalt();
    const encoder = new TextEncoder();
    const data = encoder.encode(password + actualSalt);
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return { hash, salt: actualSalt };
}

/**
 * Verify a password against a hash - Edge Runtime compatible
 */
export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
    const { hash: newHash } = await hashPassword(password, salt);
    return newHash === hash;
}

/**
 * Simple symmetric encryption using Web Crypto API for basic use cases
 */
export async function simpleEncrypt(text: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    // Create key from secret
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret.padEnd(32, '0').slice(0, 32)),
        { name: "AES-GCM" },
        false,
        ["encrypt"]
    );
    
    // Generate IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt
    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        keyMaterial,
        data
    );
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    // Convert to base64
    return btoa(String.fromCharCode(...combined));
}

/**
 * Simple symmetric decryption using Web Crypto API
 */
export async function simpleDecrypt(encryptedData: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    
    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    // Create key from secret
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret.padEnd(32, '0').slice(0, 32)),
        { name: "AES-GCM" },
        false,
        ["decrypt"]
    );
    
    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        keyMaterial,
        encrypted
    );
    
    // Convert back to string
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
}

// Backward compatibility aliases
export const Encrypt = EdgeEncrypt;
export const Decrypt = EdgeDecrypt;
