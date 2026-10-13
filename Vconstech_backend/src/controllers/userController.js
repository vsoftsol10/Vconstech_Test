import { prisma } from '../config/database.js';
import bcrypt from 'bcryptjs';
import { getPlanTemplateLimit } from '../config/planTemplateLimits.js';
import { isStrongPassword, PASSWORD_CHANGE_PURPOSE } from '../utils/passwordSecurity.js';

const normalizeEngineerStatus = (status) => {
  const value = typeof status === 'string' ? status.trim().toLowerCase() : '';
  return value === 'inactive' ? 'Inactive' : 'Active';
};

const PAID_SUBSCRIPTION_DURATION_MONTHS = Number(
  process.env.ERP_PAID_SUBSCRIPTION_MONTHS || 12
);

const getPaidSubscriptionExpiry = (startDate) => {
  const expiryDate = new Date(startDate);
  expiryDate.setMonth(expiryDate.getMonth() + PAID_SUBSCRIPTION_DURATION_MONTHS);
  return expiryDate;
};

// Get all engineers in the same company
export const getEmployees = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    console.log('==================');
    console.log('Logged in user:', req.user);
    console.log('Looking for companyId:', companyId);
    console.log('==================');

    const employees = await prisma.engineer.findMany({
      where: {
        companyId
      },
      select: {
        id: true,
        name: true,
        empId: true,
        phone: true,
        alternatePhone: true,
        status: true,
        companyId: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log('Found engineers:', employees.length);
    console.log('Engineers data:', employees);

    res.json({
      count: employees.length,
      employees: employees.map((employee) => ({
        ...employee,
        status: normalizeEngineerStatus(employee.status)
      }))
    });

  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch employees',
      details: error.message 
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const users = await prisma.user.findMany({
      where: {
        companyId
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      count: users.length,
      users
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users',
      details: error.message 
    });
  }
};

// ✅ UPDATED: Get user profile by ID (includes GST number)
export const getSelectedTemplate = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { selectedTemplateId: true, package: true, subscriptionPlan: true, customTemplateLimit: true } });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    const templateLimit = getPlanTemplateLimit(user.package || user.subscriptionPlan, user.customTemplateLimit);
    res.json({ success: true, selectedTemplateId: user.selectedTemplateId <= templateLimit ? user.selectedTemplateId : 1, templateLimit });
  } catch { res.status(500).json({ success: false, error: 'Failed to load document template' }); }
};

export const updateSelectedTemplate = async (req, res) => {
  try {
    const selectedTemplateId = Number(req.body.selectedTemplateId);
    if (!Number.isInteger(selectedTemplateId) || selectedTemplateId < 1 || selectedTemplateId > 10) return res.status(400).json({ success: false, error: 'Invalid template id' });
    const user = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { package: true, subscriptionPlan: true, customTemplateLimit: true } });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    const templateLimit = getPlanTemplateLimit(user.package || user.subscriptionPlan, user.customTemplateLimit);
    if (selectedTemplateId > templateLimit) return res.status(403).json({ success: false, error: 'This template requires a plan upgrade', templateLimit });
    await prisma.user.update({ where: { id: req.user.userId }, data: { selectedTemplateId } });
    res.json({ success: true, selectedTemplateId, message: 'Document template saved' });
  } catch { res.status(500).json({ success: false, error: 'Failed to save document template' }); }
};

export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('🔍 Getting profile for userId:', userId);
    console.log('🔍 Request user:', req.user);

    if (req.user.userId !== userId && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to view this profile'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        city: true,
        address: true,
        gstNumber: true, // ✅ Added GST number
        role: true,
        package: true,
        customMembers: true,
        customProjectLimit: true,
        customPrice: true,
        customTemplateLimit: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        accountStatus: true,
        isActive: true,
        trialEndDate: true,
        selectedTemplateId: true,
        subscriptionStartedAt: true,
        companyId: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log('✅ User found:', user);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Accounts created before subscription expiry was introduced do not have an
    // end date stored. Give active paid accounts a real one-year end date so
    // the profile and the scheduled expiry process use the same value.
    const isActivePaidAccount = Boolean(
      user.isActive &&
      user.package &&
      user.subscriptionStatus !== 'TRIAL_ACTIVE'
    );

    if (!user.trialEndDate && isActivePaidAccount) {
      const subscriptionStartedAt = user.subscriptionStartedAt || user.createdAt;
      const trialEndDate = getPaidSubscriptionExpiry(subscriptionStartedAt);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionStartedAt,
          subscriptionStatus: 'SUBSCRIPTION_ACTIVE',
          trialEndDate
        }
      });

      user.subscriptionStartedAt = subscriptionStartedAt;
      user.subscriptionStatus = 'SUBSCRIPTION_ACTIVE';
      user.trialEndDate = trialEndDate;
    }

    // Fetch company separately with logo
    if (user.companyId) {
      const company = await prisma.company.findUnique({
        where: { id: user.companyId }
      });

      console.log('✅ Company found:', company);

      // Merge company data when available, but do not fail the profile load
      // if the company row has not been created yet or was removed.
      if (company) {
        user.company = {
          id: company.id,
          name: company.name,
          logo: company.logo
        };
      }
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('❌ Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile',
      details: error.message
    });
  }
};

