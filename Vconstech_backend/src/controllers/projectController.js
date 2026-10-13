// src/controllers/projectController.js
import { prisma } from '../config/database.js';
import BudgetCalculationService from '../services/BudgetCalculationService.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import archiver from 'archiver';
import { createNotification } from '../utils/generateId.js';
import { isProjectExecutionEnabled } from '../utils/projectStatus.js';
 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const attachBudgetSummary = async (project) => {
  if (!project) return project;

  const budgetSummary = await BudgetCalculationService.calculateProjectFinancials(project.id, {
    companyId: project.companyId,
  });

  return {
    ...project,
    totalBudget: budgetSummary.totalBudget,
    materialCost: budgetSummary.materialCost,
    labourCost: budgetSummary.labourCost,
    contractCost: budgetSummary.contractCost,
    expenseCost: budgetSummary.expenseCost,
    totalSpent: budgetSummary.totalSpent,
    remainingBudget: budgetSummary.remainingBudget,
    spent: budgetSummary.totalSpent,
    spentBreakdown: budgetSummary.breakdown,
    budgetSummary,
  };
};

const attachBudgetSummaries = async (projects = [], companyId) => {
  const budgetSummaries = await BudgetCalculationService.calculateProjectsFinancials(projects, {
    companyId,
  });

  return projects.map((project) => {
    const budgetSummary = budgetSummaries.get(project.id);
    if (!budgetSummary) return project;

    return {
      ...project,
      totalBudget: budgetSummary.totalBudget,
      materialCost: budgetSummary.materialCost,
      labourCost: budgetSummary.labourCost,
      contractCost: budgetSummary.contractCost,
      expenseCost: budgetSummary.expenseCost,
      totalSpent: budgetSummary.totalSpent,
      remainingBudget: budgetSummary.remainingBudget,
      spent: budgetSummary.totalSpent,
      spentBreakdown: budgetSummary.breakdown,
      budgetSummary,
    };
  });
};
 
export const createProject = async (req, res) => {
  try {
    const {
      projectId,
      name,
      clientName,
      projectType,
      budget,
      description,
      startDate,
      endDate,
      location,
      assignedUserId
    } = req.body;
 
    console.log('========================================');
    console.log('📥 CREATE PROJECT REQUEST');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('User:', req.user);
    console.log('========================================');
 
    // Validation
    if (!name || !clientName) {
  return res.status(400).json({
    error: 'Project name and client name are required'
  });
}
 
 
    if (!location) {
      console.log('❌ Validation failed: Missing location');
      return res.status(400).json({
        error: 'Project location is required'
      });
    }
 
  
 
    // Check if project ID already exists
    const projectCount = await prisma.project.count({
  where: { companyId: req.user.companyId }
});
let generatedProjectId = `PRJ${String(projectCount + 1).padStart(3, '0')}`;
 
// Handle collision (e.g. if a project was deleted)
const existingProject = await prisma.project.findUnique({
  where: { projectId: generatedProjectId }
});
if (existingProject) {
  generatedProjectId = `PRJ${Date.now().toString().slice(-6)}`;
}
 
    // Verify assigned engineer exists and belongs to same company
    if (assignedUserId) {
  console.log('🔍 Verifying engineer:', assignedUserId);
  const assignedEngineer = await prisma.engineer.findFirst({
    where: {
      id: parseInt(assignedUserId),
      companyId: req.user.companyId
    }
  });
 
  if (!assignedEngineer) {
    console.log('❌ Engineer not found or wrong company');
    return res.status(400).json({
      error: 'Invalid Engineer selected or engineer does not belong to your company'
    });
  }
}
 
    // Get company ID from authenticated user
    const companyId = req.user.companyId;
    const accountOwner = await prisma.user.findFirst({
      where: { companyId, role: 'Admin' },
      select: { package: true, customProjectLimit: true }
    });

    if (accountOwner?.package === 'Advanced' && accountOwner.customProjectLimit) {
      const existingProjects = await prisma.project.count({ where: { companyId } });
      if (existingProjects >= accountOwner.customProjectLimit) {
        return res.status(400).json({
          error: `Cannot create more projects. Your Advanced package allows a maximum of ${accountOwner.customProjectLimit} projects.`
        });
      }
    }

    console.log('✅ All validations passed. Creating project...');
 
    // Create project with engineer assignment
    const project = await prisma.project.create({
      data: {
        projectId: generatedProjectId,
        name,
        clientName,
        projectType: projectType || 'Residential',
        budget: budget ? parseFloat(budget) : null,
        description,
        location,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: 'PENDING',
        actualProgress: 0, // ✅ Initialize with 0% progress
        companyId,
        assignedEngineerId: assignedUserId ? parseInt(assignedUserId) : null
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
          }
        },
        assignedEngineer: {
          select: {
            id: true,
            name: true,
            empId: true,
            phone: true,
            alternatePhone: true
          }
        }
      }
    });
 
    console.log('✅✅✅ PROJECT CREATED SUCCESSFULLY ✅✅✅');
    console.log('Project DB ID:', project.id);
    console.log('Project ID:', project.projectId);
    console.log('========================================');
 
    if (project.assignedEngineerId) {
      await createNotification(
        project.assignedEngineerId,
        `You have been assigned to Project: ${project.name}.`,
        'INFO',
        'ENGINEER',
        null,
        project.id
      );
    }

    res.status(201).json({
      message: 'Project created successfully',
      project
    });
 
  } catch (error) {
    console.error('💥💥💥 CREATE PROJECT ERROR 💥💥💥');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    console.error('========================================');
 
    res.status(500).json({
      error: 'Failed to create project',
      details: error.message
    });
  }
};

