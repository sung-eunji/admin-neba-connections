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

async function checkExhibitorsTable() {
  try {
    console.log('🔍 Checking exhibitors_prw_2025 table in Supabase...');
    
    // Check if exhibitors_prw_2025 table exists and get sample data
    const { data: exhibitors, error: exhibitorsError } = await supabase
      .from('exhibitors_prw_2025')
      .select('*')
      .limit(3);
    
    if (exhibitorsError) {
      console.log('❌ exhibitors_prw_2025 table error:', exhibitorsError.message);
    } else {
      console.log('✅ exhibitors_prw_2025 table found!');
      console.log('📊 Sample data:', exhibitors);
      console.log('📈 Total count:', exhibitors.length);
    }
    
    // Check total count
    const { count, error: countError } = await supabase
      .from('exhibitors_prw_2025')
      .select('*', { count: 'exact', head: true });
    
    if (!countError) {
      console.log('📊 Total exhibitors in table:', count);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkExhibitorsTable();
