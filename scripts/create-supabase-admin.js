const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please check your .env.local file:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createAdminUser() {
  try {
    console.log('🔍 Checking if admin user exists...');

    // Check if user already exists
    const { data: existingUsers, error: listError } =
      await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('❌ Error listing users:', listError);
      return;
    }

    const existingUser = existingUsers.users.find(
      (user) => user.email === 'admin@neba.com'
    );

    if (existingUser) {
      console.log('✅ Admin user already exists:', existingUser.id);
      console.log('📧 Email:', existingUser.email);
      console.log('📅 Created:', existingUser.created_at);
      return;
    }

    console.log('🔍 Creating admin user...');

    // Create admin user
    const { data: newUser, error: createError } =
      await supabase.auth.admin.createUser({
        email: 'admin@neba.com',
        password: 'admin123',
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name: 'Admin User',
          role: 'admin',
        },
      });

    if (createError) {
      console.error('❌ Error creating user:', createError);
      return;
    }

    console.log('✅ Admin user created successfully!');
    console.log('🆔 User ID:', newUser.user.id);
    console.log('📧 Email:', newUser.user.email);
    console.log('🔑 Password: admin123');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createAdminUser();
