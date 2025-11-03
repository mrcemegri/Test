exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('activities').del();
  await knex('deals').del();
  await knex('contacts').del();
  await knex('companies').del();
  await knex('users').where('email', '!=', 'system@crm.com').del();

  // Create sample users
  const [adminUser] = await knex('users').insert({
    email: 'admin@example.com',
    password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXwtGtrmu.2q', // password123
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
    is_active: true
  }).returning('*');

  const [managerUser] = await knex('users').insert({
    email: 'manager@example.com',
    password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXwtGtrmu.2q', // password123
    first_name: 'Manager',
    last_name: 'User',
    role: 'manager',
    is_active: true
  }).returning('*');

  const [salesUser] = await knex('users').insert({
    email: 'sales@example.com',
    password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXwtGtrmu.2q', // password123
    first_name: 'Sales',
    last_name: 'Rep',
    role: 'sales_rep',
    is_active: true
  }).returning('*');

  // Create sample companies
  const [company1] = await knex('companies').insert({
    name: 'Acme Corporation',
    domain: 'acme.com',
    website: 'https://acme.com',
    industry: 'Technology',
    company_size: '100-500',
    phone: '+1-555-0100',
    address: '123 Main St, New York, NY 10001',
    assigned_to: salesUser.id,
    created_by: adminUser.id
  }).returning('*');

  const [company2] = await knex('companies').insert({
    name: 'Global Industries',
    domain: 'global.com',
    website: 'https://global.com',
    industry: 'Manufacturing',
    company_size: '1000-5000',
    phone: '+1-555-0200',
    address: '456 Oak Ave, Chicago, IL 60601',
    assigned_to: managerUser.id,
    created_by: adminUser.id
  }).returning('*');

  // Create sample contacts
  const [contact1] = await knex('contacts').insert({
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@acme.com',
    phone: '+1-555-0111',
    mobile: '+1-555-0112',
    company_id: company1.id,
    job_title: 'CEO',
    department: 'Executive',
    assigned_to: salesUser.id,
    created_by: adminUser.id,
    lifecycle_stage: 'opportunity'
  }).returning('*');

  const [contact2] = await knex('contacts').insert({
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane.smith@global.com',
    phone: '+1-555-0221',
    company_id: company2.id,
    job_title: 'CTO',
    department: 'Technology',
    assigned_to: managerUser.id,
    created_by: adminUser.id,
    lifecycle_stage: 'mql'
  }).returning('*');

  const [contact3] = await knex('contacts').insert({
    first_name: 'Mike',
    last_name: 'Johnson',
    email: 'mike.johnson@acme.com',
    phone: '+1-555-0131',
    company_id: company1.id,
    job_title: 'VP of Sales',
    department: 'Sales',
    assigned_to: salesUser.id,
    created_by: adminUser.id,
    lifecycle_stage: 'sql'
  }).returning('*');

  // Get default pipeline and stages
  const pipeline = await knex('pipelines').where({ name: 'Sales Pipeline' }).first();
  const stages = await knex('pipeline_stages').where({ pipeline_id: pipeline.id }).orderBy('order_index');

  // Create sample deals
  const [deal1] = await knex('deals').insert({
    name: 'Acme Enterprise Deal',
    amount: 150000.00,
    currency: 'USD',
    pipeline_id: pipeline.id,
    current_stage_id: stages[2].id, // Proposal stage
    contact_id: contact1.id,
    company_id: company1.id,
    assigned_to: salesUser.id,
    expected_close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    status: 'open',
    created_by: salesUser.id
  }).returning('*');

  const [deal2] = await knex('deals').insert({
    name: 'Global Software License',
    amount: 75000.00,
    currency: 'USD',
    pipeline_id: pipeline.id,
    current_stage_id: stages[1].id, // Qualified stage
    contact_id: contact2.id,
    company_id: company2.id,
    assigned_to: managerUser.id,
    expected_close_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
    status: 'open',
    created_by: managerUser.id
  }).returning('*');

  const [deal3] = await knex('deals').insert({
    name: 'Acme Support Contract',
    amount: 25000.00,
    currency: 'USD',
    pipeline_id: pipeline.id,
    current_stage_id: stages[4].id, // Closed Won
    contact_id: contact3.id,
    company_id: company1.id,
    assigned_to: salesUser.id,
    expected_close_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
    actual_close_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    status: 'won',
    created_by: salesUser.id
  }).returning('*');

  // Create sample activities
  await knex('activities').insert([
    {
      type: 'call',
      subject: 'Initial discovery call with John Doe',
      description: 'Great conversation about their needs. They are interested in our enterprise solution.',
      deal_id: deal1.id,
      contact_id: contact1.id,
      created_by: salesUser.id,
      is_completed: true,
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
    },
    {
      type: 'email',
      subject: 'Follow-up email - pricing information',
      description: 'Sent detailed pricing proposal to John Doe.',
      deal_id: deal1.id,
      contact_id: contact1.id,
      created_by: salesUser.id,
      is_completed: true,
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    },
    {
      type: 'meeting',
      subject: 'Demo with Jane Smith',
      description: 'Product demo scheduled for next week.',
      deal_id: deal2.id,
      contact_id: contact2.id,
      created_by: managerUser.id,
      is_completed: false,
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
    },
    {
      type: 'task',
      subject: 'Send contract to Acme',
      description: 'Prepare and send support contract for signature.',
      deal_id: deal3.id,
      contact_id: contact3.id,
      created_by: salesUser.id,
      is_completed: true,
      created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000) // 12 days ago
    },
    {
      type: 'note',
      subject: 'Acme decision maker identified',
      description: 'John Doe is the main decision maker. Mike Johnson will be our champion.',
      deal_id: deal1.id,
      contact_id: contact1.id,
      created_by: salesUser.id,
      is_completed: true,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
    }
  ]);

  console.log('Sample data created successfully!');
};