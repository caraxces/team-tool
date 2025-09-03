import express from 'express';
import { protect } from '../middlewares/auth.middleware';
import { 
    findOrCreateConversationHandler,
    getMessagesHandler,
    sendMessageHandler
} from '../controllers/chat.controller';

const router = express.Router();

router.use(protect);

// Find or create a DM conversation between the current user and another user
router.post('/conversations', findOrCreateConversationHandler);

// Get messages for a specific conversation
router.get('/conversations/:conversationId/messages', getMessagesHandler);

// Send a new message to a conversation
router.post('/conversations/:conversationId/messages', sendMessageHandler);


export default router; 