export const getProjectSelectorOptions = async (req, res) => {
  try {
    let companyId = req.user?.companyId;

    if (!companyId && req.user?.userId) {
      const user = await prisma.user.findUnique({
        where: { id: String(req.user.userId) },
        select: { companyId: true }
      });
      companyId = user?.companyId;
    }

    if (!companyId) {
      return res.status(400).json({
        error: 'Company ID not found'
      });
    }

    const projects = await prisma.project.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        projectId: true,
        status: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      count: projects.length,
      projects: projects.map((project) => ({
        id: project.id,
        name: project.name,
        projectName: project.name,
        projectId: project.projectId,
        status: project.status
      }))
    });
  } catch (error) {
    console.error('Get project selector options error:', error);
    res.status(500).json({
      error: 'Failed to fetch project selector options',
      details: error.message
    });
  }
};
 
export const getProjectsByCompany = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { status, projectType } = req.query;
 
    console.log('=== Get Projects By Company ===');
    console.log('Company ID:', companyId);
    console.log('Filters - Status:', status, 'Type:', projectType);
 
    const whereClause = { companyId };
 
    if (status) {
      whereClause.status = status;
    }
 
    if (projectType) {
      whereClause.projectType = projectType;
    }
 
    console.log('Where clause:', JSON.stringify(whereClause, null, 2));
 
    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        assignedEngineer: {
          select: {
            id: true,
            name: true,
            empId: true,
            phone: true,
            alternatePhone: true
          }
        },
        _count: {
          select: {
            materialUsages: true,
            contracts: true,
            finances: true,
            files: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const projectsWithBudgetSummary = await attachBudgetSummaries(projects, companyId);

    console.log('Projects found:', projects.length);
    console.log('Project IDs:', projects.map(p => ({ id: p.id, projectId: p.projectId, name: p.name })));

    res.json({
      count: projectsWithBudgetSummary.length,
      projects: projectsWithBudgetSummary
    });
 
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      error: 'Failed to fetch projects',
      details: error.message
    });
  }
};
 
// Get single project by ID
export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
 
    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(id),
        companyId
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
          }
        },
        assignedEngineer: {
          select: {
            id: true,
            name: true,
            empId: true,
            phone: true,
            alternatePhone: true,
            address: true
          }
        },
        materialUsages: {
          include: {
            material: true,
            engineer: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            date: 'desc'
          }
        },
        projectMaterials: {
          include: {
            material: true,
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        expenses: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        contracts: true,
        finances: {
          orderBy: {
            date: 'desc'
          }
        },
        files: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            uploadedAt: 'desc'
          }
        }
      }
    });
 
    if (!project) {
      return res.status(404).json({
        error: 'Project not found'
      });
    }
 
    const projectWithBudgetSummary = await attachBudgetSummary({
      ...project,
      // Preserve the legacy response key while querying the schema's actual
      // `materialUsages` relation.
      materialUsed: project.materialUsages,
    });

    res.json({ project: projectWithBudgetSummary });
 
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      error: 'Failed to fetch project',
      details: error.message
    });
  }
};
 
