import express from 'express';
import {
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectSelectorOptions,
  getProjectsByCompany,
  uploadProjectFile,
  getProjectFiles,
  downloadProjectFile,
  downloadProjectFilesZip,   // ✅ NEW
  deleteProjectFile,
  createProjectFolder,       // ✅ NEW
  getProjectFolders,         // ✅ NEW
  updateProjectProgress  // ✅ NEW: Import progress update function
} from '../controllers/projectController.js';
import { authenticateToken, authorizeRole } from '../middlewares/authMiddlewares.js';
import { updateProjectStatus } from '../controllers/projectController.js';
import { upload } from '../config/multerConfig.js';
import { prisma } from '../config/database.js';
import { validateProjectCreate, validateProjectUpdate } from '../middlewares/projectMiddleware.js';
 
 
const router = express.Router();

const setProjectIdParam = (req, res, next) => {
  req.params.id = req.params[0];
  return next();
};

const setProjectFileParams = (req, res, next) => {
  req.params.id = req.params[0];
  req.params.fileId = req.params[1];
  return next();
};
 
// ============================================
// CUSTOM MIDDLEWARE FOR PROJECT ACCESS
// ============================================
 
// Middleware to check if user has access to project (Admin or Assigned Engineer)
const checkProjectAccess = async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id);
    const fileId = req.params.fileId; // May be undefined for non-file routes
    const userId = req.user.id;
    const userRole = req.user.role;
    const companyId = req.user.companyId;
 
    console.log('========================================');
    console.log('🔐 CHECK PROJECT ACCESS MIDDLEWARE');
    console.log('Route:', req.method, req.originalUrl);
    console.log('Project ID:', projectId);
    if (fileId) console.log('File ID:', fileId);
    console.log('User ID:', userId);
    console.log('User Role:', userRole);
    console.log('Company ID:', companyId);
    console.log('========================================');
 
    // ✅ ADMINS: Have access to ALL projects in their company
    if (userRole === 'ADMIN') {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          companyId: companyId
        }
      });
 
      if (!project) {
        console.log('❌ Project not found or not in admin\'s company');
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }
 
      console.log('✅ Admin access granted to project');
      return next();
    }
 
    // ✅ ENGINEERS: Only have access to ASSIGNED projects
    if (userRole === 'SITE_ENGINEER') {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          companyId: companyId
        }
      });
 
      if (!project) {
        console.log('❌ Project not found');
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }
 
      // Check if engineer is assigned to this project
      let hasAccess = false;
 
      // Method 1: Check via assignedEngineerId field
      if (project.assignedEngineerId === userId) {
        hasAccess = true;
        console.log('✅ Engineer access granted (assigned via assignedEngineerId)');
      }
 
      // Method 2: Check via many-to-many relation (if you have it)
      if (!hasAccess) {
        try {
          const projectWithEngineer = await prisma.project.findFirst({
            where: {
              id: projectId,
              companyId: companyId,
              engineers: {
                some: {
                  id: userId
                }
              }
            }
          });
 
          if (projectWithEngineer) {
            hasAccess = true;
            console.log('✅ Engineer access granted (assigned via engineers relation)');
          }
        } catch (error) {
          console.log('Many-to-many check skipped (relation may not exist)');
        }
      }
 
      if (hasAccess) {
        return next();
      }
 
      console.log('❌ Engineer not assigned to this project');
      return res.status(403).json({
        success: false,
        error: 'Access denied. You are not assigned to this project.'
      });
    }
 
    // Unknown user role
    console.log('❌ Unknown user role:', userRole);
    return res.status(403).json({
      success: false,
      error: 'Invalid user role'
    });
 
  } catch (error) {
    console.error('💥 Error checking project access:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify project access',
      details: error.message
    });
  }
};
 
// ============================================
// ROUTES
// ============================================
 
// All routes require authentication
router.use(authenticateToken);
 
// Create new project (Admin only)
router.post('/', authorizeRole('Admin'), createProject);
 
// Get lightweight project options without financial enrichment
router.get('/selector', getProjectSelectorOptions);

// Get all projects for user's company
router.get('/', getProjectsByCompany);
 
// Get single project by ID
router.get(/^\/(\d+)$/, setProjectIdParam, getProjectById);
 
// Update project (Admin only)
router.put(/^\/(\d+)$/, setProjectIdParam, authorizeRole('Admin'), updateProject);

router.patch(/^\/(\d+)\/status$/, setProjectIdParam, authorizeRole('Admin'), updateProjectStatus);
 
// ✅ NEW: Update project progress
// Admin: Can update any project progress
// Site Engineer: Can ONLY update assigned project progress
router.patch(/^\/(\d+)\/progress$/, setProjectIdParam, checkProjectAccess, updateProjectProgress);
 
// Delete project (Admin only)
router.delete(/^\/(\d+)$/, setProjectIdParam, authorizeRole('Admin'), deleteProject);
 
// ============================================
// FILE ROUTES - Admin: All Projects | Engineer: Assigned Projects Only
// ============================================
 
// Upload file - Admin (any project) or Assigned Engineer (only assigned projects)
// (accepts an optional `folderId` field in the form body to file it into a folder)
router.post(/^\/(\d+)\/files$/, setProjectIdParam, checkProjectAccess, upload.single('file'), uploadProjectFile);
 
// Get project files - Admin (any project) or Assigned Engineer (only assigned projects)
router.get(/^\/(\d+)\/files$/, setProjectIdParam, checkProjectAccess, getProjectFiles);
 
// Download file - Admin (any project) or Assigned Engineer (only assigned projects)
router.get(/^\/(\d+)\/files\/([^/]+)\/download$/, setProjectFileParams, checkProjectAccess, downloadProjectFile);
 
// ✅ NEW: Download multiple selected files as a single zip
// Body: { fileIds: [1, 2, 3] }
router.post(/^\/(\d+)\/files\/download-zip$/, setProjectIdParam, checkProjectAccess, downloadProjectFilesZip);
 
// Delete file - Admin (any project) or Assigned Engineer (only assigned projects)
router.delete(/^\/(\d+)\/files\/([^/]+)$/, setProjectFileParams, checkProjectAccess, deleteProjectFile);
 
// ============================================
// FOLDER ROUTES - Admin: All Projects | Engineer: Assigned Projects Only
// ============================================
 
// ✅ NEW: Create a folder inside a project
router.post(/^\/(\d+)\/folders$/, setProjectIdParam, checkProjectAccess, createProjectFolder);
 
// ✅ NEW: List folders for a project (includes file count per folder)
router.get(/^\/(\d+)\/folders$/, setProjectIdParam, checkProjectAccess, getProjectFolders);
 
 
router.post('/', authorizeRole('Admin'), validateProjectCreate, createProject);
router.put(/^\/(\d+)$/, setProjectIdParam, authorizeRole('Admin'), validateProjectUpdate, updateProject);
 
export default router;
 















