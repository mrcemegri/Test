exports.up = function(knex) {
  return knex.schema.createTable('deals', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.decimal('amount', 12, 2);
    table.string('currency').defaultTo('USD');
    table.uuid('pipeline_id').notNullable();
    table.uuid('current_stage_id').notNullable();
    table.uuid('contact_id').notNullable();
    table.uuid('company_id').nullable();
    table.uuid('assigned_to').nullable();
    table.date('expected_close_date');
    table.date('actual_close_date');
    table.enum('status', ['open', 'won', 'lost']).defaultTo('open');
    table.uuid('created_by').notNullable();
    table.timestamps(true, true);

    // Indexes
    table.index('name');
    table.index('pipeline_id');
    table.index('current_stage_id');
    table.index('contact_id');
    table.index('company_id');
    table.index('assigned_to');
    table.index('created_by');
    table.index('status');
    table.index('expected_close_date');
    table.index(['pipeline_id', 'current_stage_id'], 'deal_pipeline_stage');

    // Full text search
    table.index(['name', 'status'], 'deals_search_idx');

    // Foreign keys
    table.foreign('pipeline_id').references('id').inTable('pipelines').onDelete('CASCADE');
    table.foreign('current_stage_id').references('id').inTable('pipeline_stages').onDelete('CASCADE');
    table.foreign('contact_id').references('id').inTable('contacts').onDelete('CASCADE');
    table.foreign('company_id').references('id').inTable('companies').onDelete('SET NULL');
    table.foreign('assigned_to').references('id').inTable('users').onDelete('SET NULL');
    table.foreign('created_by').references('id').inTable('users').onDelete('CASCADE');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('deals');
};