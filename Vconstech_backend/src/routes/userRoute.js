import express from 'express';
import { 
  getEmployees, 
  getAllUsers,
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
  uploadCompanyLogo,
  getSelectedTemplate,
  updateSelectedTemplate
} from '../controllers/userController.js';
import { authenticateToken, authenticatePasswordChangeToken, authorizeRole } from '../middlewares/authMiddlewares.js';
import { uploadLogo } from '../config/multerConfig.js';

const router = express.Router();

// Restricted temporary-password tokens are accepted only here.
router.put('/forced-change-password', authenticatePasswordChangeToken, changeUserPassword);
// All remaining routes require a normal session token.
router.use(authenticateToken);
// Profile routes
router.get('/profile/:userId', getUserProfile);
router.put('/profile/:userId', updateUserProfile);
router.put('/change-password/:userId', changeUserPassword);
router.get('/document-template', getSelectedTemplate);
router.put('/document-template', updateSelectedTemplate);

// Logo upload route (Admin only)
router.post('/upload-logo/:userId', uploadLogo.single('logo'), uploadCompanyLogo);

// Employee routes
router.get('/employees', getEmployees);

// User routes (Admin only)
router.get('/', authorizeRole('Admin'), getAllUsers);

export default router;
