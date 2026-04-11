import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const ENCRYPTION_VERSION = "vault-v1";

function getVaultFileSecret(): string {
    const secret =
        process.env.VAULT_FILE_ENCRYPTION_KEY?.trim() ||
        process.env.AI_PROVIDER_ENCRYPTION_KEY?.trim() ||
        process.env.BETTER_AUTH_SECRET?.trim() ||
        "";

    if (!secret) {
        throw new Error(
            "Missing vault encryption key. Set VAULT_FILE_ENCRYPTION_KEY, AI_PROVIDER_ENCRYPTION_KEY, or BETTER_AUTH_SECRET."
        );
    }

    return secret;
}

function deriveKey(secret: string): Buffer {
    return createHash("sha256").update(secret).digest();
}

export function getVaultEncryptionVersion(): string {
    return ENCRYPTION_VERSION;
}

export function encryptVaultBuffer(plainBuffer: Buffer): {
    encryptedBuffer: Buffer;
    iv: string;
    authTag: string;
} {
    const key = deriveKey(getVaultFileSecret());
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    const encryptedBuffer = Buffer.concat([cipher.update(plainBuffer), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
        encryptedBuffer,
        iv: iv.toString("base64url"),
        authTag: authTag.toString("base64url")
    };
}

export function decryptVaultBuffer(
    encryptedBuffer: Buffer,
    ivBase64Url?: string,
    authTagBase64Url?: string
): Buffer {
    if (!ivBase64Url || !authTagBase64Url) {
        throw new Error("Missing decryption metadata for encrypted vault chunk");
    }

    const key = deriveKey(getVaultFileSecret());
    const iv = Buffer.from(ivBase64Url, "base64url");
    const authTag = Buffer.from(authTagBase64Url, "base64url");

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
}
