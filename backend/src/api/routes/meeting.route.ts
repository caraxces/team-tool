import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import {
    createMeetingHandler,
    deleteMeetingHandler,
    getMeetingByIdHandler,
    getMeetingsHandler,
    updateMeetingHandler,
    getMyMeetingsHandler,
    updateParticipantResponseHandler
} from '../controllers/meeting.controller';

const router = Router();

// Apply auth middleware to all routes
router.use(protect);

// Meeting CRUD routes
router.get('/', getMeetingsHandler);
router.get('/my-meetings', getMyMeetingsHandler);
router.get('/:id', getMeetingByIdHandler);
router.post('/', createMeetingHandler);
router.put('/:id', updateMeetingHandler);
router.delete('/:id', deleteMeetingHandler);

// Participant response routes
router.patch('/:meetingId/response', updateParticipantResponseHandler);

export default router; 