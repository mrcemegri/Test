const { db } = require('../config/database');
const { NotFoundError, ConflictError, DatabaseError } = require('../utils/errors');

class Contact {
  static async create(contactData) {
    try {
      const [contact] = await db('contacts')
        .insert(contactData)
        .returning('*');

      return contact;
    } catch (error) {
      if (error.code === '23505') {
        if (error.constraint.includes('email')) {
          throw new ConflictError('Contact email already exists');
        }
      }
      throw new DatabaseError('Failed to create contact', error);
    }
  }

  static async findById(id) {
    try {
      const contact = await db('contacts')
        .where({ id })
        .first();

      if (!contact) {
        throw new NotFoundError('Contact');
      }

      return contact;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to find contact', error);
    }
  }

  static async findByEmail(email) {
    try {
      return await db('contacts')
        .where({ email })
        .first();
    } catch (error) {
      throw new DatabaseError('Failed to find contact by email', error);
    }
  }

  static async update(id, updates) {
    try {
      const [contact] = await db('contacts')
        .where({ id })
        .update({
          ...updates,
          updated_at: new Date()
        })
        .returning('*');

      if (!contact) {
        throw new NotFoundError('Contact');
      }

      return contact;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      if (error.code === '23505') {
        if (error.constraint.includes('email')) {
          throw new ConflictError('Contact email already exists');
        }
      }
      throw new DatabaseError('Failed to update contact', error);
    }
  }

  static async delete(id) {
    try {
      const result = await db('contacts')
        .where({ id })
        .del();

      if (result === 0) {
        throw new NotFoundError('Contact');
      }

      return true;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to delete contact', error);
    }
  }

  static async findAll(filters = {}) {
    try {
      const {
        limit = 20,
        offset = 0,
        assigned_to,
        company_id,
        lifecycle_stage,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = filters;

      let query = db('contacts')
        .select('*');

      // Apply filters
      if (assigned_to) query = query.where({ assigned_to });
      if (company_id) query = query.where({ company_id });
      if (lifecycle_stage) query = query.where({ lifecycle_stage });

      // Apply sorting
      query = query.orderBy(sort_by, sort_order);

      // Apply pagination
      query = query.limit(limit).offset(offset);

      return await query;
    } catch (error) {
      throw new DatabaseError('Failed to fetch contacts', error);
    }
  }

  static async search(query, filters = {}) {
    try {
      const { limit = 20, offset = 0, assigned_to, company_id } = filters;

      let dbQuery = db('contacts')
        .select('*')
        .where('first_name', 'ilike', `%${query}%`)
        .orWhere('last_name', 'ilike', `%${query}%`)
        .orWhere('email', 'ilike', `%${query}%`)
        .orWhere('job_title', 'ilike', `%${query}%`);

      if (assigned_to) dbQuery = dbQuery.where({ assigned_to });
      if (company_id) dbQuery = dbQuery.where({ company_id });

      const contacts = await dbQuery
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      return contacts;
    } catch (error) {
      throw new DatabaseError('Failed to search contacts', error);
    }
  }

  static async findByIdWithRelations(id) {
    try {
      const contact = await db('contacts')
        .leftJoin('companies', 'contacts.company_id', 'companies.id')
        .leftJoin('users as assigned_user', 'contacts.assigned_to', 'assigned_user.id')
        .leftJoin('users as creator_user', 'contacts.created_by', 'creator_user.id')
        .leftJoin('deals', 'contacts.id', 'deals.contact_id')
        .select([
          'contacts.*',
          'companies.name as company_name',
          'companies.website as company_website',
          'assigned_user.first_name as assigned_first_name',
          'assigned_user.last_name as assigned_last_name',
          'assigned_user.email as assigned_email',
          'creator_user.first_name as created_by_first_name',
          'creator_user.last_name as created_by_last_name'
        ])
        .count('deals.id as deal_count')
        .where('contacts.id', id)
        .groupBy('contacts.id', 'companies.id', 'assigned_user.id', 'creator_user.id')
        .first();

      if (!contact) {
        throw new NotFoundError('Contact');
      }

      return contact;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to find contact with relations', error);
    }
  }

  static async assign(id, assigned_to) {
    try {
      const [contact] = await db('contacts')
        .where({ id })
        .update({
          assigned_to,
          updated_at: new Date()
        })
        .returning('*');

      if (!contact) {
        throw new NotFoundError('Contact');
      }

      return contact;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to assign contact', error);
    }
  }

  static async getActivities(id, filters = {}) {
    try {
      const { limit = 20, offset = 0, type } = filters;

      let query = db('activities')
        .select('*')
        .where('contact_id', id)
        .orderBy('created_at', 'desc');

      if (type) query = query.where({ type });

      query = query.limit(limit).offset(offset);

      return await query;
    } catch (error) {
      throw new DatabaseError('Failed to fetch contact activities', error);
    }
  }

  static async getDeals(id, filters = {}) {
    try {
      const { limit = 20, offset = 0, status } = filters;

      let query = db('deals')
        .select('*')
        .where('contact_id', id)
        .orderBy('created_at', 'desc');

      if (status) query = query.where({ status });

      query = query.limit(limit).offset(offset);

      return await query;
    } catch (error) {
      throw new DatabaseError('Failed to fetch contact deals', error);
    }
  }

  static async count(filters = {}) {
    try {
      const { assigned_to, company_id, lifecycle_stage } = filters;

      let query = db('contacts').count('* as count');

      if (assigned_to) query = query.where({ assigned_to });
      if (company_id) query = query.where({ company_id });
      if (lifecycle_stage) query = query.where({ lifecycle_stage });

      const result = await query.first();
      return parseInt(result.count);
    } catch (error) {
      throw new DatabaseError('Failed to count contacts', error);
    }
  }

  static async getLifecycleStats() {
    try {
      const stats = await db('contacts')
        .select('lifecycle_stage')
        .count('* as count')
        .groupBy('lifecycle_stage')
        .orderBy('count', 'desc');

      return stats;
    } catch (error) {
      throw new DatabaseError('Failed to fetch lifecycle stats', error);
    }
  }
}

module.exports = Contact;