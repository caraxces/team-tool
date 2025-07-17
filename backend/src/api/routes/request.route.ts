import { Router } from 'express';
import {
    createLeaveRequestHandler,
    getLeaveRequestsHandler,
    createPaymentRequestHandler,
    getPaymentRequestsHandler
} from '../controllers/request.controller';
import { protect } from '../middlewares/auth.middleware';
// No longer need upload middleware
// import { uploadImage } from '../middlewares/upload.middleware';

const router = Router();

// All routes in this file are protected
router.use(protect);

// Routes for Leave & Out of Office Requests
router.route('/leave')
    .post(createLeaveRequestHandler)
    .get(getLeaveRequestsHandler);

// Routes for Payment Requests
router.route('/payment')
    .post(createPaymentRequestHandler) // Removed uploadImage.single('receipt')
    .get(getPaymentRequestsHandler);

export default router; 