const { Deal, Contact, Company, Activity, User } = require('../models');

class DashboardService {
  static async getDashboardMetrics(user) {
    try {
      const metrics = {};

      // Deal metrics
      const dealFilters = {
        assigned_to: user.role === 'admin' || user.role === 'manager' ? undefined : user.id
      };

      metrics.deals = {
        total: await Deal.count(dealFilters),
        open: await Deal.count({ ...dealFilters, status: 'open' }),
        won: await Deal.count({ ...dealFilters, status: 'won' }),
        lost: await Deal.count({ ...dealFilters, status: 'lost' })
      };

      // Contact metrics
      const contactFilters = {
        assigned_to: user.role === 'admin' || user.role === 'manager' ? undefined : user.id
      };

      metrics.contacts = {
        total: await Contact.count(contactFilters),
        leads: await Contact.count({ ...contactFilters, lifecycle_stage: 'lead' }),
        mql: await Contact.count({ ...contactFilters, lifecycle_stage: 'mql' }),
        sql: await Contact.count({ ...contactFilters, lifecycle_stage: 'sql' }),
        opportunities: await Contact.count({ ...contactFilters, lifecycle_stage: 'opportunity' }),
        customers: await Contact.count({ ...contactFilters, lifecycle_stage: 'customer' })
      };

      // Company metrics
      const companyFilters = {
        assigned_to: user.role === 'admin' || user.role === 'manager' ? undefined : user.id
      };

      metrics.companies = {
        total: await Company.count(companyFilters)
      };

      // Activity metrics
      const activityFilters = {
        created_by: user.role === 'admin' || user.role === 'manager' ? undefined : user.id
      };

      metrics.activities = {
        total: await Activity.count(activityFilters),
        pending_tasks: await Activity.count({ ...activityFilters, type: 'task', is_completed: false })
      };

      // Pipeline value metrics
      const openDeals = await Deal.findAll({
        ...dealFilters,
        status: 'open',
        limit: 1000
      });

      metrics.pipeline_value = openDeals.reduce((total, deal) => total + parseFloat(deal.amount || 0), 0);

      // Conversion rates
      const totalDeals = metrics.deals.total || 1;
      metrics.conversion_rates = {
        lead_to_mql: 0, // Would need more complex tracking
        mql_to_sql: 0,
        sql_to_deal: 0,
        deal_to_close: totalDeals > 0 ? ((metrics.deals.won + metrics.deals.lost) / totalDeals) * 100 : 0
      };

      return metrics;
    } catch (error) {
      throw error;
    }
  }

  static async getPipelineHealth(user) {
    try {
      const dealFilters = {
        assigned_to: user.role === 'admin' || user.role === 'manager' ? undefined : user.id
      };

      const dealCounts = await Deal.count(dealFilters);

      const openDeals = await Deal.findAll({
        ...dealFilters,
        status: 'open',
        limit: 1000
      });

      const wonDeals = await Deal.findAll({
        ...dealFilters,
        status: 'won',
        limit: 1000
      });

      const pipelineHealth = {
        total_deals: dealCounts,
        total_value: openDeals.reduce((total, deal) => total + parseFloat(deal.amount || 0), 0),
        average_deal_value: openDeals.length > 0 ?
          openDeals.reduce((total, deal) => total + parseFloat(deal.amount || 0), 0) / openDeals.length : 0,
        conversion_rate: dealCounts > 0 ? (wonDeals.length / dealCounts) * 100 : 0,
        deal_velocity: this.calculateDealVelocity(wonDeals)
      };

      return pipelineHealth;
    } catch (error) {
      throw error;
    }
  }

