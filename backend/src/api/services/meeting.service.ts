import pool from '../../config/database';
import { RowDataPacket } from 'mysql2/promise';
import { generateUUID } from '../utils/uuid.util';
import { Meeting, CreateMeetingDto, UpdateMeetingDto, MeetingFilters } from '../../types/meeting.types';
import { createMeetingInvitedNotification } from './notification.service';

export const createMeeting = async (meetingData: CreateMeetingDto, organizerId: number): Promise<Meeting> => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const meetingUUID = generateUUID();
        const { participant_ids, reminder_minutes, ...meetingFields } = meetingData;

        // Create meeting
        const [meetingResult] = await connection.query<any>(
            `INSERT INTO meetings (uuid, title, description, start_time, end_time, location, 
             meeting_type, meeting_url, organizer_id, color, is_recurring, recurring_pattern) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                meetingUUID,
                meetingFields.title,
                meetingFields.description || null,
                meetingFields.start_time,
                meetingFields.end_time,
                meetingFields.location || null,
                meetingFields.meeting_type,
                meetingFields.meeting_url || null,
                organizerId,
                meetingFields.color || '#3B82F6',
                meetingFields.is_recurring || false,
                meetingFields.recurring_pattern ? JSON.stringify(meetingFields.recurring_pattern) : null
            ]
        );

        const meetingId = meetingResult.insertId;

        // Add participants if provided
        if (participant_ids && participant_ids.length > 0) {
            const participantValues = participant_ids.map(userId => [meetingId, userId, 'pending', true]);
            await connection.query(
                'INSERT INTO meeting_participants (meeting_id, user_id, response_status, is_required) VALUES ?',
                [participantValues]
            );

            // Create notifications for participants
            try {
                // Filter out the organizer from the recipient list
                const recipients = participant_ids.filter(id => id !== organizerId);
                if (recipients.length > 0) {
                    await createMeetingInvitedNotification(
                        organizerId,
                        recipients,
                        meetingId,
                        meetingFields.title
                    );
                }
            } catch (notificationError) {
                console.error('Failed to create meeting invitation notification:', notificationError);
                // Do not fail the whole transaction for a notification error
            }
        }

        // Add reminders if provided
        if (reminder_minutes && reminder_minutes.length > 0 && participant_ids) {
            const reminderValues: any[] = [];
            for (const userId of participant_ids) {
                for (const minutes of reminder_minutes) {
                    const reminderTime = new Date(new Date(meetingFields.start_time).getTime() - minutes * 60000);
                    reminderValues.push([meetingId, userId, reminderTime, 'notification', false]);
                }
            }
            if (reminderValues.length > 0) {
                await connection.query(
                    'INSERT INTO meeting_reminders (meeting_id, user_id, reminder_time, reminder_type, is_sent) VALUES ?',
                    [reminderValues]
                );
            }
        }

        await connection.commit();
        return await getMeetingById(meetingId);
    } catch (error) {
        await connection.rollback();
        console.error("Error in createMeeting:", error);
        throw new Error('Failed to create meeting.');
    } finally {
        connection.release();
    }
};

export const getMeetings = async (filters: MeetingFilters = {}): Promise<Meeting[]> => {
    let query = `
        SELECT m.*, 
               u.full_name as organizer_name, u.email as organizer_email
        FROM meetings m
        LEFT JOIN users u ON m.organizer_id = u.id
        WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.start_date) {
        query += ' AND m.start_time >= ?';
        params.push(filters.start_date);
    }
    if (filters.end_date) {
        query += ' AND m.end_time <= ?';
        params.push(filters.end_date);
    }
    if (filters.status) {
        query += ' AND m.status = ?';
        params.push(filters.status);
    }
    if (filters.meeting_type) {
        query += ' AND m.meeting_type = ?';
        params.push(filters.meeting_type);
    }
    if (filters.organizer_id) {
        query += ' AND m.organizer_id = ?';
        params.push(filters.organizer_id);
    }

    query += ' ORDER BY m.start_time ASC';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    
    const meetings: any[] = rows.map((row: any) => ({
        ...row,
        organizer: row.organizer_name ? {
            id: row.organizer_id,
            fullName: row.organizer_name,
            email: row.organizer_email
        } : undefined
    }));

    // Get participants for each meeting
    for (const meeting of meetings) {
        const [participants] = await pool.query<RowDataPacket[]>(
            `SELECT mp.*, u.full_name, u.email 
             FROM meeting_participants mp
             LEFT JOIN users u ON mp.user_id = u.id
             WHERE mp.meeting_id = ?`,
            [meeting.id]
        );
        meeting.participants = participants.map((p: any) => ({
            ...p,
            user: {
                id: p.user_id,
                fullName: p.full_name,
                email: p.email
            }
        }));
    }

    return meetings as Meeting[];
};

