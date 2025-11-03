const { db } = require('../config/database');
const { NotFoundError, ConflictError, DatabaseError } = require('../utils/errors');

class Pipeline {
  static async create(pipelineData) {
    try {
      const { stages, ...pipelineInfo } = pipelineData;

      // Create pipeline
      const [pipeline] = await db('pipelines')
        .insert(pipelineInfo)
        .returning('*');

      // Create stages if provided
      if (stages && stages.length > 0) {
        const stagesWithPipelineId = stages.map(stage => ({
          ...stage,
          pipeline_id: pipeline.id
        }));

        await db('pipeline_stages')
          .insert(stagesWithPipelineId);
      }

      return pipeline;
    } catch (error) {
      throw new DatabaseError('Failed to create pipeline', error);
    }
  }

  static async findById(id) {
    try {
      const pipeline = await db('pipelines')
        .where({ id })
        .first();

      if (!pipeline) {
        throw new NotFoundError('Pipeline');
      }

      return pipeline;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to find pipeline', error);
    }
  }

  static async findByIdWithStages(id) {
    try {
      const pipeline = await db('pipelines')
        .where({ id })
        .first();

      if (!pipeline) {
        throw new NotFoundError('Pipeline');
      }

      // Get stages for this pipeline
      const stages = await db('pipeline_stages')
        .select('*')
        .where({ pipeline_id: id })
        .where({ is_active: true })
        .orderBy('order_index', 'asc');

      return {
        ...pipeline,
        stages
      };
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to find pipeline with stages', error);
    }
  }

  static async update(id, updates) {
    try {
      const [pipeline] = await db('pipelines')
        .where({ id })
        .update({
          ...updates,
          updated_at: new Date()
        })
        .returning('*');

      if (!pipeline) {
        throw new NotFoundError('Pipeline');
      }

      return pipeline;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to update pipeline', error);
    }
  }

  static async delete(id) {
    try {
      await db.transaction(async (trx) => {
        // Check if pipeline exists
        const pipeline = await trx('pipelines')
          .where({ id })
          .first();

        if (!pipeline) {
          throw new NotFoundError('Pipeline');
        }

        // Check if there are any deals in this pipeline
        const dealsCount = await trx('deals')
          .where({ pipeline_id: id })
          .count('* as count')
          .first();

        if (parseInt(dealsCount.count) > 0) {
          throw new ConflictError('Cannot delete pipeline with existing deals');
        }

        // Delete stages first
        await trx('pipeline_stages')
          .where({ pipeline_id: id })
          .del();

        // Delete pipeline
        await trx('pipelines')
          .where({ id })
          .del();
      });

      return true;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) throw error;
      throw new DatabaseError('Failed to delete pipeline', error);
    }
  }

  static async findAll(filters = {}) {
    try {
      const { limit = 20, offset = 0, created_by, is_active = true } = filters;

      let query = db('pipelines')
        .select('*')
        .orderBy('created_at', 'desc');

      if (created_by) query = query.where({ created_by });
      if (typeof is_active === 'boolean') query = query.where({ is_active });

      query = query.limit(limit).offset(offset);

      return await query;
    } catch (error) {
      throw new DatabaseError('Failed to fetch pipelines', error);
    }
  }

  static async addStage(pipelineId, stageData) {
    try {
      const [stage] = await db('pipeline_stages')
        .insert({
          ...stageData,
          pipeline_id: pipelineId
        })
        .returning('*');

      return stage;
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictError('Stage order already exists in this pipeline');
      }
      throw new DatabaseError('Failed to add stage to pipeline', error);
    }
  }

  static async getStages(pipelineId, filters = {}) {
    try {
      const { is_active = true } = filters;

      const stages = await db('pipeline_stages')
        .select('*')
        .where({ pipeline_id: pipelineId })
        .where({ is_active })
        .orderBy('order_index', 'asc');

      return stages;
    } catch (error) {
      throw new DatabaseError('Failed to fetch pipeline stages', error);
    }
  }

  static async getDefaultPipeline() {
    try {
      // Try to find a default pipeline, or create one if none exists
      let pipeline = await db('pipelines')
        .where({ name: 'Sales Pipeline' })
        .first();

      if (!pipeline) {
        // Create default sales pipeline
        const defaultStages = [
          { name: 'Lead', order_index: 0, probability: 10 },
          { name: 'Qualified', order_index: 1, probability: 25 },
          { name: 'Proposal', order_index: 2, probability: 50 },
          { name: 'Negotiation', order_index: 3, probability: 75 },
          { name: 'Closed Won', order_index: 4, probability: 100 },
          { name: 'Closed Lost', order_index: 5, probability: 0 }
        ];

        const [createdPipeline] = await db('pipelines')
          .insert({
            name: 'Sales Pipeline',
            description: 'Default sales pipeline for tracking deals',
            created_by: '00000000-0000-0000-0000-000000000000' // System user
          })
          .returning('*');

        // Add default stages
        const stagesWithPipelineId = defaultStages.map(stage => ({
          ...stage,
          pipeline_id: createdPipeline.id
        }));

        await db('pipeline_stages')
          .insert(stagesWithPipelineId);

        pipeline = createdPipeline;
      }

      // Get stages
      const stages = await db('pipeline_stages')
        .select('*')
        .where({ pipeline_id: pipeline.id })
        .where({ is_active: true })
        .orderBy('order_index', 'asc');

      return {
        ...pipeline,
        stages
      };
    } catch (error) {
      throw new DatabaseError('Failed to get default pipeline', error);
    }
  }

  static async count(filters = {}) {
    try {
      const { created_by, is_active } = filters;

      let query = db('pipelines').count('* as count');

      if (created_by) query = query.where({ created_by });
      if (typeof is_active === 'boolean') query = query.where({ is_active });

      const result = await query.first();
      return parseInt(result.count);
    } catch (error) {
      throw new DatabaseError('Failed to count pipelines', error);
    }
  }
}

module.exports = Pipeline;