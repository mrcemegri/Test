exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email').unique().notNullable();
    table.string('password_hash').notNullable();
    table.string('first_name').notNullable();
    table.string('last_name').notNullable();
    table.string('phone');
    table.enum('role', ['admin', 'manager', 'sales_rep', 'viewer']).defaultTo('sales_rep');
    table.uuid('company_id');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);

    // Indexes
    table.index('email');
    table.index('company_id');
    table.index('role');
    table.index('is_active');

    // Foreign key constraints will be added after companies table is created
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};