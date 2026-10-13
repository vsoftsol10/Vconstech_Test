// scripts/updateNotifications.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateExistingNotifications() {
  try {
    // Set all existing notifications to ENGINEER role
    await prisma.notification.updateMany({
      where: {
        recipientRole: null
      },
      data: {
        recipientRole: 'ENGINEER'
      }
    });

    console.log('✅ All existing notifications updated');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateExistingNotifications();