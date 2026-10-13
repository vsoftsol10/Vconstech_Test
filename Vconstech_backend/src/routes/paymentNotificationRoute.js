import express from 'express';
import { prisma } from '../config/database.js';
import { authenticateToken } from '../middlewares/authMiddlewares.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/payment-notifications — get all payment notifications (SuperAdmin)
router.get('/', async (req, res) => {
  try {
    const notifications = await prisma.paymentNotification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.paymentNotification.count({
      where: { isRead: false },
    });

    res.json({ success: true, notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/payment-notifications/:id/read — mark one as read
router.put('/:id/read', async (req, res) => {
  try {
    await prisma.paymentNotification.update({
      where: { id: parseInt(req.params.id) },
      data:  { isRead: true },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/payment-notifications/read-all — mark all as read
router.put('/read-all', async (req, res) => {
  try {
    const result = await prisma.paymentNotification.updateMany({
      where: { isRead: false },
      data:  { isRead: true },
    });
    res.json({ success: true, count: result.count });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
