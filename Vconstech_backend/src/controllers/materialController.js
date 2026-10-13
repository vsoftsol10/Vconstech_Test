// src/controllers/materialController.js
import { prisma } from '../config/database.js';
import { generateMaterialId } from '../utils/generateId.js';

/**
 * Get dashboard data (metrics + recent usage logs)
 * GET /api/materials/dashboard
 */
export const getDashboard = async (req, res) => {
  try {
    const { companyId } = req.user;

    const [totalMaterials, activeMaterials, pendingRequests, materialUsages] = await Promise.all([
      prisma.material.count({
        where: { companyId }
      }),
      prisma.projectMaterial.count({
        where: {
          status: 'ACTIVE',
          project: {
            companyId
          }
        }
      }),
      prisma.materialRequest.count({
        where: {
          status: 'PENDING',
          employee: { companyId: String(companyId) }
        }
      }),
      prisma.materialUsage.findMany({
        where: {
          project: { companyId }
        },
        include: {
          material: {
            select: {
              id: true,
              name: true,
              unit: true,
              defaultRate: true
            }
          },
          project: {
            select: {
              id: true,
              name: true
            }
          },
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
      })
    ]);

    const totalCost = materialUsages.reduce((sum, usage) => {
      const rate = usage.material.defaultRate || 0;
      return sum + (usage.quantity * rate);
    }, 0);

    // ✅ FIXED: Get recent material usage logs (last 10)
    // Changed 'user' to 'engineer'
    const recentUsageLogs = materialUsages.slice(0, 10);

    // ✅ FIXED: Format usage logs
    // Changed 'log.user' to 'log.engineer' and 'userId' to 'engineerId'
    const formattedUsageLogs = recentUsageLogs.map(log => ({
      id: log.id,
      date: log.date.toISOString().split('T')[0],
      projectId: log.projectId,
      projectName: log.project.name,
      materialId: log.materialId,
      materialName: log.material.name,
      quantity: log.quantity,
      unit: log.material.unit,
      defaultRate: log.material.defaultRate || 0,
      totalCost: Math.round((log.quantity * (log.material.defaultRate || 0)) * 100) / 100,
      remarks: log.remarks,
      engineerId: log.engineerId,  // ✅ Changed from 'userId'
      userName: log.engineer.name   // ✅ Changed from 'log.user.name'
    }));

    res.json({
      success: true,
      data: {
        metrics: {
          totalMaterials,
          activeMaterials,
          totalCost: Math.round(totalCost * 100) / 100,
          pendingRequests
        },
        usageLogs: formattedUsageLogs
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
      details: error.message
    });
  }
};

/**
 * Get material usage statistics
 * GET /api/materials/usage-stats
 */
export const getUsageStats = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { projectId, materialId, startDate, endDate } = req.query;

    const whereClause = {
      project: { companyId }
    };

    if (projectId) {
      whereClause.projectId = parseInt(projectId);
    }

    if (materialId) {
      whereClause.materialId = parseInt(materialId);
    }

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) {
        whereClause.date.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.date.lte = new Date(endDate);
      }
    }

    const usageStats = await prisma.materialUsage.groupBy({
      by: ['materialId'],
      where: whereClause,
      _sum: {
        quantity: true
      },
      _count: {
        id: true
      }
    });

    const materials = await prisma.material.findMany({
      where: {
        id: { in: usageStats.map((stat) => stat.materialId) },
        companyId
      }
    });
    const materialsById = new Map(materials.map((material) => [material.id, material]));

    // Enrich with material details
    const enrichedStats = usageStats.map((stat) => {
      const material = materialsById.get(stat.materialId);
      const totalCost = (stat._sum.quantity || 0) * (material?.defaultRate || 0);

      return {
        materialId: stat.materialId,
        materialName: material?.name,
        unit: material?.unit,
        totalQuantityUsed: stat._sum.quantity || 0,
        usageCount: stat._count.id,
        totalCost: Math.round(totalCost * 100) / 100
      };
    });

    res.json({
      success: true,
      stats: enrichedStats
    });
  } catch (error) {
    console.error('Get usage stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch usage statistics',
      details: error.message
    });
  }
};

/**
 * Get project-wise material usage summary
 * GET /api/materials/project-summary
 */
export const getProjectSummary = async (req, res) => {
  try {
    const { companyId } = req.user;

    const projects = await prisma.project.findMany({
      where: { companyId },
      include: {
        materialUsages: {
          include: {
            material: true
          }
        }
      }
    });

    const summary = projects.map(project => {
      const totalCost = project.materialUsages.reduce((sum, usage) => {
        const rate = usage.material.defaultRate || 0;
        return sum + (usage.quantity * rate);
      }, 0);

      return {
        projectId: project.id,
        projectName: project.name,
        projectType: project.projectType,
        status: project.status,
        materialsUsedCount: new Set(project.materialUsages.map(u => u.materialId)).size,
        totalUsageCount: project.materialUsages.length,
        totalCost: Math.round(totalCost * 100) / 100
      };
    });

    res.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Get project summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project summary',
      details: error.message
    });
  }
};

