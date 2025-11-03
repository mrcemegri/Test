exports.up = function(knex) {
  return knex.schema.createTable('activities', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.enum('type', ['call', 'email', 'meeting', 'note', 'task']).notNullable();
    table.string('subject').notNullable();
    table.text('description');
    table.uuid('deal_id').nullable();
    table.uuid('contact_id').nullable();
    table.uuid('created_by').notNullable();
    table.boolean('is_completed').defaultTo(false);
    table.timestamps(true, true);

    // Indexes
    table.index('type');
    table.index('deal_id');
    table.index('contact_id');
    table.index('created_by');
    table.index('is_completed');
    table.index('created_at');
    table.index(['contact_id', 'created_at'], 'contact_activity_timeline');
    table.index(['deal_id', 'created_at'], 'deal_activity_timeline');

    // Full text search
    table.index(['subject', 'type'], 'activities_search_idx');

    // Foreign keys
    table.foreign('deal_id').references('id').inTable('deals').onDelete('CASCADE');
    table.foreign('contact_id').references('id').inTable('contacts').onDelete('CASCADE');
    table.foreign('created_by').references('id').inTable('users').onDelete('CASCADE');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('activities');
};