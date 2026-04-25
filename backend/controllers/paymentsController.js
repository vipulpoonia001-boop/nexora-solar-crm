import { db } from '../models/db.js';

const toNumber = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

export const getPayments = async (req, res) => {
  try {
    const { projectId, search } = req.query;

    let query = {};
    if (projectId) query.projectId = projectId;

    let payments = await db.find('payments', query);

    if (search) {
      const searchLower = search.toLowerCase();
      payments = payments.filter(p => 
        p.customerName.toLowerCase().includes(searchLower)
      );
    }

    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPayment = async (req, res) => {
  try {
    const payment = await db.findById('payments', req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addPayment = async (req, res) => {
  try {
    const { projectId, amount, method, description, date } = req.body;

    const payment = await db.findOne('payments', { projectId });
    if (!payment) return res.status(404).json({ error: 'Payment record not found' });

    const newPaymentEntry = {
      id: crypto.randomUUID(),
      date: date || new Date().toISOString().split('T')[0],
      amount: parseFloat(amount),
      method,
      description
    };

    const updatedHistory = [...(payment.paymentHistory || []), newPaymentEntry];
    const newAdvancePaid = toNumber(payment.advancePaid) + parseFloat(amount);
    const newRemaining = toNumber(payment.totalCost) - newAdvancePaid;

    const updated = await db.update('payments', payment.id, {
      advancePaid: newAdvancePaid,
      remainingBalance: Math.max(0, newRemaining),
      paymentHistory: updatedHistory
    });

    await db.insert('activities', {
      type: 'payment_received',
      description: `Payment received: ₹${amount} from ${payment.customerName}`,
      entityId: payment.id,
      entityType: 'payment',
      userId: req.user.id
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePayment = async (req, res) => {
  try {
    const existingPayment = await db.findById('payments', req.params.id);
    if (!existingPayment) return res.status(404).json({ error: 'Payment not found' });

    const updates = { ...req.body };
    const existingAdvancePaid = toNumber(existingPayment.advancePaid);
    const nextTotalCost = req.body.totalCost !== undefined
      ? toNumber(req.body.totalCost)
      : toNumber(existingPayment.totalCost);

    if (req.body.totalCost !== undefined && nextTotalCost < 0) {
      return res.status(400).json({ error: 'Total cost cannot be negative' });
    }

    if (req.body.advancePaid !== undefined) {
      const nextAdvancePaid = toNumber(req.body.advancePaid);
      if (nextAdvancePaid < 0) {
        return res.status(400).json({ error: 'Received payment cannot be negative' });
      }
      if (nextAdvancePaid > nextTotalCost) {
        return res.status(400).json({ error: 'Received payment cannot exceed total cost' });
      }

      updates.advancePaid = nextAdvancePaid;
      updates.remainingBalance = Math.max(0, nextTotalCost - nextAdvancePaid);

      const adjustmentAmount = nextAdvancePaid - existingAdvancePaid;
      if (adjustmentAmount !== 0) {
        const adjustmentEntry = {
          id: crypto.randomUUID(),
          date: req.body.date || new Date().toISOString().split('T')[0],
          amount: adjustmentAmount,
          method: 'Adjustment',
          description: req.body.adjustmentNote || 'Manual correction of received amount'
        };

        updates.paymentHistory = [...(existingPayment.paymentHistory || []), adjustmentEntry];

        await db.insert('activities', {
          type: 'payment_adjusted',
          description: `Payment corrected for ${existingPayment.customerName}: ${adjustmentAmount >= 0 ? '+' : ''}${adjustmentAmount}`,
          entityId: existingPayment.id,
          entityType: 'payment',
          userId: req.user.id
        });
      }
    } else if (req.body.totalCost !== undefined) {
      updates.remainingBalance = Math.max(0, nextTotalCost - existingAdvancePaid);
    }

    const payment = await db.update('payments', req.params.id, updates);
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPaymentStats = async (req, res) => {
  try {
    const payments = await db.read('payments');
    const stats = {
      totalRevenue: payments.reduce((sum, p) => sum + toNumber(p.advancePaid), 0),
      totalPending: payments.reduce((sum, p) => sum + toNumber(p.remainingBalance), 0),
      totalProjects: payments.length,
      fullyPaid: payments.filter(p => toNumber(p.remainingBalance) === 0).length,
      partiallyPaid: payments.filter(p => toNumber(p.advancePaid) > 0 && toNumber(p.remainingBalance) > 0).length,
      unpaid: payments.filter(p => toNumber(p.advancePaid) === 0).length
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