/**
 * Get all materials for a company
 * GET /api/materials
 */
export const getAllMaterials = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { category, search } = req.query;

    const isEngineer = req.user?.type === 'engineer' || String(req.user?.role || '').toUpperCase() === 'SITE_ENGINEER';
    const assignedProjectFilter = isEngineer
      ? { project: { companyId, assignedEngineerId: req.user.id } }
      : {};

    const where = {
      companyId,
      ...(isEngineer ? { projectMaterials: { some: assignedProjectFilter } } : {})
    };

    // Filter by category
    if (category && category !== 'All') {
      where.category = category;
    }

    // Search by name or vendor
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { vendor: { contains: search, mode: 'insensitive' } }
      ];
    }

    const materials = await prisma.material.findMany({
      where,
      include: {
        projectMaterials: {
          ...(isEngineer ? { where: assignedProjectFilter } : {}),
          include: {
            project: {
              select: {
                id: true,
                name: true,
                projectId: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' }
    });

    const baseUrl = process.env.BASE_URL || 'http://localhost:5001';
    const formattedMaterials = materials.map((m) => {
      const allocatedQuantity = (m.projectMaterials || []).reduce(
        (sum, pm) => sum + (Number(pm.assigned) || 0),
        0
      );
      const projectNames = [...new Set(
        (m.projectMaterials || [])
          .map((pm) => pm.project?.name)
          .filter(Boolean)
      )];

      return {
        ...m,
        availableQuantity: Number(m.quantity || 0) - allocatedQuantity,
        projectName: projectNames.length === 0 ? null : projectNames.join(', '),
        files: (m.files || []).map((fileUrl) => {
          const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${baseUrl}${fileUrl}`;
          return {
            url: fullUrl,
            fileUrl: fullUrl,
            name: fileUrl.split('/').pop(),
            fileName: fileUrl.split('/').pop(),
          };
        }),
      };
    });

    res.json({ success: true, count: formattedMaterials.length, materials: formattedMaterials });
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch materials',
      details: error.message 
    });
  }
};

/**
 * Get single material by ID
 * GET /api/materials/:id
 */
export const getMaterialById = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;

    const material = await prisma.material.findFirst({
      where: {
        id: parseInt(id),
        companyId
      },
      include: {
        projectMaterials: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                projectId: true
              }
            }
          }
        },
        usages: {
          take: 10,
          orderBy: { date: 'desc' },
          include: {
            project: {
              select: {
                name: true,
                projectId: true
              }
            },
            engineer: {
              select: {
                name: true,
                empId: true
              }
            }
          }
        }
      }
    });

    if (!material) {
      return res.status(404).json({ 
        success: false,
        error: 'Material not found' 
      });
    }

    const baseUrl = process.env.BASE_URL || 'http://localhost:5001';
    const allocatedQuantity = (material.projectMaterials || []).reduce(
      (sum, pm) => sum + (Number(pm.assigned) || 0),
      0
    );
    const projectNames = [...new Set(
      (material.projectMaterials || [])
        .map((pm) => pm.project?.name)
        .filter(Boolean)
    )];

    const formattedMaterial = {
      ...material,
      availableQuantity: Number(material.quantity || 0) - allocatedQuantity,
      projectName: projectNames.length === 0 ? null : projectNames.join(', '),
      files: (material.files || []).map((fileUrl) => {
        const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${baseUrl}${fileUrl}`;
        return {
          url: fullUrl,
          fileUrl: fullUrl,
          name: fileUrl.split('/').pop(),
          fileName: fileUrl.split('/').pop(),
        };
      }),
    };

    res.json({ success: true, material: formattedMaterial });
  } catch (error) {
    console.error('Get material error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch material',
      details: error.message 
    });
  }
};

/**
 * Create new material (Admin only - from approved request)
 * POST /api/materials
 */
export const createMaterial = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { name, category, unit, defaultRate, vendor, description, dueDate, quantity } = req.body;

    if (!name || !category || !unit) {
      return res.status(400).json({ success: false, error: 'Name, category, and unit are required' });
    }

    const parsedQuantity = quantity !== undefined && quantity !== null && quantity !== ''
      ? parseFloat(quantity)
      : NaN;

    if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantity is required and must be greater than zero'
      });
    }

    const materialId = await generateMaterialId();

    // ← Build file URL array from uploaded files
    const fileUrls = req.files?.map(f => `/uploads/material-files/${f.filename}`) ?? [];

    const material = await prisma.material.create({
      data: {
        materialId,
        name,
        category,
        unit,
        defaultRate: defaultRate ? parseFloat(defaultRate) : null,
        vendor: vendor || null,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        quantity: parsedQuantity,
        files: fileUrls,                                   // ← new
        companyId
      }
    });

    res.status(201).json({ success: true, message: 'Material created successfully', material });
  } catch (error) {
    console.error('Create material error:', error);
    res.status(500).json({ success: false, error: 'Failed to create material', details: error.message });
  }
};

/**
 * Update material
 * PUT /api/materials/:id
 */
