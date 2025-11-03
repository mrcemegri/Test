const express = require('express');
const { Pipeline, PipelineStage } = require('../models');
const { authorizeRoles } = require('../middleware/auth');
const { validateRequest, validateParams, validateQuery, schemas } = require('../middleware/validation');
const { successResponse, paginatedResponse } = require('../utils/response');

const router = express.Router();

// Get all pipelines
router.get('/', validateQuery(schemas.query.pagination), async (req, res, next) => {
  try {
    const { limit, offset, created_by, is_active } = req.query;

    const filters = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      created_by: req.user.role === 'admin' || req.user.role === 'manager' ? created_by : req.user.id,
      is_active: is_active !== undefined ? is_active === 'true' : true
    };

    const pipelines = await Pipeline.findAll(filters);
    const total = await Pipeline.count(filters);

    res.json(
      paginatedResponse(pipelines, total, limit, offset)
    );
  } catch (error) {
    next(error);
  }
});

// Get default pipeline
router.get('/default', async (req, res, next) => {
  try {
    const pipeline = await Pipeline.getDefaultPipeline();

    res.json(
      successResponse(pipeline)
    );
  } catch (error) {
    next(error);
  }
});

// Get pipeline by ID with stages
router.get('/:id', validateParams(schemas.id), async (req, res, next) => {
  try {
    const pipeline = await Pipeline.findByIdWithStages(req.params.id);

    // Check access permissions
    if (req.user.role === 'admin' ||
        req.user.role === 'manager' ||
        pipeline.created_by === req.user.id) {
      res.json(
        successResponse(pipeline)
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

// Create new pipeline (admin/manager only)
router.post('/', authorizeRoles('admin', 'manager'), validateRequest(schemas.pipeline.create), async (req, res, next) => {
  try {
    const pipelineData = {
      ...req.body,
      created_by: req.user.id,
      company_id: req.user.company_id
    };

    const pipeline = await Pipeline.create(pipelineData);

    res.status(201).json(
      successResponse(pipeline, 'Pipeline created successfully')
    );
  } catch (error) {
    next(error);
  }
});

// Update pipeline
router.put('/:id', validateParams(schemas.id), validateRequest(schemas.pipeline.update), async (req, res, next) => {
  try {
    const pipeline = await Pipeline.findById(req.params.id);

    // Check permissions
    if (req.user.role === 'admin' ||
        req.user.role === 'manager' ||
        pipeline.created_by === req.user.id) {

      const updatedPipeline = await Pipeline.update(req.params.id, req.body);

      res.json(
        successResponse(updatedPipeline, 'Pipeline updated successfully')
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

// Delete pipeline (admin/manager only)
router.delete('/:id', authorizeRoles('admin', 'manager'), validateParams(schemas.id), async (req, res, next) => {
  try {
    await Pipeline.delete(req.params.id);

    res.json(
      successResponse(null, 'Pipeline deleted successfully')
    );
  } catch (error) {
    next(error);
  }
});

// Get pipeline stages
router.get('/:id/stages', validateParams(schemas.id), async (req, res, next) => {
  try {
    const pipeline = await Pipeline.findById(req.params.id);

    // Check access permissions
    if (req.user.role === 'admin' ||
        req.user.role === 'manager' ||
        pipeline.created_by === req.user.id) {

      const { is_active } = req.query;
      const stages = await Pipeline.getStages(req.params.id, {
        is_active: is_active !== undefined ? is_active === 'true' : true
      });

      res.json(
        successResponse(stages)
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

// Add stage to pipeline (admin/manager only)
router.post('/:id/stages', authorizeRoles('admin', 'manager'), validateParams(schemas.id), validateRequest({
  name: schemas.pipeline.create.extract().stages[0].name,
  order_index: schemas.pipeline.create.extract().stages[0].order_index,
  probability: schemas.pipeline.create.extract().stages[0].probability
}), async (req, res, next) => {
  try {
    const pipeline = await Pipeline.findById(req.params.id);

    // Check permissions
    if (req.user.role === 'admin' ||
        req.user.role === 'manager' ||
        pipeline.created_by === req.user.id) {

      const stage = await Pipeline.addStage(req.params.id, req.body);

      res.status(201).json(
        successResponse(stage, 'Stage added successfully')
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

// Update pipeline stage
router.put('/stages/:stageId', validateParams({ stageId: schemas.id }), validateRequest({
  name: schemas.pipeline.create.extract().stages[0].name,
  probability: schemas.pipeline.create.extract().stages[0].probability
}), async (req, res, next) => {
  try {
    const stage = await PipelineStage.findById(req.params.stageId);
    const pipeline = await Pipeline.findById(stage.pipeline_id);

    // Check permissions
    if (req.user.role === 'admin' ||
        req.user.role === 'manager' ||
        pipeline.created_by === req.user.id) {

      const updatedStage = await PipelineStage.update(req.params.stageId, req.body);

      res.json(
        successResponse(updatedStage, 'Stage updated successfully')
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

// Delete pipeline stage (admin/manager only)
router.delete('/stages/:stageId', authorizeRoles('admin', 'manager'), validateParams({ stageId: schemas.id }), async (req, res, next) => {
  try {
    await PipelineStage.delete(req.params.stageId);

    res.json(
      successResponse(null, 'Stage deleted successfully')
    );
  } catch (error) {
    next(error);
  }
});

// Get deals count for each stage
router.get('/:id/stages/stats', validateParams(schemas.id), async (req, res, next) => {
  try {
    const pipeline = await Pipeline.findByIdWithStages(req.params.id);

    // Check access permissions
    if (req.user.role === 'admin' ||
        req.user.role === 'manager' ||
        pipeline.created_by === req.user.id) {

      // Get deal counts for each stage
      const stageStats = await Promise.all(
        pipeline.stages.map(async (stage) => {
          const dealCount = await PipelineStage.getDealCount(stage.id);
          return {
            ...stage,
            deal_count: dealCount
          };
        })
      );

      res.json(
        successResponse(stageStats)
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

module.exports = router;