import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import * as meetingService from '../services/meeting.service';

export const createMeetingHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const organizerId = req.user!.id;
        const meeting = await meetingService.createMeeting(req.body, organizerId);
        res.status(201).json({ success: true, data: meeting });
    } catch (error) {
        next(error);
    }
};

export const getMeetingsHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const filters = {
            start_date: req.query.start_date as string,
            end_date: req.query.end_date as string,
            status: req.query.status as string,
            meeting_type: req.query.meeting_type as string,
            organizer_id: req.query.organizer_id ? parseInt(req.query.organizer_id as string, 10) : undefined
        };
        const meetings = await meetingService.getMeetings(filters);
        res.status(200).json({ success: true, data: meetings });
    } catch (error) {
        next(error);
    }
};

export const getMeetingByIdHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.params.id, 10);
        const meeting = await meetingService.getMeetingById(id);
        res.status(200).json({ success: true, data: meeting });
    } catch (error) {
        next(error);
    }
};

export const updateMeetingHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.params.id, 10);
        const meeting = await meetingService.updateMeeting(id, req.body);
        res.status(200).json({ success: true, data: meeting });
    } catch (error) {
        next(error);
    }
};

export const deleteMeetingHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.params.id, 10);
        await meetingService.deleteMeeting(id);
        res.status(200).json({ success: true, message: 'Meeting deleted successfully' });
    } catch (error) {
        next(error);
    }
};

export const getMyMeetingsHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const filters = {
            start_date: req.query.start_date as string,
            end_date: req.query.end_date as string,
            status: req.query.status as string
        };
        const meetings = await meetingService.getMyMeetings(userId, filters);
        res.status(200).json({ success: true, data: meetings });
    } catch (error) {
        next(error);
    }
};

export const updateParticipantResponseHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const meetingId = parseInt(req.params.meetingId, 10);
        const userId = req.user!.id;
        const { response_status } = req.body;
        
        await meetingService.updateParticipantResponse(meetingId, userId, response_status);
        res.status(200).json({ success: true, message: 'Response updated successfully' });
    } catch (error) {
        next(error);
    }
}; 