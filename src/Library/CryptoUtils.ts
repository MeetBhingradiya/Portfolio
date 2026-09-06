/**
 * Cryptographic Utilities for Hardware Unlock
 * 
 * Handles:
 * - Ed25519 signature verification
 * - Nonce validation
 * - Key format conversions
 */

import * as ed25519 from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha2.js";

// Precompute hash function
ed25519.hashes.sha512 = sha512;

/**
 * Verify Ed25519 signature
 * 
 * @param message - The signed message (base64)
 * @param signature - The signature (base64)
 * @param publicKey - The public key (base64)
 * @returns true if signature is valid
 */
export async function verifyEdSignature(
    message: string,
    signature: string,
    publicKey: string
): Promise<boolean> {
    try {
        const messageBytes = Buffer.from(message, "base64");
        const signatureBytes = Buffer.from(signature, "base64");
        const publicKeyBytes = Buffer.from(publicKey, "base64");

        // Verify returns boolean, true if valid
        const isValid = await ed25519.verifyAsync(signatureBytes, messageBytes, publicKeyBytes);
        return isValid;
    } catch (error) {
        console.error("Signature verification error:", error);
        return false;
    }
}

/**
 * Generate Ed25519 keypair
 * 
 * Returns base64-encoded keypair suitable for storage
 */
export async function generateEdKeypair(): Promise<{
    publicKey: string;
    privateKey: string;
}> {
    const privateKey = ed25519.utils.randomSecretKey();
    const publicKey = await ed25519.getPublicKeyAsync(privateKey);

    return {
        publicKey: Buffer.from(publicKey).toString("base64"),
        privateKey: Buffer.from(privateKey).toString("base64")
    };
}

/**
 * Sign message with Ed25519 private key
 * 
 * @param message - Message to sign (base64)
 * @param privateKey - Private key (base64)
 * @returns Signature (base64)
 */
export async function signMessage(
    message: string,
    privateKey: string
): Promise<string> {
    try {
        const messageBytes = Buffer.from(message, "base64");
        const privateKeyBytes = Buffer.from(privateKey, "base64");

        const signature = await ed25519.signAsync(messageBytes, privateKeyBytes);
        return Buffer.from(signature).toString("base64");
    } catch (error) {
        console.error("Message signing error:", error);
        throw error;
    }
}

/**
 * Hash a string for challenge creation
 * 
 * Returns SHA-512 hash as base64
 */
export function hashChallenge(input: string): string {
    const hash = sha512(input);
    return Buffer.from(hash).toString("base64");
}

/**
 * Create a nonce for challenge
 * 
 * Returns random 32-byte nonce as base64
 */
export function createNonce(): string {
    return Buffer.from(ed25519.utils.randomSecretKey()).toString("base64");
}

/**
 * Validate nonce format
 */
export function isValidNonce(nonce: string): boolean {
    try {
        const decoded = Buffer.from(nonce, "base64");
        // Nonce should be 32 bytes
        return decoded.length === 32;
    } catch {
        return false;
    }
}

/**
 * Validate public key format (Ed25519 requires 32 bytes)
 */
export function isValidPublicKey(publicKey: string): boolean {
    try {
        const decoded = Buffer.from(publicKey, "base64");
        return decoded.length === 32;
    } catch {
        return false;
    }
}
