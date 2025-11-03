const { Activity } = require('../models');
const { NotFoundError } = require('../utils/errors');

class ActivityService {
  static async createActivity(activityData, userId) {
    try {
      const activity = await Activity.create({
        ...activityData,
        created_by: userId
      });

      return activity;
    } catch (error) {
      throw error;
    }
  }

  static async getActivityById(id, user) {
    try {
      const activity = await Activity.findByIdWithRelations(id);

      // Check access permissions
      if (user.role === 'admin' ||
          user.role === 'manager' ||
          activity.created_by === user.id) {
        return activity;
      } else {
        throw new NotFoundError('Activity');
      }
    } catch (error) {
      throw error;
    }
  }

  static async updateActivity(id, updates, user) {
    try {
      const activity = await Activity.findById(id);

      // Check permissions
      if (user.role === 'admin' ||
          user.role === 'manager' ||
          activity.created_by === user.id) {

        const updatedActivity = await Activity.update(id, updates);
        return updatedActivity;
      } else {
        throw new NotFoundError('Activity');
      }
    } catch (error) {
      throw error;
    }
  }

  static async deleteActivity(id, user) {
    try {
      const activity = await Activity.findById(id);

      // Check permissions (only admin or creator can delete)
      if (user.role === 'admin' || activity.created_by === user.id) {
        await Activity.delete(id);
        return true;
      } else {
        throw new NotFoundError('Activity');
      }
    } catch (error) {
      throw error;
    }
  }

  static async getActivities(filters, user) {
    try {
      // Filter based on user role
      let activityFilters = {
        ...filters,
        created_by: user.role === 'admin' || user.role === 'manager' ? filters.created_by : user.id
      };

      const activities = await Activity.findAll(activityFilters);
      return activities;
    } catch (error) {
      throw error;
    }
  }

  static async searchActivities(query, filters, user) {
    try {
      const searchFilters = {
        ...filters
      };

      const activities = await Activity.search(query, searchFilters);
      return activities;
    } catch (error) {
      throw error;
    }
  }

  static async getRecentActivities(user, limit = 10) {
    try {
      const filters = {
        limit,
        created_by: user.role === 'admin' || user.role === 'manager' ? undefined : user.id
      };

      const activities = await Activity.getRecent(filters);
      return activities;
    } catch (error) {
      throw error;
    }
  }

  static async getActivityStats(user, filters = {}) {
    try {
      const activityFilters = {
        ...filters,
        created_by: user.role === 'admin' || user.role === 'manager' ? filters.created_by : user.id
      };

      const stats = await Activity.getStats(activityFilters);
      return stats;
    } catch (error) {
      throw error;
    }
  }

  static async getPendingTasks(user, filters = {}) {
    try {
      const taskFilters = {
        ...filters,
        assigned_to: user.role === 'admin' || user.role === 'manager' ? filters.assigned_to : user.id
      };

      const tasks = await Activity.getPendingTasks(taskFilters);
      return tasks;
    } catch (error) {
      throw error;
    }
  }

  static async completeTask(id, user) {
    try {
      const activity = await Activity.findById(id);

      // Check permissions
      if (user.role === 'admin' ||
          user.role === 'manager' ||
          activity.created_by === user.id) {

        if (activity.type !== 'task') {
          throw new Error('Activity is not a task');
        }

        const completedTask = await Activity.completeTask(id);
        return completedTask;
      } else {
        throw new NotFoundError('Activity');
      }
    } catch (error) {
      throw error;
    }
  }

  static async getContactTimeline(contactId, filters, user) {
    try {
      const activities = await Activity.getContactTimeline(contactId, filters);
      return activities;
    } catch (error) {
      throw error;
    }
  }

  static async getDealTimeline(dealId, filters, user) {
    try {
      const activities = await Activity.getDealTimeline(dealId, filters);
      return activities;
    } catch (error) {
      throw error;
    }
  }

  static async logActivity(type, subject, description, relatedEntities, userId) {
    try {
      const activityData = {
        type,
        subject,
        description,
        created_by: userId,
        ...relatedEntities // Can include deal_id, contact_id, etc.
      };

      const activity = await Activity.create(activityData);
      return activity;
    } catch (error) {
      throw error;
    }
  }

  // Utility method to automatically log activities for system events
  static async logSystemEvent(eventType, entityData, userId) {
    try {
      const activityData = {
        type: 'note',
        subject: `System Event: ${eventType}`,
        description: `System automatically logged event: ${eventType}`,
        created_by: userId,
        is_completed: true
      };

      // Add entity relationships if provided
      if (entityData.contact_id) activityData.contact_id = entityData.contact_id;
      if (entityData.deal_id) activityData.deal_id = entityData.deal_id;
      if (entityData.company_id) {
        // Activities don't directly link to companies, but we could add a note in description
        activityData.description += ` (Company: ${entityData.company_name || 'N/A'})`;
      }

      const activity = await Activity.create(activityData);
      return activity;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ActivityService;