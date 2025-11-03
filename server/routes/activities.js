const express = require('express');
const { Activity } = require('../models');
const { authorizeRoles } = require('../middleware/auth');
const { validateRequest, validateParams, validateQuery, schemas } = require('../middleware/validation');
const { successResponse, paginatedResponse } = require('../utils/response');

const router = express.Router();

// Get all activities
router.get('/', validateQuery(schemas.query.pagination), async (req, res, next) => {
  try {
    const { limit, offset, type, deal_id, contact_id, created_by, is_completed, sort_by, sort_order } = req.query;

    // Filter based on user role
    let filters = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      type,
      deal_id,
      contact_id,
      created_by: req.user.role === 'admin' || req.user.role === 'manager' ? created_by : req.user.id,
      is_completed: is_completed !== undefined ? is_completed === 'true' : undefined,
      sort_by,
      sort_order
    };

    const activities = await Activity.findAll(filters);
    const total = await Activity.count({
      type,
      deal_id,
      contact_id,
      created_by: filters.created_by,
      is_completed
    });

    res.json(
      paginatedResponse(activities, total, limit, offset)
    );
  } catch (error) {
    next(error);
  }
});

// Search activities
router.get('/search', validateQuery(schemas.query.search), async (req, res, next) => {
  try {
    const { q, limit, offset, type } = req.query;

    const filters = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      type
    };

    const activities = await Activity.search(q, filters);

    res.json(
      successResponse(activities)
    );
  } catch (error) {
    next(error);
  }
});

// Get recent activities
router.get('/recent', async (req, res, next) => {
  try {
    const { limit, contact_id, deal_id } = req.query;

    const filters = {
      limit: parseInt(limit) || 10,
      created_by: req.user.role === 'admin' || req.user.role === 'manager' ? undefined : req.user.id,
      contact_id,
      deal_id
    };

    const activities = await Activity.getRecent(filters);

    res.json(
      successResponse(activities)
    );
  } catch (error) {
    next(error);
  }
});

// Get activity stats
router.get('/stats', async (req, res, next) => {
  try {
    const { date_from, date_to } = req.query;

    const filters = {
      created_by: req.user.role === 'admin' || req.user.role === 'manager' ? undefined : req.user.id,
      date_from,
      date_to
    };

    const stats = await Activity.getStats(filters);

    res.json(
      successResponse(stats)
    );
  } catch (error) {
    next(error);
  }
});

// Get pending tasks
router.get('/tasks/pending', async (req, res, next) => {
  try {
    const { limit, offset } = req.query;

    const filters = {
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0,
      assigned_to: req.user.role === 'admin' || req.user.role === 'manager' ? undefined : req.user.id
    };

    const tasks = await Activity.getPendingTasks(filters);

    res.json(
      successResponse(tasks)
    );
  } catch (error) {
    next(error);
  }
});

// Get activity by ID
router.get('/:id', validateParams(schemas.id), async (req, res, next) => {
  try {
    const activity = await Activity.findByIdWithRelations(req.params.id);

    // Check access permissions
    if (req.user.role === 'admin' ||
        req.user.role === 'manager' ||
        activity.created_by === req.user.id ||
        activity.contact_id === req.user.id ||
        activity.deal_id === req.user.id) {
      res.json(
        successResponse(activity)
      );
    } else {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
  } catch (error) {
    next(error);
  }
});

// Create new activity
router.post('/', validateRequest(schemas.activity.create), async (req, res, next) => {
  try {
    const activityData = {
      ...req.body,
      created_by: req.user.id
    };

    const activity = await Activity.create(activityData);

    res.status(201).json(
      successResponse(activity, 'Activity created successfully')
    );
  } catch (error) {
    next(error);
  }
});

// Update activity
router.put('/:id', validateParams(schemas.id), validateRequest(schemas.activity.update), async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id);

    // Check permissions
    if (req.user.role === 'admin' ||
        req.user.role === 'manager' ||
        activity.created_by === req.user.id) {

      const updatedActivity = await Activity.update(req.params.id, req.body);

      res.json(
        successResponse(updatedActivity, 'Activity updated successfully')
      );
    } else {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
  } catch (error) {
    next(error);
  }
});

// Delete activity
router.delete('/:id', validateParams(schemas.id), async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id);

    // Check permissions (only admin or creator can delete)
    if (req.user.role === 'admin' || activity.created_by === req.user.id) {
      await Activity.delete(req.params.id);

      res.json(
        successResponse(null, 'Activity deleted successfully')
      );
    } else {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
  } catch (error) {
    next(error);
  }
});

// Complete task
router.post('/:id/complete', validateParams(schemas.id), async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id);

    // Check permissions
    if (req.user.role === 'admin' ||
        req.user.role === 'manager' ||
        activity.created_by === req.user.id) {

      if (activity.type !== 'task') {
        return res.status(400).json({
          success: false,
          error: 'Activity is not a task'
        });
      }

      const completedTask = await Activity.completeTask(req.params.id);

      res.json(
        successResponse(completedTask, 'Task completed successfully')
      );
    } else {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
  } catch (error) {
    next(error);
  }
});

// Get contact timeline
router.get('/contact/:contactId/timeline', validateParams({ contactId: schemas.id }), async (req, res, next) => {
  try {
    const { limit, offset } = req.query;

    const filters = {
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0
    };

    const activities = await Activity.getContactTimeline(req.params.contactId, filters);

    res.json(
      successResponse(activities)
    );
  } catch (error) {
    next(error);
  }
});

// Get deal timeline
router.get('/deal/:dealId/timeline', validateParams({ dealId: schemas.id }), async (req, res, next) => {
  try {
    const { limit, offset } = req.query;

    const filters = {
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0
    };

    const activities = await Activity.getDealTimeline(req.params.dealId, filters);

    res.json(
      successResponse(activities)
    );
  } catch (error) {
    next(error);
  }
});

module.exports = router;