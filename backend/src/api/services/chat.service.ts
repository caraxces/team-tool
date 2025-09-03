import pool from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { encrypt, decrypt } from '../utils/crypto.util';
import { createMessageNotification, createMentionNotification } from './notification.service';

export const findOrCreateConversation = async (currentUserId: number, otherUserId: number): Promise<number> => {
    // Case 1: Self-chat
    if (currentUserId === otherUserId) {
        // Look for an existing self-chat conversation
        const findSelfQuery = `
            SELECT c.id as conversation_id
            FROM conversations c
            JOIN conversation_participants cp ON c.id = cp.conversation_id
            WHERE c.type = 'self' AND cp.user_id = ?;
        `;
        const [selfRows] = await pool.query<RowDataPacket[]>(findSelfQuery, [currentUserId]);

        if (selfRows.length > 0) {
            return selfRows[0].conversation_id;
        }

        // No self-chat found, create one.
        const connection = await pool.getConnection();
        await connection.beginTransaction();
        try {
            const conversationUuid = uuidv4();
            const [convResult] = await connection.query<ResultSetHeader>(
                `INSERT INTO conversations (uuid, type) VALUES (?, 'self')`,
                [conversationUuid]
            );
            const conversationId = convResult.insertId;

            await connection.query(
                `INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)`,
                [conversationId, currentUserId]
            );

            await connection.commit();
            return conversationId;
        } catch (error) {
            await connection.rollback();
            console.error("Failed to create self-conversation:", error);
            throw new Error("Could not start self-conversation.");
        } finally {
            connection.release();
        }
    }

    // Case 2: Chat with another user (DM)
    const findDmQuery = `
        SELECT conversation_id
        FROM conversation_participants
        WHERE user_id IN (?, ?)
        GROUP BY conversation_id
        HAVING COUNT(DISTINCT user_id) = 2 AND
               (SELECT COUNT(*) FROM conversation_participants cp_inner WHERE cp_inner.conversation_id = conversation_participants.conversation_id) = 2;
    `;
    const [dmRows] = await pool.query<RowDataPacket[]>(findDmQuery, [currentUserId, otherUserId]);

    if (dmRows.length > 0) {
        return dmRows[0].conversation_id;
    }

    // If no DM found, create a new one
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
        const conversationUuid = uuidv4();
        const [convResult] = await connection.query<ResultSetHeader>(
            `INSERT INTO conversations (uuid, type) VALUES (?, 'dm')`,
            [conversationUuid]
        );
        const conversationId = convResult.insertId;

        await connection.query(
            `INSERT INTO conversation_participants (conversation_id, user_id) VALUES ?`,
            [[[conversationId, currentUserId], [conversationId, otherUserId]]]
        );

        await connection.commit();
        return conversationId;
    } catch (error) {
        await connection.rollback();
        console.error("Failed to create DM conversation:", error);
        throw new Error("Could not start DM conversation.");
    } finally {
        connection.release();
    }
};

export interface Message {
    id: number;
    uuid: string;
    content: string; // Decrypted content
    createdAt: string;
    sender: {
        id: number;
        fullName: string;
        avatarUrl: string | null;
    }
}

export const getMessagesByConversationId = async (conversationId: number, currentUserId: number): Promise<Message[]> => {
    // First, verify the user is a participant
    const [participantCheck] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM conversation_participants WHERE conversation_id = ? AND user_id = ?`,
        [conversationId, currentUserId]
    );

    if (participantCheck.length === 0) {
        throw new Error("User is not a participant of this conversation.");
    }
    
    const query = `
        SELECT
            m.id,
            m.uuid,
            m.content,
            m.iv,
            m.created_at AS createdAt,
            s.id AS senderId,
            s.full_name AS senderName,
            s.avatar_url AS senderAvatar
        FROM
            messages m
        JOIN
            users s ON m.sender_id = s.id
        WHERE
            m.conversation_id = ?
        ORDER BY
            m.created_at ASC;
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, [conversationId]);
    
    return rows.map(row => {
        const decryptedContent = decrypt({ iv: row.iv, content: row.content });
        return {
            id: row.id,
            uuid: row.uuid,
            content: decryptedContent,
            createdAt: row.createdAt,
            sender: {
                id: row.senderId,
                fullName: row.senderName,
                avatarUrl: row.senderAvatar,
            }
        };
    });
};

// Get conversation participants (excluding sender)
const getConversationParticipants = async (conversationId: number, excludeUserId?: number): Promise<number[]> => {
    let query = `
        SELECT DISTINCT user_id 
        FROM conversation_participants 
        WHERE conversation_id = ?
    `;
    const params: any[] = [conversationId];
    
    if (excludeUserId) {
        query += ' AND user_id != ?';
        params.push(excludeUserId);
    }
    
    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows.map(row => row.user_id);
};

