const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function addColumns() {
  console.log("Adding columns to users table...");
  const sql = `
    ALTER TABLE users ADD COLUMN IF NOT EXISTS age integer;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS blood_group text;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS weight numeric;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS height numeric;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS gender text;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS allergies text[] DEFAULT '{}';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS conditions text[] DEFAULT '{}';
  `;
  
  // Since we can't run raw SQL easily via client, we'll try a small RPC or just inform.
  // Actually, we can use the 'rpc' if we had a function, but usually we don't.
  // I will check if I can just try an update to test if columns exist.
  
  const { error } = await supabase
    .from('users')
    .select('age, blood_group, weight, height, gender, allergies, conditions')
    .limit(1);

  if (error) {
    console.log("Error detected (Columns likely missing):", error.message);
    console.log("PLEASE RUN THIS SQL IN YOUR SUPABASE DASHBOARD:");
    console.log(sql);
  } else {
    console.log("Success! Columns already exist.");
  }
}

addColumns();
