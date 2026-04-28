/// <reference types="node" />

import crypto from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

export interface CryptoKeys {
    publicKey: string;
    privateKey: string;
}

function getKeyPaths(privateRepoDir: string, keysSubdir: string) {
    const keysDir = join(privateRepoDir, keysSubdir);
    return {
        keysDir,
        publicKeyPath: join(keysDir, "public.pem"),
        privateKeyPath: join(keysDir, "private.pem")
    };
}

function generateRSAKeys(): CryptoKeys {
    const pair = crypto.generateKeyPairSync("rsa", {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: "spki",
            format: "pem"
        },
        privateKeyEncoding: {
            type: "pkcs8",
            format: "pem"
        }
    });

    return { publicKey: pair.publicKey, privateKey: pair.privateKey };
}

export function loadRepoKeys(privateRepoDir: string, keysSubdir: string): CryptoKeys {
    const paths = getKeyPaths(privateRepoDir, keysSubdir);

    if (!existsSync(paths.publicKeyPath) || !existsSync(paths.privateKeyPath)) {
        throw new Error("RSA keys not found in private repository.");
    }

    const publicKey = readFileSync(paths.publicKeyPath, "utf8");
    const privateKey = readFileSync(paths.privateKeyPath, "utf8");

    return { publicKey, privateKey };
}

export function ensureRepoKeys(privateRepoDir: string, keysSubdir: string): CryptoKeys {
    const paths = getKeyPaths(privateRepoDir, keysSubdir);

    if (existsSync(paths.publicKeyPath) && existsSync(paths.privateKeyPath)) {
        return loadRepoKeys(privateRepoDir, keysSubdir);
    }

    const keys = generateRSAKeys();
    mkdirSync(paths.keysDir, { recursive: true });
    writeFileSync(paths.publicKeyPath, keys.publicKey, "utf8");
    writeFileSync(paths.privateKeyPath, keys.privateKey, "utf8");
    return keys;
}

function rsaEncryptBuffer(buffer: Buffer, publicKey: string): Buffer {
    const encrypted = crypto.publicEncrypt(
        {
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256"
        },
        buffer
    );

    return encrypted;
}

function rsaDecryptBuffer(encryptedBuffer: Buffer, privateKey: string): Buffer {
    const decrypted = crypto.privateDecrypt(
        {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256"
        },
        encryptedBuffer
    );

    return decrypted;
}

export function encryptLargeBuffer(fileContent: Buffer, publicKey: string): Buffer {
    // Use AES-256-GCM for large files, encrypt the key with RSA
    const aesKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-gcm", aesKey, iv);

    let encrypted = cipher.update(fileContent);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Encrypt the AES key with RSA
    const encryptedAesKey = rsaEncryptBuffer(aesKey, publicKey);

    // Combine: [encrypted AES key length (4 bytes)] + [encrypted AES key] + [IV] + [auth tag] + [encrypted content]
    const keyLengthBuffer = Buffer.alloc(4);
    keyLengthBuffer.writeUInt32BE(encryptedAesKey.length);

    return Buffer.concat([keyLengthBuffer, encryptedAesKey, iv, authTag, encrypted]);
}

export function decryptLargeBuffer(encryptedBuffer: Buffer, privateKey: string): Buffer {
    // Extract components
    const keyLength = encryptedBuffer.readUInt32BE(0);
    let offset = 4;

    const encryptedAesKey = encryptedBuffer.slice(offset, offset + keyLength);
    offset += keyLength;

    const iv = encryptedBuffer.slice(offset, offset + 16);
    offset += 16;

    const authTag = encryptedBuffer.slice(offset, offset + 16);
    offset += 16;

    const encrypted = encryptedBuffer.slice(offset);

    // Decrypt the AES key with RSA
    const aesKey = rsaDecryptBuffer(encryptedAesKey, privateKey);

    // Decrypt content with AES
    const decipher = crypto.createDecipheriv("aes-256-gcm", aesKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted;
}
