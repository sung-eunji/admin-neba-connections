'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { authenticateAdminUser } from '@/lib/admin-users';

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
    });

    // Authenticate using admin_users table
    const user = await authenticateAdminUser(email, password);

    if (user) {
      // Set HTTP-only cookie with user ID
      const cookieStore = await cookies();
      cookieStore.set('neba_admin', user.id, {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });

      // Redirect to dashboard
      redirect('/events/nrf');
    } else {
      return { error: 'Invalid email or password' };
    }
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      email: email,
      timestamp: new Date().toISOString(),
    });

    // Return more specific error message
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return { error: `Login failed: ${errorMessage}` };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('neba_admin');
  redirect('/');
}
