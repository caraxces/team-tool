import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createKnowledgeItemSchema } from '../validators/knowledge.validator';
import {
    getAllKnowledgeItemsHandler,
    createKnowledgeItemHandler,
    updateKnowledgeItemStatusHandler,
    deleteKnowledgeItemHandler,
} from '../controllers/knowledge.controller';

const router = Router();

// All knowledge base routes will be protected
router.use(protect);

router.route('/')
    .get(getAllKnowledgeItemsHandler)
    .post(validate(createKnowledgeItemSchema), createKnowledgeItemHandler);

router.route('/:id')
    .delete(deleteKnowledgeItemHandler);
    
router.route('/:id/status')
    .patch(updateKnowledgeItemStatusHandler);

export default router; 