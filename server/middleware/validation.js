const Joi = require('joi');
const { ValidationError } = require('../utils/errors');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const validationError = new ValidationError('Validation failed', error.details);
      return next(validationError);
    }

    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query, { abortEarly: false });

    if (error) {
      const validationError = new ValidationError('Query validation failed', error.details);
      return next(validationError);
    }

    next();
  };
};

const validateParams = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.params, { abortEarly: false });

    if (error) {
      const validationError = new ValidationError('Parameters validation failed', error.details);
      return next(validationError);
    }

    next();
  };
};

// Common validation schemas
const schemas = {
  id: Joi.string().uuid().required(),

  user: {
    register: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
      first_name: Joi.string().min(2).max(50).required(),
      last_name: Joi.string().min(2).max(50).required(),
      company_name: Joi.string().min(2).max(100).optional()
    }),

    login: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required()
    }),

    update: Joi.object({
      first_name: Joi.string().min(2).max(50).optional(),
      last_name: Joi.string().min(2).max(50).optional(),
      phone: Joi.string().optional(),
      role: Joi.string().valid('admin', 'manager', 'sales_rep', 'viewer').optional(),
      is_active: Joi.boolean().optional()
    })
  },

  company: {
    create: Joi.object({
      name: Joi.string().min(2).max(100).required(),
      domain: Joi.string().domain().optional(),
      phone: Joi.string().optional(),
      address: Joi.string().max(200).optional(),
      website: Joi.string().uri().optional(),
      industry: Joi.string().max(50).optional(),
      company_size: Joi.string().max(50).optional(),
      assigned_to: Joi.string().uuid().optional()
    }),

    update: Joi.object({
      name: Joi.string().min(2).max(100).optional(),
      domain: Joi.string().domain().optional(),
      phone: Joi.string().optional(),
      address: Joi.string().max(200).optional(),
      website: Joi.string().uri().optional(),
      industry: Joi.string().max(50).optional(),
      company_size: Joi.string().max(50).optional(),
      assigned_to: Joi.string().uuid().optional()
    })
  },

  contact: {
    create: Joi.object({
      first_name: Joi.string().min(2).max(50).required(),
      last_name: Joi.string().min(2).max(50).required(),
      email: Joi.string().email().required(),
      phone: Joi.string().optional(),
      mobile: Joi.string().optional(),
      company_id: Joi.string().uuid().optional(),
      job_title: Joi.string().max(100).optional(),
      department: Joi.string().max(50).optional(),
      assigned_to: Joi.string().uuid().optional(),
      lifecycle_stage: Joi.string().valid('lead', 'mql', 'sql', 'opportunity', 'customer').default('lead')
    }),

    update: Joi.object({
      first_name: Joi.string().min(2).max(50).optional(),
      last_name: Joi.string().min(2).max(50).optional(),
      email: Joi.string().email().optional(),
      phone: Joi.string().optional(),
      mobile: Joi.string().optional(),
      company_id: Joi.string().uuid().optional(),
      job_title: Joi.string().max(100).optional(),
      department: Joi.string().max(50).optional(),
      assigned_to: Joi.string().uuid().optional(),
      lifecycle_stage: Joi.string().valid('lead', 'mql', 'sql', 'opportunity', 'customer').optional()
    })
  },

  deal: {
    create: Joi.object({
      name: Joi.string().min(2).max(200).required(),
      amount: Joi.number().min(0).optional(),
      currency: Joi.string().default('USD'),
      pipeline_id: Joi.string().uuid().required(),
      current_stage_id: Joi.string().uuid().required(),
      contact_id: Joi.string().uuid().required(),
      company_id: Joi.string().uuid().optional(),
      assigned_to: Joi.string().uuid().optional(),
      expected_close_date: Joi.date().optional()
    }),

    update: Joi.object({
      name: Joi.string().min(2).max(200).optional(),
      amount: Joi.number().min(0).optional(),
      currency: Joi.string().optional(),
      current_stage_id: Joi.string().uuid().optional(),
      assigned_to: Joi.string().uuid().optional(),
      expected_close_date: Joi.date().optional(),
      actual_close_date: Joi.date().optional(),
      status: Joi.string().valid('open', 'won', 'lost').optional()
    }),

    moveStage: Joi.object({
      stage_id: Joi.string().uuid().required()
    })
  },

  pipeline: {
    create: Joi.object({
      name: Joi.string().min(2).max(100).required(),
      description: Joi.string().max(500).optional(),
      stages: Joi.array().items(
        Joi.object({
          name: Joi.string().min(2).max(100).required(),
          order_index: Joi.number().integer().min(0).required(),
          probability: Joi.number().integer().min(0).max(100).required()
        })
      ).min(1).required()
    }),

    update: Joi.object({
      name: Joi.string().min(2).max(100).optional(),
      description: Joi.string().max(500).optional(),
      is_active: Joi.boolean().optional()
    })
  },

  activity: {
    create: Joi.object({
      type: Joi.string().valid('call', 'email', 'meeting', 'note', 'task').required(),
      subject: Joi.string().min(2).max(200).required(),
      description: Joi.string().max(2000).optional(),
      deal_id: Joi.string().uuid().optional(),
      contact_id: Joi.string().uuid().optional(),
      is_completed: Joi.boolean().default(false)
    }),

    update: Joi.object({
      type: Joi.string().valid('call', 'email', 'meeting', 'note', 'task').optional(),
      subject: Joi.string().min(2).max(200).optional(),
      description: Joi.string().max(2000).optional(),
      is_completed: Joi.boolean().optional()
    })
  },

  query: {
    search: Joi.object({
      q: Joi.string().min(1).max(100).required(),
      limit: Joi.number().integer().min(1).max(100).default(20),
      offset: Joi.number().integer().min(0).default(0)
    }),

    pagination: Joi.object({
      limit: Joi.number().integer().min(1).max(100).default(20),
      offset: Joi.number().integer().min(0).default(0),
      sort_by: Joi.string().optional(),
      sort_order: Joi.string().valid('asc', 'desc').default('desc')
    })
  }
};

module.exports = {
  validateRequest,
  validateQuery,
  validateParams,
  schemas
};