import express from 'express';
import { prisma } from '../config/database.js';

const router = express.Router();

// Test database connection
router.get('/db-test', async (req, res) => {
  try {
    // Try to query the database
    await prisma.$connect();
    const userCount = await prisma.user.count();
    
    res.status(200).json({ 
      success: true,
      message: 'Database connected successfully!',
      userCount: userCount,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Database connection failed',
      error: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
});

export default router;
