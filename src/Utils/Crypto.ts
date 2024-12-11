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
        Data, Secret, Salt, Format, Rounds, Expires, Algorithm = EncryptionAlgorithms.AES_256_CBC
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

async function Decrypt(
    token: string, 
    Secret: string, 
    Rounds: number, 
    Algorithm: EncryptionAlgorithms = EncryptionAlgorithms.AES_256_CBC
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

export {
    Decrypt,
    Encrypt,
    EncryptionAlgorithms
};