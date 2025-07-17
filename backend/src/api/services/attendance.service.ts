import pool from '../../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface Attendance extends RowDataPacket {
    id: number;
    user_id: number;
    work_location_id: number | null; // Can be null now
    clock_in_time: Date;
    clock_out_time: Date | null;
    status: 'ON_TIME' | 'LATE' | 'OUT_OF_RANGE'; // Added new status
    work_date: string;
}

interface WorkLocation extends RowDataPacket {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    radius: number;
}

// Haversine formula to calculate distance between two lat/lon points in meters
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

export const getTodayAttendance = async (userId: number): Promise<Attendance | null> => {
    const today = new Date().toISOString().slice(0, 10);
    const [rows] = await pool.query<Attendance[]>('SELECT * FROM attendance WHERE user_id = ? AND work_date = ?', [userId, today]);
    return rows[0] || null;
}

export const clockIn = async (userId: number, userLat: number, userLon: number): Promise<Attendance> => {
    // 1. Check for existing clock-in
    const existingAttendance = await getTodayAttendance(userId);
    if (existingAttendance) {
        throw new Error('Bạn đã chấm công hôm nay rồi.');
    }

    // 2. Determine time-based status
    const now = new Date();
    const clockInDeadline = new Date(now);
    clockInDeadline.setHours(9, 11, 0, 0); // Deadline is 9:11:00 AM
    const timeBasedStatus = now > clockInDeadline ? 'LATE' : 'ON_TIME';
    const workDate = now.toISOString().slice(0, 10);

    // 3. Find valid location using the efficient spatial index query
    // ST_Distance_Sphere is the correct function for POINT data type and is very fast with a spatial index.
    const findLocationQuery = `
      SELECT id FROM work_locations
      WHERE ST_Distance_Sphere(location_point, POINT(?, ?)) <= radius
      LIMIT 1;
    `;
    // MySQL's POINT constructor is POINT(longitude, latitude)
    const [validLocations] = await pool.query<WorkLocation[]>(findLocationQuery, [userLon, userLat]);
    const validLocation = validLocations[0] || null;

    // 4. Determine final status and location ID
    const finalStatus = validLocation ? timeBasedStatus : 'OUT_OF_RANGE';
    const locationId = validLocation ? validLocation.id : null;

    // 5. Insert the complete and final record in a single operation
    const [result] = await pool.query(
        'INSERT INTO attendance (user_id, work_location_id, status, work_date, clock_in_time) VALUES (?, ?, ?, ?, ?)',
        [userId, locationId, finalStatus, workDate, now]
    );

    // 6. Fetch and return the newly created record to the frontend
    // @ts-ignore - Ok to ignore here as insertId is on OkPacket
    const newAttendanceId = result.insertId;
    const [newAttendance] = await pool.query<Attendance[]>('SELECT * FROM attendance WHERE id = ?', [newAttendanceId]);
    return newAttendance[0];
};

export const clockOut = async (userId: number): Promise<Attendance> => {
    // 1. Find today's attendance record
    const attendance = await getTodayAttendance(userId);
    if (!attendance) {
        throw new Error('Bạn chưa chấm công hôm nay.');
    }

    if (attendance.clock_out_time) {
        throw new Error('Bạn đã chấm công ra rồi.');
    }

    // 2. Update clock_out_time
    const now = new Date();
    await pool.query('UPDATE attendance SET clock_out_time = ? WHERE id = ?', [now, attendance.id]);

    const [updatedAttendance] = await pool.query<Attendance[]>('SELECT * FROM attendance WHERE id = ?', [attendance.id]);
    return updatedAttendance[0];
};

// --- Service functions for HR/HRM ---

export interface FullAttendanceRecord extends RowDataPacket {
    id: number;
    user_id: number;
    full_name: string;
    date: string;
    clock_in_time: string | null;
    clock_out_time: string | null;
    status: 'ON_TIME' | 'LATE' | 'OUT_OF_RANGE';
}

export const getAllAttendanceRecords = async (): Promise<FullAttendanceRecord[]> => {
    const query = `
        SELECT 
            a.id, a.user_id, u.full_name, a.work_date as date, a.clock_in_time, 
            a.clock_out_time, a.status
        FROM attendance a
        JOIN users u ON a.user_id = u.id
        ORDER BY a.work_date DESC, u.full_name ASC;
    `;
    const [rows] = await pool.query<FullAttendanceRecord[]>(query);
    return rows;
};

export const updateAttendanceRecord = async (attendanceId: number, data: Partial<FullAttendanceRecord>): Promise<FullAttendanceRecord> => {
    // Sanitize data to only allow updatable fields
    const allowedFields = ['work_date', 'clock_in_time', 'clock_out_time', 'status'];
    const fieldsToUpdate = Object.entries(data).filter(([key]) => {
        if (key === 'date') return true; // Allow 'date' from frontend to map to 'work_date'
        return allowedFields.includes(key)
    });

    if (fieldsToUpdate.length === 0) {
        throw new Error("No valid fields provided for update.");
    }
    
    // Validate status value if present
    const statusUpdate = fieldsToUpdate.find(([key]) => key === 'status');
    if (statusUpdate && !['ON_TIME', 'LATE', 'OUT_OF_RANGE'].includes(statusUpdate[1] as string)) {
        throw new Error(`Invalid status value: ${statusUpdate[1]}`);
    }

    const setClause = fieldsToUpdate.map(([key]) => `${key === 'date' ? 'work_date' : key} = ?`).join(', ');
    const values = fieldsToUpdate.map(([, value]) => value);

    await pool.query(`UPDATE attendance SET ${setClause} WHERE id = ?`, [...values, attendanceId]);

    const [updatedRows] = await pool.query<FullAttendanceRecord[]>(
        `SELECT a.id, a.user_id, u.full_name, a.work_date as date, a.clock_in_time, a.clock_out_time, a.status 
         FROM attendance a JOIN users u ON a.user_id = u.id WHERE a.id = ?`, 
        [attendanceId]
    );
    return updatedRows[0];
};

export const exportAttendanceToCsv = async (): Promise<string> => {
    const records = await getAllAttendanceRecords();
    if (records.length === 0) {
        return "ID,User Name,Date,Clock In,Clock Out,Status\n";
    }

    // Using json2csv library for robust CSV generation
    const { Parser } = require('json2csv');
    const fields = ['id', 'full_name', 'date', 'clock_in_time', 'clock_out_time', 'status'];
    const opts = { fields };

    try {
        const parser = new Parser(opts);
        const csv = parser.parse(records);
        return csv;
    } catch (err) {
        console.error("Error converting to CSV:", err);
        throw err;
    }
}; 