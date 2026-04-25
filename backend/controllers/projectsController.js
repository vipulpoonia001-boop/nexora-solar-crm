import { db } from '../models/db.js';
import { getPricingSettings, estimateProjectCost } from '../utils/pricing.js';

export const getProjects = async (req, res) => {
  try {
    const { stage, netMeterStatus, subsidyStatus, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    let query = {};
    if (stage) query.stage = stage;
    if (netMeterStatus) query.netMeterStatus = netMeterStatus;
    if (subsidyStatus) query.subsidyStatus = subsidyStatus;

    let projects = await db.find('projects', query);

    const payments = await db.read('payments');
    projects = projects.map(proj => {
      const payment = payments.find(p => p.projectId === proj.id);
      return {
        ...proj,
        paymentInfo: payment ? { totalCost: payment.totalCost, advancePaid: payment.advancePaid, remainingBalance: payment.remainingBalance } : null
      };
    });

    if (search) {
      const searchLower = search.toLowerCase();
      projects = projects.filter(p => 
        p.customerName.toLowerCase().includes(searchLower) ||
        p.phone.includes(search) ||
        p.address.toLowerCase().includes(searchLower)
      );
    }

    projects.sort((a, b) => {
      const aVal = a[sortBy] || '';
      const bVal = b[sortBy] || '';
      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProject = async (req, res) => {
  try {
    const project = await db.findById('projects', req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Get associated payment
    const payment = await db.findOne('payments', { projectId: project.id });

    res.json({ ...project, payment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createProject = async (req, res) => {
  try {
    console.log('Creating project with data:', req.body);
    const project = await db.insert('projects', req.body);
    console.log('Project inserted:', project);

    const pricingSettings = await getPricingSettings();
    const manualCost = Number(req.body.totalCost);
    const computedCost = Number.isFinite(manualCost) && manualCost > 0
      ? manualCost
      : estimateProjectCost(project.systemSize, pricingSettings);

    console.log('Creating payment with cost:', computedCost);
    await db.insert('payments', {
      projectId: project.id,
      customerName: project.customerName,
      totalCost: computedCost,
      advancePaid: 0,
      remainingBalance: computedCost,
      paymentHistory: []
    });

    await db.insert('activities', {
      type: 'project_created',
      description: `New project created: ${project.customerName} - ${project.systemSize}kW`,
      entityId: project.id,
      entityType: 'project',
      userId: req.user.id
    });

    console.log('Project creation complete');
    res.status(201).json(project);
  } catch (error) {
    console.error('Project creation error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { totalCost, ...projectUpdates } = req.body;

    if (totalCost !== undefined) {
      const parsedTotalCost = Number(totalCost);
      if (Number.isFinite(parsedTotalCost) && parsedTotalCost >= 0) {
        projectUpdates.totalCost = parsedTotalCost;
      }
    }

    const project = await db.update('projects', req.params.id, projectUpdates);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const parsedTotalCost = Number(totalCost);
    if (Number.isFinite(parsedTotalCost) && parsedTotalCost >= 0) {
      const existingPayment = await db.findOne('payments', { projectId: project.id });
      const nextTotalCost = Math.round(parsedTotalCost);
      const paidAmount = Number(existingPayment?.advancePaid) || 0;
      const nextRemaining = Math.max(0, nextTotalCost - paidAmount);

      if (existingPayment) {
        await db.update('payments', existingPayment.id, {
          customerName: project.customerName,
          totalCost: nextTotalCost,
          remainingBalance: nextRemaining
        });
      } else {
        await db.insert('payments', {
          projectId: project.id,
          customerName: project.customerName,
          totalCost: nextTotalCost,
          advancePaid: 0,
          remainingBalance: nextTotalCost,
          paymentHistory: []
        });
      }
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const success = await db.delete('projects', req.params.id);
    if (!success) return res.status(404).json({ error: 'Project not found' });

    // Delete associated payment
    const payment = await db.findOne('payments', { projectId: req.params.id });
    if (payment) await db.delete('payments', payment.id);

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProjectStage = async (req, res) => {
  try {
    const { stage } = req.body;
    const project = await db.update('projects', req.params.id, { stage });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    await db.insert('activities', {
      type: 'stage_updated',
      description: `Project stage updated to ${stage}: ${project.customerName}`,
      entityId: project.id,
      entityType: 'project',
      userId: req.user.id
    });

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateNetMeterStatus = async (req, res) => {
  try {
    const { netMeterStatus } = req.body;
    const project = await db.update('projects', req.params.id, { netMeterStatus });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateSubsidyStatus = async (req, res) => {
  try {
    const { subsidyStatus } = req.body;
    const project = await db.update('projects', req.params.id, { subsidyStatus });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProjectStats = async (req, res) => {
  try {
    const projects = await db.read('projects');
    const stats = {
      total: projects.length,
      'Quotation': projects.filter(p => p.stage === 'Quotation').length,
      'Structure installed': projects.filter(p => p.stage === 'Structure installed').length,
      'Work completed at site': projects.filter(p => p.stage === 'Work completed at site').length,
      'net metering': projects.filter(p => p.stage === 'net metering').length,
      'Project Completed': projects.filter(p => p.stage === 'Project Completed').length,
      pendingNetMeter: projects.filter(p => p.netMeterStatus === 'pending' || p.netMeterStatus === 'applied').length,
      pendingSubsidy: projects.filter(p => p.subsidyStatus === 'applied').length
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
