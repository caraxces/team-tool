import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import * as requestService from '../services/request.service';

// --- LEAVE / OUT OF OFFICE ---

export const createLeaveRequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const newRequest = await requestService.createLeaveRequest(userId, req.body);
        res.status(201).json({ success: true, data: newRequest });
    } catch (error) {
        next(error);
    }
};

export const getLeaveRequestsHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const requests = await requestService.getLeaveRequestsByUserId(userId);
        res.status(200).json({ success: true, data: requests });
    } catch (error) {
        next(error);
    }
};

// --- PAYMENT REQUESTS ---

export const createPaymentRequestHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        // The receipt_url will now come directly from the body.
        const newRequest = await requestService.createPaymentRequest(userId, req.body);
        res.status(201).json({ success: true, data: newRequest });
    } catch (error) {
        next(error);
    }
};

export const getPaymentRequestsHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const requests = await requestService.getPaymentRequestsByUserId(userId);
        res.status(200).json({ success: true, data: requests });
    } catch (error) {
        next(error);
    }
}; 