export const updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;
    const { name, category, unit, defaultRate, vendor, description, dueDate, quantity, removeFiles } = req.body;

    const existingMaterial = await prisma.material.findFirst({
      where: { id: parseInt(id), companyId }
    });

    if (!existingMaterial) {
      return res.status(404).json({ success: false, error: 'Material not found' });
    }

    // ← New files uploaded in this request
    const newFileUrls = req.files?.map(f => `/uploads/material-files/${f.filename}`) ?? [];

    // ← Optionally remove specific files (pass array of URLs to remove)
    const filesToRemove = removeFiles ? JSON.parse(removeFiles) : [];
    const existingFiles = (existingMaterial.files || []).filter(f => !filesToRemove.includes(f));

    // ← Delete removed files from disk
    filesToRemove.forEach(fileUrl => {
      const filePath = path.join(__dirname, '../../', fileUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    const parsedQuantity =
      quantity !== undefined && quantity !== null && quantity !== ''
        ? parseFloat(quantity)
        : existingMaterial.quantity;

    if (quantity !== undefined && quantity !== null && quantity !== '' && (Number.isNaN(parsedQuantity) || parsedQuantity <= 0)) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be greater than zero'
      });
    }

    const material = await prisma.material.update({
      where: { id: parseInt(id) },
      data: {
        name: name || existingMaterial.name,
        category: category || existingMaterial.category,
        unit: unit || existingMaterial.unit,
        defaultRate: defaultRate !== undefined ? parseFloat(defaultRate) : existingMaterial.defaultRate,
        vendor: vendor !== undefined ? vendor : existingMaterial.vendor,
        description: description !== undefined ? description : existingMaterial.description,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : existingMaterial.dueDate,
        quantity: parsedQuantity, // ← new
        files: [...existingFiles, ...newFileUrls],  // ← merge existing + new
      }
    });

    res.json({ success: true, message: 'Material updated successfully', material });
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({ success: false, error: 'Failed to update material', details: error.message });
  }
};

/**
 * Delete material
 * DELETE /api/materials/:id
 */
export const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;

    const material = await prisma.material.findFirst({
      where: { id: parseInt(id), companyId }
    });

    if (!material) {
      return res.status(404).json({ success: false, error: 'Material not found' });
    }

    const usageCount = await prisma.projectMaterial.count({
      where: { materialId: parseInt(id) }
    });

    if (usageCount > 0) {
      return res.status(400).json({ success: false, error: 'Cannot delete material that is assigned to projects' });
    }

    // ← Delete files from disk before deleting record
    (material.files || []).forEach(fileUrl => {
      const filePath = path.join(__dirname, '../../', fileUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    await prisma.material.delete({ where: { id: parseInt(id) } });

    res.json({ success: true, message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete material', details: error.message });
  }
};

/**
 * Get material categories
 * GET /api/materials/categories
 */
export const getCategories = async (req, res) => {
  try {
    const { companyId } = req.user;

    const materials = await prisma.material.findMany({
      where: { companyId },
      select: { category: true },
      distinct: ['category']
    });

    const categories = materials.map(m => m.category).filter(Boolean);

    res.json({ 
      success: true,
      categories 
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch categories',
      details: error.message 
    });
  }
};

/**
 * Get lightweight dashboard data without recalculating material totals.
 * Dashboard reuses project financial summaries for material cost.
 * GET /api/materials/dashboard-summary
 */
export const getDashboardSummary = async (req, res) => {
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
        success: false,
        error: 'Company ID not found'
      });
    }

    const [totalMaterials, activeMaterials, pendingRequests, recentUsageLogs] = await Promise.all([
      prisma.material.count({
        where: { companyId }
      }),
      prisma.projectMaterial.count({
        where: {
          status: 'ACTIVE',
          project: {
            companyId
          }
        }
      }),
      prisma.materialRequest.count({
        where: {
          status: 'PENDING',
          employee: { companyId: String(companyId) }
        }
      }),
      prisma.materialUsage.findMany({
        where: {
          project: { companyId }
        },
        include: {
          material: {
            select: {
              id: true,
              name: true,
              unit: true,
              defaultRate: true
            }
          },
          project: {
            select: {
              id: true,
              name: true
            }
          },
          engineer: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          date: 'desc'
        },
        take: 10
      })
    ]);

    const formattedUsageLogs = recentUsageLogs.map(log => ({
      id: log.id,
      date: log.date.toISOString().split('T')[0],
      projectId: log.projectId,
      projectName: log.project.name,
      materialId: log.materialId,
      materialName: log.material.name,
      quantity: log.quantity,
      unit: log.material.unit,
      defaultRate: log.material.defaultRate || 0,
      totalCost: Math.round((log.quantity * (log.material.defaultRate || 0)) * 100) / 100,
      remarks: log.remarks,
      engineerId: log.engineerId,
      userName: log.engineer.name
    }));

    res.json({
      success: true,
      data: {
        metrics: {
          totalMaterials,
          activeMaterials,
          pendingRequests
        },
        usageLogs: formattedUsageLogs
      }
    });
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
      details: error.message
    });
  }
};

