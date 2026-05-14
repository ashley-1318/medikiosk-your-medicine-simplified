// Supabase admin client — uses SERVICE key (full access, never expose to frontend)
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

module.exports = supabase;
