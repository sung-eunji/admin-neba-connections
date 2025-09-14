import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

export interface JsonAdminUser {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
  last_login: string | null;
}

const ADMIN_USERS_FILE = path.join(process.cwd(), 'data', 'admin-users.json');

// Ensure data directory exists
function ensureDataDirectory() {
  const dataDir = path.dirname(ADMIN_USERS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Read admin users from JSON file
function readAdminUsers(): JsonAdminUser[] {
  try {
    ensureDataDirectory();
    if (!fs.existsSync(ADMIN_USERS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(ADMIN_USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading admin users:', error);
    return [];
  }
}

// Write admin users to JSON file
function writeAdminUsers(users: JsonAdminUser[]): void {
  try {
    ensureDataDirectory();
    fs.writeFileSync(ADMIN_USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error writing admin users:', error);
  }
}

// Initialize default admin user if file doesn't exist
function initializeDefaultAdmin(): void {
  const users = readAdminUsers();
  if (users.length === 0) {
    const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const hashedPassword = bcrypt.hashSync(defaultPassword, 10);
    
    const defaultAdmin: JsonAdminUser = {
      id: 'admin-001',
      email: process.env.ADMIN_EMAIL || 'admin@neba.com',
      password_hash: hashedPassword,
      created_at: new Date().toISOString(),
      last_login: null,
    };
    
    writeAdminUsers([defaultAdmin]);
    console.log('✅ Default admin user created');
  }
}

// Authenticate admin user using JSON file
export async function authenticateJsonAdmin(
  email: string,
  password: string
): Promise<JsonAdminUser | null> {
  try {
    console.log('🔍 JSON auth attempt for email:', email);
    
    // Initialize default admin if needed
    initializeDefaultAdmin();
    
    const users = readAdminUsers();
    const user = users.find(u => u.email === email);
    
    if (!user) {
      console.log('❌ User not found');
      return null;
    }
    
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isValid) {
      console.log('❌ Password mismatch');
      return null;
    }
    
    // Update last login
    user.last_login = new Date().toISOString();
    writeAdminUsers(users);
    
    console.log('✅ JSON authentication successful!');
    return user;
  } catch (error) {
    console.error('❌ JSON authentication error:', error);
    return null;
  }
}

// Get admin user by ID
export async function getJsonAdminById(id: string): Promise<JsonAdminUser | null> {
  try {
    const users = readAdminUsers();
    return users.find(u => u.id === id) || null;
  } catch (error) {
    console.error('Error getting admin user by ID:', error);
    return null;
  }
}

// Create new admin user
export async function createJsonAdmin(
  email: string,
  password: string
): Promise<JsonAdminUser> {
  const users = readAdminUsers();
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const newUser: JsonAdminUser = {
    id: `admin-${Date.now()}`,
    email,
    password_hash: hashedPassword,
    created_at: new Date().toISOString(),
    last_login: null,
  };
  
  users.push(newUser);
  writeAdminUsers(users);
  
  return newUser;
}
