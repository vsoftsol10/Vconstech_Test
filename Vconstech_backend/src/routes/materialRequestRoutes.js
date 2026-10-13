import express from 'express';
import {
  getAllRequests,
  getMyRequests,
  getPendingRequests,
  createMaterialRequest,
  approveMaterialRequest,
  rejectMaterialRequest,
  updateMaterialRequest,
  addAdminComment,          // ← ADD THIS IMPORT
} from '../controllers/materialRequestController.js';
import { authenticateToken, authorizeRole } from '../middlewares/authMiddlewares.js';
import { uploadMaterialFiles } from '../config/multerConfig.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/my-requests', getMyRequests);
router.get('/pending', authorizeRole('Admin'), getPendingRequests);
router.get('/', authorizeRole('Admin'), getAllRequests);
router.post('/', uploadMaterialFiles.array('files', 5), createMaterialRequest);

// ✅ Specific sub-routes FIRST
router.put('/:id/approve', authorizeRole('Admin'), approveMaterialRequest);
router.put('/:id/reject', authorizeRole('Admin'), rejectMaterialRequest);
router.put('/:id/comment', authorizeRole('Admin'), addAdminComment);

// ✅ Generic /:id route LAST
router.put('/:id', uploadMaterialFiles.array('files', 5), updateMaterialRequest);

export default router;