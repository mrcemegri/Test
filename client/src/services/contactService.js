import api from './api';

export const contactService = {
  // Get all contacts
  getContacts: async (params = {}) => {
    const response = await api.get('/contacts', { params });
    return response.data;
  },

  // Get contact by ID
  getContactById: async (id) => {
    const response = await api.get(`/contacts/${id}`);
    return response.data;
  },

  // Create new contact
  createContact: async (contactData) => {
    const response = await api.post('/contacts', contactData);
    return response.data;
  },

  // Update contact
  updateContact: async (id, contactData) => {
    const response = await api.put(`/contacts/${id}`, contactData);
    return response.data;
  },

  // Delete contact
  deleteContact: async (id) => {
    const response = await api.delete(`/contacts/${id}`);
    return response.data;
  },

  // Search contacts
  searchContacts: async (query, params = {}) => {
    const response = await api.get('/contacts/search', {
      params: { q: query, ...params }
    });
    return response.data;
  },

  // Assign contact to user
  assignContact: async (id, assignedTo) => {
    const response = await api.post(`/contacts/${id}/assign`, {
      assigned_to: assignedTo
    });
    return response.data;
  },

  // Get contact activities
  getContactActivities: async (id, params = {}) => {
    const response = await api.get(`/contacts/${id}/activities`, { params });
    return response.data;
  },

  // Get contact deals
  getContactDeals: async (id, params = {}) => {
    const response = await api.get(`/contacts/${id}/deals`, { params });
    return response.data;
  },

  // Get lifecycle stats
  getLifecycleStats: async () => {
    const response = await api.get('/contacts/stats/lifecycle');
    return response.data;
  },
};