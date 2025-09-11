'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { authenticateAdminUser } from '@/lib/admin-users';

export async function login(formData: FormData) {
  const email = formData.get('username') as string;
  const password = formData.get('password') as string;

  try {
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
    return { error: 'An error occurred during login' };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('neba_admin');
  redirect('/');
}

