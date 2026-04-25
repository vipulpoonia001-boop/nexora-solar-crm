import { Router } from 'express';
import { login, getProfile, createUser } from '../controllers/authController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.get('/profile', authenticate, getProfile);
router.post('/users', authenticate, authorize('admin'), createUser);

export default router;