// Parse user mentions from message content
const parseUserMentions = async (messageContent: string): Promise<number[]> => {
    // Pattern for user mentions: @[UserName](user_id) or @username
    const userMentionRegex = /@\[([^\]]+)\]\((\d+)\)/g;
    const simpleUserMentionRegex = /@(\w+)/g;
    
    const mentionedUserIds: number[] = [];
    let match;

    // Parse complex mentions @[UserName](user_id)
    while ((match = userMentionRegex.exec(messageContent)) !== null) {
        const userId = parseInt(match[2]);
        if (!isNaN(userId) && !mentionedUserIds.includes(userId)) {
            mentionedUserIds.push(userId);
        }
    }

    // Parse simple mentions @username
    while ((match = simpleUserMentionRegex.exec(messageContent)) !== null) {
        const username = match[1];
        // Find user by username or email
        const [userRows] = await pool.query<RowDataPacket[]>(
            'SELECT id FROM users WHERE full_name LIKE ? OR email LIKE ?', 
            [`%${username}%`, `%${username}%`]
        );
        
        for (const user of userRows) {
            if (!mentionedUserIds.includes(user.id)) {
                mentionedUserIds.push(user.id);
            }
        }
    }
    
    return mentionedUserIds;
};

const parseMentions = async (messageContent: string) => {
    const projectRegex = /#\[Project:([^\]]+)\]\(([^)]+)\)/g;
    const taskRegex = /@\[Task:([^\]]+)\]\(([^)]+)\)/g;
    
    const mentions = [];
    let match;

    while ((match = projectRegex.exec(messageContent)) !== null) {
        const projectUuid = match[1];
        const [projectRows] = await pool.query<RowDataPacket[]>('SELECT id FROM projects WHERE uuid = ?', [projectUuid]);
        if (projectRows.length > 0) {
            mentions.push({ type: 'project', id: projectRows[0].id });
        }
    }

    while ((match = taskRegex.exec(messageContent)) !== null) {
        const taskUuid = match[1];
        const [taskRows] = await pool.query<RowDataPacket[]>('SELECT id FROM tasks WHERE uuid = ?', [taskUuid]);
        if (taskRows.length > 0) {
            mentions.push({ type: 'task', id: taskRows[0].id });
        }
    }
    
    return mentions;
};


export const sendMessage = async (
    conversationId: number,
    senderId: number,
    content: string
): Promise<Message> => {

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        const { iv, content: encryptedContent } = encrypt(content);
        const messageUuid = uuidv4();

        const [result] = await connection.query<ResultSetHeader>(
            `INSERT INTO messages (uuid, conversation_id, sender_id, content, iv) VALUES (?, ?, ?, ?, ?)`,
            [messageUuid, conversationId, senderId, encryptedContent, iv]
        );
        const newMessageId = result.insertId;

        const mentionsToInsert = await parseMentions(content);
        if (mentionsToInsert.length > 0) {
            const mentionValues = mentionsToInsert.map(m => 
                [newMessageId, m.type, m.type === 'task' ? m.id : null, m.type === 'project' ? m.id : null]
            );
            await connection.query(
                'INSERT INTO mentions (message_id, mention_type, mentioned_task_id, mentioned_project_id) VALUES ?',
                [mentionValues]
            );
        }
        
        await connection.commit();
        
        // Refetch the message to return the full object
        const [rows] = await pool.query<RowDataPacket[]>(`
             SELECT m.id, m.uuid, m.content, m.iv, m.created_at AS createdAt,
                    s.id AS senderId, s.full_name AS senderName, s.avatar_url AS senderAvatar
             FROM messages m
             JOIN users s ON m.sender_id = s.id
             WHERE m.id = ?`,
             [newMessageId]
        );
        
        const row = rows[0];
        const decryptedContent = decrypt({ iv: row.iv, content: row.content });

        // Create notifications after successful message send
        try {
            // 1. Get conversation participants (excluding sender)
            const participants = await getConversationParticipants(conversationId, senderId);
            const senderName = row.senderName;
            
            // 2. Create message notification for all participants
            if (participants.length > 0) {
                await createMessageNotification(senderId, senderName, participants, conversationId, decryptedContent);
            }
            
            // 3. Parse and create mention notifications
            const mentionedUserIds = await parseUserMentions(decryptedContent);
            if (mentionedUserIds.length > 0) {
                // Filter out the sender from mentions and participants to avoid duplicate notifications
                const filteredMentions = mentionedUserIds.filter(id => id !== senderId);
                if (filteredMentions.length > 0) {
                    await createMentionNotification(senderId, filteredMentions, conversationId, decryptedContent);
                }
            }
        } catch (notificationError) {
            // Log notification errors but don't fail the message send
            console.error('Failed to create notifications:', notificationError);
        }

        return {
            id: row.id,
            uuid: row.uuid,
            content: decryptedContent,
            createdAt: row.createdAt,
            sender: {
                id: row.senderId,
                fullName: row.senderName,
                avatarUrl: row.senderAvatar,
            }
        };

    } catch (error) {
        await connection.rollback();
        console.error('Error sending message:', error);
        throw new Error('Failed to send message.');
    } finally {
        connection.release();
    }
};

// Service functions to be implemented 