  static async getTeamPerformance(user) {
    try {
      if (user.role !== 'admin' && user.role !== 'manager') {
        throw new Error('Insufficient permissions to view team performance');
      }

      const teamMembers = await User.findTeamMembers(user.company_id);

      const teamPerformance = await Promise.all(
        teamMembers.map(async (member) => {
          const dealCount = await Deal.count({ assigned_to: member.id });
          const contactCount = await Contact.count({ assigned_to: member.id });
          const activityCount = await Activity.count({ created_by: member.id });

          const dealValue = await Deal.findAll({
            assigned_to: member.id,
            status: 'open',
            limit: 1000
          });

          const totalValue = dealValue.reduce((total, deal) => total + parseFloat(deal.amount || 0), 0);

          const wonDeals = await Deal.count({ assigned_to: member.id, status: 'won' });
          const totalDeals = await Deal.count({ assigned_to: member.id });
          const winRate = totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0;

          return {
            user: member,
            metrics: {
              deals_count: dealCount,
              contacts_count: contactCount,
              activities_count: activityCount,
              pipeline_value: totalValue,
              win_rate: winRate
            }
          };
        })
      );

      return teamPerformance;
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

  static async getUpcomingTasks(user, limit = 10) {
    try {
      const filters = {
        limit,
        assigned_to: user.role === 'admin' || user.role === 'manager' ? undefined : user.id
      };

      const tasks = await Activity.getPendingTasks(filters);
      return tasks;
    } catch (error) {
      throw error;
    }
  }

  static async getTopDeals(user, limit = 10) {
    try {
      const dealFilters = {
        assigned_to: user.role === 'admin' || user.role === 'manager' ? undefined : user.id,
        status: 'open',
        sort_by: 'amount',
        sort_order: 'desc',
        limit
      };

      const deals = await Deal.findAll(dealFilters);
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

  static async getSalesForecast(user, months = 3) {
    try {
      const dealFilters = {
        assigned_to: user.role === 'admin' || user.role === 'manager' ? undefined : user.id,
        status: 'open',
        limit: 1000
      };

      const openDeals = await Deal.findAll(dealFilters);

      const today = new Date();
      const forecasts = [];

      for (let i = 0; i < months; i++) {
        const monthStart = new Date(today.getFullYear(), today.getMonth() + i, 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + i + 1, 0);

        const monthlyDeals = openDeals.filter(deal => {
          if (!deal.expected_close_date) return false;
          const closeDate = new Date(deal.expected_close_date);
          return closeDate >= monthStart && closeDate <= monthEnd;
        });

        const monthlyValue = monthlyDeals.reduce((total, deal) => {
          // Apply probability based on pipeline stage if available
          const probability = deal.stage_probability || 50;
          return total + (parseFloat(deal.amount || 0) * probability / 100);
        }, 0);

        forecasts.push({
          month: monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          forecast_value: monthlyValue,
          deal_count: monthlyDeals.length
        });
      }

      return forecasts;
    } catch (error) {
      throw error;
    }
  }

  // Helper method to calculate deal velocity
  static calculateDealVelocity(wonDeals) {
    if (wonDeals.length === 0) return 0;

    const velocities = wonDeals
      .filter(deal => deal.created_at && deal.actual_close_date)
      .map(deal => {
        const created = new Date(deal.created_at);
        const closed = new Date(deal.actual_close_date);
        return Math.ceil((closed - created) / (1000 * 60 * 60 * 24)); // days
      })
      .filter(velocity => velocity > 0);

    if (velocities.length === 0) return 0;

    const averageVelocity = velocities.reduce((sum, velocity) => sum + velocity, 0) / velocities.length;
    return Math.round(averageVelocity);
  }

  static async getActivityMetrics(user, dateRange = {}) {
    try {
      const filters = {
        created_by: user.role === 'admin' || user.role === 'manager' ? undefined : user.id,
        ...dateRange
      };

      const stats = await Activity.getStats(filters);

      // Add additional metrics
      const totalActivities = await Activity.count(filters);
      const completedTasks = await Activity.count({
        ...filters,
        type: 'task',
        is_completed: true
      });
      const pendingTasks = await Activity.count({
        ...filters,
        type: 'task',
        is_completed: false
      });

      return {
        by_type: stats,
        total_activities: totalActivities,
        completed_tasks: completedTasks,
        pending_tasks: pendingTasks,
        task_completion_rate: (completedTasks + pendingTasks) > 0 ?
          (completedTasks / (completedTasks + pendingTasks)) * 100 : 0
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = DashboardService;