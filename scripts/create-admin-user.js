const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    const email = process.argv[2] || 'admin@neba.com';
    const password = process.argv[3] || 'admin123';

    console.log(`Creating admin user with email: ${email}`);

    // Check if user already exists
    const existingUser = await prisma.admin_user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('User already exists!');
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.admin_user.create({
      data: {
        email,
        password_hash: passwordHash,
      },
    });

    console.log('Admin user created successfully!');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Created at:', user.created_at);
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();

