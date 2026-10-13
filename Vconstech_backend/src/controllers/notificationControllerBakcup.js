import { prisma } from '../config/database.js';

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const userRole = req.user?.role; // Get user role from token
    
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        error: 'User ID not found in request' 
      });
    }

    const { unreadOnly } = req.query;

    // ✅ BUILD WHERE CLAUSE BASED ON ROLE
    let where = {};
    
    if (userRole === 'ADMIN' || userRole === 'SUPERVISOR') {
      // Admins see notifications meant for them
      where.recipientRole = 'ADMIN';
    } else if (userRole === 'ENGINEER' || userRole === 'SITE_ENGINEER') {
      // Engineers see their own notifications
      where.engineerId = parseInt(userId);
      where.recipientRole = 'ENGINEER';
    }

    if (unreadOnly === 'true') {
      where.read = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 50,
      include: {
        // ✅ Include engineer details for admin view
        engineer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    }).catch(err => {
      console.error('Prisma notification query error:', err);
      return [];
    });

    // ✅ COUNT UNREAD BASED ON ROLE
    let unreadWhere = { read: false };
    if (userRole === 'ADMIN' || userRole === 'SUPERVISOR') {
      unreadWhere.recipientRole = 'ADMIN';
    } else {
      unreadWhere.engineerId = parseInt(userId);
      unreadWhere.recipientRole = 'ENGINEER';
    }

    const unreadCount = await prisma.notification.count({
      where: unreadWhere
    }).catch(err => {
      console.error('Prisma notification count error:', err);
      return 0;
    });

    res.json({ 
      success: true,
      count: notifications.length,
      unreadCount,
      notifications 
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch notifications',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(400).json({ 
        success: false,
        error: 'User ID not found' 
      });
    }

    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(id) }
    });

    if (!notification) {
      return res.status(404).json({ 
        success: false,
        error: 'Notification not found' 
      });
    }

    // ✅ AUTHORIZATION: Check if user has permission to mark as read
    const hasPermission = 
      (userRole === 'ADMIN' && notification.recipientRole === 'ADMIN') ||
      (notification.engineerId === parseInt(userId) && notification.recipientRole === 'ENGINEER');

    if (!hasPermission) {
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized' 
      });
    }

    const updated = await prisma.notification.update({
      where: { id: parseInt(id) },
      data: { read: true }
    });

    res.json({ 
      success: true,
      message: 'Notification marked as read',
      notification: updated 
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to mark notification as read',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(400).json({ 
        success: false,
        error: 'User ID not found' 
      });
    }

    // ✅ BUILD WHERE BASED ON ROLE
    let where = { read: false };
    
    if (userRole === 'ADMIN' || userRole === 'SUPERVISOR') {
      where.recipientRole = 'ADMIN';
    } else {
      where.engineerId = parseInt(userId);
      where.recipientRole = 'ENGINEER';
    }

    const result = await prisma.notification.updateMany({
      where,
      data: { read: true }
    });

    res.json({ 
      success: true,
      message: 'All notifications marked as read',
      count: result.count 
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to mark all notifications as read',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(400).json({ 
        success: false,
        error: 'User ID not found' 
      });
    }

    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(id) }
    });

    if (!notification) {
      return res.status(404).json({ 
        success: false,
        error: 'Notification not found' 
      });
    }

    // ✅ AUTHORIZATION CHECK
    const hasPermission = 
      (userRole === 'ADMIN' && notification.recipientRole === 'ADMIN') ||
      (notification.engineerId === parseInt(userId) && notification.recipientRole === 'ENGINEER');

    if (!hasPermission) {
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized' 
      });
    }

    await prisma.notification.delete({
      where: { id: parseInt(id) }
    });

    res.json({ 
      success: true,
      message: 'Notification deleted successfully' 
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete notification',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const clearReadNotifications = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(400).json({ 
        success: false,
        error: 'User ID not found' 
      });
    }

    // ✅ BUILD WHERE BASED ON ROLE
    let where = { read: true };
    
    if (userRole === 'ADMIN' || userRole === 'SUPERVISOR') {
      where.recipientRole = 'ADMIN';
    } else {
      where.engineerId = parseInt(userId);
      where.recipientRole = 'ENGINEER';
    }

    const result = await prisma.notification.deleteMany({
      where
    });

    res.json({ 
      success: true,
      message: 'Read notifications cleared',
      count: result.count 
    });
  } catch (error) {
    console.error('Clear read notifications error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to clear notifications',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
