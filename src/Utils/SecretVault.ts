import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const ENC_PREFIX = "enc:v1:";

function getVaultSecret(): string {
    const secret =
        process.env.AI_PROVIDER_ENCRYPTION_KEY?.trim() ||
        process.env.BETTER_AUTH_SECRET?.trim() ||
        "";

    if (!secret) {
        throw new Error("Missing AI provider encryption secret. Set AI_PROVIDER_ENCRYPTION_KEY or BETTER_AUTH_SECRET.");
    }

    return secret;
}

function deriveKey(secret: string): Buffer {
    return createHash("sha256").update(secret).digest();
}

export function encryptStoredSecret(plainText: string): string {
    const trimmed = plainText.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith(ENC_PREFIX)) return trimmed;

    const key = deriveKey(getVaultSecret());
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv);

    const encrypted = Buffer.concat([
        cipher.update(Buffer.from(trimmed, "utf8")),
        cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return `${ENC_PREFIX}${iv.toString("base64url")}:${authTag.toString("base64url")}:${encrypted.toString("base64url")}`;
}

export function decryptStoredSecret(value: string): string {
    const raw = value?.trim() || "";
    if (!raw) return "";
    if (!raw.startsWith(ENC_PREFIX)) return raw;

    const payload = raw.slice(ENC_PREFIX.length);
    const [ivB64, tagB64, cipherB64] = payload.split(":");

    if (!ivB64 || !tagB64 || !cipherB64) {
        throw new Error("Invalid encrypted secret format");
    }

    const key = deriveKey(getVaultSecret());
    const iv = Buffer.from(ivB64, "base64url");
    const authTag = Buffer.from(tagB64, "base64url");
    const encrypted = Buffer.from(cipherB64, "base64url");

    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
}

export function isEncryptedSecret(value: string): boolean {
    return (value?.trim() || "").startsWith(ENC_PREFIX);
}
