import crypto from 'crypto';

function CreateRSAKeys() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });

    return { publicKey, privateKey };
}

function EncryptRSAData(data: string, publicKey: string) {
    const buffer = Buffer.from(data, 'utf-8');
    const encrypted = crypto.publicEncrypt(publicKey, buffer);
    return encrypted.toString('base64');
}

function DecryptRSAData(encryptedData: string, privateKey: string) {
    const buffer = Buffer.from(encryptedData, 'base64');
    const decrypted = crypto.privateDecrypt(privateKey, buffer);
    return decrypted.toString('utf-8');
}

export const RSA = {
    CreateRSAKeys,
    EncryptRSAData,
    DecryptRSAData
}

// Usage example
// const plaintext = 'Hello, World!';
// const encrypted = encrypt(plaintext, publicKey);
// const decrypted = decrypt(encrypted, privateKey);

// console.log('Plaintext:', plaintext);
// console.log('Encrypted:', encrypted);
// console.log('Decrypted:', decrypted);