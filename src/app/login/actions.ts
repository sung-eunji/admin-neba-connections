'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { authenticateHybridAdmin } from '@/lib/hybrid-auth';
import { supabase } from '@/lib/supabase';

export async function login(formData: FormData) {
  const email = formData.get('username') as string;
  const password = formData.get('password') as string;

  try {
    console.log('🔍 Login attempt started:', {
      email,
      timestamp: new Date().toISOString(),
    });
    console.log('🔍 Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
      ADMIN_EMAIL: process.env.ADMIN_EMAIL ? 'Set' : 'Not set',
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ? 'Set' : 'Not set',
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
    });

    let user = null;

    // Try Supabase authentication first
    try {
      console.log('🔍 Attempting Supabase authentication...');
      const { data: supabaseUser, error: supabaseError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (supabaseUser?.user && !supabaseError) {
        console.log(
          '✅ Supabase authentication successful:',
          supabaseUser.user.id
        );
        user = {
          id: supabaseUser.user.id,
          email: supabaseUser.user.email,
          name: supabaseUser.user.user_metadata?.name || email,
        };
      } else {
        console.log(
          '❌ Supabase authentication failed:',
          supabaseError?.message
        );
      }
    } catch (supabaseError) {
      console.log('❌ Supabase authentication error:', supabaseError);
    }

    // Fallback to hybrid method if Supabase fails
    if (!user) {
      console.log('🔍 Falling back to hybrid authentication...');
      user = await authenticateHybridAdmin(email, password);
    }

    if (user) {
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
      console.log('❌ Authentication failed for email:', email);
      return {
        error: `Authentication failed. Please check your credentials. 
        Debug info: NODE_ENV=${process.env.NODE_ENV}, 
        DATABASE_URL=${process.env.DATABASE_URL ? 'Set' : 'Not set'},
        SUPABASE_URL=${
          process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set'
        }`,
      };
    }
  } catch (error) {
    // Don't log NEXT_REDIRECT errors as they are normal for successful logins
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      // This is a successful login redirect, not an actual error
      return;
    }

    console.error('Login error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      email: email,
      timestamp: new Date().toISOString(),
    });

    // Return more specific error message with debugging info
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return {
      error: `Login failed: ${errorMessage}. 
      Environment: NODE_ENV=${process.env.NODE_ENV}, 
      DATABASE_URL=${process.env.DATABASE_URL ? 'Set' : 'Not set'},
      SUPABASE_URL=${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set'}`,
    };
  }
}

export async function logout() {
  try {
    // Sign out from Supabase
    await supabase.auth.signOut();
  } catch (error) {
    console.log('Supabase logout error (non-critical):', error);
  }

  const cookieStore = await cookies();
  cookieStore.delete('neba_admin');
  redirect('/');
}
