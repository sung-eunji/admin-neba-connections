import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  listAdminUsers,
  createAdminUser,
  AdminUserFilters,
  CreateAdminUserData,
} from '@/lib/admin-users';

// Check authentication
async function checkAuth() {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get('neba_admin');

  if (!adminCookie || !adminCookie.value) {
    return false;
  }
  return true;
}

// GET /api/admin-users - List admin users
export async function GET(request: NextRequest) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);

    const filters: AdminUserFilters = {
      search: searchParams.get('search') || '',
      page: parseInt(searchParams.get('page') || '1'),
      take: parseInt(searchParams.get('take') || '20'),
    };

    const result = await listAdminUsers(filters);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin users' },
      { status: 500 }
    );
  }
}

// POST /api/admin-users - Create admin user
export async function POST(request: NextRequest) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const userData: CreateAdminUserData = { email, password };
    const user = await createAdminUser(userData);

    return NextResponse.json(user, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating admin user:', error);

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create admin user' },
      { status: 500 }
    );
  }
}
