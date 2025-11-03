const express = require('express');
const { Company } = require('../models');
const { authorizeRoles } = require('../middleware/auth');
const { validateRequest, validateParams, validateQuery, schemas } = require('../middleware/validation');
const { successResponse, paginatedResponse } = require('../utils/response');

const router = express.Router();

// Get all companies
router.get('/', validateQuery(schemas.query.pagination), async (req, res, next) => {
  try {
    const { limit, offset, assigned_to, industry, company_size } = req.query;

    // Filter based on user role
    let filters = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      assigned_to: req.user.role === 'admin' || req.user.role === 'manager' ? assigned_to : req.user.id,
      industry,
      company_size
    };

    const companies = await Company.findAll(filters);
    const total = await Company.count({
      assigned_to: filters.assigned_to,
      industry,
      company_size
    });

    res.json(
      paginatedResponse(companies, total, limit, offset)
    );
  } catch (error) {
    next(error);
  }
});

// Search companies
router.get('/search', validateQuery(schemas.query.search), async (req, res, next) => {
  try {
    const { q, limit, offset } = req.query;

    const filters = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      assigned_to: req.user.role === 'admin' || req.user.role === 'manager' ? undefined : req.user.id
    };

    const companies = await Company.search(q, filters);

    res.json(
      successResponse(companies)
    );
  } catch (error) {
    next(error);
  }
});

// Get company by ID
router.get('/:id', validateParams(schemas.id), async (req, res, next) => {
  try {
    const company = await Company.findByIdWithRelations(req.params.id);

    // Check access permissions
    if (req.user.role === 'admin' ||
        req.user.role === 'manager' ||
        company.assigned_to === req.user.id ||
        company.created_by === req.user.id) {
      res.json(
        successResponse(company)
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

// Create new company
router.post('/', validateRequest(schemas.company.create), async (req, res, next) => {
  try {
    const companyData = {
      ...req.body,
      assigned_to: req.user.role === 'admin' || req.user.role === 'manager' ? req.body.assigned_to : req.user.id,
      created_by: req.user.id
    };

    const company = await Company.create(companyData);

    res.status(201).json(
      successResponse(company, 'Company created successfully')
    );
  } catch (error) {
    next(error);
  }
});

// Update company
router.put('/:id', validateParams(schemas.id), validateRequest(schemas.company.update), async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);

    // Check permissions
    if (req.user.role === 'admin' ||
        req.user.role === 'manager' ||
        company.assigned_to === req.user.id ||
        company.created_by === req.user.id) {

      // Only admin/manager can change assignment
      if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.body.assigned_to) {
        delete req.body.assigned_to;
      }

      const updatedCompany = await Company.update(req.params.id, req.body);

      res.json(
        successResponse(updatedCompany, 'Company updated successfully')
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

// Delete company
router.delete('/:id', validateParams(schemas.id), async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);

    // Check permissions (only admin or creator can delete)
    if (req.user.role === 'admin' || company.created_by === req.user.id) {
      await Company.delete(req.params.id);

      res.json(
        successResponse(null, 'Company deleted successfully')
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

// Get company contacts
router.get('/:id/contacts', validateParams(schemas.id), async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);

    // Check access permissions
    if (req.user.role === 'admin' ||
        req.user.role === 'manager' ||
        company.assigned_to === req.user.id ||
        company.created_by === req.user.id) {

      const { limit, offset } = req.query;
      const contacts = await Company.getContacts(req.params.id, {
        limit: parseInt(limit) || 20,
        offset: parseInt(offset) || 0
      });

      res.json(
        successResponse(contacts)
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

// Get company deals
router.get('/:id/deals', validateParams(schemas.id), async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);

    // Check access permissions
    if (req.user.role === 'admin' ||
        req.user.role === 'manager' ||
        company.assigned_to === req.user.id ||
        company.created_by === req.user.id) {

      const { limit, offset, status } = req.query;
      const deals = await Company.getDeals(req.params.id, {
        limit: parseInt(limit) || 20,
        offset: parseInt(offset) || 0,
        status
      });

      res.json(
        successResponse(deals)
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