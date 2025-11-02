const { db } = require('../config/database');
const { NotFoundError, ConflictError, DatabaseError } = require('../utils/errors');

class Company {
  static async create(companyData) {
    try {
      const [company] = await db('companies')
        .insert(companyData)
        .returning('*');

      return company;
    } catch (error) {
      if (error.code === '23505') {
        if (error.constraint.includes('domain')) {
          throw new ConflictError('Company domain already exists');
        }
      }
      throw new DatabaseError('Failed to create company', error);
    }
  }

  static async findById(id) {
    try {
      const company = await db('companies')
        .where({ id })
        .first();

      if (!company) {
        throw new NotFoundError('Company');
      }

      return company;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to find company', error);
    }
  }

  static async findByDomain(domain) {
    try {
      return await db('companies')
        .where({ domain })
        .first();
    } catch (error) {
      throw new DatabaseError('Failed to find company by domain', error);
    }
  }

  static async update(id, updates) {
    try {
      const [company] = await db('companies')
        .where({ id })
        .update({
          ...updates,
          updated_at: new Date()
        })
        .returning('*');

      if (!company) {
        throw new NotFoundError('Company');
      }

      return company;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      if (error.code === '23505') {
        if (error.constraint.includes('domain')) {
          throw new ConflictError('Company domain already exists');
        }
      }
      throw new DatabaseError('Failed to update company', error);
    }
  }

  static async delete(id) {
    try {
      const result = await db('companies')
        .where({ id })
        .del();

      if (result === 0) {
        throw new NotFoundError('Company');
      }

      return true;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to delete company', error);
    }
  }

  static async findAll(filters = {}) {
    try {
      const { limit = 20, offset = 0, assigned_to, industry, company_size } = filters;

      let query = db('companies')
        .select('*')
        .orderBy('created_at', 'desc');

      // Apply filters
      if (assigned_to) query = query.where({ assigned_to });
      if (industry) query = query.where({ industry });
      if (company_size) query = query.where({ company_size });

      // Apply pagination
      query = query.limit(limit).offset(offset);

      return await query;
    } catch (error) {
      throw new DatabaseError('Failed to fetch companies', error);
    }
  }

  static async search(query, filters = {}) {
    try {
      const { limit = 20, offset = 0 } = filters;

      const companies = await db('companies')
        .select('*')
        .where('name', 'ilike', `%${query}%`)
        .orWhere('domain', 'ilike', `%${query}%`)
        .orWhere('website', 'ilike', `%${query}%`)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      return companies;
    } catch (error) {
      throw new DatabaseError('Failed to search companies', error);
    }
  }

  static async findByIdWithRelations(id) {
    try {
      const company = await db('companies')
        .leftJoin('users as assigned_user', 'companies.assigned_to', 'assigned_user.id')
        .leftJoin('users as creator_user', 'companies.created_by', 'creator_user.id')
        .leftJoin('contacts', 'companies.id', 'contacts.company_id')
        .select([
          'companies.*',
          'assigned_user.first_name as assigned_first_name',
          'assigned_user.last_name as assigned_last_name',
          'assigned_user.email as assigned_email',
          'creator_user.first_name as created_by_first_name',
          'creator_user.last_name as created_by_last_name'
        ])
        .count('contacts.id as contact_count')
        .where('companies.id', id)
        .groupBy('companies.id', 'assigned_user.id', 'creator_user.id')
        .first();

      if (!company) {
        throw new NotFoundError('Company');
      }

      return company;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to find company with relations', error);
    }
  }

  static async count(filters = {}) {
    try {
      const { assigned_to, industry, company_size } = filters;

      let query = db('companies').count('* as count');

      if (assigned_to) query = query.where({ assigned_to });
      if (industry) query = query.where({ industry });
      if (company_size) query = query.where({ company_size });

      const result = await query.first();
      return parseInt(result.count);
    } catch (error) {
      throw new DatabaseError('Failed to count companies', error);
    }
  }

  static async getContacts(id, filters = {}) {
    try {
      const { limit = 20, offset = 0 } = filters;

      const contacts = await db('contacts')
        .select('*')
        .where('company_id', id)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      return contacts;
    } catch (error) {
      throw new DatabaseError('Failed to fetch company contacts', error);
    }
  }

  static async getDeals(id, filters = {}) {
    try {
      const { limit = 20, offset = 0, status } = filters;

      let query = db('deals')
        .select('*')
        .where('company_id', id)
        .orderBy('created_at', 'desc');

      if (status) query = query.where({ status });

      query = query.limit(limit).offset(offset);

      return await query;
    } catch (error) {
      throw new DatabaseError('Failed to fetch company deals', error);
    }
  }
}

module.exports = Company;