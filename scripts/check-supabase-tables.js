const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkSupabaseTables() {
  try {
    console.log('🔍 Checking Supabase tables...');

    // Check if admin_user table exists and get its data
    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_user')
      .select('*')
      .limit(5);

    if (adminError) {
      console.log('❌ admin_user table error:', adminError.message);
    } else {
      console.log('✅ admin_user table found!');
      console.log('📊 Sample data:', adminUsers);
    }

    // Check other possible admin tables
    const tables = ['admin_users', 'admins', 'users', 'admin'];

    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*').limit(1);

      if (!error && data) {
        console.log(`✅ ${table} table found!`);
        console.log(`📊 Sample data:`, data);
      }
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkSupabaseTables();