// Update project
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const {
      name, clientName, projectType, budget, quotationAmount,
      description, startDate, endDate, location, status,
      assignedUserId, actualProgress
    } = req.body;
 
    console.log('Updating project with data:', req.body);
 
    const existingProject = await prisma.project.findFirst({
      where: { id: parseInt(id), companyId }
    });
 
    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }
 
    if (assignedUserId) {
      const assignedEngineer = await prisma.engineer.findFirst({
        where: { id: parseInt(assignedUserId), companyId: req.user.companyId }
      });
      if (!assignedEngineer) {
        return res.status(400).json({
          error: 'Invalid Engineer selected or engineer does not belong to your company'
        });
      }
    }
 
    // ✅ Declare updateData FIRST, then populate it
    const updateData = {};
 
    if (name !== undefined) updateData.name = name;
    if (clientName !== undefined) updateData.clientName = clientName;
    if (projectType !== undefined) updateData.projectType = projectType;
    if (budget !== undefined) updateData.budget = budget ? parseFloat(budget) : null;
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (status !== undefined) updateData.status = status;
    if (assignedUserId !== undefined) {
      updateData.assignedEngineerId = assignedUserId ? parseInt(assignedUserId) : null;
    }
 
    // ✅ Now these work because updateData exists
    if (actualProgress !== undefined) {
      const progress = parseInt(actualProgress);
      if (!isNaN(progress) && progress >= 0 && progress <= 100) {
        updateData.actualProgress = progress;
      }
    }
 
    if (quotationAmount !== undefined) {
      updateData.quotationAmount = quotationAmount ? parseFloat(quotationAmount) : null;
    }
 
    const updatedProject = await prisma.project.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        assignedEngineer: {
          select: { id: true, name: true, empId: true, phone: true, alternatePhone: true }
        }
      }
    });

    if (
      updatedProject.assignedEngineerId &&
      updatedProject.assignedEngineerId !== existingProject.assignedEngineerId
    ) {
      await createNotification(
        updatedProject.assignedEngineerId,
        `You have been assigned to Project: ${updatedProject.name}.`,
        'INFO',
        'ENGINEER',
        null,
        updatedProject.id
      );
    }
 
    console.log('Project updated successfully:', updatedProject);
    res.json({ message: 'Project updated successfully', project: updatedProject });
 
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project', details: error.message });
  }
};
 
// ✅ NEW: Update project progress with role-based authorization
export const updateProjectStatus = async (req, res) => {
  try {
    const projectId = Number.parseInt(req.params.id, 10);
    const companyId = req.user.companyId;
    const { status } = req.body;
    const validStatuses = ['PENDING', 'ONGOING', 'ON_HOLD', 'COMPLETED'];

    if (!Number.isInteger(projectId) || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid project status' });
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, companyId },
      select: { id: true },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const updatedProject = await prisma.project.update({
      where: { id: project.id },
      data: { status },
      select: { id: true, projectId: true, status: true, actualProgress: true },
    });

    return res.json({ message: 'Project status updated successfully', project: updatedProject });
  } catch (error) {
    console.error('Update project status error:', error);
    return res.status(500).json({ error: 'Failed to update project status', details: error.message });
  }
};

export const updateProjectProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { actualProgress } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    const companyId = req.user.companyId;
 
    console.log('=== Update Project Progress ===');
    console.log('Project ID:', id);
    console.log('User ID:', userId);
    console.log('User Role:', userRole);
    console.log('Progress:', actualProgress);
 
    // Validate progress value
    if (actualProgress === undefined || actualProgress === null) {
      return res.status(400).json({
        error: 'Progress value is required'
      });
    }
 
    const progress = parseInt(actualProgress);
    if (isNaN(progress) || progress < 0 || progress > 100) {
      return res.status(400).json({
        error: 'Progress must be a number between 0 and 100'
      });
    }
 
    // Get project with company and engineer info
    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(id),
        companyId: companyId
      },
      include: {
        assignedEngineer: {
          select: {
            id: true,
            name: true,
            empId: true
          }
        }
      }
    });
 
    if (!project) {
      return res.status(404).json({
        error: 'Project not found'
      });
    }
 
    // ✅ AUTHORIZATION CHECK
    // Admin: Can update any project
    // Site Engineer: Can ONLY update assigned projects
    if (userRole === 'SITE_ENGINEER') {
      if (project.assignedEngineerId !== userId) {
        console.log('❌ Engineer not assigned to this project');
        return res.status(403).json({
          error: 'Access denied. You can only update progress for projects assigned to you.',
          assignedEngineer: project.assignedEngineer?.name || 'None',
          yourId: userId
        });
      }
      console.log('✅ Engineer is assigned to this project');
    } else if (userRole === 'ADMIN') {
      console.log('✅ Admin has access to all projects');
    } else {
      return res.status(403).json({
        error: 'Invalid user role'
      });
    }
 
    // Update the progress
    const updatedProject = await prisma.project.update({
      where: { id: parseInt(id) },
      data: { actualProgress: progress },
      include: {
        assignedEngineer: {
          select: {
            id: true,
            name: true,
            empId: true,
            phone: true,
            alternatePhone: true
          }
        }
      }
    });
 
    console.log('✅ Progress updated successfully:', updatedProject.actualProgress);
 
    res.json({
      success: true,
      message: 'Project progress updated successfully',
      project: updatedProject
    });
 
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({
      error: 'Failed to update project progress',
      details: error.message
    });
  }
};
 
