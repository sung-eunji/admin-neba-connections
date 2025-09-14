import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

export interface AdminUser {
  id: string;
  email: string;
  created_at: string | null;
  last_login: string | null;
}

export interface CreateAdminUserData {
  email: string;
  password: string;
}

export interface UpdateAdminUserData {
  email?: string;
  password?: string;
}

export interface AdminUserUpdateData {
  email?: string;
  password_hash?: string;
}

export interface AdminUserFilters {
  search?: string;
  page?: number;
  take?: number;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  totalPages: number;
}

// Create admin user
export async function createAdminUser(
  data: CreateAdminUserData
): Promise<AdminUser> {
  const user = await prisma.admin_user.create({
    data: {
      email: data.email,
      password_hash: data.password, // Store as plain text
    },
    select: {
      id: true,
      email: true,
      created_at: true,
      last_login: true,
    },
  });

  return {
    ...user,
    created_at: user.created_at?.toISOString() || null,
    last_login: user.last_login?.toISOString() || null,
  };
}

// Get admin user by email
export async function getAdminUserByEmail(email: string) {
  return prisma.admin_user.findUnique({
    where: { email },
  });
}

// Get admin user by ID
export async function getAdminUserById(id: string): Promise<AdminUser | null> {
  const user = await prisma.admin_user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      created_at: true,
      last_login: true,
    },
  });

  if (!user) return null;

  return {
    ...user,
    created_at: user.created_at?.toISOString() || null,
    last_login: user.last_login?.toISOString() || null,
  };
}

// List admin users with pagination and search
export async function listAdminUsers(
  filters: AdminUserFilters = {}
): Promise<AdminUsersResponse> {
  const { search = '', page = 1, take = 20 } = filters;
  const skip = (page - 1) * take;

  const where = search
    ? {
        email: {
          contains: search,
          mode: 'insensitive' as const,
        },
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.admin_user.findMany({
      where,
      skip,
      take,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        email: true,
        created_at: true,
        last_login: true,
      },
    }),
    prisma.admin_user.count({ where }),
  ]);

  const formattedUsers: AdminUser[] = users.map((user) => ({
    ...user,
    created_at: user.created_at?.toISOString() || null,
    last_login: user.last_login?.toISOString() || null,
  }));

  return {
    users: formattedUsers,
    total,
    page,
    totalPages: Math.ceil(total / take),
  };
}

// Update admin user
export async function updateAdminUser(
  id: string,
  data: UpdateAdminUserData
): Promise<AdminUser> {
  const updateData: AdminUserUpdateData = {};

  if (data.email) {
    updateData.email = data.email;
  }

  if (data.password) {
    updateData.password_hash = data.password; // Store as plain text
  }

  const user = await prisma.admin_user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      created_at: true,
      last_login: true,
    },
  });

  return {
    ...user,
    created_at: user.created_at?.toISOString() || null,
    last_login: user.last_login?.toISOString() || null,
  };
}

// Delete admin user
export async function deleteAdminUser(id: string): Promise<void> {
  await prisma.admin_user.delete({
    where: { id },
  });
}

// Update last login
export async function updateLastLogin(id: string): Promise<void> {
  await prisma.admin_user.update({
    where: { id },
    data: { last_login: new Date() },
  });
}

// Authenticate admin user
export async function authenticateAdminUser(
  email: string,
  password: string
): Promise<AdminUser | null> {
  try {
    console.log('🔍 Starting authentication for email:', email);

    const user = await getAdminUserByEmail(email);

    if (!user) {
      console.log('❌ User not found for email:', email);
      return null;
    }

    // Debug: Print input password and stored password
    console.log('🔍 Login Debug Info:');
    console.log('📧 Email:', email);
    console.log('🔑 Input password:', password);
    console.log('💾 Stored password hash:', user.password_hash);

    // Compare using bcrypt
    const isValid = await bcrypt.compare(password, user.password_hash);
    console.log('✅ Passwords match:', isValid);

    if (!isValid) {
      console.log('❌ Password mismatch!');
      return null;
    }

    console.log('✅ Authentication successful!');

    // Update last login
    await updateLastLogin(user.id);

    return {
      id: user.id,
      email: user.email,
      created_at: user.created_at?.toISOString() || null,
      last_login: user.last_login?.toISOString() || null,
    };
  } catch (error) {
    console.error('❌ Authentication error:', error);
    console.error('Error in authenticateAdminUser:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      email: email,
      timestamp: new Date().toISOString(),
    });
    throw error; // Re-throw to be caught by the calling function
  }
}
