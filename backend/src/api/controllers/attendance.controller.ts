import { Request, Response, NextFunction } from 'express';
import * as attendanceService from '../services/attendance.service';
import { clockInValidator } from '../validators/attendance.validator';
import { validate } from '../middlewares/validate.middleware';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const getStatusHandler = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.id;
        const attendance = await attendanceService.getTodayAttendance(userId);
        res.status(200).json({
            message: 'Lấy trạng thái chấm công thành công.',
            data: attendance
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const clockInHandler = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.id;
        const { latitude, longitude } = req.body;

        const newAttendance = await attendanceService.clockIn(userId, latitude, longitude);
        res.status(201).json({
            message: 'Chấm công vào thành công!',
            data: newAttendance
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const clockOutHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const result = await attendanceService.clockOut(userId);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

// --- HR/HRM Handlers ---

export const getAllAttendanceHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const records = await attendanceService.getAllAttendanceRecords();
        res.status(200).json({ success: true, data: records });
    } catch (error) {
        next(error);
    }
};

export const updateAttendanceHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const attendanceId = parseInt(req.params.id, 10);
        const updatedRecord = await attendanceService.updateAttendanceRecord(attendanceId, req.body);
        res.status(200).json({ success: true, data: updatedRecord });
    } catch (error) {
        next(error);
    }
};

export const exportAttendanceHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const csv = await attendanceService.exportAttendanceToCsv();
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=attendance_export.csv');
        res.status(200).send(csv);
    } catch (error) {
        next(error);
    }
}; 