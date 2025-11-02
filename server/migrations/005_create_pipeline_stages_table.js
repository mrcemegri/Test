exports.up = function(knex) {
  return knex.schema.createTable('pipeline_stages', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('pipeline_id').notNullable();
    table.string('name').notNullable();
    table.integer('order_index').notNullable();
    table.integer('probability').defaultTo(0);
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);

    // Indexes
    table.index('pipeline_id');
    table.index(['pipeline_id', 'order_index'], 'pipeline_stage_order');
    table.index('is_active');

    // Foreign keys
    table.foreign('pipeline_id').references('id').inTable('pipelines').onDelete('CASCADE');

    // Ensure uniqueness of order within pipeline
    table.unique(['pipeline_id', 'order_index']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('pipeline_stages');
};