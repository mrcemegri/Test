const { Company } = require('../models');
const { NotFoundError, ConflictError } = require('../utils/errors');

class CompanyService {
  static async createCompany(companyData, userId) {
    try {
      // Check if company with same domain already exists
      if (companyData.domain) {
        const existingCompany = await Company.findByDomain(companyData.domain);
        if (existingCompany) {
          throw new ConflictError('Company with this domain already exists');
        }
      }

      const company = await Company.create({
        ...companyData,
        assigned_to: companyData.assigned_to || userId,
        created_by: userId
      });

      return company;
    } catch (error) {
      throw error;
    }
  }

  static async getCompanyById(id, user) {
    try {
      const company = await Company.findByIdWithRelations(id);

      // Check access permissions
      if (user.role === 'admin' ||
          user.role === 'manager' ||
          company.assigned_to === user.id ||
          company.created_by === user.id) {
        return company;
      } else {
        throw new NotFoundError('Company');
      }
    } catch (error) {
      throw error;
    }
  }

  static async updateCompany(id, updates, user) {
    try {
      const company = await Company.findById(id);

      // Check permissions
      if (user.role === 'admin' ||
          user.role === 'manager' ||
          company.assigned_to === user.id ||
          company.created_by === user.id) {

        // Only admin/manager can change assignment
        if (user.role !== 'admin' && user.role !== 'manager' && updates.assigned_to) {
          delete updates.assigned_to;
        }

        const updatedCompany = await Company.update(id, updates);
        return updatedCompany;
      } else {
        throw new NotFoundError('Company');
      }
    } catch (error) {
      throw error;
    }
  }

  static async deleteCompany(id, user) {
    try {
      const company = await Company.findById(id);

      // Check permissions (only admin or creator can delete)
      if (user.role === 'admin' || company.created_by === user.id) {
        await Company.delete(id);
        return true;
      } else {
        throw new NotFoundError('Company');
      }
    } catch (error) {
      throw error;
    }
  }

  static async getCompanies(filters, user) {
    try {
      // Filter based on user role
      let companyFilters = {
        ...filters,
        assigned_to: user.role === 'admin' || user.role === 'manager' ? filters.assigned_to : user.id
      };

      const companies = await Company.findAll(companyFilters);
      return companies;
    } catch (error) {
      throw error;
    }
  }

  static async searchCompanies(query, filters, user) {
    try {
      const searchFilters = {
        ...filters,
        assigned_to: user.role === 'admin' || user.role === 'manager' ? filters.assigned_to : user.id
      };

      const companies = await Company.search(query, searchFilters);
      return companies;
    } catch (error) {
      throw error;
    }
  }

  static async getCompanyContacts(id, filters, user) {
    try {
      const company = await Company.findById(id);

      // Check access permissions
      if (user.role === 'admin' ||
          user.role === 'manager' ||
          company.assigned_to === user.id ||
          company.created_by === user.id) {

        const contacts = await Company.getContacts(id, filters);
        return contacts;
      } else {
        throw new NotFoundError('Company');
      }
    } catch (error) {
      throw error;
    }
  }

  static async getCompanyDeals(id, filters, user) {
    try {
      const company = await Company.findById(id);

      // Check access permissions
      if (user.role === 'admin' ||
          user.role === 'manager' ||
          company.assigned_to === user.id ||
          company.created_by === user.id) {

        const deals = await Company.getDeals(id, filters);
        return deals;
      } else {
        throw new NotFoundError('Company');
      }
    } catch (error) {
      throw error;
    }
  }
}

module.exports = CompanyService;