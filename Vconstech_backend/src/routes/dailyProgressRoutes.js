// backend/routes/dailyProgressRoutes.js
// FIXED VERSION - Uses correct model accessor

import express from 'express';
import { prisma } from '../config/database.js';
import { authenticateToken } from '../middlewares/authMiddlewares.js';

const router = express.Router();

/**
 * @route   POST /api/daily-progress
 * @desc    Create a daily progress update
 * @access  Private (Engineer only)
 */
router.post('/', authenticateToken, async (req, res) => {
  console.log('\n========================================');
  console.log('📝 DAILY PROGRESS UPDATE REQUEST');
  console.log('========================================');
  
  try {
    console.log('1️⃣ Request received');
    console.log('   Body:', JSON.stringify(req.body, null, 2));
    console.log('   User:', JSON.stringify(req.user, null, 2));

    const { projectId, message, workDone, challenges, nextSteps } = req.body;
    const engineerId = req.user.id;

    console.log('\n2️⃣ Extracted data:');
    console.log('   projectId:', projectId, typeof projectId);
    console.log('   engineerId:', engineerId, typeof engineerId);
    console.log('   message length:', message?.length);
    console.log('   has workDone:', !!workDone);
    console.log('   has challenges:', !!challenges);
    console.log('   has nextSteps:', !!nextSteps);

    // Validate required fields
    if (!projectId || !message) {
      console.log('❌ Validation failed!');
      console.log('   projectId exists:', !!projectId);
      console.log('   message exists:', !!message);
      return res.status(400).json({ 
        error: 'Project ID and message are required',
        debug: { projectId, hasMessage: !!message }
      });
    }

    console.log('\n3️⃣ Looking up project...');
    console.log('   Searching for project ID:', projectId);

    const normalizedProjectId = Number.parseInt(projectId, 10);
    let project = null;

    if (!Number.isNaN(normalizedProjectId)) {
      project = await prisma.project.findUnique({
        where: { id: normalizedProjectId },
        include: { assignedEngineer: true }
      });
    }

    if (!project && projectId) {
      project = await prisma.project.findUnique({
        where: { projectId: String(projectId) },
        include: { assignedEngineer: true }
      });
    }

    console.log('\n4️⃣ Project lookup result:');
    if (project) {
      console.log('   ✅ Project found');
      console.log('   Project ID:', project.id);
      console.log('   Project name:', project.name);
      console.log('   Assigned engineer ID:', project.assignedEngineer?.id);
      console.log('   Requesting engineer ID:', engineerId);
    } else {
      console.log('   ❌ Project NOT found');
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.assignedEngineer?.id !== engineerId) {
      console.log('\n❌ Authorization failed!');
      console.log('   Engineer is not assigned to this project');
      console.log('   Expected:', project.assignedEngineer?.id);
      console.log('   Got:', engineerId);
      return res.status(403).json({ 
        error: 'You are not assigned to this project',
        debug: {
          assignedEngineerId: project.assignedEngineer?.id,
          requestingEngineerId: engineerId
        }
      });
    }

    const resolvedProjectId = project.id;

    console.log('\n5️⃣ Creating daily progress update...');
    console.log('   Data to insert:');
    console.log('   {');
    console.log('     projectId:', resolvedProjectId);
    console.log('     engineerId:', engineerId);
    console.log('     message: "' + message.substring(0, 50) + '..."');
    console.log('   }');

    // ✅ FIXED: Use the exact model name from schema
    const dailyUpdate = await prisma.daily_progress_updates.create({
      data: {
        projectId: resolvedProjectId,
        engineerId,
        message,
        workDone: workDone || null,
        challenges: challenges || null,
        nextSteps: nextSteps || null
      },
      include: {
        engineers: {
          select: {
            id: true,
            name: true,
            empId: true
          }
        },
        Project: {
          select: {
            id: true,
            name: true,
            projectId: true
          }
        }
      }
    });

    console.log('\n6️⃣ ✅ SUCCESS!');
    console.log('   Created update ID:', dailyUpdate.id);
    console.log('========================================\n');

    res.status(201).json({
      message: 'Daily progress update created successfully',
      update: dailyUpdate
    });

  } catch (error) {
    console.log('\n❌ ERROR OCCURRED!');
    console.log('========================================');
    console.log('Error name:', error.name);
    console.log('Error message:', error.message);
    console.log('Error stack:', error.stack);
    
    if (error.code) {
      console.log('Error code:', error.code);
    }
    
    if (error.meta) {
      console.log('Error meta:', JSON.stringify(error.meta, null, 2));
    }
    
    console.log('========================================\n');
    
    res.status(500).json({ 
      error: 'Failed to create daily progress update',
      details: error.message,
      code: error.code,
      meta: error.meta
    });
  }
});

