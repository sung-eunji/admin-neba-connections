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

    // Try Supabase authentication
    console.log('🔍 Attempting Supabase authentication...');
    const { data: supabaseUser, error: supabaseError } =
      await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

    if (supabaseUser?.user && !supabaseError) {
      console.log(
        '✅ Supabase authentication successful:',
        supabaseUser.user.id
      );
      const user = {
        id: supabaseUser.user.id,
        email: supabaseUser.user.email,
        name: supabaseUser.user.user_metadata?.name || email,
      };

      console.log('✅ Login successful for user:', user.id);

      // Set HTTP-only cookie with user ID
      const cookieStore = await cookies();
      cookieStore.set('neba_admin', user.id.toString(), {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });

      // Redirect to dashboard
      redirect('/events/nrf');
    } else {
      console.log('❌ Supabase authentication failed:', supabaseError?.message);
      console.log('❌ Supabase error details:', supabaseError);

      // More specific error messages
      if (supabaseError?.message?.includes('Invalid login credentials')) {
        return {
          error: 'Invalid email or password. Please check your credentials.',
        };
      } else if (supabaseError?.message?.includes('Email not confirmed')) {
        return {
          error:
            'Please check your email and confirm your account before logging in.',
        };
      } else {
        return {
          error: `Authentication failed: ${
            supabaseError?.message || 'Unknown error'
          }. Please try again.`,
        };
      }
    }
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
  try {
    // Sign out from Supabase
    await supabaseAdmin.auth.signOut();
  } catch (error) {
    console.log('Supabase logout error (non-critical):', error);
  }

  const cookieStore = await cookies();
  cookieStore.delete('neba_admin');
  redirect('/');
}
