/**
 *  @FileID          Utils\Crypto.ts
 *  @Description     Currently, there is no description available.
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  @license
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, folks, or modification of this file,
 *  via any medium even in public/private repository, is strictly prohibited without
 *  prior written consent from the author, modifier or the organization.
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is hosted on GitHub, which is a repository hosting service provided by Microsoft. 
 *  This project is not officially affiliated with, endorsed by, or in any way associated 
 *  with GitHub or Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------
 *  Last Updated on Version: 1.0.10
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 03/03/25 8:11 AM IST (Kolkata +5:30 UTC)
 */


import crypto from "crypto";

enum EncryptionAlgorithms {
    AES_128_CBC = "aes-128-cbc",
    AES_192_CBC = "aes-192-cbc",
    AES_128_GCM = "aes-128-gcm",
    AES_192_GCM = "aes-192-gcm",
    AES_256_CFB = "aes-256-cfb",
    AES_256_OFB = "aes-256-ofb",
    AES_256_CBC = "aes-256-cbc",
    AES_256_GCM = "aes-256-gcm",
    AES_256_CTR = "aes-256-ctr",
    // SHA1 = "sha1",
    // SHA224 = "sha224",
    // SHA256 = "sha256",
    // SHA384 = "sha384",
    // SHA512 = "sha512",
    // MD5 = "md5",
    // RIPEMD160 = "rmd160",
    // SHA224WithRSAEncryption = "sha224WithRSAEncryption",
    // RSASHA224 = "RSA-SHA224",
    // SHA256WithRSAEncryption = "sha256WithRSAEncryption",
    // RSASHA256 = "RSA-SHA256",
    // SHA384WithRSAEncryption = "sha384WithRSAEncryption",
    // RSASHA384 = "RSA-SHA384",
    // SHA512WithRSAEncryption = "sha512WithRSAEncryption",
    // RSASHA512 = "RSA-SHA512",
    // RSASHA1 = "RSA-SHA1",
    // ECDSAWITHSHA1 = "ecdsa-with-SHA1",
    // DSA_SHA = "DSA-SHA",
    // DSA_SHA1 = "DSA-SHA1",
    // DSA = "DSA",
    // DSA_WITH_SHA224 = "DSA-WITH-SHA224",
    // DSA_SHA224 = "DSA-SHA224",
    // DSA_WITH_SHA256 = "DSA-WITH-SHA256",
    // DSA_SHA256 = "DSA-SHA256",
    // DSA_WITH_SHA384 = "DSA-WITH-SHA384",
    // DSA_SHA384 = "DSA-SHA384",
    // DSA_WITH_SHA512 = "DSA-WITH-SHA512",
    // DSA_SHA512 = "DSA-SHA512",
    // DSA_RIPEMD160 = "DSA-RIPEMD160",
    // RIPEMD160WithRSA = "ripemd160WithRSA",
    // RSA_RIPEMD160 = "RSA-RIPEMD160",
    // MD5WithRSAEncryption = "md5WithRSAEncryption",
    // RSA_MD5 = "RSA-MD5"
}

interface EncryptOptions {
    Data: Record<string, any> | string | Buffer;
    Secret: string;
    Salt: string;
    Format: "front" | "back" | "both";
    Rounds?: number;
    Expires?: Date | number;
    Algorithm?: EncryptionAlgorithms;
}

interface TokenPayload {
    iv: string;
    salt: string;
    encryptedData: string;
    expires?: number;
}

const applySalt = (data: string, salt: string, format: "front" | "back" | "both") => {
    if (format === "front") return salt + data;
    if (format === "back") return data + salt;
    return salt + data + salt;
};

