import bcrypt from 'bcryptjs';

export interface SimpleAdminUser {
  id: string;
  email: string;
  created_at: string;
  last_login: string | null;
}

// Simple authentication without database
export async function authenticateSimpleAdmin(
  email: string,
  password: string
): Promise<SimpleAdminUser | null> {
  try {
    console.log('🔍 Simple auth attempt for email:', email);

    // Get admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!adminEmail || (!adminPassword && !adminPasswordHash)) {
      console.error('❌ Admin credentials not configured in environment variables');
      return null;
    }

    // Check email
    if (email !== adminEmail) {
      console.log('❌ Email mismatch');
      return null;
    }

    // Check password
    let isValid = false;
    
    if (adminPasswordHash) {
      // Use bcrypt if hash is provided
      isValid = await bcrypt.compare(password, adminPasswordHash);
    } else if (adminPassword) {
      // Use plain text comparison if no hash is provided
      isValid = password === adminPassword;
    }

    if (!isValid) {
      console.log('❌ Password mismatch');
      return null;
    }

    console.log('✅ Simple authentication successful!');

    return {
      id: 'admin-001',
      email: adminEmail,
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Simple authentication error:', error);
    return null;
  }
}

// Get admin user by ID (for session validation)
export async function getSimpleAdminById(id: string): Promise<SimpleAdminUser | null> {
  if (id !== 'admin-001') {
    return null;
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    return null;
  }

  return {
    id: 'admin-001',
    email: adminEmail,
    created_at: new Date().toISOString(),
    last_login: new Date().toISOString(),
  };
}
