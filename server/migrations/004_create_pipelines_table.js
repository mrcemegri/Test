exports.up = function(knex) {
  return knex.schema.createTable('pipelines', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.text('description');
    table.boolean('is_active').defaultTo(true);
    table.uuid('created_by').notNullable();
    table.uuid('company_id');
    table.timestamps(true, true);

    // Indexes
    table.index('name');
    table.index('created_by');
    table.index('company_id');
    table.index('is_active');

    // Foreign keys
    table.foreign('created_by').references('id').inTable('users').onDelete('CASCADE');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('pipelines');
};