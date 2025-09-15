import bcrypt from 'bcryptjs';

export interface HybridAdminUser {
  id: bigint | string;
  email: string;
  created_at: string;
  last_login: string | null;
}

// Try to use Prisma, fallback to simple auth if it fails
export async function authenticateHybridAdmin(
  email: string,
  password: string
): Promise<HybridAdminUser | null> {
  try {
    console.log('🔍 Hybrid auth attempt for email:', email);
    console.log('🔍 Environment variables:', {
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
      ADMIN_EMAIL: process.env.ADMIN_EMAIL ? 'Set' : 'Not set',
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ? 'Set' : 'Not set',
    });
    
    // First, try to use Prisma (database)
    try {
      console.log('🔄 Attempting PostgreSQL authentication...');
      const { authenticateAdminUser } = await import('./admin-users');
      const user = await authenticateAdminUser(email, password);
      if (user) {
        console.log('✅ Database authentication successful!');
        return {
          id: user.id,
          email: user.email,
          created_at: user.created_at || new Date().toISOString(),
          last_login: user.last_login,
        };
      } else {
        console.log('❌ Database authentication failed - user not found or invalid password');
      }
    } catch (prismaError) {
      console.log('⚠️ Prisma authentication failed, trying fallback:', prismaError);
    }
    
    // Fallback to environment variables or hardcoded credentials
    console.log('🔄 Falling back to environment variable authentication');
    
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@neba.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    
    console.log('🔍 Fallback credentials check:', {
      expectedEmail: adminEmail,
      inputEmail: email,
      hasPassword: !!adminPassword,
      hasPasswordHash: !!adminPasswordHash,
    });
    
    if (!adminEmail || (!adminPassword && !adminPasswordHash)) {
      console.error('❌ No fallback credentials configured');
      return null;
    }
    
    if (email !== adminEmail) {
      console.log('❌ Email mismatch in fallback:', { expected: adminEmail, received: email });
      return null;
    }
    
    let isValid = false;
    
    if (adminPasswordHash) {
      console.log('🔄 Using bcrypt password hash comparison');
      isValid = await bcrypt.compare(password, adminPasswordHash);
    } else if (adminPassword) {
      console.log('🔄 Using plain text password comparison');
      isValid = password === adminPassword;
    }
    
    console.log('🔍 Password validation result:', isValid);
    
    if (!isValid) {
      console.log('❌ Password mismatch in fallback');
      return null;
    }
    
    console.log('✅ Fallback authentication successful!');
    
    return {
      id: 'fallback-admin',
      email: adminEmail,
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Hybrid authentication error:', error);
    return null;
  }
}

// Get admin user by ID with fallback
export async function getHybridAdminById(id: bigint | string): Promise<HybridAdminUser | null> {
  try {
    // Try Prisma first
    try {
      const { getAdminUserById } = await import('./admin-users');
      const user = await getAdminUserById(typeof id === 'string' ? BigInt(id) : id);
      if (user) {
        return {
          id: user.id,
          email: user.email,
          created_at: user.created_at || new Date().toISOString(),
          last_login: user.last_login,
        };
      }
    } catch {
      console.log('⚠️ Prisma getAdminUserById failed, trying fallback');
    }
    
    // Fallback for fallback-admin ID
    if (id === 'fallback-admin') {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@neba.com';
      
      return {
        id: 'fallback-admin',
        email: adminEmail,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error in getHybridAdminById:', error);
    return null;
  }
}
