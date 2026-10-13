import { prisma } from '../config/database.js';
import { generateRequestId, generateMaterialId, createNotification } from '../utils/generateId.js';

const resolveBackendUrl = () => process.env.BASE_URL || 'http://localhost:5001';

const formatRequestFiles = (files = []) => {
  const baseUrl = resolveBackendUrl();

  return (Array.isArray(files) ? files : []).map((file) => {
    let fileRecord = file;

    if (typeof file === 'string') {
      try {
        fileRecord = JSON.parse(file);
      } catch {
        fileRecord = { url: file };
      }
    }

    const rawUrl = fileRecord?.url || fileRecord?.fileUrl || '';
    const absoluteUrl = rawUrl.startsWith('http') ? rawUrl : `${baseUrl}${rawUrl}`;
    const storedName = rawUrl.split('/').pop();
    const fileName = fileRecord?.originalName || fileRecord?.name || fileRecord?.fileName || storedName;

    return {
      url: absoluteUrl,
      fileUrl: absoluteUrl,
      name: fileName,
      fileName,
      storedName,
      size: fileRecord?.size || null,
      mimeType: fileRecord?.mimeType || null,
    };
  });
};

const buildRequestFileRecords = (files = []) =>
  (Array.isArray(files) ? files : []).map((file) =>
    JSON.stringify({
      url: `/uploads/material-files/${file.filename}`,
      originalName: file.originalname,
      storedName: file.filename,
      size: file.size,
      mimeType: file.mimetype,
    })
  );

const normalizeQuantity = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return null;
  return Math.round((numericValue + Number.EPSILON) * 100) / 100;
};

export const getMyRequests = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        error: 'User ID not found in request'
      });
    }

    const requests = await prisma.materialRequest.findMany({
      where: { employeeId: parseInt(userId) },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            projectId: true
          }
        },
        material: {
          select: {
            id: true,
            materialId: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }).catch(err => {
      console.error('Prisma query error:', err);
      return [];
    });

    const formattedRequests = requests.map(req => ({
      ...req,
      quantity: normalizeQuantity(req.quantity),
      projectName: req.project?.name || null,
      files: formatRequestFiles(req.files),
    }));

    res.json({ 
      success: true,
      count: formattedRequests.length,
      requests: formattedRequests
    });
  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch requests',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const updateMaterialRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?.userId;
    const { name, vendor, defaultRate, quantity, unit, dueDate, description } = req.body;

    const existing = await prisma.materialRequest.findFirst({
      where: { id: parseInt(id), employeeId: parseInt(userId) }
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }
    if (existing.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'Cannot edit a reviewed request' });
    }

    // Handle new uploaded files
    const newFileUrls = buildRequestFileRecords(req.files);
    const existingFiles = existing.files || [];

    const updated = await prisma.materialRequest.update({
      where: { id: parseInt(id) },
      data: {
        name: name || existing.name,
        vendor: vendor !== undefined ? vendor : existing.vendor,
        defaultRate: defaultRate ? parseFloat(defaultRate) : existing.defaultRate,
        quantity: quantity !== undefined && quantity !== null && quantity !== '' ? normalizeQuantity(quantity) : existing.quantity,
        unit: unit || existing.unit,
        dueDate: dueDate ? new Date(dueDate) : existing.dueDate,
        description: description !== undefined ? description : existing.description,
        files: [...existingFiles, ...newFileUrls],
      }
    });

    // Format files for response
    const formattedFiles = formatRequestFiles(updated.files);

    res.json({ success: true, message: 'Request updated successfully', request: { ...updated, quantity: normalizeQuantity(updated.quantity), files: formattedFiles } });
  } catch (error) {
    console.error('Update material request error:', error);
    res.status(500).json({ success: false, error: 'Failed to update request', details: error.message });
  }
};

