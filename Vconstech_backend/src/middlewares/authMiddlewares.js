// middleware/authMiddlewares.js
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { PASSWORD_CHANGE_PURPOSE } from '../utils/passwordSecurity.js';

const INACTIVE_ACCOUNT_ERROR = 'Your account has been deactivated. Please contact your administrator.';
const ACCOUNT_STATUS_CACHE_TTL_MS = 10_000;
const accountStatusCache = new Map();

const getCachedAccountStatus = async (cacheKey, loader) => {
  const cached = accountStatusCache.get(cacheKey);
  if (cached && Date.now() - cached.createdAt < ACCOUNT_STATUS_CACHE_TTL_MS) {
    return cached.value;
  }

  const value = await loader();
  accountStatusCache.set(cacheKey, { value, createdAt: Date.now() });
  return value;
};

const isCustomerAccountInactive = (user) => {
  if (!user) return true;
  if (!user.isActive) return true;

  const accountStatus = String(user.accountStatus || '').trim().toUpperCase();
  if (accountStatus && accountStatus !== 'ACTIVE') return true;

  const subscriptionStatus = String(user.subscriptionStatus || '').trim().toUpperCase();
  if (subscriptionStatus && ['TRIAL_EXPIRED', 'SUBSCRIPTION_EXPIRED', 'INACTIVE', 'CANCELLED'].includes(subscriptionStatus)) {
    return true;
  }

  return false;
};

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    if (decoded.purpose === PASSWORD_CHANGE_PURPOSE) {
      return res.status(403).json({ error: 'This token can only be used to change the password' });
    }

    if (decoded.type === 'engineer') {
      const owner = await getCachedAccountStatus(`company:${decoded.companyId}`, () => (
        prisma.user.findFirst({
          where: {
            companyId: String(decoded.companyId),
            role: { in: ['Admin', 'ADMIN'] }
          },
          select: {
            isActive: true,
            accountStatus: true,
            subscriptionStatus: true
          }
        })
      ));

      if (isCustomerAccountInactive(owner)) {
        console.log('❌ Engineer attempted access for inactive customer account:', decoded.username);
        return res.status(403).json({
          error: INACTIVE_ACCOUNT_ERROR
        });
      }

      req.user = decoded;
      return next();
    }
    // Admin/user - keep the existing isActive re-check on every request.
    const user = await getCachedAccountStatus(`user:${decoded.userId}`, () => (
      prisma.user.findUnique({
        where: { id: String(decoded.userId) },
        select: { isActive: true }
      })
    ));

    if (!user || !user.isActive) {
      console.log('❌ Deactivated user attempted access:', decoded.email);
      return res.status(403).json({
        error: INACTIVE_ACCOUNT_ERROR
      });
    }
    req.user = decoded;
    next();
  });
};

export const authenticatePasswordChangeToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err || decoded.purpose !== PASSWORD_CHANGE_PURPOSE || !decoded.userId) {
      return res.status(403).json({ error: 'A valid password-change token is required' });
    }
    req.user = decoded;
    next();
  });
};

export const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      console.error('❌ No user found in request');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.user.role) {
      console.error('❌ No role found in token:', req.user);
      return res.status(403).json({ 
        error: 'No role found in token',
        tokenData: req.user 
      });
    }

    const userRole = req.user.role.toUpperCase().trim();
    const allowedRoles = roles.map(role => role.toUpperCase().trim());

    console.log('🔒 Authorization Check:');
    console.log('   Endpoint requires:', allowedRoles);
    console.log('   User has role:', userRole);
    console.log('   Is authorized?', allowedRoles.includes(userRole));

    if (!allowedRoles.includes(userRole)) {
      console.error('❌ Authorization failed');
      return res.status(403).json({
        error: 'You do not have permission to perform this action',
        requiredRole: roles,
        yourRole: req.user.role,
        debugInfo: {
          userRoleUppercase: userRole,
          allowedRolesUppercase: allowedRoles
        }
      });
    }

    console.log('✅ Authorization successful');
    next();
  };
};
