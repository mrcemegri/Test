const { db } = require('../config/database');
const bcrypt = require('bcryptjs');
const { NotFoundError, ConflictError, DatabaseError } = require('../utils/errors');

class User {
  static async create(userData) {
    try {
      const { password, company_id, ...otherData } = userData;

      // Hash password
      const password_hash = await bcrypt.hash(password, 12);

      const [user] = await db('users')
        .insert({
          ...otherData,
          password_hash,
          company_id
        })
        .returning('*');

      // Remove password hash from response
      delete user.password_hash;
      return user;
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictError('Email already exists');
      }
      throw new DatabaseError('Failed to create user', error);
    }
  }

  static async findById(id) {
    try {
      const user = await db('users')
        .where({ id })
        .first();

      if (!user) {
        throw new NotFoundError('User');
      }

      // Remove password hash from response
      delete user.password_hash;
      return user;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to find user', error);
    }
  }

  static async findByEmail(email) {
    try {
      return await db('users')
        .where({ email })
        .first();
    } catch (error) {
      throw new DatabaseError('Failed to find user by email', error);
    }
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async update(id, updates) {
    try {
      const [user] = await db('users')
        .where({ id })
        .update({
          ...updates,
          updated_at: new Date()
        })
        .returning('*');

      if (!user) {
        throw new NotFoundError('User');
      }

      // Remove password hash from response
      delete user.password_hash;
      return user;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      if (error.code === '23505') {
        throw new ConflictError('Email already exists');
      }
      throw new DatabaseError('Failed to update user', error);
    }
  }

  static async delete(id) {
    try {
      const result = await db('users')
        .where({ id })
        .del();

      if (result === 0) {
        throw new NotFoundError('User');
      }

      return true;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to delete user', error);
    }
  }

  static async findAll(filters = {}) {
    try {
      const { limit = 20, offset = 0, role, company_id, is_active } = filters;

      let query = db('users')
        .select('*')
        .orderBy('created_at', 'desc');

      // Apply filters
      if (role) query = query.where({ role });
      if (company_id) query = query.where({ company_id });
      if (typeof is_active === 'boolean') query = query.where({ is_active });

      // Apply pagination
      query = query.limit(limit).offset(offset);

      const users = await query;

      // Remove password hashes from responses
      return users.map(user => {
        delete user.password_hash;
        return user;
      });
    } catch (error) {
      throw new DatabaseError('Failed to fetch users', error);
    }
  }

  static async findTeamMembers(company_id, filters = {}) {
    try {
      const { limit = 20, offset = 0, role, is_active = true } = filters;

      let query = db('users')
        .select('*')
        .where({ company_id, is_active })
        .orderBy('created_at', 'desc');

      if (role) query = query.where({ role });

      query = query.limit(limit).offset(offset);

      const users = await query;

      // Remove password hashes from responses
      return users.map(user => {
        delete user.password_hash;
        return user;
      });
    } catch (error) {
      throw new DatabaseError('Failed to fetch team members', error);
    }
  }

  static async count(filters = {}) {
    try {
      const { role, company_id, is_active } = filters;

      let query = db('users').count('* as count');

      if (role) query = query.where({ role });
      if (company_id) query = query.where({ company_id });
      if (typeof is_active === 'boolean') query = query.where({ is_active });

      const result = await query.first();
      return parseInt(result.count);
    } catch (error) {
      throw new DatabaseError('Failed to count users', error);
    }
  }
}

module.exports = User;