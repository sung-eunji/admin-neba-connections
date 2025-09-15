import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  getAdminUserById,
  updateAdminUser,
  deleteAdminUser,
  UpdateAdminUserData,
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

// GET /api/admin-users/[id] - Get admin user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const user = await getAdminUserById(BigInt(id));

    if (!user) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching admin user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin user' },
      { status: 500 }
    );
  }
}

// PUT /api/admin-users/[id] - Update admin user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { email, password } = body;

    if (!email && !password) {
      return NextResponse.json(
        { error: 'At least one field (email or password) is required' },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    // Validate password strength if provided
    if (password && password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const updateData: UpdateAdminUserData = {};
    if (email) updateData.email = email;
    if (password) updateData.password = password;

    const user = await updateAdminUser(BigInt(id), updateData);
    return NextResponse.json(user);
  } catch (error: unknown) {
    console.error('Error updating admin user:', error);

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

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2025'
    ) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update admin user' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin-users/[id] - Delete admin user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await deleteAdminUser(BigInt(id));
    return NextResponse.json({ message: 'Admin user deleted successfully' });
  } catch (error: unknown) {
    console.error('Error deleting admin user:', error);

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2025'
    ) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete admin user' },
      { status: 500 }
    );
  }
}