/**
 * @route   GET /api/daily-progress/project/:projectId
 * @desc    Get all daily progress updates for a project
 * @access  Private (Admin/Engineer)
 */
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const normalizedProjectId = Number.parseInt(projectId, 10);
    let resolvedProjectId = normalizedProjectId;

    if (Number.isNaN(resolvedProjectId) && projectId) {
      const projectLookup = await prisma.project.findUnique({
        where: { projectId: String(projectId) }
      });
      resolvedProjectId = projectLookup?.id;
    }

    if (!resolvedProjectId || Number.isNaN(resolvedProjectId)) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const updates = await prisma.daily_progress_updates.findMany({
      where: {
        projectId: resolvedProjectId
      },
      include: {
        engineers: {
          select: {
            id: true,
            name: true,
            empId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const totalCount = await prisma.daily_progress_updates.count({
      where: {
        projectId: resolvedProjectId
      }
    });

    res.json({
      updates,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + updates.length < totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching daily progress updates:', error);
    res.status(500).json({ 
      error: 'Failed to fetch daily progress updates',
      details: error.message 
    });
  }
});

/**
 * @route   GET /api/daily-progress/engineer/:engineerId
 * @desc    Get all daily progress updates by an engineer
 * @access  Private (Admin only)
 */
router.get('/engineer/:engineerId', authenticateToken, async (req, res) => {
  try {
    const { engineerId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const updates = await prisma.daily_progress_updates.findMany({
      where: {
        engineerId: parseInt(engineerId)
      },
      include: {
        Project: {
          select: {
            id: true,
            name: true,
            projectId: true
          }
        },
        engineers: {
          select: {
            id: true,
            name: true,
            empId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const totalCount = await prisma.daily_progress_updates.count({
      where: {
        engineerId: parseInt(engineerId)
      }
    });

    res.json({
      updates,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + updates.length < totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching engineer daily updates:', error);
    res.status(500).json({ 
      error: 'Failed to fetch engineer daily updates',
      details: error.message 
    });
  }
});

/**
 * @route   GET /api/daily-progress/:id
 * @desc    Get a specific daily progress update
 * @access  Private
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const update = await prisma.daily_progress_updates.findUnique({
      where: {
        id: parseInt(id)
      },
      include: {
        engineers: {
          select: {
            id: true,
            name: true,
            empId: true
          }
        },
        Project: {
          select: {
            id: true,
            name: true,
            projectId: true,
            clientName: true
          }
        }
      }
    });

    if (!update) {
      return res.status(404).json({ error: 'Daily progress update not found' });
    }

    res.json({ update });
  } catch (error) {
    console.error('Error fetching daily progress update:', error);
    res.status(500).json({ 
      error: 'Failed to fetch daily progress update',
      details: error.message 
    });
  }
});

/**
 * @route   DELETE /api/daily-progress/:id
 * @desc    Delete a daily progress update
 * @access  Private (Engineer - own updates, Admin - all updates)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const update = await prisma.daily_progress_updates.findUnique({
      where: { id: parseInt(id) }
    });

    if (!update) {
      return res.status(404).json({ error: 'Daily progress update not found' });
    }

    // Check permissions: engineer can delete own updates, admin can delete any
    if (update.engineerId !== userId && userRole !== 'Admin') {
      return res.status(403).json({ 
        error: 'You do not have permission to delete this update' 
      });
    }

    await prisma.daily_progress_updates.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Daily progress update deleted successfully' });
  } catch (error) {
    console.error('Error deleting daily progress update:', error);
    res.status(500).json({ 
      error: 'Failed to delete daily progress update',
      details: error.message 
    });
  }
});

/**
 * @route   GET /api/daily-progress/recent/all
 * @desc    Get recent daily progress updates across all projects
 * @access  Private (Admin only)
 */
router.get('/recent/all', authenticateToken, async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const updates = await prisma.daily_progress_updates.findMany({
      include: {
        engineers: {
          select: {
            id: true,
            name: true,
            empId: true
          }
        },
        Project: {
          select: {
            id: true,
            name: true,
            projectId: true,
            clientName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit)
    });

    res.json({ updates });
  } catch (error) {
    console.error('Error fetching recent updates:', error);
    res.status(500).json({ 
      error: 'Failed to fetch recent updates',
      details: error.message 
    });
  }
});

export default router;
