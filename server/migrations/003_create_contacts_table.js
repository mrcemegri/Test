exports.up = function(knex) {
  return knex.schema.createTable('contacts', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('first_name').notNullable();
    table.string('last_name').notNullable();
    table.string('email').unique().notNullable();
    table.string('phone');
    table.string('mobile');
    table.uuid('company_id').nullable();
    table.string('job_title');
    table.string('department');
    table.uuid('assigned_to').nullable();
    table.uuid('created_by').notNullable();
    table.enum('lifecycle_stage', ['lead', 'mql', 'sql', 'opportunity', 'customer']).defaultTo('lead');
    table.timestamps(true, true);

    // Indexes
    table.index('email');
    table.index('first_name');
    table.index('last_name');
    table.index('company_id');
    table.index('assigned_to');
    table.index('created_by');
    table.index('lifecycle_stage');

    // Full text search index
    table.index(['first_name', 'last_name', 'email'], 'contacts_search_idx');

    // Foreign keys
    table.foreign('company_id').references('id').inTable('companies').onDelete('SET NULL');
    table.foreign('assigned_to').references('id').inTable('users').onDelete('SET NULL');
    table.foreign('created_by').references('id').inTable('users').onDelete('CASCADE');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('contacts');
};