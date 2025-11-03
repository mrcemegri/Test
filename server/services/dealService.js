const { Deal, Pipeline } = require('../models');
const { NotFoundError, ConflictError } = require('../utils/errors');

class DealService {
  static async createDeal(dealData, userId) {
    try {
      const deal = await Deal.create({
        ...dealData,
        assigned_to: dealData.assigned_to || userId,
        created_by: userId
      });

      return deal;
    } catch (error) {
      throw error;
    }
  }

  static async getDealById(id, user) {
    try {
      const deal = await Deal.findByIdWithRelations(id);

      // Check access permissions
      if (user.role === 'admin' ||
          user.role === 'manager' ||
          deal.assigned_to === user.id ||
          deal.created_by === user.id) {
        return deal;
      } else {
        throw new NotFoundError('Deal');
      }
    } catch (error) {
      throw error;
    }
  }

  static async updateDeal(id, updates, user) {
    try {
      const deal = await Deal.findById(id);

      // Check permissions
      if (user.role === 'admin' ||
          user.role === 'manager' ||
          deal.assigned_to === user.id ||
          deal.created_by === user.id) {

        // Only admin/manager can change assignment
        if (user.role !== 'admin' && user.role !== 'manager' && updates.assigned_to) {
          delete updates.assigned_to;
        }

        const updatedDeal = await Deal.update(id, updates);
        return updatedDeal;
      } else {
        throw new NotFoundError('Deal');
      }
    } catch (error) {
      throw error;
    }
  }

  static async deleteDeal(id, user) {
    try {
      const deal = await Deal.findById(id);

      // Check permissions (only admin or creator can delete)
      if (user.role === 'admin' || deal.created_by === user.id) {
        await Deal.delete(id);
        return true;
      } else {
        throw new NotFoundError('Deal');
      }
    } catch (error) {
      throw error;
    }
  }

  static async getDeals(filters, user) {
    try {
      // Filter based on user role
      let dealFilters = {
        ...filters,
        assigned_to: user.role === 'admin' || user.role === 'manager' ? filters.assigned_to : user.id
      };

      const deals = await Deal.findAll(dealFilters);
      return deals;
    } catch (error) {
      throw error;
    }
  }

  static async searchDeals(query, filters, user) {
    try {
      const searchFilters = {
        ...filters,
        assigned_to: user.role === 'admin' || user.role === 'manager' ? filters.assigned_to : user.id
      };

      const deals = await Deal.search(query, searchFilters);
      return deals;
    } catch (error) {
      throw error;
    }
  }

  static async moveDealStage(id, stageId, user) {
    try {
      const deal = await Deal.findById(id);

      // Check permissions
      if (user.role === 'admin' ||
          user.role === 'manager' ||
          deal.assigned_to === user.id ||
          deal.created_by === user.id) {

        const updatedDeal = await Deal.moveStage(id, stageId);
        return updatedDeal;
      } else {
        throw new NotFoundError('Deal');
      }
    } catch (error) {
      throw error;
    }
  }

  static async getPipelineDeals(pipelineId, filters, user) {
    try {
      const pipeline = await Pipeline.findById(pipelineId);

      // Check access to pipeline
      if (user.role === 'admin' ||
          user.role === 'manager' ||
          pipeline.created_by === user.id) {

        const dealFilters = {
          ...filters,
          assigned_to: user.role === 'admin' || user.role === 'manager' ? filters.assigned_to : user.id
        };

        const deals = await Deal.getPipelineDeals(pipelineId, dealFilters);
        return deals;
      } else {
        throw new NotFoundError('Pipeline');
      }
    } catch (error) {
      throw error;
    }
  }

  static async getDealActivities(id, filters, user) {
    try {
      const deal = await Deal.findById(id);

      // Check access permissions
      if (user.role === 'admin' ||
          user.role === 'manager' ||
          deal.assigned_to === user.id ||
          deal.created_by === user.id) {

        const activities = await Deal.getActivities(id, filters);
        return activities;
      } else {
        throw new NotFoundError('Deal');
      }
    } catch (error) {
      throw error;
    }
  }

  static async getPipelineStats(pipelineId, user) {
    try {
      const pipeline = await Pipeline.findById(pipelineId);

      // Check access to pipeline
      if (user.role === 'admin' ||
          user.role === 'manager' ||
          pipeline.created_by === user.id) {

        const stats = await Deal.getPipelineStats(pipelineId);
        return stats;
      } else {
        throw new NotFoundError('Pipeline');
      }
    } catch (error) {
      throw error;
    }
  }

  static async getDealValueByStage(pipelineId, user) {
    try {
      const pipeline = await Pipeline.findById(pipelineId);

      // Check access to pipeline
      if (user.role === 'admin' ||
          user.role === 'manager' ||
          pipeline.created_by === user.id) {

        const values = await Deal.getValueByStage(pipelineId);
        return values;
      } else {
        throw new NotFoundError('Pipeline');
      }
    } catch (error) {
      throw error;
    }
  }

  static async getTopDeals(user, limit = 10) {
    try {
      const filters = {
        assigned_to: user.role === 'admin' || user.role === 'manager' ? undefined : user.id,
        status: 'open',
        sort_by: 'amount',
        sort_order: 'desc',
        limit
      };

      const deals = await Deal.findAll(filters);
      return deals;
    } catch (error) {
      throw error;
    }
  }

  static async getDealsClosingSoon(user, days = 30) {
    try {
      const allDeals = await Deal.findAll({
        assigned_to: user.role === 'admin' || user.role === 'manager' ? undefined : user.id,
        status: 'open',
        sort_by: 'expected_close_date',
        sort_order: 'asc',
        limit: 1000
      });

      const today = new Date();
      const futureDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));

      const closingSoon = allDeals.filter(deal => {
        if (!deal.expected_close_date) return false;
        const closeDate = new Date(deal.expected_close_date);
        return closeDate >= today && closeDate <= futureDate;
      });

      return closingSoon;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = DealService;