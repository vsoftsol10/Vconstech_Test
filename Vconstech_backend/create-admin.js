import { PrismaClient } from '@prisma/client';
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const salt = await bcrypt.genSaltSync(10);
    const hashedPassword = await bcrypt.hashSync('admin123', salt);
    
    // First, create or get company
    let company = await prisma.company.findFirst({
      where: { name: 'Test Company' }
    });
    
    if (!company) {
      company = await prisma.company.create({
        data: { name: 'Test Company' }
      });
    }
    
    // Create admin user
    const user = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@vconsatech.com',
        password: hashedPassword,
        role: 'Admin',
        companyId: company.id
      }
    });
    
    console.log('Admin user created successfully:', user);
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
