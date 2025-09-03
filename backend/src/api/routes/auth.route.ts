import { Router } from 'express';
import { 
    registerHandler, 
    loginHandler,
    forgotPasswordHandler,
    resetPasswordHandler
} from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { registerSchema, loginSchema } from '../validators/auth.validator';

const router = Router();

// POST /api/auth/register
router.post('/register', validate(registerSchema), registerHandler);

// POST /api/auth/login
router.post('/login', validate(loginSchema), loginHandler);
router.post('/forgot-password', forgotPasswordHandler);
router.post('/reset-password', resetPasswordHandler);


export default router; 