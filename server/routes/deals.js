const express = require('express');
const { Deal } = require('../models');
const { authorizeRoles } = require('../middleware/auth');
const { validateRequest, validateParams, validateQuery, schemas } = require('../middleware/validation');
const { successResponse, paginatedResponse } = require('../utils/response');

const router = express.Router();

// Get all deals
router.get('/', validateQuery(schemas.query.pagination), async (req, res, next) => {
  try {
    const { limit, offset, pipeline_id, current_stage_id, assigned_to, contact_id, company_id, status, sort_by, sort_order } = req.query;

    // Filter based on user role
    let filters = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      pipeline_id,
      current_stage_id,
      assigned_to: req.user.role === 'admin' || req.user.role === 'manager' ? assigned_to : req.user.id,
      contact_id,
      company_id,
      status,
      sort_by,
      sort_order
    };

    const deals = await Deal.findAll(filters);
    const total = await Deal.count({
      pipeline_id,
      current_stage_id,
      assigned_to: filters.assigned_to,
      contact_id,
      company_id,
      status
    });

    res.json(
      paginatedResponse(deals, total, limit, offset)
    );
  } catch (error) {
    next(error);
  }
});

// Search deals
router.get('/search', validateQuery(schemas.query.search), async (req, res, next) => {
  try {
    const { q, limit, offset } = req.query;

    const filters = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      assigned_to: req.user.role === 'admin' || req.user.role === 'manager' ? undefined : req.user.id,
      pipeline_id: req.query.pipeline_id
    };

    const deals = await Deal.search(q, filters);

    res.json(
      successResponse(deals)
    );
  } catch (error) {
    next(error);
  }
});

// Get deal by ID
router.get('/:id', validateParams(schemas.id), async (req, res, next) => {
  try {
    const deal = await Deal.findByIdWithRelations(req.params.id);

    // Check access permissions
    if (req.user.role === 'admin' ||
        req.user.role === 'manager' ||
        deal.assigned_to === req.user.id ||
        deal.created_by === req.user.id) {
      res.json(
        successResponse(deal)
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

// Create new deal
router.post('/', validateRequest(schemas.deal.create), async (req, res, next) => {
  try {
    const dealData = {
      ...req.body,
      assigned_to: req.user.role === 'admin' || req.user.role === 'manager' ? req.body.assigned_to : req.user.id,
      created_by: req.user.id
    };

    const deal = await Deal.create(dealData);

    res.status(201).json(
      successResponse(deal, 'Deal created successfully')
    );
  } catch (error) {
    next(error);
  }
});

// Update deal
router.put('/:id', validateParams(schemas.id), validateRequest(schemas.deal.update), async (req, res, next) => {
  try {
    const deal = await Deal.findById(req.params.id);

    // Check permissions
    if (req.user.role === 'admin' ||
        req.user.role === 'manager' ||
        deal.assigned_to === req.user.id ||
        deal.created_by === req.user.id) {

      // Only admin/manager can change assignment
      if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.body.assigned_to) {
        delete req.body.assigned_to;
      }

      const updatedDeal = await Deal.update(req.params.id, req.body);

      res.json(
        successResponse(updatedDeal, 'Deal updated successfully')
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

// Delete deal
router.delete('/:id', validateParams(schemas.id), async (req, res, next) => {
  try {
    const deal = await Deal.findById(req.params.id);

    // Check permissions (only admin or creator can delete)
    if (req.user.role === 'admin' || deal.created_by === req.user.id) {
      await Deal.delete(req.params.id);

      res.json(
        successResponse(null, 'Deal deleted successfully')
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

// Move deal to different stage
router.post('/:id/move-stage', validateParams(schemas.id), validateRequest(schemas.deal.moveStage), async (req, res, next) => {
  try {
    const deal = await Deal.findById(req.params.id);

    // Check permissions
    if (req.user.role === 'admin' ||
        req.user.role === 'manager' ||
        deal.assigned_to === req.user.id ||
        deal.created_by === req.user.id) {

      const updatedDeal = await Deal.moveStage(req.params.id, req.body.stage_id);

      res.json(
        successResponse(updatedDeal, 'Deal moved to new stage successfully')
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

// Get deals for a pipeline
router.get('/pipeline/:pipelineId', validateParams(schemas.id), async (req, res, next) => {
  try {
    const { limit, offset, assigned_to } = req.query;

    const filters = {
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0,
      assigned_to: req.user.role === 'admin' || req.user.role === 'manager' ? assigned_to : req.user.id
    };

    const deals = await Deal.getPipelineDeals(req.params.pipelineId, filters);

    res.json(
      successResponse(deals)
    );
  } catch (error) {
    next(error);
  }
});

// Get deal activities
router.get('/:id/activities', validateParams(schemas.id), async (req, res, next) => {
  try {
    const deal = await Deal.findById(req.params.id);

    // Check access permissions
    if (req.user.role === 'admin' ||
        req.user.role === 'manager' ||
        deal.assigned_to === req.user.id ||
        deal.created_by === req.user.id) {

      const { limit, offset, type } = req.query;
      const activities = await Deal.getActivities(req.params.id, {
        limit: parseInt(limit) || 20,
        offset: parseInt(offset) || 0,
        type
      });

      res.json(
        successResponse(activities)
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

// Get pipeline statistics
router.get('/pipeline/:pipelineId/stats', validateParams(schemas.id), async (req, res, next) => {
  try {
    const stats = await Deal.getPipelineStats(req.params.pipelineId);

    res.json(
      successResponse(stats)
    );
  } catch (error) {
    next(error);
  }
});

// Get deal value by stage
router.get('/pipeline/:pipelineId/value', validateParams(schemas.id), async (req, res, next) => {
  try {
    const values = await Deal.getValueByStage(req.params.pipelineId);

    res.json(
      successResponse(values)
    );
  } catch (error) {
    next(error);
  }
});

module.exports = router;