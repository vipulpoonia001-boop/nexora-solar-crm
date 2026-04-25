import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getAdminOverview,
  getAdminPricingSettings,
  updateAdminPricingSettings,
  listUsers,
  createAdminUser,
  updateAdminUser,
  resetAdminUserPassword,
  pruneActivities,
  downloadSystemBackup
} from '../controllers/adminController.js';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/overview', getAdminOverview);
router.get('/settings/pricing', getAdminPricingSettings);
router.put('/settings/pricing', updateAdminPricingSettings);
router.get('/users', listUsers);
router.post('/users', createAdminUser);
router.put('/users/:id', updateAdminUser);
router.put('/users/:id/password', resetAdminUserPassword);
router.post('/system/prune-activities', pruneActivities);
router.get('/system/backup', downloadSystemBackup);

export default router;