// Delete project
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
 
    // Check if project exists and belongs to user's company
    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(id),
        companyId
      },
      include: {
        files: true
      }
    });
 
    if (!project) {
      return res.status(404).json({
        error: 'Project not found'
      });
    }
 
    // Delete associated files from filesystem
    if (project.files && project.files.length > 0) {
      project.files.forEach(file => {
        const filePath = path.join(__dirname, '../../', file.fileUrl);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            console.error('Error deleting file:', err);
          }
        }
      });
    }
 
    // Delete project (cascade will handle related records)
    await prisma.project.delete({
      where: { id: parseInt(id) }
    });
 
    res.json({
      message: 'Project deleted successfully'
    });
 
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      error: 'Failed to delete project',
      details: error.message
    });
  }
};
 
export const uploadProjectFile = async (req, res) => {
  try {
    console.log('=== FILE UPLOAD DEBUG ===');
    console.log('req.file:', req.file);
    console.log('req.body:', req.body);
    console.log('req.user:', {
      id: req.user.id,
      role: req.user.role,
      companyId: req.user.companyId,
      name: req.user.name,
      type: req.user.type
    });
    console.log('=======================');
 
    const { id } = req.params;
    const companyId = req.user.companyId;
    const userId = req.user.id;
    const userRole = req.user.role;
    const userType = req.user.type;
    // ✅ NEW: accept an optional folderId so an uploaded file can be placed inside a folder
    const { documentType, folderId } = req.body;
 
    // Verify project exists and belongs to company
    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(id),
        companyId
      }
    });
 
    if (!project) {
      if (req.file) {
        const filePath = path.join(__dirname, '../../uploads/project-files', req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
 
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
 
    // ✅ NEW: if a folderId was sent, verify that folder exists and belongs to this project
    let resolvedFolderId = null;
    if (folderId) {
      const folder = await prisma.folder.findFirst({
        where: { id: parseInt(folderId), projectId: parseInt(id) }
      });
      if (!folder) {
        const filePath = path.join(__dirname, '../../uploads/project-files', req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        return res.status(400).json({
          success: false,
          error: 'Invalid folder for this project'
        });
      }
      resolvedFolderId = folder.id;
    }
 
    const fileSize = req.file.size;
 
    const fileData = {
      projectId: parseInt(id),
      fileUrl: `/uploads/project-files/${req.file.filename}`,
      fileName: req.file.originalname,
      documentType: documentType || null,
      fileSize: fileSize,
      folderId: resolvedFolderId // ✅ NEW: null when no folder was specified
    };
 
    if (userType === 'engineer' || userRole === 'Site_Engineer') {
      fileData.uploadedByEngineerId = userId;
      console.log('👷 Engineer upload - ID:', userId);
    } else {
      fileData.uploadedBy = userId;
      console.log('👤 Admin upload - ID:', userId);
    }
 
    console.log('📝 Creating file with data:', fileData);
 
    const file = await prisma.file.create({
      data: fileData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        engineer: {
          select: {
            id: true,
            name: true,
            empId: true
          }
        },
        folder: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
 
    const uploaderName = file.user?.name || file.engineer?.name || 'Unknown';
 
    console.log('✅ File uploaded successfully');
    console.log('📄 File details:', {
      id: file.id,
      fileName: file.fileName,
      documentType: file.documentType,
      folderId: file.folderId,
      uploadedBy: uploaderName,
      uploaderType: file.user ? 'Admin' : 'Engineer'
    });
 
    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      file
    });
 
  } catch (error) {
    console.error('💥 Upload file error:', error);
    console.error('Error stack:', error.stack);
 
    if (req.file) {
      const filePath = path.join(__dirname, '../../uploads/project-files', req.file.filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log('🗑️ Cleaned up uploaded file after error');
        } catch (cleanupError) {
          console.error('Error cleaning up file:', cleanupError);
        }
      }
    }
 
    res.status(500).json({
      success: false,
      error: 'Failed to upload file',
      details: error.message
    });
  }
};
 
export const getProjectFiles = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
 
    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(id),
        companyId
      }
    });
 
    if (!project) {
      return res.status(404).json({
        error: 'Project not found'
      });
    }
 
    const files = await prisma.file.findMany({
      where: {
        projectId: parseInt(id)
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        engineer: {
          select: {
            id: true,
            name: true,
            empId: true
          }
        },
        folder: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        uploadedAt: 'desc'
      }
    });
 
    const formattedFiles = files.map(file => ({
      ...file,
      uploaderName: file.user?.name || file.engineer?.name || 'Unknown',
      uploaderType: file.user ? 'Admin' : 'Engineer',
      uploaderRole: file.user?.role || 'Site_Engineer'
    }));
 
    res.json({
      count: formattedFiles.length,
      files: formattedFiles
    });
 
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({
      error: 'Failed to fetch files',
      details: error.message
    });
  }
};
 
