'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';

export async function login(formData: FormData) {
  const email = formData.get('username') as string;
  const password = formData.get('password') as string;

  try {
    console.log('🔍 Login attempt started:', {
      email,
      timestamp: new Date().toISOString(),
    });

    // Check environment variables first
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('🔍 Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      SUPABASE_URL: supabaseUrl ? 'Set' : 'Not set',
      SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey ? 'Set' : 'Not set',
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase environment variables');
      return {
        error: 'Server configuration error. Please contact administrator.',
      };
    }

    // Try Supabase admin_user table authentication
    console.log('🔍 Attempting Supabase admin_user table authentication...');

    // Get user from admin_user table
    const { data: adminUser, error: userError } = await supabaseAdmin
      .from('admin_user')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !adminUser) {
      console.log('❌ User not found in admin_user table:', userError?.message);
      return {
        error: 'Invalid email or password. Please check your credentials.',
      };
    }

    console.log('✅ User found in admin_user table:', adminUser.id);

    // Verify password using bcrypt
    const bcrypt = await import('bcryptjs');
    const isValidPassword = await bcrypt.compare(
      password,
      adminUser.password_hash
    );

    if (!isValidPassword) {
      console.log('❌ Invalid password for user:', email);
      return {
        error: 'Invalid email or password. Please check your credentials.',
      };
    }

    console.log('✅ Password verification successful for user:', adminUser.id);

    // Update last login
    await supabaseAdmin
      .from('admin_user')
      .update({ last_login: new Date().toISOString() })
      .eq('id', adminUser.id);

    // Set HTTP-only cookie with user ID
    const cookieStore = await cookies();
    cookieStore.set('neba_admin', adminUser.id.toString(), {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    console.log('✅ Login successful for user:', adminUser.id);

    // Redirect to dashboard
    redirect('/events/nrf');
  } catch (error) {
    // Don't log NEXT_REDIRECT errors as they are normal for successful logins
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      // This is a successful login redirect, not an actual error
      return;
    }

    console.error('❌ Login error:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      email: email,
      timestamp: new Date().toISOString(),
    });

    // Return user-friendly error message
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    // Check for specific error types
    if (errorMessage.includes('fetch')) {
      return {
        error:
          'Network error. Please check your internet connection and try again.',
      };
    } else if (errorMessage.includes('timeout')) {
      return {
        error: 'Request timeout. Please try again.',
      };
    } else {
      return {
        error: 'An unexpected error occurred. Please try again later.',
      };
    }
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('neba_admin');
  redirect('/');
}
