const { db } = require('../config/database');
const { NotFoundError, ConflictError, DatabaseError } = require('../utils/errors');

class PipelineStage {
  static async findById(id) {
    try {
      const stage = await db('pipeline_stages')
        .where({ id })
        .first();

      if (!stage) {
        throw new NotFoundError('Pipeline stage');
      }

      return stage;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to find pipeline stage', error);
    }
  }

  static async update(id, updates) {
    try {
      const [stage] = await db('pipeline_stages')
        .where({ id })
        .update({
          ...updates,
          updated_at: new Date()
        })
        .returning('*');

      if (!stage) {
        throw new NotFoundError('Pipeline stage');
      }

      return stage;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      if (error.code === '23505') {
        throw new ConflictError('Stage order already exists in this pipeline');
      }
      throw new DatabaseError('Failed to update pipeline stage', error);
    }
  }

  static async delete(id) {
    try {
      await db.transaction(async (trx) => {
        // Check if stage exists
        const stage = await trx('pipeline_stages')
          .where({ id })
          .first();

        if (!stage) {
          throw new NotFoundError('Pipeline stage');
        }

        // Check if there are any deals in this stage
        const dealsCount = await trx('deals')
          .where({ current_stage_id: id })
          .count('* as count')
          .first();

        if (parseInt(dealsCount.count) > 0) {
          throw new ConflictError('Cannot delete stage with existing deals');
        }

        // Delete stage
        await trx('pipeline_stages')
          .where({ id })
          .del();
      });

      return true;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) throw error;
      throw new DatabaseError('Failed to delete pipeline stage', error);
    }
  }

  static async moveDeals(fromStageId, toStageId) {
    try {
      const result = await db('deals')
        .where({ current_stage_id: fromStageId })
        .update({
          current_stage_id: toStageId,
          updated_at: new Date()
        });

      return result;
    } catch (error) {
      throw new DatabaseError('Failed to move deals between stages', error);
    }
  }

  static async getDealCount(stageId) {
    try {
      const result = await db('deals')
        .where({ current_stage_id: stageId })
        .count('* as count')
        .first();

      return parseInt(result.count);
    } catch (error) {
      throw new DatabaseError('Failed to get deal count for stage', error);
    }
  }

  static async getDeals(stageId, filters = {}) {
    try {
      const { limit = 20, offset = 0, status } = filters;

      let query = db('deals')
        .select('*')
        .where({ current_stage_id: stageId })
        .orderBy('created_at', 'desc');

      if (status) query = query.where({ status });

      query = query.limit(limit).offset(offset);

      return await query;
    } catch (error) {
      throw new DatabaseError('Failed to get deals for stage', error);
    }
  }
}

module.exports = PipelineStage;