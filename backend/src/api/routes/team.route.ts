import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import {
    getMyTeamsHandler,
    createTeamHandler,
    getTeamMembersHandler,
    inviteMemberHandler,
    getMemberCsvTemplateHandler,
    importMembersHandler
} from '../controllers/team.controller';
import { uploadCsv } from '../middlewares/upload.middleware';

const router = Router();

router.use(protect);

router.get('/', getMyTeamsHandler);
router.post('/', createTeamHandler);

router.get('/:teamId/members', getTeamMembersHandler);
router.post('/:teamId/members', inviteMemberHandler);

// CSV Template and Import
router.get('/:teamId/members/csv-template', getMemberCsvTemplateHandler);
router.post('/:teamId/members/import', uploadCsv.single('file'), importMembersHandler);

export default router;
