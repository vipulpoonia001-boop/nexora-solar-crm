import { body, param, validationResult } from 'express-validator';

export const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  };
};

export const leadValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('loadRequirement').isFloat({ min: 0.5, max: 100 }).withMessage('Load must be between 0.5 and 100 kW'),
  body('source').isIn(['Website', 'Referral', 'Facebook', 'Google Ads', 'Walk-in', 'Other']).withMessage('Invalid source'),
  body('status').isIn(['new', 'contacted', 'interested', 'converted', 'rejected']).withMessage('Invalid status')
];

export const projectValidation = [
  body('customerName').trim().notEmpty().withMessage('Customer name is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('systemSize').isFloat({ min: 0.5, max: 100 }).withMessage('System size must be between 0.5 and 100 kW'),
  body('stage').isIn(['Quotation', 'Structure installed', 'Work completed at site', 'net metering', 'Project Completed']).withMessage('Invalid stage'),
  body('netMeterStatus').isIn(['pending', 'applied', 'approved', 'installed']).withMessage('Invalid net meter status'),
  body('subsidyStatus').isIn(['applied', 'received', 'without subsidy']).withMessage('Invalid subsidy status')
];

export const paymentValidation = [
  body('projectId').trim().notEmpty().withMessage('Project ID is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be positive'),
  body('method').isIn(['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Card']).withMessage('Invalid payment method')
];
