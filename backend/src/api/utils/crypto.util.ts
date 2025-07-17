import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
// It's crucial to keep this key secret and consistent. 
// For production, this should be loaded from environment variables and be a 64-character hex string (representing 32 bytes).
const ENCRYPTION_KEY = process.env.CHAT_ENCRYPTION_KEY || 'd0b578a493433618a816196288134764491c145a1656828555df38c4b62f4b52';
const IV_LENGTH = 16; // For AES, this is always 16

if (Buffer.from(ENCRYPTION_KEY, 'hex').length !== 32) {
    throw new Error('Encryption key must be a 64-character hex string (32 bytes) for aes-256-cbc.');
}

/**
 * Encrypts a piece of text.
 * @param text The text to encrypt.
 * @returns An object containing the initialization vector (iv) and the encrypted content.
 */
export const encrypt = (text: string): { iv: string; content: string } => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return {
        iv: iv.toString('hex'),
        content: encrypted.toString('hex'),
    };
};

/**
 * Decrypts a piece of text.
 * @param encrypted An object containing the iv and the encrypted content.
 * @returns The decrypted text.
 */
export const decrypt = (encrypted: { iv: string; content: string }): string => {
    const iv = Buffer.from(encrypted.iv, 'hex');
    const encryptedText = Buffer.from(encrypted.content, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}; 