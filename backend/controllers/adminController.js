import bcrypt from 'bcryptjs';
import { db } from '../models/db.js';
import { getPricingSettings, savePricingSettings } from '../utils/pricing.js';

const ALLOWED_ROLES = ['admin', 'staff'];

const toNumber = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
};

const isCompletedProject = (project) => project.stage === 'Project Completed';

export const getAdminOverview = async (req, res) => {
  try {
    const [users, leads, projects, payments, activities, pricing] = await Promise.all([
      db.read('users'),
      db.read('leads'),
      db.read('projects'),
      db.read('payments'),
      db.read('activities'),
      getPricingSettings()
    ]);

    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.active).length;
    const adminUsers = users.filter((u) => u.role === 'admin').length;
    const completedProjects = projects.filter(isCompletedProject).length;
    const pendingPayments = payments.reduce((sum, payment) => sum + toNumber(payment.remainingBalance), 0);
    const collectedRevenue = payments.reduce((sum, payment) => sum + toNumber(payment.advancePaid), 0);

    const recentActivities = [...activities]
      .sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0))
      .slice(0, 8);

    res.json({
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers: Math.max(0, totalUsers - activeUsers),
        adminUsers,
        staffUsers: users.filter((u) => u.role === 'staff').length,
        totalLeads: leads.length,
        totalProjects: projects.length,
        completedProjects,
        ongoingProjects: Math.max(0, projects.length - completedProjects),
        pendingPayments,
        collectedRevenue
      },
      pricing,
      collections: {
        users: users.length,
        leads: leads.length,
        projects: projects.length,
        payments: payments.length,
        activities: activities.length
      },
      recentActivities
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAdminPricingSettings = async (req, res) => {
  try {
    const pricing = await getPricingSettings();
    res.json(pricing);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAdminPricingSettings = async (req, res) => {
  try {
    const costPerKw = Number(req.body.costPerKw);
    const customKwPricing = req.body.customKwPricing || {};
    const electricityRate = Number(req.body.electricityRate);
    const unitsPerKw = Number(req.body.unitsPerKw);

    if (!Number.isFinite(costPerKw) || costPerKw <= 0) {
      return res.status(400).json({ error: 'costPerKw must be a positive number.' });
    }

    if (typeof customKwPricing !== 'object' || Array.isArray(customKwPricing)) {
      return res.status(400).json({ error: 'customKwPricing must be an object map.' });
    }

    const sanitizedCustomPricing = {};
    Object.entries(customKwPricing).forEach(([kw, amount]) => {
      const kwNumber = Number(kw);
      const amountNumber = Number(amount);
      if (Number.isFinite(kwNumber) && kwNumber > 0 && Number.isFinite(amountNumber) && amountNumber > 0) {
        sanitizedCustomPricing[String(kwNumber)] = Math.round(amountNumber);
      }
    });

    await savePricingSettings({
      costPerKw: Math.round(costPerKw),
      customKwPricing: sanitizedCustomPricing,
      electricityRate: Number.isFinite(electricityRate) ? electricityRate : 8,
      unitsPerKw: Number.isFinite(unitsPerKw) ? unitsPerKw : 120
    }, req.user.id);

    const latestPricing = await getPricingSettings();
    res.json(latestPricing);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const listUsers = async (req, res) => {
  try {
    const { search = '', role = '', status = '' } = req.query;
    let users = await db.read('users');

    if (search) {
      const query = search.toLowerCase();
      users = users.filter((user) =>
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.phone?.toLowerCase().includes(query)
      );
    }

    if (role) {
      users = users.filter((user) => user.role === role);
    }

    if (status === 'active') {
      users = users.filter((user) => user.active);
    } else if (status === 'inactive') {
      users = users.filter((user) => !user.active);
    }

    users.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    res.json(users.map(sanitizeUser));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createAdminUser = async (req, res) => {
  try {
    const { name, email, password, role = 'staff', phone = '' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Invalid role provided.' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await db.findOne('users', { email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ error: 'User already exists with this email.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await db.insert('users', {
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
      phone: String(phone).trim(),
      active: true
    });

    res.status(201).json(sanitizeUser(user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAdminUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const existingUser = await db.findById('users', userId);

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const updates = {};

    if (req.body.name !== undefined) {
      updates.name = String(req.body.name).trim();
    }

    if (req.body.phone !== undefined) {
      updates.phone = String(req.body.phone).trim();
    }

    if (req.body.role !== undefined) {
      if (!ALLOWED_ROLES.includes(req.body.role)) {
        return res.status(400).json({ error: 'Invalid role provided.' });
      }
      updates.role = req.body.role;
    }

    if (req.body.active !== undefined) {
      if (typeof req.body.active !== 'boolean') {
        return res.status(400).json({ error: 'Active flag must be boolean.' });
      }
      updates.active = req.body.active;
    }

    const nextRole = updates.role ?? existingUser.role;
    const nextActive = updates.active ?? existingUser.active;

    if (req.user.id === userId && nextActive === false) {
      return res.status(400).json({ error: 'You cannot deactivate your own account.' });
    }

    if (existingUser.role === 'admin' && (nextRole !== 'admin' || nextActive === false)) {
      const users = await db.read('users');
      const otherActiveAdmins = users.filter(
        (user) => user.id !== userId && user.role === 'admin' && user.active
      ).length;

      if (otherActiveAdmins === 0) {
        return res.status(400).json({ error: 'At least one active admin is required.' });
      }
    }

    const updatedUser = await db.update('users', userId, updates);
    res.json(sanitizeUser(updatedUser));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const resetAdminUserPassword = async (req, res) => {
  try {
    const userId = req.params.id;
    const { password } = req.body;

    if (!password || String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const user = await db.findById('users', userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.update('users', userId, { password: hashedPassword });

    res.json({ success: true, message: 'Password reset successful.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const pruneActivities = async (req, res) => {
  try {
    const keepLast = Number(req.body.keepLast ?? 200);
    if (!Number.isInteger(keepLast) || keepLast < 10 || keepLast > 5000) {
      return res.status(400).json({ error: 'keepLast must be an integer between 10 and 5000.' });
    }

    const activities = await db.read('activities');
    if (activities.length <= keepLast) {
      return res.json({
        success: true,
        removed: 0,
        remaining: activities.length
      });
    }

    const latestActivities = [...activities]
      .sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0))
      .slice(0, keepLast)
      .sort((a, b) => new Date(a.createdAt || a.updatedAt || 0) - new Date(b.createdAt || b.updatedAt || 0));

    await db.write('activities', latestActivities);

    res.json({
      success: true,
      removed: activities.length - latestActivities.length,
      remaining: latestActivities.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const downloadSystemBackup = async (req, res) => {
  try {
    const [users, leads, projects, payments, activities] = await Promise.all([
      db.read('users'),
      db.read('leads'),
      db.read('projects'),
      db.read('payments'),
      db.read('activities')
    ]);

    const payload = {
      exportedAt: new Date().toISOString(),
      exportedBy: {
        id: req.user.id,
        email: req.user.email
      },
      data: {
        users,
        leads,
        projects,
        payments,
        activities
      }
    };

    const filename = `nexora-backup-${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