export const getMeetingById = async (id: number): Promise<Meeting> => {
    const meetings = await getMeetings({});
    const meeting = meetings.find((m: Meeting) => m.id === id);
    if (!meeting) {
        throw new Error('Meeting not found');
    }
    return meeting;
};

export const updateMeeting = async (id: number, meetingData: UpdateMeetingDto): Promise<Meeting> => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { participant_ids, ...meetingFields } = meetingData;
        
        // Update meeting fields
        const updateFields: string[] = [];
        const updateValues: any[] = [];
        
        Object.entries(meetingFields).forEach(([key, value]) => {
            if (value !== undefined) {
                updateFields.push(`${key} = ?`);
                updateValues.push(key === 'recurring_pattern' ? JSON.stringify(value) : value);
            }
        });

        if (updateFields.length > 0) {
            updateValues.push(id);
            await connection.query(
                `UPDATE meetings SET ${updateFields.join(', ')} WHERE id = ?`,
                updateValues
            );
        }

        // Update participants if provided
        if (participant_ids) {
            // Remove existing participants
            await connection.query('DELETE FROM meeting_participants WHERE meeting_id = ?', [id]);
            
            // Add new participants
            if (participant_ids.length > 0) {
                const participantValues = participant_ids.map(userId => [id, userId, 'pending', true]);
                await connection.query(
                    'INSERT INTO meeting_participants (meeting_id, user_id, response_status, is_required) VALUES ?',
                    [participantValues]
                );
            }
        }

        await connection.commit();
        return await getMeetingById(id);
    } catch (error) {
        await connection.rollback();
        console.error("Error in updateMeeting:", error);
        throw new Error('Failed to update meeting.');
    } finally {
        connection.release();
    }
};

export const deleteMeeting = async (id: number): Promise<void> => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Delete related data (CASCADE should handle this, but being explicit)
        await connection.query('DELETE FROM meeting_reminders WHERE meeting_id = ?', [id]);
        await connection.query('DELETE FROM meeting_participants WHERE meeting_id = ?', [id]);
        
        const [result] = await connection.query<any>('DELETE FROM meetings WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            throw new Error('Meeting not found.');
        }

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        console.error("Error in deleteMeeting:", error);
        throw new Error('Failed to delete meeting.');
    } finally {
        connection.release();
    }
};

export const updateParticipantResponse = async (meetingId: number, userId: number, responseStatus: string): Promise<void> => {
    const [result] = await pool.query<any>(
        'UPDATE meeting_participants SET response_status = ? WHERE meeting_id = ? AND user_id = ?',
        [responseStatus, meetingId, userId]
    );
    
    if (result.affectedRows === 0) {
        throw new Error('Participant not found.');
    }
};

export const getMyMeetings = async (userId: number, filters: MeetingFilters = {}): Promise<Meeting[]> => {
    let query = `
        SELECT DISTINCT m.*, 
               u.full_name as organizer_name, u.email as organizer_email
        FROM meetings m
        LEFT JOIN users u ON m.organizer_id = u.id
        LEFT JOIN meeting_participants mp ON m.id = mp.meeting_id
        WHERE (m.organizer_id = ? OR mp.user_id = ?)
    `;
    const params: any[] = [userId, userId];

    if (filters.start_date) {
        query += ' AND m.start_time >= ?';
        params.push(filters.start_date);
    }
    if (filters.end_date) {
        query += ' AND m.end_time <= ?';
        params.push(filters.end_date);
    }
    if (filters.status) {
        query += ' AND m.status = ?';
        params.push(filters.status);
    }

    query += ' ORDER BY m.start_time ASC';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    
    const meetings: any[] = rows.map((row: any) => ({
        ...row,
        organizer: row.organizer_name ? {
            id: row.organizer_id,
            fullName: row.organizer_name,
            email: row.organizer_email
        } : undefined
    }));

    // Get participants for each meeting
    for (const meeting of meetings) {
        const [participants] = await pool.query<RowDataPacket[]>(
            `SELECT mp.*, u.full_name, u.email 
             FROM meeting_participants mp
             LEFT JOIN users u ON mp.user_id = u.id
             WHERE mp.meeting_id = ?`,
            [meeting.id]
        );
        meeting.participants = participants.map((p: any) => ({
            ...p,
            user: {
                id: p.user_id,
                fullName: p.full_name,
                email: p.email
            }
        }));
    }

    return meetings as Meeting[];
}; 