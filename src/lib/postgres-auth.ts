import bcrypt from 'bcryptjs';
import { query, queryOne } from './postgres';

export interface PostgresAdminUser {
  id: string;
  email: string;
  created_at: string;
  last_login: string | null;
}

// Authenticate admin user using direct PostgreSQL queries
export async function authenticatePostgresAdmin(
  email: string,
  password: string
): Promise<PostgresAdminUser | null> {
  try {
    console.log('🔍 PostgreSQL auth attempt for email:', email);
    
    // Get user from database
    const user = await queryOne<{
      id: string;
      email: string;
      password_hash: string;
      created_at: Date;
      last_login: Date | null;
    }>(
      'SELECT id, email, password_hash, created_at, last_login FROM admin_user WHERE email = $1',
      [email]
    );
    
    if (!user) {
      console.log('❌ User not found');
      return null;
    }
    
    // Check password
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isValid) {
      console.log('❌ Password mismatch');
      return null;
    }
    
    // Update last login
    await query(
      'UPDATE admin_user SET last_login = NOW() WHERE id = $1',
      [user.id]
    );
    
    console.log('✅ PostgreSQL authentication successful!');
    
    return {
      id: user.id,
      email: user.email,
      created_at: user.created_at.toISOString(),
      last_login: user.last_login?.toISOString() || null,
    };
  } catch (error) {
    console.error('❌ PostgreSQL authentication error:', error);
    return null;
  }
}

// Get admin user by ID
export async function getPostgresAdminById(id: string): Promise<PostgresAdminUser | null> {
  try {
    const user = await queryOne<{
      id: string;
      email: string;
      created_at: Date;
      last_login: Date | null;
    }>(
      'SELECT id, email, created_at, last_login FROM admin_user WHERE id = $1',
      [id]
    );
    
    if (!user) return null;
    
    return {
      id: user.id,
      email: user.email,
      created_at: user.created_at.toISOString(),
      last_login: user.last_login?.toISOString() || null,
    };
  } catch (error) {
    console.error('Error getting admin user by ID:', error);
    return null;
  }
}

// Create admin user
export async function createPostgresAdmin(
  email: string,
  password: string
): Promise<PostgresAdminUser> {
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = await queryOne<{
    id: string;
    email: string;
    created_at: Date;
    last_login: Date | null;
  }>(
    `INSERT INTO admin_user (email, password_hash) 
     VALUES ($1, $2) 
     RETURNING id, email, created_at, last_login`,
    [email, hashedPassword]
  );
  
  return {
    id: user!.id,
    email: user!.email,
    created_at: user!.created_at.toISOString(),
    last_login: user!.last_login?.toISOString() || null,
  };
}
