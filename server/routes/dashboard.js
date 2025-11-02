const express = require('express');
const { Deal, Contact, Company, Activity, User } = require('../models');
const { authorizeRoles } = require('../middleware/auth');
const { successResponse } = require('../utils/response');

const router = express.Router();

// Get dashboard metrics
router.get('/metrics', async (req, res, next) => {
  try {
    const metrics = {};

    // Deal metrics
    metrics.deals = {
      total: await Deal.count({
        assigned_to: req.user.role === 'admin' || req.user.role === 'manager' ? undefined : req.user.id
      }),
      open: await Deal.count({
        assigned_to: req.user.role === 'admin' || req.user.role === 'manager' ? undefined : req.user.id,
        status: 'open'
      }),
      won: await Deal.count({
        assigned_to: req.user.role === 'admin' || req.user.role === 'manager' ? undefined : req.user.id,
        status: 'won'
      }),
      lost: await Deal.count({
        assigned_to: req.user.role === 'admin' || req.user.role === 'manager' ? undefined : req.user.id,
        status: 'lost'
      })
    };

    // Contact metrics
    metrics.contacts = {
      total: await Contact.count({
        assigned_to: req.user.role === 'admin' || req.user.role === 'manager' ? undefined : req.user.id
      }),
      leads: await Contact.count({
        assigned_to: req.user.role === 'admin' || req.user.role === 'manager' ? undefined : req.user.id,
        lifecycle_stage: 'lead'
      }),
      mql: await Contact.count({
        assigned_to: req.user.role === 'admin' || req.user.role === 'manager' ? undefined : req.user.id,
        lifecycle_stage: 'mql'
      }),
      sql: await Contact.count({
        assigned_to: req.user.role === 'admin' || req.user.role === 'manager' ? undefined : req.user.id,
        lifecycle_stage: 'sql'
      }),
      opportunities: await Contact.count({
        assigned_to: req.user.role === 'admin' || req.user.role === 'manager' ? undefined : req.user.id,
        lifecycle_stage: 'opportunity'
      }),
      customers: await Contact.count({
        assigned_to: req.user.role === 'admin' || req.user.role === 'manager' ? undefined : req.user.id,
        lifecycle_stage: 'customer'
      })
    };

    // Company metrics
    metrics.companies = {
      total: await Company.count({
        assigned_to: req.user.role === 'admin' || req.user.role === 'manager' ? undefined : req.user.id
      })
    };

    // Activity metrics
    metrics.activities = {
      total: await Activity.count({
        created_by: req.user.role === 'admin' || req.user.role === 'manager' ? undefined : req.user.id
      }),
      pending_tasks: await Activity.count({
        created_by: req.user.role === 'admin' || req.user.role === 'manager' ? undefined : req.user.id,
        type: 'task',
        is_completed: false
      })
    };

    // Pipeline value metrics
    const pipelineStats = await Deal.getValueByStage('default-pipeline-id'); // Would need to get actual default pipeline ID
    metrics.pipeline_value = pipelineStats.reduce((total, stage) => total + parseFloat(stage.total_value || 0), 0);

    res.json(
      successResponse(metrics)
    );
  } catch (error) {
    next(error);
  }
});

// Get pipeline health
router.get('/pipeline-health', async (req, res, next) => {
  try {
    // Get pipeline health metrics
    const pipelineHealth = {
      total_deals: 0,
      total_value: 0,
      average_deal_value: 0,
      conversion_rate: 0,
      deal_velocity: 0 // Average time to close
    };

    const dealCounts = await Deal.count({
      assigned_to: req.user.role === 'admin' || req.user.role === 'manager' ? undefined : req.user.id
    });

    const openDeals = await Deal.findAll({
      assigned_to: req.user.role === 'admin' || req.user.role === 'manager' ? undefined : req.user.id,
      status: 'open',
      limit: 1000 // Get all open deals for calculation
    });

    const wonDeals = await Deal.findAll({
      assigned_to: req.user.role === 'admin' || req.user.role === 'manager' ? undefined : req.user.id,
      status: 'won',
      limit: 1000 // Get all won deals for calculation
    });

    pipelineHealth.total_deals = dealCounts;
    pipelineHealth.total_value = openDeals.reduce((total, deal) => total + parseFloat(deal.amount || 0), 0);
    pipelineHealth.average_deal_value = openDeals.length > 0 ? pipelineHealth.total_value / openDeals.length : 0;
    pipelineHealth.conversion_rate = dealCounts > 0 ? (wonDeals.length / dealCounts) * 100 : 0;

    res.json(
      successResponse(pipelineHealth)
    );
  } catch (error) {
    next(error);
  }
});

// Get team performance (admin/manager only)
router.get('/team-performance', authorizeRoles('admin', 'manager'), async (req, res, next) => {
  try {
    const teamMembers = await User.findTeamMembers(req.user.company_id);

    const teamPerformance = await Promise.all(
      teamMembers.map(async (member) => {
        const dealCount = await Deal.count({ assigned_to: member.id });
        const contactCount = await Contact.count({ assigned_to: member.id });
        const activityCount = await Activity.count({ created_by: member.id });

        const dealValue = await Deal.findAll({
          assigned_to: member.id,
          status: 'open',
          limit: 1000
        });

        const totalValue = dealValue.reduce((total, deal) => total + parseFloat(deal.amount || 0), 0);

        return {
          user: member,
          metrics: {
            deals_count: dealCount,
            contacts_count: contactCount,
            activities_count: activityCount,
            pipeline_value: totalValue
          }
        };
      })
    );

    res.json(
      successResponse(teamPerformance)
    );
  } catch (error) {
    next(error);
  }
});

// Get recent activities for dashboard
router.get('/recent-activities', async (req, res, next) => {
  try {
    const activities = await Activity.getRecent({
      limit: 10,
      created_by: req.user.role === 'admin' || req.user.role === 'manager' ? undefined : req.user.id
    });

    res.json(
      successResponse(activities)
    );
  } catch (error) {
    next(error);
  }
});

// Get upcoming tasks
router.get('/upcoming-tasks', async (req, res, next) => {
  try {
    const tasks = await Activity.getPendingTasks({
      limit: 10,
      assigned_to: req.user.role === 'admin' || req.user.role === 'manager' ? undefined : req.user.id
    });

    res.json(
      successResponse(tasks)
    );
  } catch (error) {
    next(error);
  }
});

// Get top deals by value
router.get('/top-deals', async (req, res, next) => {
  try {
    const deals = await Deal.findAll({
      assigned_to: req.user.role === 'admin' || req.user.role === 'manager' ? undefined : req.user.id,
      status: 'open',
      sort_by: 'amount',
      sort_order: 'desc',
      limit: 10
    });

    res.json(
      successResponse(deals)
    );
  } catch (error) {
    next(error);
  }
});

// Get deals closing soon
router.get('/closing-soon', async (req, res, next) => {
  try {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));

    const deals = await Deal.findAll({
      assigned_to: req.user.role === 'admin' || req.user.role === 'manager' ? undefined : req.user.id,
      status: 'open',
      sort_by: 'expected_close_date',
      sort_order: 'asc',
      limit: 10
    });

    // Filter deals closing within 30 days
    const closingSoon = deals.filter(deal => {
      if (!deal.expected_close_date) return false;
      const closeDate = new Date(deal.expected_close_date);
      return closeDate >= today && closeDate <= thirtyDaysFromNow;
    });

    res.json(
      successResponse(closingSoon)
    );
  } catch (error) {
    next(error);
  }
});

module.exports = router;