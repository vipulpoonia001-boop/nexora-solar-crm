import { Router } from 'express';
import {
  getPayments, getPayment, addPayment, updatePayment, getPaymentStats
} from '../controllers/paymentsController.js';
import { authenticate } from '../middleware/auth.js';
import { validate, paymentValidation } from '../middleware/validation.js';

const router = Router();

router.get('/', authenticate, getPayments);
router.get('/stats', authenticate, getPaymentStats);
router.get('/:id', authenticate, getPayment);
router.post('/', authenticate, validate(paymentValidation), addPayment);
router.put('/:id', authenticate, updatePayment);

export default router;