// ✅ UPDATED: Update user profile (includes GST number)
export const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, phoneNumber, city, address, gstNumber, companyName } = req.body; // ✅ Added gstNumber

    if (req.user.userId !== userId && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to update this profile'
      });
    }

    // Validate required fields
    if (!name || !email || !phoneNumber || !city || !address) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Validate phone number
    if (!/^\d{10}$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Phone number must be 10 digits'
      });
    }

    // ✅ Optional: Validate GST number format (15 characters alphanumeric)
    if (gstNumber && gstNumber.trim() !== '') {
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(gstNumber)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid GST number format (e.g., 22AAAAA0000A1Z5)'
        });
      }
    }

    // Check email uniqueness
    if (email !== req.user.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          id: { not: userId }
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Email is already in use'
        });
      }
    }

    // Handle company name update properly
    let updateData = {
      name,
      email,
      phoneNumber,
      city,
      address,
      gstNumber: gstNumber || '', // ✅ Added GST number to update data
      updatedAt: new Date()
    };

    // Get current user to find their company
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true }
    });

    // If companyName is provided and user has a company, UPDATE the existing company
    if (companyName && currentUser.companyId) {
      await prisma.company.update({
        where: { id: currentUser.companyId },
        data: { 
          name: companyName,
          updatedAt: new Date()
        }
      });
    } 
    // If companyName is provided but user has NO company, create one
    else if (companyName && !currentUser.companyId) {
      const newCompany = await prisma.company.create({
        data: { name: companyName }
      });
      updateData.companyId = newCompany.id;
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        city: true,
        address: true,
        gstNumber: true, // ✅ Include GST number in response
        role: true,
        package: true,
        customMembers: true,
        customProjectLimit: true,
        customPrice: true,
        customTemplateLimit: true,
        selectedTemplateId: true,
        company: {
          select: {
            id: true,
            name: true,
            logo: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user profile',
      details: error.message
    });
  }
};

// ✅ FIXED: Change user password
export const changeUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body;
    const forcedChange = req.user?.purpose === PASSWORD_CHANGE_PURPOSE;
    const targetUserId = forcedChange ? req.user.userId : userId;

    if (!targetUserId || (!forcedChange && req.user.userId !== targetUserId)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to change this password'
      });
    }

    // Validate required fields
    if ((!forcedChange && !currentPassword) || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    // Validate new password length
    if (forcedChange && !isStrongPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 12 characters and include uppercase, lowercase, number, and symbol'
      });
    }
    if (!forcedChange && newPassword.length < 6) return res.status(400).json({ success: false, error: 'New password must be at least 6 characters long' });

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: targetUserId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify current password
    const isPasswordValid = forcedChange || await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: targetUserId },
      data: {
        password: hashedPassword,
        ...(forcedChange ? { mustChangePassword: false, passwordExpiresAt: null } : {}),
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password',
      details: error.message
    });
  }
};

// ✅ NEW: Upload company logo (Admin only)
export const uploadCompanyLogo = async (req, res) => {
  try {
    const { userId } = req.params;

    // ✅ FIXED: && instead of ||
    if (req.user.userId !== userId && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can upload company logo'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true }
    });

    if (!user || !user.companyId) {
      return res.status(404).json({
        success: false,
        error: 'User or company not found'
      });
    }

    const logoUrl = `/uploads/logos/${req.file.filename}`;
    
    await prisma.company.update({
      where: { id: user.companyId },
      data: { logo: logoUrl, updatedAt: new Date() }
    });

    res.json({
      success: true,
      message: 'Company logo uploaded successfully',
      logoUrl
    });

  } catch (error) {
    console.error('Upload company logo error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload company logo',
      details: error.message
    });
  }
};
