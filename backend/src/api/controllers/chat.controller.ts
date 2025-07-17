import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import * as chatService from '../services/chat.service';

export const findOrCreateConversationHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const currentUserId = req.user!.id;
    const { otherUserId } = req.body;

    if (!otherUserId) {
        return res.status(400).json({ message: "otherUserId is required." });
    }

    try {
        const conversationId = await chatService.findOrCreateConversation(currentUserId, otherUserId);
        res.status(200).json({ 
            status: 'success', 
            data: { conversationId }
        });
    } catch (error) {
        next(error);
    }
};

export const getMessagesHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const currentUserId = req.user!.id;
    const conversationId = parseInt(req.params.conversationId, 10);

    try {
        const messages = await chatService.getMessagesByConversationId(conversationId, currentUserId);
        res.status(200).json({
            status: 'success',
            data: {
                messages,
            }
        });
    } catch (error) {
        next(error);
    }
}

export const sendMessageHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const senderId = req.user!.id;
    const conversationId = parseInt(req.params.conversationId, 10);
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ message: "Message content cannot be empty."});
    }

    try {
        const newMessage = await chatService.sendMessage(conversationId, senderId, content);
        // Here you might want to emit this message over a websocket to the other participants
        res.status(201).json({
            status: 'success',
            data: {
                message: newMessage,
            }
        });
    } catch (error) {
        next(error);
    }
} 