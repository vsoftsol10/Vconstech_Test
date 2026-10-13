import express from 'express';
import {
  createBill,
  getAllBills,
  getBillById,
  updateBill,
  deleteBill,
  getBillsByProject,
  updateBillStatus
} from '../controllers/billingController.js';
import { authenticateToken } from '../middlewares/authMiddlewares.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Create a new bill
router.post('/', createBill);

// Get all bills for the company
router.get('/', getAllBills);

// Get a specific bill by ID
router.get('/:id', getBillById);

// Get bills by project ID
router.get('/project/:projectId', getBillsByProject);

// Update a bill
router.put('/:id', updateBill);

// Update bill status only
router.patch('/:id', updateBillStatus);

// Delete a bill
router.delete('/:id', deleteBill);

export default router;