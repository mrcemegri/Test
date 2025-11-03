const knex = require('knex');
require('dotenv').config();

const db = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'crm_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    directory: './server/migrations',
    tableName: 'knex_migrations'
  },
  seeds: {
    directory: './server/seeds'
  }
});

// Test database connection
const testConnection = async () => {
  try {
    await db.raw('SELECT 1');
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
};

// Initialize database connection on module load
if (process.env.NODE_ENV !== 'test') {
  testConnection();
}

module.exports = { db, testConnection };