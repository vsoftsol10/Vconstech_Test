import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔍 Checking database connection...');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Check if company exists or create one
    let company = await prisma.company.findFirst({
      where: { name: 'Test Company' }
    });

    if (!company) {
      console.log('📦 Creating test company...');
      company = await prisma.company.create({
        data: { name: 'Test Company' }
      });
      console.log('✅ Company created:', company);
    } else {
      console.log('✅ Company already exists:', company);
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('SmartVarun9895', salt);
    console.log('✅ Password hashed');

    // Create user
    console.log('👤 Creating user...');
    const user = await prisma.user.create({
      data: {
        name: 'Banu',
        email: 'banu@gmail.com',
        password: hashedPassword,
        role: 'Admin',
        companyId: company.id
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyId: true,
        company: {
          select: {
            name: true
          }
        }
      }
    });

    console.log('✅ User created successfully:');
    console.log(JSON.stringify(user, null, 2));

    // Verify user exists
    const verifyUser = await prisma.user.findUnique({
      where: { email: 'banu@gmail.com' }
    });

    console.log('\n✅ Verification - User exists in database:', !!verifyUser);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
