import api from './api';

export const dealService = {
  // Get all deals
  getDeals: async (params = {}) => {
    const response = await api.get('/deals', { params });
    return response.data;
  },

  // Get deal by ID
  getDealById: async (id) => {
    const response = await api.get(`/deals/${id}`);
    return response.data;
  },

  // Create new deal
  createDeal: async (dealData) => {
    const response = await api.post('/deals', dealData);
    return response.data;
  },

  // Update deal
  updateDeal: async (id, dealData) => {
    const response = await api.put(`/deals/${id}`, dealData);
    return response.data;
  },

  // Delete deal
  deleteDeal: async (id) => {
    const response = await api.delete(`/deals/${id}`);
    return response.data;
  },

  // Search deals
  searchDeals: async (query, params = {}) => {
    const response = await api.get('/deals/search', {
      params: { q: query, ...params }
    });
    return response.data;
  },

  // Move deal to different stage
  moveDealStage: async (id, stageId) => {
    const response = await api.post(`/deals/${id}/move-stage`, {
      stage_id: stageId
    });
    return response.data;
  },

  // Get deals for a pipeline
  getPipelineDeals: async (pipelineId, params = {}) => {
    const response = await api.get(`/deals/pipeline/${pipelineId}`, { params });
    return response.data;
  },

  // Get deal activities
  getDealActivities: async (id, params = {}) => {
    const response = await api.get(`/deals/${id}/activities`, { params });
    return response.data;
  },

  // Get pipeline statistics
  getPipelineStats: async (pipelineId) => {
    const response = await api.get(`/deals/pipeline/${pipelineId}/stats`);
    return response.data;
  },

  // Get deal value by stage
  getDealValueByStage: async (pipelineId) => {
    const response = await api.get(`/deals/pipeline/${pipelineId}/value`);
    return response.data;
  },
};