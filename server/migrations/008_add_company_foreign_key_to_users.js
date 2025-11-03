exports.up = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    // Add foreign key constraint to company_id after companies table is created
    table.foreign('company_id').references('id').inTable('companies').onDelete('SET NULL');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    // Drop foreign key constraint
    table.dropForeign('company_id');
  });
};