export interface HardcodedAdminUser {
  id: string;
  email: string;
  created_at: string;
  last_login: string | null;
}

// Hardcoded admin credentials (no database needed)
const HARDCODED_ADMIN = {
  email: 'admin@neba.com',
  password: 'admin123',
  id: 'hardcoded-admin',
};

// Simple authentication with hardcoded credentials
export async function authenticateHardcodedAdmin(
  email: string,
  password: string
): Promise<HardcodedAdminUser | null> {
  try {
    console.log('🔍 Hardcoded auth attempt for email:', email);
    
    // Check credentials
    if (email === HARDCODED_ADMIN.email && password === HARDCODED_ADMIN.password) {
      console.log('✅ Hardcoded authentication successful!');
      
      return {
        id: HARDCODED_ADMIN.id,
        email: HARDCODED_ADMIN.email,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
      };
    }
    
    console.log('❌ Invalid credentials');
    return null;
  } catch (error) {
    console.error('❌ Hardcoded authentication error:', error);
    return null;
  }
}

// Get admin user by ID
export async function getHardcodedAdminById(id: string): Promise<HardcodedAdminUser | null> {
  if (id === HARDCODED_ADMIN.id) {
    return {
      id: HARDCODED_ADMIN.id,
      email: HARDCODED_ADMIN.email,
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
    };
  }
  return null;
}
