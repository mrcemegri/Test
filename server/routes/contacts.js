const express = require('express');
const { Contact } = require('../models');
const { authorizeRoles } = require('../middleware/auth');
const { validateRequest, validateParams, validateQuery, schemas } = require('../middleware/validation');
const { successResponse, paginatedResponse } = require('../utils/response');

const router = express.Router();

// Get all contacts
router.get('/', validateQuery(schemas.query.pagination), async (req, res, next) => {
  try {
    const { limit, offset, assigned_to, company_id, lifecycle_stage, sort_by, sort_order } = req.query;

    // Filter based on user role
    let filters = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      assigned_to: req.user.role === 'admin' || req.user.role === 'manager' ? assigned_to : req.user.id,
      company_id,
      lifecycle_stage,
      sort_by,
      sort_order
    };

    const contacts = await Contact.findAll(filters);
    const total = await Contact.count({
      assigned_to: filters.assigned_to,
      company_id,
      lifecycle_stage
    });

    res.json(
      paginatedResponse(contacts, total, limit, offset)
    );
  } catch (error) {
    next(error);
  }
});

// Search contacts
router.get('/search', validateQuery(schemas.query.search), async (req, res, next) => {
  try {
    const { q, limit, offset } = req.query;

    const filters = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      assigned_to: req.user.role === 'admin' || req.user.role === 'manager' ? undefined : req.user.id
    };

    const contacts = await Contact.search(q, filters);

    res.json(
      successResponse(contacts)
    );
  } catch (error) {
    next(error);
  }
});

// Get contact lifecycle stats
router.get('/stats/lifecycle', async (req, res, next) => {
  try {
    const stats = await Contact.getLifecycleStats();

    res.json(
      successResponse(stats)
    );
  } catch (error) {
    next(error);
  }
});

// Get contact by ID
router.get('/:id', validateParams(schemas.id), async (req, res, next) => {
  try {
    const contact = await Contact.findByIdWithRelations(req.params.id);

    // Check access permissions
    if (req.user.role === 'admin' ||
        req.user.role === 'manager' ||
        contact.assigned_to === req.user.id ||
        contact.created_by === req.user.id) {
      res.json(
        successResponse(contact)
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

// Create new contact
router.post('/', validateRequest(schemas.contact.create), async (req, res, next) => {
  try {
    const contactData = {
      ...req.body,
      assigned_to: req.user.role === 'admin' || req.user.role === 'manager' ? req.body.assigned_to : req.user.id,
      created_by: req.user.id
    };

    const contact = await Contact.create(contactData);

    res.status(201).json(
      successResponse(contact, 'Contact created successfully')
    );
  } catch (error) {
    next(error);
  }
});

// Update contact
router.put('/:id', validateParams(schemas.id), validateRequest(schemas.contact.update), async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id);

    // Check permissions
    if (req.user.role === 'admin' ||
        req.user.role === 'manager' ||
        contact.assigned_to === req.user.id ||
        contact.created_by === req.user.id) {

      // Only admin/manager can change assignment
      if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.body.assigned_to) {
        delete req.body.assigned_to;
      }

      const updatedContact = await Contact.update(req.params.id, req.body);

      res.json(
        successResponse(updatedContact, 'Contact updated successfully')
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

// Delete contact
router.delete('/:id', validateParams(schemas.id), async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id);

    // Check permissions (only admin or creator can delete)
    if (req.user.role === 'admin' || contact.created_by === req.user.id) {
      await Contact.delete(req.params.id);

      res.json(
        successResponse(null, 'Contact deleted successfully')
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

// Assign contact to user
router.post('/:id/assign', validateParams(schemas.id), async (req, res, next) => {
  try {
    const { assigned_to } = req.body;

    if (!assigned_to) {
      return res.status(400).json({
        success: false,
        error: 'assigned_to field is required'
      });
    }

    // Only admin/manager can assign contacts
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const contact = await Contact.assign(req.params.id, assigned_to);

    res.json(
      successResponse(contact, 'Contact assigned successfully')
    );
  } catch (error) {
    next(error);
  }
});

// Get contact activities
router.get('/:id/activities', validateParams(schemas.id), async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id);

    // Check access permissions
    if (req.user.role === 'admin' ||
        req.user.role === 'manager' ||
        contact.assigned_to === req.user.id ||
        contact.created_by === req.user.id) {

      const { limit, offset, type } = req.query;
      const activities = await Contact.getActivities(req.params.id, {
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

// Get contact deals
router.get('/:id/deals', validateParams(schemas.id), async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id);

    // Check access permissions
    if (req.user.role === 'admin' ||
        req.user.role === 'manager' ||
        contact.assigned_to === req.user.id ||
        contact.created_by === req.user.id) {

      const { limit, offset, status } = req.query;
      const deals = await Contact.getDeals(req.params.id, {
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