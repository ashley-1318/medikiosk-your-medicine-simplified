const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function inspect() {
  const { data: med } = await supabase.from('medicines').select('*').limit(1);
  const { data: inv } = await supabase.from('inventory').select('*').limit(1);
  
  if (med && med.length > 0) console.log('Medicines columns:', Object.keys(med[0]));
  else console.log('Medicines table empty');

  if (inv && inv.length > 0) console.log('Inventory columns:', Object.keys(inv[0]));
  else {
      // If empty, try to get column names via an insert attempt that fails
      const { error } = await supabase.from('inventory').insert({ dummy_col: 1 });
      console.log('Inventory columns info via error:', error.message);
  }
}

inspect();
