const { db } = require('../config/database');
const { NotFoundError, DatabaseError } = require('../utils/errors');

class Activity {
  static async create(activityData) {
    try {
      const [activity] = await db('activities')
        .insert(activityData)
        .returning('*');

      return activity;
    } catch (error) {
      if (error.code === '23503') {
        if (error.constraint.includes('deal_id')) {
          throw new NotFoundError('Deal');
        }
        if (error.constraint.includes('contact_id')) {
          throw new NotFoundError('Contact');
        }
      }
      throw new DatabaseError('Failed to create activity', error);
    }
  }

  static async findById(id) {
    try {
      const activity = await db('activities')
        .where({ id })
        .first();

      if (!activity) {
        throw new NotFoundError('Activity');
      }

      return activity;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to find activity', error);
    }
  }

  static async findByIdWithRelations(id) {
    try {
      const activity = await db('activities')
        .leftJoin('contacts', 'activities.contact_id', 'contacts.id')
        .leftJoin('deals', 'activities.deal_id', 'deals.id')
        .leftJoin('users as creator_user', 'activities.created_by', 'creator_user.id')
        .select([
          'activities.*',
          'contacts.first_name as contact_first_name',
          'contacts.last_name as contact_last_name',
          'contacts.email as contact_email',
          'deals.name as deal_name',
          'creator_user.first_name as created_by_first_name',
          'creator_user.last_name as created_by_last_name',
          'creator_user.email as created_by_email'
        ])
        .where('activities.id', id)
        .first();

      if (!activity) {
        throw new NotFoundError('Activity');
      }

      return activity;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to find activity with relations', error);
    }
  }

  static async update(id, updates) {
    try {
      const [activity] = await db('activities')
        .where({ id })
        .update({
          ...updates,
          updated_at: new Date()
        })
        .returning('*');

      if (!activity) {
        throw new NotFoundError('Activity');
      }

      return activity;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to update activity', error);
    }
  }

  static async delete(id) {
    try {
      const result = await db('activities')
        .where({ id })
        .del();

      if (result === 0) {
        throw new NotFoundError('Activity');
      }

      return true;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to delete activity', error);
    }
  }

  static async findAll(filters = {}) {
    try {
      const {
        limit = 20,
        offset = 0,
        type,
        deal_id,
        contact_id,
        created_by,
        is_completed,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = filters;

      let query = db('activities')
        .select('*');

      // Apply filters
      if (type) query = query.where({ type });
      if (deal_id) query = query.where({ deal_id });
      if (contact_id) query = query.where({ contact_id });
      if (created_by) query = query.where({ created_by });
      if (typeof is_completed === 'boolean') query = query.where({ is_completed });

      // Apply sorting
      query = query.orderBy(sort_by, sort_order);

      // Apply pagination
      query = query.limit(limit).offset(offset);

      return await query;
    } catch (error) {
      throw new DatabaseError('Failed to fetch activities', error);
    }
  }

  static async getContactTimeline(contactId, filters = {}) {
    try {
      const { limit = 50, offset = 0 } = filters;

      const activities = await db('activities')
        .select('*')
        .where('contact_id', contactId)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      return activities;
    } catch (error) {
      throw new DatabaseError('Failed to fetch contact timeline', error);
    }
  }

  static async getDealTimeline(dealId, filters = {}) {
    try {
      const { limit = 50, offset = 0 } = filters;

      const activities = await db('activities')
        .select('*')
        .where('deal_id', dealId)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      return activities;
    } catch (error) {
      throw new DatabaseError('Failed to fetch deal timeline', error);
    }
  }

  static async getRecent(filters = {}) {
    try {
      const {
        limit = 10,
        created_by,
        contact_id,
        deal_id
      } = filters;

      let query = db('activities')
        .select('*')
        .orderBy('created_at', 'desc')
        .limit(limit);

      if (created_by) query = query.where({ created_by });
      if (contact_id) query = query.where({ contact_id });
      if (deal_id) query = query.where({ deal_id });

      return await query;
    } catch (error) {
      throw new DatabaseError('Failed to fetch recent activities', error);
    }
  }

  static async search(query, filters = {}) {
    try {
      const { limit = 20, offset = 0, type } = filters;

      let dbQuery = db('activities')
        .select('*')
        .where('subject', 'ilike', `%${query}%`)
        .orWhere('description', 'ilike', `%${query}%`);

      if (type) dbQuery = dbQuery.where({ type });

      const activities = await dbQuery
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      return activities;
    } catch (error) {
      throw new DatabaseError('Failed to search activities', error);
    }
  }

  static async count(filters = {}) {
    try {
      const {
        type,
        deal_id,
        contact_id,
        created_by,
        is_completed
      } = filters;

      let query = db('activities').count('* as count');

      if (type) query = query.where({ type });
      if (deal_id) query = query.where({ deal_id });
      if (contact_id) query = query.where({ contact_id });
      if (created_by) query = query.where({ created_by });
      if (typeof is_completed === 'boolean') query = query.where({ is_completed });

      const result = await query.first();
      return parseInt(result.count);
    } catch (error) {
      throw new DatabaseError('Failed to count activities', error);
    }
  }

  static async getStats(filters = {}) {
    try {
      const { created_by, date_from, date_to } = filters;

      let query = db('activities')
        .select('type')
        .count('* as count')
        .groupBy('type');

      if (created_by) query = query.where({ created_by });
      if (date_from) query = query.where('created_at', '>=', date_from);
      if (date_to) query = query.where('created_at', '<=', date_to);

      const stats = await query;

      return stats;
    } catch (error) {
      throw new DatabaseError('Failed to get activity stats', error);
    }
  }

  static async completeTask(id) {
    try {
      const [activity] = await db('activities')
        .where({ id, type: 'task' })
        .update({
          is_completed: true,
          updated_at: new Date()
        })
        .returning('*');

      if (!activity) {
        throw new NotFoundError('Task');
      }

      return activity;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to complete task', error);
    }
  }

  static async getPendingTasks(filters = {}) {
    try {
      const { limit = 20, offset = 0, assigned_to } = filters;

      let query = db('activities')
        .select('*')
        .where({ type: 'task', is_completed: false })
        .orderBy('created_at', 'asc');

      if (assigned_to) query = query.where({ created_by: assigned_to });

      query = query.limit(limit).offset(offset);

      return await query;
    } catch (error) {
      throw new DatabaseError('Failed to fetch pending tasks', error);
    }
  }
}

module.exports = Activity;