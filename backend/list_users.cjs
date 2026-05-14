const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllUsers() {
  console.log("Listing ALL users in the database...");
  const { data, error } = await supabase
    .from('users')
    .select('id, name, phone_number');

  if (error) {
    console.error("Error listing users:", error);
  } else {
    console.log("Users in DB:");
    data.forEach(u => {
      console.log(`- ID: ${u.id} | Name: ${u.name} | Phone: ${u.phone_number}`);
    });
  }
}

listAllUsers();
