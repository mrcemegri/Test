const { db } = require('../config/database');
const { NotFoundError, ConflictError, DatabaseError } = require('../utils/errors');

class Deal {
  static async create(dealData) {
    try {
      const [deal] = await db('deals')
        .insert(dealData)
        .returning('*');

      return deal;
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictError('Deal already exists');
      }
      if (error.code === '23503') {
        if (error.constraint.includes('current_stage_id')) {
          throw new ConflictError('Invalid pipeline stage');
        }
        if (error.constraint.includes('contact_id')) {
          throw new ConflictError('Invalid contact');
        }
        if (error.constraint.includes('company_id')) {
          throw new ConflictError('Invalid company');
        }
      }
      throw new DatabaseError('Failed to create deal', error);
    }
  }

  static async findById(id) {
    try {
      const deal = await db('deals')
        .where({ id })
        .first();

      if (!deal) {
        throw new NotFoundError('Deal');
      }

      return deal;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to find deal', error);
    }
  }

  static async findByIdWithRelations(id) {
    try {
      const deal = await db('deals')
        .leftJoin('contacts', 'deals.contact_id', 'contacts.id')
        .leftJoin('companies', 'deals.company_id', 'companies.id')
        .leftJoin('pipeline_stages', 'deals.current_stage_id', 'pipeline_stages.id')
        .leftJoin('pipelines', 'deals.pipeline_id', 'pipelines.id')
        .leftJoin('users as assigned_user', 'deals.assigned_to', 'assigned_user.id')
        .leftJoin('users as creator_user', 'deals.created_by', 'creator_user.id')
        .select([
          'deals.*',
          'contacts.first_name as contact_first_name',
          'contacts.last_name as contact_last_name',
          'contacts.email as contact_email',
          'companies.name as company_name',
          'pipeline_stages.name as stage_name',
          'pipeline_stages.probability as stage_probability',
          'pipelines.name as pipeline_name',
          'assigned_user.first_name as assigned_first_name',
          'assigned_user.last_name as assigned_last_name',
          'assigned_user.email as assigned_email',
          'creator_user.first_name as created_by_first_name',
          'creator_user.last_name as created_by_last_name'
        ])
        .where('deals.id', id)
        .first();

      if (!deal) {
        throw new NotFoundError('Deal');
      }

      return deal;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to find deal with relations', error);
    }
  }

  static async update(id, updates) {
    try {
      const [deal] = await db('deals')
        .where({ id })
        .update({
          ...updates,
          updated_at: new Date()
        })
        .returning('*');

      if (!deal) {
        throw new NotFoundError('Deal');
      }

      return deal;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to update deal', error);
    }
  }

  static async delete(id) {
    try {
      const result = await db('deals')
        .where({ id })
        .del();

      if (result === 0) {
        throw new NotFoundError('Deal');
      }

      return true;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to delete deal', error);
    }
  }

  static async findAll(filters = {}) {
    try {
      const {
        limit = 20,
        offset = 0,
        pipeline_id,
        current_stage_id,
        assigned_to,
        contact_id,
        company_id,
        status,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = filters;

      let query = db('deals')
        .select('*');

      // Apply filters
      if (pipeline_id) query = query.where({ pipeline_id });
      if (current_stage_id) query = query.where({ current_stage_id });
      if (assigned_to) query = query.where({ assigned_to });
      if (contact_id) query = query.where({ contact_id });
      if (company_id) query = query.where({ company_id });
      if (status) query = query.where({ status });

      // Apply sorting
      query = query.orderBy(sort_by, sort_order);

      // Apply pagination
      query = query.limit(limit).offset(offset);

      return await query;
    } catch (error) {
      throw new DatabaseError('Failed to fetch deals', error);
    }
  }

  static async search(query, filters = {}) {
    try {
      const { limit = 20, offset = 0, assigned_to, pipeline_id } = filters;

      let dbQuery = db('deals')
        .select('*')
        .where('name', 'ilike', `%${query}%`);

      if (assigned_to) dbQuery = dbQuery.where({ assigned_to });
      if (pipeline_id) dbQuery = dbQuery.where({ pipeline_id });

      const deals = await dbQuery
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      return deals;
    } catch (error) {
      throw new DatabaseError('Failed to search deals', error);
    }
  }

  static async moveStage(id, stageId) {
    try {
      const [deal] = await db('deals')
        .where({ id })
        .update({
          current_stage_id: stageId,
          updated_at: new Date()
        })
        .returning('*');

      if (!deal) {
        throw new NotFoundError('Deal');
      }

      return deal;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to move deal to new stage', error);
    }
  }

  static async getPipelineDeals(pipelineId, filters = {}) {
    try {
      const { limit = 20, offset = 0, assigned_to } = filters;

      let query = db('deals')
        .select('*')
        .where({ pipeline_id: pipelineId })
        .orderBy('created_at', 'desc');

      if (assigned_to) query = query.where({ assigned_to });

      query = query.limit(limit).offset(offset);

      return await query;
    } catch (error) {
      throw new DatabaseError('Failed to fetch pipeline deals', error);
    }
  }

  static async getActivities(id, filters = {}) {
    try {
      const { limit = 20, offset = 0, type } = filters;

      let query = db('activities')
        .select('*')
        .where('deal_id', id)
        .orderBy('created_at', 'desc');

      if (type) query = query.where({ type });

      query = query.limit(limit).offset(offset);

      return await query;
    } catch (error) {
      throw new DatabaseError('Failed to fetch deal activities', error);
    }
  }

  static async count(filters = {}) {
    try {
      const {
        pipeline_id,
        current_stage_id,
        assigned_to,
        contact_id,
        company_id,
        status
      } = filters;

      let query = db('deals').count('* as count');

      if (pipeline_id) query = query.where({ pipeline_id });
      if (current_stage_id) query = query.where({ current_stage_id });
      if (assigned_to) query = query.where({ assigned_to });
      if (contact_id) query = query.where({ contact_id });
      if (company_id) query = query.where({ company_id });
      if (status) query = query.where({ status });

      const result = await query.first();
      return parseInt(result.count);
    } catch (error) {
      throw new DatabaseError('Failed to count deals', error);
    }
  }

  static async getPipelineStats(pipelineId) {
    try {
      const stats = await db('deals')
        .select('current_stage_id')
        .count('* as count')
        .sum('amount as total_value')
        .where({ pipeline_id })
        .groupBy('current_stage_id');

      return stats;
    } catch (error) {
      throw new DatabaseError('Failed to get pipeline stats', error);
    }
  }

  static async getValueByStage(pipelineId) {
    try {
      const values = await db('deals')
        .select([
          'pipeline_stages.name as stage_name',
          'pipeline_stages.order_index',
          db.raw('COUNT(*) as deal_count'),
          db.raw('SUM(CASE WHEN deals.amount IS NOT NULL THEN deals.amount ELSE 0 END) as total_value'),
          db.raw('AVG(CASE WHEN deals.amount IS NOT NULL THEN deals.amount ELSE 0 END) as average_value')
        ])
        .leftJoin('pipeline_stages', 'deals.current_stage_id', 'pipeline_stages.id')
        .where('deals.pipeline_id', pipelineId)
        .where('deals.status', 'open')
        .groupBy('pipeline_stages.id', 'pipeline_stages.name', 'pipeline_stages.order_index')
        .orderBy('pipeline_stages.order_index', 'asc');

      return values;
    } catch (error) {
      throw new DatabaseError('Failed to get deal value by stage', error);
    }
  }
}

module.exports = Deal;