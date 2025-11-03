exports.up = function(knex) {
  return knex.schema.createTable('companies', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.string('domain').unique();
    table.string('phone');
    table.string('address');
    table.string('website');
    table.string('industry');
    table.string('company_size');
    table.uuid('assigned_to').nullable();
    table.uuid('created_by').notNullable();
    table.timestamps(true, true);

    // Indexes
    table.index('name');
    table.index('domain');
    table.index('assigned_to');
    table.index('created_by');
    table.index('industry');

    // Foreign keys
    table.foreign('assigned_to').references('id').inTable('users').onDelete('SET NULL');
    table.foreign('created_by').references('id').inTable('users').onDelete('CASCADE');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('companies');
};