export const getPendingRequests = async (req, res) => {
  try {
    const { companyId } = req.user;

    if (!companyId) {
      return res.status(400).json({ 
        success: false,
        error: 'Company ID not found' 
      });
    }

    const requests = await prisma.materialRequest.findMany({
      where: {
        status: 'PENDING',
        employee: {
          companyId: String(companyId)
        }
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            empId: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            projectId: true
          }
        },
        material: {
          select: {
            id: true,
            materialId: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }).catch(err => {
      console.error('Prisma query error:', err);
      return [];
    });

    const requestsWithProjectName = requests.map(req => ({
      ...req,
      quantity: normalizeQuantity(req.quantity),
      projectName: req.project?.name || null,
      files: formatRequestFiles(req.files),
    }));

    res.json({ 
      success: true,
      count: requestsWithProjectName.length,
      requests: requestsWithProjectName 
    });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch pending requests',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const createMaterialRequest = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    
    console.log('📝 Creating request with data:', req.body);
    console.log('👤 User ID:', userId);
    
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        error: 'User ID not found' 
      });
    }

    const { 
      name, category, unit, defaultRate, vendor, 
      description, type, projectId, materialId, quantity,
      dueDate // ✅ Added dueDate
    } = req.body;

    if (!name || !category || !unit || !defaultRate || !type || !quantity) {
      return res.status(400).json({ 
        success: false,
        error: 'Name, category, unit, defaultRate, type, and quantity are required' 
      });
    }

    const parsedQuantity = normalizeQuantity(quantity);
    if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be a number greater than zero'
      });
    }

    if (!['GLOBAL', 'PROJECT', 'PROJECT_MATERIAL'].includes(type)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid request type' 
      });
    }

    if (type === 'PROJECT' && !projectId) {
      return res.status(400).json({ 
        success: false,
        error: 'Project ID is required for project-specific materials' 
      });
    }

    if (type === 'PROJECT_MATERIAL' && (!projectId || !materialId)) {
      return res.status(400).json({ 
        success: false,
        error: 'Project ID and material ID are required' 
      });
    }

    const requestId = await generateRequestId();
    const fileUrls = buildRequestFileRecords(req.files);

    const request = await prisma.materialRequest.create({
      data: {
        requestId,
        employeeId: parseInt(userId),
        name,
        category,
        unit,
        defaultRate: parseFloat(defaultRate),
        vendor: vendor || null,
        description: description || null,
        type,
        projectId: projectId ? parseInt(projectId) : null,
        materialId: materialId ? parseInt(materialId) : null,
        quantity: parsedQuantity,
        status: 'PENDING',
        requestDate: new Date(),
        dueDate: dueDate ? new Date(dueDate) : null, // ✅ Save dueDate
          files: fileUrls,
      },
      include: {
        project: {
          select: {
            name: true
          }
        },
        employee: {
          select: {
            name: true
          }
        }
      }
    });

    console.log('✅ Request created successfully:', request.id);

    // 1. For ENGINEER (confirmation)
    await createNotification(
      parseInt(userId),
      `Material request for "${name}" has been submitted for approval`,
      'INFO',
      'ENGINEER',
      request.id
    );

    // 2. For ADMIN (action required)
    await createNotification(
      parseInt(userId),
      `New material request: "${name}" from ${request.employee.name} requires approval`,
      'INFO',
      'ADMIN',
      request.id
    );

    res.status(201).json({ 
      success: true,
      message: 'Material request submitted successfully',
      request: {
        ...request,
        quantity: normalizeQuantity(request.quantity),
        projectName: request.project?.name || null,
        files: formatRequestFiles(request.files),
      }
    });
  } catch (error) {
    console.error('❌ Create material request error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create material request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getAllRequests = async (req, res) => {
  try {
    const { companyId } = req.user;

    if (!companyId) {
      return res.status(400).json({ 
        success: false,
        error: 'Company ID not found' 
      });
    }

    console.log('Fetching all requests for company:', companyId);

    const requests = await prisma.materialRequest.findMany({
      where: {
        employee: {
          companyId: String(companyId)
        }
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            empId: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            projectId: true
          }
        },
        material: {
          select: {
            id: true,
            materialId: true,
            name: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }).catch(err => {
      console.error('Prisma query error:', err);
      return [];
    });

    const requestsWithProjectName = requests.map(req => ({
      ...req,
      quantity: normalizeQuantity(req.quantity),
      projectName: req.project?.name || null,
      files: formatRequestFiles(req.files),
    }));

    console.log(`Found ${requestsWithProjectName.length} total requests`);

    res.json({ 
      success: true,
      count: requestsWithProjectName.length,
      requests: requestsWithProjectName 
    });
  } catch (error) {
    console.error('Get all requests error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch requests',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const approveMaterialRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvalNotes } = req.body;
    
    console.log('📝 Approving request ID:', id);
    
    const reviewerId = req.user?.engineerId || null;
    const { companyId } = req.user;

    if (!companyId) {
      return res.status(400).json({ 
        success: false,
        error: 'Company ID not found' 
      });
    }

    const request = await prisma.materialRequest.findUnique({
      where: { id: parseInt(id) },
      include: {
        employee: true,
        project: true
      }
    });

    if (!request) {
      return res.status(404).json({ 
        success: false,
        error: 'Request not found' 
      });
    }

    if (request.employee.companyId !== String(companyId)) {
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized' 
      });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ 
        success: false,
        error: 'Request has already been reviewed' 
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.materialRequest.update({
        where: { id: parseInt(id) },
        data: {
          status: 'APPROVED',
          reviewDate: new Date(),
          approvalNotes: approvalNotes || null,
          reviewedBy: reviewerId
        },
        include: {
          employee: true,
          project: true,
          material: true,
          reviewer: true
        }
      });

      const requestQuantity = normalizeQuantity(request.quantity) ?? 0;

      if (request.type === 'GLOBAL') {
        const materialId = await generateMaterialId();
        await tx.material.create({
          data: {
            materialId,
            name: request.name,
            category: request.category,
            unit: request.unit,
            defaultRate: request.defaultRate,
            vendor: request.vendor,
            description: request.description,
            quantity: requestQuantity,
            dueDate: request.dueDate || null, // ✅ Carry dueDate over to Material
            companyId: String(companyId)
          }
        });
      } else if (request.type === 'PROJECT') {
        const materialId = await generateMaterialId();
        const newMaterial = await tx.material.create({
          data: {
            materialId,
            name: request.name,
            category: request.category,
            unit: request.unit,
            defaultRate: request.defaultRate,
            vendor: request.vendor,
            description: request.description,
            quantity: requestQuantity,
            dueDate: request.dueDate || null, // ✅ Carry dueDate over to Material
            companyId: String(companyId)
          }
        });

        await tx.projectMaterial.create({
          data: {
            projectId: request.projectId,
            materialId: newMaterial.id,
            assigned: requestQuantity,
            used: 0,
            status: 'NOT_USED'
          }
        });
      } else if (request.type === 'PROJECT_MATERIAL') {
        const existingProjectMaterial = await tx.projectMaterial.findUnique({
          where: {
            projectId_materialId: {
              projectId: request.projectId,
              materialId: request.materialId
            }
          }
        });

        if (existingProjectMaterial) {
          await tx.projectMaterial.update({
            where: { id: existingProjectMaterial.id },
            data: {
              assigned: existingProjectMaterial.assigned + requestQuantity,
              status: 'ACTIVE',
              updatedAt: new Date()
            }
          });
        } else {
          await tx.projectMaterial.create({
            data: {
              projectId: request.projectId,
              materialId: request.materialId,
              assigned: requestQuantity,
              used: 0,
              status: 'ACTIVE'
            }
          });
        }
      }

      return updatedRequest;
    });

    await createNotification(
      request.employeeId,
      `Your request for "${request.name}" has been approved`,
      'SUCCESS',
      'ENGINEER',
      request.id
    );

    console.log('✅ Request approved successfully');

    res.json({ 
      success: true,
      message: 'Request approved successfully',
      request: result 
    });
  } catch (error) {
    console.error('❌ Approve request error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to approve request',
      details: error.message
    });
  }
};

