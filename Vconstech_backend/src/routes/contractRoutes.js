// src/routes/contractRoutes.js
import express from 'express';
import { 
  getAllContracts, 
  getContractById, 
  createContract, 
  updateContract, 
  deleteContract,
  getContractDashboardSummary,
  getContractsByProject 
} from '../controllers/contractController.js';
import { authenticateToken } from '../middlewares/authMiddlewares.js';

const router = express.Router();

const continueOnlyForNumericId = (req, res, next) => {
  if (/^\d+$/.test(req.params.id)) {
    return next();
  }

  return next('route');
};

// All routes require authentication
router.use(authenticateToken);

// GET dashboard contract summary for the user's company
router.get('/dashboard-summary', getContractDashboardSummary);

// GET all contracts for the user's company
router.get('/', getAllContracts);

// GET contracts by project ID
router.get('/project/:projectId', getContractsByProject);

// GET single contract by ID
router.get('/:id', continueOnlyForNumericId, getContractById);

// POST create new contract
router.post(
  '/',
  createContract
);

// PUT update contract (especially payment updates)

router.put(
  '/:id',
  continueOnlyForNumericId,
  updateContract
);

// DELETE contract
router.delete(
  '/:id',
  continueOnlyForNumericId,
  deleteContract
);

export default router;
