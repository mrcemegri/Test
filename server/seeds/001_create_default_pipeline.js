exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('pipelines').del();
  await knex('pipeline_stages').del();

  // Get system user ID (create if doesn't exist)
  let systemUser = await knex('users').where({ email: 'system@crm.com' }).first();
  if (!systemUser) {
    [systemUser] = await knex('users').insert({
      email: 'system@crm.com',
      password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXwtGtrmu.2q', // placeholder
      first_name: 'System',
      last_name: 'User',
      role: 'admin',
      is_active: true
    }).returning('*');
  }

  // Create default sales pipeline
  const [pipeline] = await knex('pipelines').insert({
    name: 'Sales Pipeline',
    description: 'Default sales pipeline for tracking deals from lead to close',
    created_by: systemUser.id,
    is_active: true
  }).returning('*');

  // Create pipeline stages
  const stages = [
    {
      pipeline_id: pipeline.id,
      name: 'Lead',
      order_index: 0,
      probability: 10
    },
    {
      pipeline_id: pipeline.id,
      name: 'Qualified',
      order_index: 1,
      probability: 25
    },
    {
      pipeline_id: pipeline.id,
      name: 'Proposal',
      order_index: 2,
      probability: 50
    },
    {
      pipeline_id: pipeline.id,
      name: 'Negotiation',
      order_index: 3,
      probability: 75
    },
    {
      pipeline_id: pipeline.id,
      name: 'Closed Won',
      order_index: 4,
      probability: 100
    },
    {
      pipeline_id: pipeline.id,
      name: 'Closed Lost',
      order_index: 5,
      probability: 0
    }
  ];

  await knex('pipeline_stages').insert(stages);
};