async function Encrypt(options: EncryptOptions): Promise<string> {
    const {
        Data, Secret, Salt, Format, Rounds, Expires, Algorithm = EncryptionAlgorithms.AES_256_CTR
    } = options;

    const serializedData = typeof Data === "object" ? JSON.stringify(Data) : Data.toString();

    const key = crypto.pbkdf2Sync(Secret, Salt, Rounds ? Rounds : 10, 32, "sha256");
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(Algorithm, key, iv);

    const saltedData = applySalt(serializedData, Salt, Format);
    let encrypted = cipher.update(saltedData, "utf-8", "hex");
    encrypted += cipher.final("hex");

    const token: TokenPayload = {
        iv: iv.toString("hex"),
        salt: Salt,
        encryptedData: encrypted,
        expires: Expires ? new Date(Expires).getTime() : undefined,
    };

    return Buffer.from(JSON.stringify(token)).toString("base64");
}

/**
 * Decrypts an encoded token and returns its original content.
 *
 * This function decodes a base64-encoded token containing encryption details, including an initialization vector, salt, encrypted data, and an optional expiration timestamp. If the token has expired, the function returns null. Otherwise, it derives a decryption key from the provided secret and salt using PBKDF2 with the specified rounds, decrypts the encrypted data using the given algorithm, and removes the salt from the decrypted output. If the resulting string is valid JSON, it returns the parsed object; otherwise, it returns the decrypted string.
 *
 * @param token - A base64-encoded string representing the token payload.
 * @param Secret - The secret used to derive the decryption key.
 * @param Rounds - The number of iterations for key derivation; a falsy value defaults to 10.
 * @param Algorithm - The encryption algorithm used for decryption; defaults to AES_256_CTR.
 * @returns A promise that resolves with the decrypted content, or null if the token has expired.
 */
async function Decrypt(
    token: string,
    Secret: string,
    Rounds: number,
    Algorithm: EncryptionAlgorithms = EncryptionAlgorithms.AES_256_CTR
): Promise<any | null> {
    const decoded = JSON.parse(Buffer.from(token, "base64").toString()) as TokenPayload;

    if (decoded.expires && Date.now() > decoded.expires) return null;

    const key = crypto.pbkdf2Sync(Secret, decoded.salt, Rounds ? Rounds : 10, 32, "sha256");
    const decipher = crypto.createDecipheriv(Algorithm, key, Buffer.from(decoded.iv, "hex"));

    let decrypted = decipher.update(decoded.encryptedData, "hex", "utf-8");
    decrypted += decipher.final("utf-8");

    const cleanedData = decrypted.replaceAll(decoded.salt, "");

    try {
        return JSON.parse(cleanedData);
    } catch {
        return cleanedData;
    }
}

/**
 * Generates a cryptographically secure random salt as a hexadecimal string.
 *
 * This function creates a salt by generating a specified number of random bytes using
 * a cryptographic random number generator, then converts the bytes to a hexadecimal string.
 * By default, it generates 64 random bytes, resulting in a 128-character hexadecimal string.
 *
 * @param length - The number of random bytes to generate (default is 64).
 * @returns A hexadecimal string representing the generated salt.
 */
function generateSalt(length: number = 64): string {
    return crypto.randomBytes(length).toString("hex");
}

/**
 * Returns a random integer between 1 and 10.
 *
 * The returned value can be used as the number of rounds for cryptographic key derivation.
 *
 * @returns A random integer between 1 and 10, inclusive.
 */
function generateRounds(): number {
    return Math.floor(Math.random() * 10) + 1;
}

/**
 * Generates a secret string for cryptographic use.
 *
 * The returned string is prefixed with "DO_NOT_SHARE_THIS_" followed by a 32-byte random hexadecimal value.
 *
 * @example
 * const secret = generateSecret();
 * // secret might be "DO_NOT_SHARE_THIS_a3d7f045e8b9..."
 *
 * @returns A unique secret string.
 */
function generateSecret(): string {
    return `DO_NOT_SHARE_THIS_${crypto.randomBytes(32).toString("hex")}`;
}

export {
    Decrypt,
    Encrypt,
    EncryptionAlgorithms,
    generateSalt,
    generateRounds,
    generateSecret
};