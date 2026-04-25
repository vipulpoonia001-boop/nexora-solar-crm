import { Router } from 'express';
import {
  getLeads, getLead, createLead, updateLead, deleteLead,
  convertLead, getLeadStats
} from '../controllers/leadsController.js';
import { authenticate } from '../middleware/auth.js';
import { validate, leadValidation } from '../middleware/validation.js';

const router = Router();

router.get('/', authenticate, getLeads);
router.get('/stats', authenticate, getLeadStats);
router.get('/:id', authenticate, getLead);
router.post('/', authenticate, validate(leadValidation), createLead);
router.put('/:id', authenticate, updateLead);
router.delete('/:id', authenticate, deleteLead);
router.post('/:id/convert', authenticate, convertLead);

export default router;
