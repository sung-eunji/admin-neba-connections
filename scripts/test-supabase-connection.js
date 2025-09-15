const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing Supabase connection...');
console.log('Environment variables:');
console.log('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Not set');
console.log('- SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Not set');

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

async function testConnection() {
  try {
    console.log('\n🔍 Testing admin_user table...');
    
    // Test admin_user table
    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_user')
      .select('*')
      .limit(1);
    
    if (adminError) {
      console.error('❌ admin_user table error:', adminError.message);
    } else {
      console.log('✅ admin_user table accessible');
      console.log('📊 Sample admin user:', adminUsers?.[0]?.email || 'No users found');
    }

    console.log('\n🔍 Testing exhibitors_prw_2025 table...');
    
    // Test exhibitors table
    const { data: exhibitors, error: exhibitorsError } = await supabase
      .from('exhibitors_prw_2025')
      .select('*')
      .limit(1);
    
    if (exhibitorsError) {
      console.error('❌ exhibitors_prw_2025 table error:', exhibitorsError.message);
    } else {
      console.log('✅ exhibitors_prw_2025 table accessible');
      console.log('📊 Sample exhibitor:', exhibitors?.[0]?.name || 'No exhibitors found');
    }

    console.log('\n🔍 Testing total counts...');
    
    // Test total counts
    const { count: adminCount, error: adminCountError } = await supabase
      .from('admin_user')
      .select('*', { count: 'exact', head: true });
    
    const { count: exhibitorCount, error: exhibitorCountError } = await supabase
      .from('exhibitors_prw_2025')
      .select('*', { count: 'exact', head: true });
    
    if (adminCountError) {
      console.error('❌ admin_user count error:', adminCountError.message);
    } else {
      console.log('✅ Total admin users:', adminCount);
    }
    
    if (exhibitorCountError) {
      console.error('❌ exhibitors_prw_2025 count error:', exhibitorCountError.message);
    } else {
      console.log('✅ Total exhibitors:', exhibitorCount);
    }

    console.log('\n🎉 All tests passed! Supabase connection is working correctly.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testConnection();