// Download project file
export const downloadProjectFile = async (req, res) => {
  try {
    const { id, fileId } = req.params;
    const companyId = req.user.companyId;
 
    console.log('=== FILE DOWNLOAD REQUEST ===');
    console.log('Project ID (from URL):', id);
    console.log('File ID (from URL):', fileId);
    console.log('Company ID:', companyId);
    console.log('User:', req.user.name, '| Role:', req.user.role);
    console.log('=============================');
 
    // Verify project exists and belongs to company
    console.log('🔍 Step 1: Looking for project...');
    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(id),
        companyId
      }
    });
 
    if (!project) {
      console.error('❌ Project not found or access denied');
      console.error('   - Searched for project ID:', parseInt(id));
      console.error('   - In company ID:', companyId);
      return res.status(404).json({
        success: false,
        error: 'Project not found or you do not have access to this project'
      });
    }
 
    console.log('✅ Project found:', project.name);
 
    // Get file info
    console.log('🔍 Step 2: Looking for file...');
    const file = await prisma.file.findFirst({
      where: {
        id: parseInt(fileId),
        projectId: parseInt(id)
      }
    });
 
    if (!file) {
      console.error('❌ File not found in database');
      console.error('   - Searched for file ID:', parseInt(fileId));
      console.error('   - In project ID:', parseInt(id));
 
      // Debug: Check if file exists at all
      const fileExists = await prisma.file.findUnique({
        where: { id: parseInt(fileId) }
      });
 
      if (fileExists) {
        console.error('   - File exists but belongs to project:', fileExists.projectId);
      } else {
        console.error('   - File does not exist in database at all');
      }
 
      return res.status(404).json({
        success: false,
        error: 'File not found in this project'
      });
    }
 
    console.log('✅ File found in database:', file.fileName);
 
    // Construct file path
    const filePath = path.join(__dirname, '../../', file.fileUrl);
    console.log('🔍 Step 3: Checking filesystem...');
    console.log('   - File URL from DB:', file.fileUrl);
    console.log('   - Full file path:', filePath);
 
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error('❌ File not found on filesystem:', filePath);
      return res.status(404).json({
        success: false,
        error: 'File not found on server. The file may have been deleted.'
      });
    }
 
    console.log('✅ File exists on filesystem');
 
    // Set headers for file download
    console.log('📤 Step 4: Sending file to client...');
    res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
 
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
 
    fileStream.on('error', (streamError) => {
      console.error('❌ Error streaming file:', streamError);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Error streaming file',
          details: streamError.message
        });
      }
    });
 
    fileStream.pipe(res);
 
    console.log('✅ File download started successfully');
    console.log('=============================');
 
  } catch (error) {
    console.error('💥 Download file error:', error);
    console.error('Error stack:', error.stack);
 
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to download file',
        details: error.message
      });
    }
  }
};
 
