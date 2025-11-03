const { db } = require('../config/database');

// Import all models
const User = require('./User');
const Company = require('./Company');
const Contact = require('./Contact');
const Pipeline = require('./Pipeline');
const PipelineStage = require('./PipelineStage');
const Deal = require('./Deal');
const Activity = require('./Activity');

// Export models and database instance
module.exports = {
  db,
  User,
  Company,
  Contact,
  Pipeline,
  PipelineStage,
  Deal,
  Activity
};