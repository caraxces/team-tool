import { Router } from 'express';
import * as attendanceController from '../controllers/attendance.controller';
import { clockInValidator } from '../validators/attendance.validator';
import { validate } from '../middlewares/validate.middleware';
import { protect, hrAndHrmOnly } from '../middlewares/auth.middleware';

const router = Router();

// Routes for HR/HRM Management
router.get('/all', protect, hrAndHrmOnly, attendanceController.getAllAttendanceHandler);
router.get('/export', protect, hrAndHrmOnly, attendanceController.exportAttendanceHandler);
router.put('/:id', protect, hrAndHrmOnly, attendanceController.updateAttendanceHandler);

// All personal attendance routes are protected
router.use(protect);

// GET /api/attendance/status - Get today's attendance status for the logged-in user
router.get('/status', attendanceController.getStatusHandler);

// POST /api/attendance/clock-in - Clock in for the day
router.post('/clock-in', clockInValidator, validate, attendanceController.clockInHandler);

// POST /api/attendance/clock-out - Clock out for the day
router.post('/clock-out', attendanceController.clockOutHandler);

export default router; 