// ✅ NEW: Download multiple selected files as one zip
export const downloadProjectFilesZip = async (req, res) => {
  try {
    const { id } = req.params;
    const { fileIds } = req.body;
    const companyId = req.user.companyId;
 
    console.log('=== ZIP DOWNLOAD REQUEST ===');
    console.log('Project ID:', id);
    console.log('File IDs:', fileIds);
    console.log('=============================');
 
    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'fileIds must be a non-empty array'
      });
    }
 
    // Verify project exists and belongs to company (same check as every other file route)
    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(id),
        companyId
      }
    });
 
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or you do not have access to this project'
      });
    }
 
    // Only fetch files that are (a) in the requested list AND (b) actually belong to this project —
    // prevents someone from smuggling in a fileId from a different project
    const files = await prisma.file.findMany({
      where: {
        id: { in: fileIds.map((fid) => parseInt(fid)) },
        projectId: parseInt(id)
      }
    });
 
    if (files.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'None of the requested files were found in this project'
      });
    }
 
    const zipFileName = `${project.name.replace(/[^a-z0-9]/gi, '_')}-files.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFileName}"`);
 
    const archive = archiver('zip', { zlib: { level: 9 } });
 
    archive.on('error', (archiveError) => {
      console.error('❌ Zip archive error:', archiveError);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Failed to create zip file',
          details: archiveError.message
        });
      }
    });
 
    // Stream the zip straight to the response as it's built — nothing is held in memory
    archive.pipe(res);
 
    const usedNames = new Set(); // avoid overwriting entries if two selected files share a name
    let skippedCount = 0;
 
    for (const file of files) {
      const filePath = path.join(__dirname, '../../', file.fileUrl);
 
      if (!fs.existsSync(filePath)) {
        console.warn('⚠️ Skipping missing file on disk:', filePath);
        skippedCount += 1;
        continue;
      }
 
      let entryName = file.fileName || path.basename(filePath);
      let finalName = entryName;
      let counter = 1;
      while (usedNames.has(finalName)) {
        const ext = path.extname(entryName);
        const base = path.basename(entryName, ext);
        finalName = `${base} (${counter})${ext}`;
        counter += 1;
      }
      usedNames.add(finalName);
 
      archive.file(filePath, { name: finalName });
    }
 
    if (skippedCount > 0) {
      console.warn(`⚠️ ${skippedCount} file(s) were missing on disk and skipped from the zip`);
    }
 
    console.log('✅ Streaming zip with', usedNames.size, 'file(s)');
    await archive.finalize();
 
  } catch (error) {
    console.error('💥 Zip download error:', error);
    console.error('Error stack:', error.stack);
 
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to download files as zip',
        details: error.message
      });
    }
  }
};
 
export const deleteProjectFile = async (req, res) => {
  try {
    const { id, fileId } = req.params;
    const companyId = req.user.companyId;
 
    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(id),
        companyId
      }
    });
 
    if (!project) {
      return res.status(404).json({
        error: 'Project not found'
      });
    }
 
    const file = await prisma.file.findFirst({
      where: {
        id: parseInt(fileId),
        projectId: parseInt(id)
      }
    });
 
    if (!file) {
      return res.status(404).json({
        error: 'File not found'
      });
    }
 
    const filePath = path.join(__dirname, '../../', file.fileUrl);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log('🗑️ File deleted from filesystem');
      } catch (err) {
        console.error('Error deleting file from filesystem:', err);
      }
    }
 
    await prisma.file.delete({
      where: { id: parseInt(fileId) }
    });
 
    console.log('✅ File deleted successfully from database');
 
    res.json({
      success: true,
      message: 'File deleted successfully'
    });
 
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      error: 'Failed to delete file',
      details: error.message
    });
  }
};
 
// ✅ NEW: Create a folder inside a project
export const createProjectFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const { name } = req.body;
 
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Folder name is required'
      });
    }
 
    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(id),
        companyId
      }
    });
 
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
 
    const folder = await prisma.folder.create({
      data: {
        name: name.trim(),
        projectId: parseInt(id)
      }
    });
 
    console.log('✅ Folder created:', folder.name, 'in project', id);
 
    res.status(201).json({
      success: true,
      message: 'Folder created successfully',
      folder
    });
 
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create folder',
      details: error.message
    });
  }
};
 
// ✅ NEW: List folders for a project (with file counts, for the folder cards/list)
export const getProjectFolders = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
 
    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(id),
        companyId
      }
    });
 
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
 
    const folders = await prisma.folder.findMany({
      where: {
        projectId: parseInt(id)
      },
      include: {
        _count: {
          select: { files: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
 
    res.json({
      count: folders.length,
      folders
    });
 
  } catch (error) {
    console.error('Get folders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch folders',
      details: error.message
    });
  }
};
 












