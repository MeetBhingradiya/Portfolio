import crypto from 'crypto';

/**
 * Generates a cryptographically secure random token of specified length
 * @param length Length of the token to generate
 * @returns Secure random token string
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hashes a string using SHA-256 algorithm
 * @param input String to hash
 * @returns Hashed string
 */
export function hashString(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Encrypts data using AES-256 algorithm
 * @param data Data to encrypt
 * @param key Encryption key
 * @returns Encrypted data as base64 string
 */
export function encryptData(data: string, key: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    crypto.createHash('sha256').update(key).digest('base64').substr(0, 32),
    iv
  );
  
  let encrypted = cipher.update(data, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypts data encrypted with AES-256 algorithm
 * @param encryptedData Data to decrypt (format: 'iv:encryptedData')
 * @param key Decryption key
 * @returns Decrypted data as string
 */
export function decryptData(encryptedData: string, key: string): string {
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    crypto.createHash('sha256').update(key).digest('base64').substr(0, 32),
    iv
  );
  
  let decrypted = decipher.update(parts[1], 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Verifies if a token is valid by comparing its hash
 * @param plainToken Plain text token to verify
 * @param hashedToken Hashed token to compare against
 * @returns Boolean indicating if token is valid
 */
export function verifyToken(plainToken: string, hashedToken: string): boolean {
  return hashString(plainToken) === hashedToken;
}

/**
 * Generates a time-limited access token with expiration
 * @param payload Data to include in token
 * @param expiryMinutes Minutes until token expiration
 * @param secretKey Secret key for signing
 * @returns Signed token string
 */
export function generateTimedAccessToken(
  payload: Record<string, any>,
  expiryMinutes: number = 60,
  secretKey: string
): string {
  const expiryTime = Date.now() + expiryMinutes * 60 * 1000;
  const data = JSON.stringify({
    ...payload,
    exp: expiryTime
  });
  
  return encryptData(data, secretKey);
}

/**
 * Validates a timed access token
 * @param token Token to validate
 * @param secretKey Secret key for verification
 * @returns Decoded payload if valid, null if invalid or expired
 */
export function validateTimedAccessToken(
  token: string,
  secretKey: string
): Record<string, any> | null {
  try {
    const decrypted = decryptData(token, secretKey);
    const payload = JSON.parse(decrypted);
    
    // Check if token is expired
    if (payload.exp && payload.exp < Date.now()) {
      return null; // Token expired
    }
    
    return payload;
  } catch (error) {
    return null; // Invalid token
  }
}