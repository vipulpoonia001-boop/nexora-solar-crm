import { db } from '../models/db.js';

export const getDashboardStats = async (req, res) => {
  try {
    const leads = await db.read('leads');
    const projects = await db.read('projects');
    const payments = await db.read('payments');
    const activities = await db.read('activities');

    // Calculate monthly data for charts
    const monthlyData = {};
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      monthlyData[key] = { leads: 0, conversions: 0, revenue: 0 };
    }

    leads.forEach(lead => {
      const d = new Date(lead.createdAt);
      const key = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      if (monthlyData[key]) monthlyData[key].leads++;
    });

    const isCompletedProject = (project) => project.stage === 'Project Completed';
    const toNumber = (value) => {
      const numericValue = Number(value);
      return Number.isFinite(numericValue) ? numericValue : 0;
    };

    projects.forEach(proj => {
      if (isCompletedProject(proj)) {
        const d = new Date(proj.actualCompletion || proj.createdAt);
        const key = d.toLocaleString('default', { month: 'short', year: 'numeric' });
        if (monthlyData[key]) monthlyData[key].conversions++;
      }
    });

    payments.forEach(pay => {
      (pay.paymentHistory || []).forEach(ph => {
        const d = new Date(ph.date);
        const key = d.toLocaleString('default', { month: 'short', year: 'numeric' });
        if (monthlyData[key]) monthlyData[key].revenue += toNumber(ph.amount);
      });
    });

    const chartData = Object.entries(monthlyData).map(([name, data]) => ({
      name,
      leads: data.leads,
      conversions: data.conversions,
      revenue: data.revenue / 100000 // In lakhs
    }));

    // Alerts
    const today = new Date().toISOString().split('T')[0];
    const alerts = [];

    // Pending follow-ups
    leads.filter(l => l.status !== 'converted' && l.status !== 'rejected').forEach(l => {
      if (l.followUpDate && l.followUpDate <= today) {
        alerts.push({
          type: 'followup',
          priority: l.followUpDate < today ? 'high' : 'medium',
          message: `Follow-up pending: ${l.name}`,
          date: l.followUpDate,
          entityId: l.id
        });
      }
    });

    // Pending installations
    projects.filter(p => p.stage === 'installation').forEach(p => {
      alerts.push({
        type: 'installation',
        priority: 'medium',
        message: `Installation in progress: ${p.customerName}`,
        date: p.expectedCompletion,
        entityId: p.id
      });
    });

    // Pending net metering
    projects.filter(p => p.netMeterStatus === 'pending' || p.netMeterStatus === 'applied').forEach(p => {
      alerts.push({
        type: 'netmeter',
        priority: p.netMeterStatus === 'pending' ? 'high' : 'medium',
        message: `Net meter ${p.netMeterStatus}: ${p.customerName}`,
        date: p.updatedAt,
        entityId: p.id
      });
    });

    // Pending subsidies
    projects.filter(p => p.subsidyStatus === 'not applied' || p.subsidyStatus === 'applied').forEach(p => {
      alerts.push({
        type: 'subsidy',
        priority: p.subsidyStatus === 'not applied' ? 'high' : 'medium',
        message: `Subsidy ${p.subsidyStatus}: ${p.customerName}`,
        date: p.updatedAt,
        entityId: p.id
      });
    });

    res.json({
      stats: {
        totalLeads: leads.length,
        convertedLeads: leads.filter(l => l.status === 'converted').length,
        activeProjects: projects.length,
        completedInstallations: projects.filter(isCompletedProject).length,
        stageBreakdown: {
          'Quotation': projects.filter(p => p.stage === 'Quotation').length,
          'Structure installed': projects.filter(p => p.stage === 'Structure installed').length,
          'Work completed at site': projects.filter(p => p.stage === 'Work completed at site').length,
          'net metering': projects.filter(p => p.stage === 'net metering').length,
          'Project Completed': projects.filter(isCompletedProject).length
        },
        totalRevenue: payments.reduce((sum, p) => sum + toNumber(p.advancePaid), 0),
        pendingPayments: payments.reduce((sum, p) => sum + toNumber(p.remainingBalance), 0),
        conversionRate: leads.length > 0 ? ((leads.filter(l => l.status === 'converted').length / leads.length) * 100).toFixed(1) : 0
      },
      chartData,
      recentActivities: activities.slice(-10).reverse(),
      alerts: alerts.slice(0, 10)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
