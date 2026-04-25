import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getPublicPricingSettings } from '../controllers/settingsController.js';

const router = Router();

router.get('/pricing', authenticate, getPublicPricingSettings);

export default router;
