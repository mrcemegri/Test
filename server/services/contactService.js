const { Contact } = require('../models');
const { NotFoundError, ConflictError } = require('../utils/errors');

class ContactService {
  static async createContact(contactData, userId) {
    try {
      // Check if contact with same email already exists
      const existingContact = await Contact.findByEmail(contactData.email);
      if (existingContact) {
        throw new ConflictError('Contact with this email already exists');
      }

      const contact = await Contact.create({
        ...contactData,
        assigned_to: contactData.assigned_to || userId,
        created_by: userId
      });

      return contact;
    } catch (error) {
      throw error;
    }
  }

  static async getContactById(id, user) {
    try {
      const contact = await Contact.findByIdWithRelations(id);

      // Check access permissions
      if (user.role === 'admin' ||
          user.role === 'manager' ||
          contact.assigned_to === user.id ||
          contact.created_by === user.id) {
        return contact;
      } else {
        throw new NotFoundError('Contact');
      }
    } catch (error) {
      throw error;
    }
  }

  static async updateContact(id, updates, user) {
    try {
      const contact = await Contact.findById(id);

      // Check permissions
      if (user.role === 'admin' ||
          user.role === 'manager' ||
          contact.assigned_to === user.id ||
          contact.created_by === user.id) {

        // Only admin/manager can change assignment
        if (user.role !== 'admin' && user.role !== 'manager' && updates.assigned_to) {
          delete updates.assigned_to;
        }

        const updatedContact = await Contact.update(id, updates);
        return updatedContact;
      } else {
        throw new NotFoundError('Contact');
      }
    } catch (error) {
      throw error;
    }
  }

  static async deleteContact(id, user) {
    try {
      const contact = await Contact.findById(id);

      // Check permissions (only admin or creator can delete)
      if (user.role === 'admin' || contact.created_by === user.id) {
        await Contact.delete(id);
        return true;
      } else {
        throw new NotFoundError('Contact');
      }
    } catch (error) {
      throw error;
    }
  }

  static async getContacts(filters, user) {
    try {
      // Filter based on user role
      let contactFilters = {
        ...filters,
        assigned_to: user.role === 'admin' || user.role === 'manager' ? filters.assigned_to : user.id
      };

      const contacts = await Contact.findAll(contactFilters);
      return contacts;
    } catch (error) {
      throw error;
    }
  }

  static async searchContacts(query, filters, user) {
    try {
      const searchFilters = {
        ...filters,
        assigned_to: user.role === 'admin' || user.role === 'manager' ? filters.assigned_to : user.id
      };

      const contacts = await Contact.search(query, searchFilters);
      return contacts;
    } catch (error) {
      throw error;
    }
  }

  static async assignContact(id, assignedTo, user) {
    try {
      // Only admin/manager can assign contacts
      if (user.role !== 'admin' && user.role !== 'manager') {
        throw new Error('Insufficient permissions to assign contacts');
      }

      const contact = await Contact.assign(id, assignedTo);
      return contact;
    } catch (error) {
      throw error;
    }
  }

  static async getContactActivities(id, filters, user) {
    try {
      const contact = await Contact.findById(id);

      // Check access permissions
      if (user.role === 'admin' ||
          user.role === 'manager' ||
          contact.assigned_to === user.id ||
          contact.created_by === user.id) {

        const activities = await Contact.getActivities(id, filters);
        return activities;
      } else {
        throw new NotFoundError('Contact');
      }
    } catch (error) {
      throw error;
    }
  }

  static async getContactDeals(id, filters, user) {
    try {
      const contact = await Contact.findById(id);

      // Check access permissions
      if (user.role === 'admin' ||
          user.role === 'manager' ||
          contact.assigned_to === user.id ||
          contact.created_by === user.id) {

        const deals = await Contact.getDeals(id, filters);
        return deals;
      } else {
        throw new NotFoundError('Contact');
      }
    } catch (error) {
      throw error;
    }
  }

  static async getLifecycleStats() {
    try {
      const stats = await Contact.getLifecycleStats();
      return stats;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ContactService;