export const rejectMaterialRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    
    const reviewerId = req.user?.engineerId || null;
    const { companyId } = req.user;

    if (!companyId) {
      return res.status(400).json({ 
        success: false,
        error: 'Company ID not found' 
      });
    }

    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({ 
        success: false,
        error: 'Rejection reason is required' 
      });
    }

    const request = await prisma.materialRequest.findUnique({
      where: { id: parseInt(id) },
      include: {
        employee: true
      }
    });

    if (!request) {
      return res.status(404).json({ 
        success: false,
        error: 'Request not found' 
      });
    }

    if (request.employee.companyId !== String(companyId)) {
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized' 
      });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ 
        success: false,
        error: 'Request has already been reviewed' 
      });
    }

    const updatedRequest = await prisma.materialRequest.update({
      where: { id: parseInt(id) },
      data: {
        status: 'REJECTED',
        reviewDate: new Date(),
        rejectionReason: rejectionReason.trim(),
        reviewedBy: reviewerId
      },
      include: {
        employee: true,
        project: true,
        material: true,
        reviewer: true
      }
    });

    await createNotification(
      request.employeeId,
      `Your request for "${request.name}" has been rejected: ${rejectionReason}`,
      'ERROR',
      'ENGINEER',
      request.id
    );

    console.log('✅ Request rejected successfully');

    res.json({ 
      success: true,
      message: 'Request rejected successfully',
      request: updatedRequest 
    });
  } catch (error) {
    console.error('❌ Reject request error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to reject request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const addAdminComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminComment } = req.body;
    const { companyId } = req.user;

    if (!adminComment || !adminComment.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Comment cannot be empty'
      });
    }

    // Find request and verify it belongs to this company
    const request = await prisma.materialRequest.findUnique({
      where: { id: parseInt(id) },
      include: { employee: true }
    });

    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    if (request.employee.companyId !== String(companyId)) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    // ✅ Only allow commenting on PENDING requests
    if (request.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: 'Can only comment on pending requests'
      });
    }

    // Save comment — request stays PENDING
    const updated = await prisma.materialRequest.update({
      where: { id: parseInt(id) },
      data: {
        adminComment: adminComment.trim()
        // ✅ status is NOT changed — remains PENDING
      }
    });

    // Notify the engineer about the admin's comment
    await createNotification(
      request.employeeId,
      `Admin left a comment on your request for "${request.name}": ${adminComment.trim()}`,
      'WARNING',
      'ENGINEER',
      request.id
    );

    res.json({
      success: true,
      message: 'Comment saved. Request remains pending.',
      request: updated
    });
  } catch (error) {
    console.error('Add admin comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save comment',
      details: error.message
    });
  }
};
