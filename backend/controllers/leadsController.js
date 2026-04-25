import { db } from '../models/db.js';
import { getPricingSettings, estimateProjectCost } from '../utils/pricing.js';

const ensureProjectForConvertedLead = async (lead, conversionData = {}) => {
  const leadId = lead.id || lead._id;
  let project = await db.findOne('projects', { leadId });
  let createdProject = false;

  if (!project) {
    const systemSize = conversionData.systemSize || lead.loadRequirement;
    const totalCost = Number(conversionData.totalCost) || 0;

    console.log('Converting lead to project:', { leadId, systemSize, totalCost });

    project = await db.insert('projects', {
      leadId: leadId,
      customerName: lead.name,
      phone: lead.phone,
      email: lead.email,
      address: lead.address,
      systemSize: systemSize,
      inverter: conversionData.inverter || 'TBD',
      panelType: conversionData.panelType || (conversionData.dcrModel ? 'DCR' : (conversionData.nonDcrModel ? 'Non-DCR' : 'TBD')),
      panelCount: Number(conversionData.panelCount) || Math.ceil(systemSize * 1000 / 545),
      totalCost: totalCost,
      stage: conversionData.stage || 'Quotation',
      netMeterStatus: conversionData.netMeterStatus || 'pending',
      subsidyStatus: conversionData.subsidyStatus || 'without subsidy',
      dcrQty: conversionData.dcrQty || '',
      dcrModel: conversionData.dcrModel || '',
      nonDcrQty: conversionData.nonDcrQty || '',
      nonDcrModel: conversionData.nonDcrModel || '',
      acdb: conversionData.acdb || '',
      dcdb: conversionData.dcdb || '',
      structure: conversionData.structure || '',
      dcCable: conversionData.dcCable || '',
      acCable: conversionData.acCable || '',
      copperEarthing: conversionData.copperEarthing || '',
      chemicalEarthing: conversionData.chemicalEarthing || '',
      accessories: conversionData.accessories || '',
      startDate: new Date().toISOString().split('T')[0],
      notes: conversionData.notes || lead.notes || ''
    });
    console.log('Project created:', project);
    createdProject = true;
  }

  const projectId = project.id || project._id;
  const existingPayment = await db.findOne('payments', { projectId });
  if (!existingPayment) {
    const pricingSettings = await getPricingSettings();
    const manualCost = Number(project.totalCost);
    const computedCost = Number.isFinite(manualCost) && manualCost > 0
      ? manualCost
      : estimateProjectCost(lead.loadRequirement, pricingSettings);

    console.log('Creating payment for project:', projectId);
    await db.insert('payments', {
      projectId: projectId,
      customerName: lead.name,
      totalCost: computedCost,
      advancePaid: 0,
      remainingBalance: computedCost,
      paymentHistory: []
    });
  }

  return { project, createdProject };
};

export const getLeads = async (req, res) => {
  try {
    const { status, source, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    let query = {};
    if (status) query.status = status;
    if (source) query.source = source;

    let leads = await db.find('leads', query);

    if (search) {
      const searchLower = search.toLowerCase();
      leads = leads.filter(lead => 
        lead.name.toLowerCase().includes(searchLower) ||
        lead.phone.includes(search) ||
        lead.email?.toLowerCase().includes(searchLower) ||
        lead.address.toLowerCase().includes(searchLower)
      );
    }

    leads.sort((a, b) => {
      const aVal = a[sortBy] || '';
      const bVal = b[sortBy] || '';
      return sortOrder === 'asc' 
        ? aVal > bVal ? 1 : -1 
        : aVal < bVal ? 1 : -1;
    });

    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getLead = async (req, res) => {
  try {
    const lead = await db.findById('leads', req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json(lead);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createLead = async (req, res) => {
  try {
    const lead = await db.insert('leads', req.body);
    let createdProject = null;

    if (lead.status === 'converted') {
      const conversion = await ensureProjectForConvertedLead(lead, req.body);
      createdProject = conversion.project;
      if (conversion.createdProject) {
        await db.insert('activities', {
          type: 'lead_converted',
          description: `Lead converted to project: ${lead.name}`,
          entityId: conversion.project.id,
          entityType: 'project',
          userId: req.user.id
        });
      }
    }

    await db.insert('activities', {
      type: 'lead_created',
      description: `New lead created: ${lead.name}`,
      entityId: lead.id,
      entityType: 'lead',
      userId: req.user.id
    });

    res.status(201).json({ lead, project: createdProject });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateLead = async (req, res) => {
  try {
    const existingLead = await db.findById('leads', req.params.id);
    if (!existingLead) return res.status(404).json({ error: 'Lead not found' });

    const lead = await db.update('leads', req.params.id, req.body);
    let createdProject = null;

    if (lead.status === 'converted') {
      const conversion = await ensureProjectForConvertedLead(lead, req.body);
      createdProject = conversion.project;

      if (conversion.createdProject) {
        await db.insert('activities', {
          type: 'lead_converted',
          description: `Lead converted to project: ${lead.name}`,
          entityId: conversion.project.id,
          entityType: 'project',
          userId: req.user.id
        });
      }
    }

    res.json({ lead, project: createdProject, wasConverted: existingLead.status !== 'converted' && lead.status === 'converted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteLead = async (req, res) => {
  try {
    const success = await db.delete('leads', req.params.id);
    if (!success) return res.status(404).json({ error: 'Lead not found' });
    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const convertLead = async (req, res) => {
  try {
    const lead = await db.findById('leads', req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    let leadAfterUpdate = lead;
    if (lead.status !== 'converted') {
      leadAfterUpdate = await db.update('leads', lead.id, { status: 'converted' });
    }

    const conversion = await ensureProjectForConvertedLead(leadAfterUpdate, req.body);

    // Log activity
    if (conversion.createdProject) {
      await db.insert('activities', {
        type: 'lead_converted',
        description: `Lead converted to project: ${leadAfterUpdate.name}`,
        entityId: conversion.project.id,
        entityType: 'project',
        userId: req.user.id
      });
    } else if (lead.status === 'converted') {
      return res.status(400).json({ error: 'Lead already converted' });
    }

    res.json({ lead: await db.findById('leads', lead.id), project: conversion.project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getLeadStats = async (req, res) => {
  try {
    const leads = await db.read('leads');
    const stats = {
      total: leads.length,
      new: leads.filter(l => l.status === 'new').length,
      contacted: leads.filter(l => l.status === 'contacted').length,
      interested: leads.filter(l => l.status === 'interested').length,
      converted: leads.filter(l => l.status === 'converted').length,
      rejected: leads.filter(l => l.status === 'rejected').length,
      conversionRate: leads.length > 0 ? ((leads.filter(l => l.status === 'converted').length / leads.length) * 100).toFixed(1) : 0
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
