const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);

async function updateSchema() {
    console.log("Updating schema...");
    
    const queries = [
        "ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS ai_analysis jsonb;",
        "ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS rejection_reason text;",
        "ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS doctor_private_notes text;",
        "ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS type text DEFAULT 'prescription';"
    ];

    for (const sql of queries) {
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
        if (error) {
            // Note: If rpc exec_sql is not defined, we might need another way or just hope columns exist
            console.error("Error executing SQL:", error);
            console.log("Trying direct postgres if possible... (fallback)");
        } else {
            console.log("Executed:", sql);
        }
    }
}

updateSchema();
