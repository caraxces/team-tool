import pool from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { encrypt, decrypt } from '../api/utils/crypto.util';

export interface Message extends RowDataPacket {
  id: number;
  uuid: string;
  conversation_id: number;
  sender_id: number;
  content: string; // This will be the decrypted content when sent to the client
  iv?: string; // IV won't be sent to the client
  created_at: string;
}

/**
 * Creates and stores an encrypted message.
 * @param conversationId The ID of the conversation.
 * @param senderId The ID of the user sending the message.
 * @param plainTextContent The raw, unencrypted message content.
 * @returns The newly created message object (with decrypted content).
 */
export const createMessage = async (conversationId: number, senderId: number, plainTextContent: string): Promise<Message> => {
    // 1. Encrypt the content
    const { iv, content: encryptedContent } = encrypt(plainTextContent);
    const messageUuid = uuidv4();

    // 2. Store the encrypted content and IV in the database
    const [result] = await pool.query<ResultSetHeader>(`
        INSERT INTO messages (uuid, conversation_id, sender_id, content, iv)
        VALUES (?, ?, ?, ?, ?)
    `, [messageUuid, conversationId, senderId, encryptedContent, iv]);

    const newMessageId = result.insertId;

    // 3. Fetch the message to return it (without the IV)
    const [messageRows] = await pool.query<Message[]>(
        'SELECT id, uuid, conversation_id, sender_id, content, created_at FROM messages WHERE id = ?',
        [newMessageId]
    );

    const newMessage = messageRows[0];
    
    // 4. Decrypt content for the response object, so the client gets plain text
    // Note: The 'content' in the database is encrypted. We use the 'iv' from step 1.
    const decryptedContent = decrypt({ iv, content: newMessage.content });
    
    return { ...newMessage, content: decryptedContent };
}; 