// src/utils/generateId.js
import { prisma } from '../config/database.js';

/**
 * Generate Material ID (MAT001, MAT002, etc.)
 */
export const generateMaterialId = async () => {
  const lastMaterial = await prisma.material.findFirst({
    where: {
      materialId: {
        startsWith: 'MAT'
      }
    },
    orderBy: {
      materialId: 'desc'
    }
  });

  if (!lastMaterial) {
    return 'MAT001';
  }

  const lastNumber = parseInt(lastMaterial.materialId.replace('MAT', ''));
  const newNumber = lastNumber + 1;
  return `MAT${String(newNumber).padStart(3, '0')}`;
};

/**
 * Generate Request ID (REQ001, REQ002, etc.)
 */
export const generateRequestId = async () => {
  const lastRequest = await prisma.materialRequest.findFirst({
    where: {
      requestId: {
        startsWith: 'REQ'
      }
    },
    orderBy: {
      requestId: 'desc'
    }
  });

  if (!lastRequest) {
    return 'REQ001';
  }

  const lastNumber = parseInt(lastRequest.requestId.replace('REQ', ''));
  const newNumber = lastNumber + 1;
  return `REQ${String(newNumber).padStart(3, '0')}`;
};

/**
 * Calculate remaining quantity
 */
export const calculateRemaining = (assigned, used) => {
  return assigned - used;
};

/**
 * Determine project material status based on usage
 */
export const determineProjectMaterialStatus = (assigned, used) => {
  if (used === 0) return 'NOT_USED';
  if (used >= assigned) return 'COMPLETED';
  return 'ACTIVE';
};

/**
 * Create notification for user
 * ✅ FIXED: Uses engineerId (Int) instead of userId
 */
export const createNotification = async (engineerId, message, type, recipientRole = 'ENGINEER', requestId = null, projectId = null) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        engineerId: parseInt(engineerId),
        message,
        type,
        recipientRole, // ✅ NEW
        requestId: requestId ? parseInt(requestId) : null, // ✅ NEW
        projectId: projectId ? parseInt(projectId) : null,
        read: false,
        date: new Date()
      }
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};
