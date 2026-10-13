// src/routes/usageLogRoutes.js
import express from 'express';
import { 
  getUsageLogs,
  createUsageLog,
  updateUsageLog,
  deleteUsageLog
} from '../controllers/usageLogController.js';
import { authenticateToken, authorizeRole } from '../middlewares/authMiddlewares.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/usage-logs?projectId=1
router.get('/', getUsageLogs);

// POST /api/usage-logs (Employee can create)
// 🔔 WITH WEBSOCKET SUPPORT
router.post(
  '/',
  createUsageLog
);

// PUT /api/usage-logs/:id (Admin or creator)
// 🔔 WITH WEBSOCKET SUPPORT
router.put(
  '/:id',
  updateUsageLog
);

// DELETE /api/usage-logs/:id (Admin only)
// 🔔 WITH WEBSOCKET SUPPORT
router.delete(
  '/:id',
  authorizeRole('Admin'),
  deleteUsageLog
);

export default router;