
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log('Migrating users table...');
  
  // Note: Supabase JS client doesn't support ALTER TABLE directly easily via standard API
  // but we can try to use RPC if a 'exec_sql' function exists, or just try to update and see if it fails.
  // Alternatively, we can use the postgres connection string, but we don't have it here.
  
  // Since we can't easily run ALTER TABLE from the JS client without a specific RPC,
  // I will check if I can use the backend's existing database logic or if I should just
  // advise the user. 
  
  // Actually, I'll try to find if there's a way to run raw SQL in this project.
  // Many Supabase projects have a 'postgres' RPC.
  
  const sql = `
    ALTER TABLE users ADD COLUMN IF NOT EXISTS email text;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS address text;
  `;
  
  const { error } = await supabase.rpc('exec_sql', { sql });
  if (error) {
    console.error('Error migrating (exec_sql might not exist):', error);
    console.log('Please run this in your Supabase SQL Editor:');
    console.log(sql);
  } else {
    console.log('Migration successful!');
  }
}

migrate();
