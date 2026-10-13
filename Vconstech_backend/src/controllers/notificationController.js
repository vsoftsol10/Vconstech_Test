import { prisma } from '../config/database.js';

const notificationPanelLimit = 50;

const isAdmin = (role) => ['ADMIN', 'SUPERVISOR'].includes(role?.toUpperCase()?.trim());
const isEngineer = (role) => ['ENGINEER', 'SITE_ENGINEER'].includes(role?.toUpperCase()?.trim());

const getRequestUser = (req) => ({
  userId: req.user?.engineerId || req.user?.id || req.user?.userId,
  userRole: req.user?.role,
  companyId: req.user?.companyId ? String(req.user.companyId) : null
});

const buildCompanyScope = (companyId) => ({
  engineer: {
    companyId
  },
  OR: [
    { projectId: null },
    { project: { is: { companyId } } }
  ]
});

const buildNotificationWhere = ({ userId, userRole, companyId, read }) => {
  if (!companyId) return null;

  const where = {
    ...buildCompanyScope(companyId)
  };

  if (isAdmin(userRole)) {
    where.recipientRole = 'ADMIN';
  } else if (isEngineer(userRole)) {
    const engineerId = Number.parseInt(userId, 10);
    if (!Number.isInteger(engineerId)) return null;
    where.engineerId = engineerId;
    where.recipientRole = 'ENGINEER';
  } else {
    return null;
  }

  if (read !== undefined) {
    where.read = read;
  }

  return where;
};

const emptyNotificationResponse = () => ({
  success: true,
  count: 0,
  unreadCount: 0,
  notifications: []
});

export const getNotifications = async (req, res) => {
  try {
    const { userId, userRole, companyId } = getRequestUser(req);

    console.log('getNotifications called');
    console.log('   Raw user from token:', req.user);
    console.log('   Resolved userId:', userId);
    console.log('   Role:', userRole);
    console.log('   Company:', companyId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID not found in request'
      });
    }

    const { unreadOnly } = req.query;
    const where = buildNotificationWhere({
      userId,
      userRole,
      companyId,
      read: unreadOnly === 'true' ? false : undefined
    });

    if (!where) {
      console.warn('Unable to scope notifications:', { userRole, companyId });
      return res.json(emptyNotificationResponse());
    }

    console.log('   Prisma where clause:', where);

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { date: 'desc' },
      take: notificationPanelLimit,
      include: {
        engineer: {
          select: {
            id: true,
            name: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            projectId: true
          }
        }
      }
    }).catch((err) => {
      console.error('Prisma notification query error:', err);
      return [];
    });

    const unreadWhere = buildNotificationWhere({
      userId,
      userRole,
      companyId,
      read: false
    });

    const unreadCount = await prisma.notification.count({
      where: unreadWhere
    }).catch((err) => {
      console.error('Prisma notification count error:', err);
      return 0;
    });

    console.log(`   Found ${notifications.length} notifications, ${unreadCount} unread`);

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
    const { userId, userRole, companyId } = getRequestUser(req);

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID not found'
      });
    }

    const notificationWhere = buildNotificationWhere({ userId, userRole, companyId });

    if (!notificationWhere) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id: parseInt(id),
        ...notificationWhere
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
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
    const { userId, userRole, companyId } = getRequestUser(req);

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID not found'
      });
    }

    const where = buildNotificationWhere({
      userId,
      userRole,
      companyId,
      read: false
    });

    if (!where) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
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
    const { userId, userRole, companyId } = getRequestUser(req);

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID not found'
      });
    }

    const notificationWhere = buildNotificationWhere({ userId, userRole, companyId });

    if (!notificationWhere) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id: parseInt(id),
        ...notificationWhere
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
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
    const { userId, userRole, companyId } = getRequestUser(req);

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID not found'
      });
    }

    const where = buildNotificationWhere({
      userId,
      userRole,
      companyId,
      read: true
    });

    if (!where) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
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
