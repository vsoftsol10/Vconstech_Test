// src/routes/engineerRoute.js
import express from 'express';
import { prisma } from '../config/database.js';
import { authenticateToken } from '../middlewares/authMiddlewares.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { sendEmail } from '../utils/mailer.js';

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/engineers';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'engineer-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif)'));
    }
  }
});

const normalizeEngineerStatus = (status) => {
  const value = typeof status === 'string' ? status.trim().toLowerCase() : '';
  return value === 'inactive' ? 'Inactive' : 'Active';
};

const INACTIVE_ACCOUNT_ERROR = 'Your account has been deactivated. Please contact your administrator.';

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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPLOYEE_LOGIN_URL = 'https://erp.thevsoft.com/employee-login';

const getEmployeeLoginUrl = () => EMPLOYEE_LOGIN_URL;

const sendEngineerWelcomeEmail = async ({ engineer, email, password }) => {
  if (!email || !EMAIL_PATTERN.test(email)) {
    console.log('[Engineer Email] Skipped welcome email because engineer email is missing or invalid');
    return null;
  }

  const employeeLoginUrl = getEmployeeLoginUrl();
  const result = await sendEmail({
    to: email,
    subject: 'Welcome to Vconstech ERP - Your engineer account is ready',
    html: `
      <div style="margin:0;padding:24px;background:#f3f6fb">
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:620px;margin:auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
          <div style="background:#0f4fa8;padding:24px 28px;color:#ffffff">
            <h2 style="margin:0;font-size:24px;line-height:1.3">Welcome to Vconstech ERP</h2>
          </div>
          <div style="padding:28px">
            <p style="margin:0 0 10px;font-size:16px">Hi <strong>${engineer.name}</strong>,</p>
            <p style="margin:0 0 22px;color:#374151">Your engineer account has been created successfully.</p>
            <div style="background:#f8fafc;border:1px solid #dbeafe;border-radius:12px;padding:18px;margin:0 0 22px">
              <h3 style="margin:0 0 14px;font-size:17px;color:#0f4fa8">Employee Portal Credentials</h3>
              <p style="margin:0 0 8px;color:#4b5563"><strong style="color:#111827">Engineer Name:</strong><br/>${engineer.name}</p>
              <p style="margin:0 0 8px;color:#4b5563"><strong style="color:#111827">Username:</strong><br/>${engineer.username}</p>
              <p style="margin:0 0 8px;color:#4b5563"><strong style="color:#111827">Email:</strong><br/>${engineer.email}</p>
              <p style="margin:0 0 8px;color:#4b5563"><strong style="color:#111827">Password:</strong><br/>${password}</p>
              <p style="margin:0 0 16px;color:#4b5563"><strong style="color:#111827">Employee Login URL:</strong><br/><a href="${employeeLoginUrl}" style="color:#0f6fdc;text-decoration:none">${employeeLoginUrl}</a></p>
              <a href="${employeeLoginUrl}" style="background:#0f6fdc;color:#ffffff;padding:12px 18px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:700">Login to Employee Portal</a>
            </div>
            <p style="margin:0 0 18px;color:#374151">Please log in with these credentials and keep them secure.</p>
            <p style="margin:0;color:#374151">Best Regards,<br/><strong>Vconstech ERP</strong></p>
          </div>
        </div>
      </div>
    `
  });

  if (!result.success) {
    console.error('[Engineer Email] Failed to send welcome email:', result.error);
  }

  return result;
};

const sendEngineerPasswordUpdatedEmail = async ({ engineer, email }) => {
  if (!email || !EMAIL_PATTERN.test(email)) {
    console.log('[Engineer Email] Skipped password update email because engineer email is missing or invalid');
    return null;
  }

  const employeeLoginUrl = getEmployeeLoginUrl();

  const result = await sendEmail({
    to: email,
    subject: 'Vconstech ERP - Your engineer password was updated',
    html: `
      <div style="margin:0;padding:24px;background:#f3f6fb">
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:620px;margin:auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
          <div style="background:#0f4fa8;padding:24px 28px;color:#ffffff">
            <h2 style="margin:0;font-size:24px;line-height:1.3">Engineer Password Updated</h2>
          </div>
          <div style="padding:28px">
            <p style="margin:0 0 10px;font-size:16px">Hi <strong>${engineer.name}</strong>,</p>
            <p style="margin:0 0 22px;color:#374151">Your engineer account password has been updated by your administrator.</p>
            <div style="background:#f8fafc;border:1px solid #dbeafe;border-radius:12px;padding:18px;margin:0 0 22px">
              <h3 style="margin:0 0 14px;font-size:17px;color:#0f4fa8">Employee Portal Credentials</h3>
              <p style="margin:0 0 8px;color:#4b5563"><strong style="color:#111827">Engineer Name:</strong><br/>${engineer.name}</p>
              <p style="margin:0 0 8px;color:#4b5563"><strong style="color:#111827">Username:</strong><br/>${engineer.username || 'Not provided'}</p>
              <p style="margin:0 0 8px;color:#4b5563"><strong style="color:#111827">Updated Password:</strong><br/>${engineer.plainPassword}</p>
              <p style="margin:0 0 16px;color:#4b5563"><strong style="color:#111827">Employee Login URL:</strong><br/><a href="${employeeLoginUrl}" style="color:#0f6fdc;text-decoration:none">${employeeLoginUrl}</a></p>
              <a href="${employeeLoginUrl}" style="background:#0f6fdc;color:#ffffff;padding:12px 18px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:700">Login to Employee Portal</a>
            </div>
            <p style="margin:0 0 18px;color:#374151">Please use this updated password for your employee portal access and keep it secure.</p>
            <p style="margin:0;color:#374151">Best Regards,<br/><strong>Vconstech ERP</strong></p>
          </div>
        </div>
      </div>
    `
  });

  if (!result.success) {
    console.error('[Engineer Email] Failed to send password update email:', result.error);
  }

  return result;
};

// ============================================
// ENGINEER LOGIN ENDPOINT
// ============================================
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('🔐 Engineer login attempt:', { username });

    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Username and password are required' 
      });
    }

    const engineer = await prisma.engineer.findFirst({
      where: { username },
      include: {
        company: {
          select: { id: true, name: true }
        }
      }
    });

    if (!engineer) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid username or password' 
      });
    }

    if (!engineer.password) {
      return res.status(401).json({ 
        success: false,
        error: 'No credentials set for this engineer. Please contact your administrator.' 
      });
    }

    const owner = await prisma.user.findFirst({
      where: {
        companyId: engineer.companyId,
        role: { in: ['Admin', 'ADMIN'] }
      },
      select: {
        isActive: true,
        accountStatus: true,
        subscriptionStatus: true
      }
    });

    if (isCustomerAccountInactive(owner)) {
      console.log('❌ Engineer login blocked for inactive customer account:', { username, companyId: engineer.companyId });
      return res.status(403).json({
        success: false,
        error: INACTIVE_ACCOUNT_ERROR
      });
    }

    const isPasswordValid = await bcrypt.compare(password, engineer.password);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid username or password' 
      });
    }

    // ✅ FIX: JWT payload now includes all fields that backend controllers expect.
    //
    // WHY THIS MATTERS FOR NOTIFICATIONS:
    //   - Notification.engineerId is an Int (Engineer.id)
    //   - notificationController reads: req.user?.engineerId || req.user?.id || req.user?.userId
    //   - materialRequestController reads: req.user?.engineerId || req.user?.id || req.user?.userId
    //   - Both resolve to engineer.id (Int) correctly via req.user.id OR req.user.engineerId
    //
    // WHY role: 'SITE_ENGINEER' (uppercase):
    //   - notificationController uses isEngineer() which checks .toUpperCase()
    //   - So 'Site_Engineer' would also work now, but UPPERCASE is the standard
    //   - getMyRequests, my-projects etc. check: req.user.type !== 'engineer' || role !== 'Site_Engineer'
    //   - type: 'engineer' handles those checks — role casing doesn't matter for them
    const token = jwt.sign(
      { 
        id: engineer.id,           // ✅ Engineer.id (Int) — used by notification & request controllers
        engineerId: engineer.id,   // ✅ Explicit alias — belt-and-suspenders for all controllers
        userId: engineer.id,       // ✅ Alias — some controllers fall back to req.user.userId
        username: engineer.username,
        name: engineer.name,
        companyId: engineer.companyId,
        role: 'SITE_ENGINEER',     // ✅ UPPERCASE — matches isEngineer() check in notificationController
        type: 'engineer'           // ✅ Kept — used by my-projects and my-profile guards
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    console.log('✅ Token generated for engineer:', engineer.name);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      engineer: {
        id: engineer.id,
        name: engineer.name,
        email: engineer.email,
        username: engineer.username,
        empId: engineer.empId,
        phone: engineer.phone,
        designation: engineer.designation || null, 
        status: normalizeEngineerStatus(engineer.status),
        profileImage: engineer.profileImage,
        companyId: engineer.companyId,
        companyName: engineer.company.name
      }
    });

  } catch (error) {
    console.error('❌ Engineer login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Login failed. Please try again.' 
    });
  }
});

router.get('/my-projects', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Fetching projects for engineer:', req.user);

    if (req.user.type !== 'engineer' && req.user.role !== 'SITE_ENGINEER') {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied. This endpoint is for engineers only.' 
      });
    }

    const engineerId = req.user.id;
    const companyId = req.user.companyId;

    const projects = await prisma.project.findMany({
      where: {
        companyId,
        assignedEngineerId: engineerId
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ 
      success: true,
      projects,
      count: projects.length,
      message: `Found ${projects.length} assigned projects`
    });

  } catch (error) {
    console.error('❌ Error fetching engineer projects:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch assigned projects',
      details: error.message 
    });
  }
});

// Get engineer's own profile
router.get('/my-profile', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'engineer' && req.user.role !== 'SITE_ENGINEER') {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied. This endpoint is for engineers only.' 
      });
    }

    const engineer = await prisma.engineer.findUnique({
      where: { id: req.user.id },
      select: {
  id: true, name: true, empId: true, email: true, phone: true,
  alternatePhone: true, designation: true, address: true,  // <-- add designation
  status: true,
  profileImage: true, username: true, createdAt: true,
  company: { select: { id: true, name: true } }
}
    });

    if (!engineer) {
      return res.status(404).json({ 
        success: false,
        error: 'Engineer profile not found' 
      });
    }

    res.json({
      success: true,
      engineer: {
        ...engineer,
        status: normalizeEngineerStatus(engineer.status)
      }
    });

  } catch (error) {
    console.error('Error fetching engineer profile:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch profile' 
    });
  }
});

// Salary history for the logged-in engineer only. This keeps payslip data private.
router.get('/my-salaries', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'engineer' && req.user.role !== 'SITE_ENGINEER') {
      return res.status(403).json({ success: false, error: 'Access denied. This endpoint is for engineers only.' });
    }

    const salaries = await prisma.engineerSalary.findMany({
      where: { engineerId: req.user.id, companyId: req.user.companyId },
      orderBy: [{ effectiveFrom: 'desc' }, { createdAt: 'desc' }],
      select: { id: true, amount: true, allowances: true, deductions: true, expenses: true, allowanceItems: true, deductionItems: true, effectiveFrom: true, notes: true, createdAt: true },
    });

    res.json({ success: true, salaries });
  } catch (error) {
    console.error('Error fetching engineer payslip history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch salary history' });
  }
});

// ============================================
// ADMIN ROUTES (Protected)
// ============================================

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        city: true,
        address: true,
        package: true,
        customMembers: true,
        role: true,
        companyId: true,
        company: { select: { name: true } }
      }
    });

    if (!user) {
      return res.status(404).json({ success: true, error: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user data' });
  }
});

// Get all engineers for the authenticated user's company
router.get('/', authenticateToken, async (req, res) => {
  try {
    const engineers = await prisma.engineer.findMany({
      where: { companyId: req.user.companyId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, empId: true, email: true, phone: true,
        alternatePhone: true, designation: true, address: true,  // <-- add designation
        status: true,
        profileImage: true, username: true, plainPassword: true,
        createdAt: true, updatedAt: true,
        projects: {
          select: { id: true, name: true, projectId: true },
          orderBy: { name: 'asc' },
        },
        _count: { select: { projects: true } }
      }
    });

    res.json({
      success: true,
      engineers: engineers.map((engineer) => ({
        ...engineer,
        status: normalizeEngineerStatus(engineer.status)
      }))
    });
  } catch (error) {
    console.error('Error fetching engineers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch engineers' });
  }
});

// Salary history for one engineer. The company filter prevents cross-company access.
router.get('/:id/salaries', authenticateToken, async (req, res) => {
  try {
    const engineerId = Number.parseInt(req.params.id, 10);
    const engineer = await prisma.engineer.findFirst({ where: { id: engineerId, companyId: req.user.companyId } });
    if (!engineer) return res.status(404).json({ success: false, error: 'Engineer not found' });

    const salaries = await prisma.engineerSalary.findMany({
      where: { engineerId, companyId: req.user.companyId },
      orderBy: [{ effectiveFrom: 'desc' }, { createdAt: 'desc' }],
    });
    res.json({ success: true, salaries });
  } catch (error) {
    console.error('Error fetching engineer salaries:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch salary history',
      ...(process.env.NODE_ENV !== 'production' ? { details: error.message } : {}),
    });
  }
});

// Add a salary record. Records are retained so the salary history can be reviewed.
router.post('/:id/salaries', authenticateToken, async (req, res) => {
  try {
    const engineerId = Number.parseInt(req.params.id, 10);
    const amount = Number(req.body.amount);
    const normalizeItems = (items, label) => {
      if (!Array.isArray(items)) return [];
      return items.filter((item) => item?.name || item?.amount).map((item) => {
        const name = String(item?.name || '').trim();
        const itemAmount = Number(item?.amount);
        if (!name || !Number.isFinite(itemAmount) || itemAmount < 0) throw new Error(`Each ${label} needs a name and a valid amount`);
        return { name, amount: itemAmount };
      });
    };
    let allowanceItems;
    let deductionItems;
    try {
      allowanceItems = normalizeItems(req.body.allowanceItems, 'allowance');
      deductionItems = normalizeItems(req.body.deductionItems, 'deduction');
    } catch (validationError) {
      return res.status(400).json({ success: false, error: validationError.message });
    }
    // Keep older clients compatible while making named line items the source of
    // truth whenever the new form supplies them.
    const allowances = allowanceItems.length ? allowanceItems.reduce((total, item) => total + item.amount, 0) : Number(req.body.allowances || 0);
    const deductions = deductionItems.length ? deductionItems.reduce((total, item) => total + item.amount, 0) : Number(req.body.deductions || 0);
    const expenses = Number(req.body.expenses || 0);
    const effectiveFrom = new Date(req.body.effectiveFrom);
    const notes = typeof req.body.notes === 'string' ? req.body.notes.trim() : '';

    if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ success: false, error: 'Enter a valid salary amount' });
    if (![allowances, deductions, expenses].every((value) => Number.isFinite(value) && value >= 0)) {
      return res.status(400).json({ success: false, error: 'Allowances, deductions, and expenses must be valid positive amounts' });
    }
    if (Number.isNaN(effectiveFrom.getTime())) return res.status(400).json({ success: false, error: 'Enter a valid effective date' });

    const engineer = await prisma.engineer.findFirst({ where: { id: engineerId, companyId: req.user.companyId } });
    if (!engineer) return res.status(404).json({ success: false, error: 'Engineer not found' });

    const salary = await prisma.engineerSalary.create({
      data: { engineerId, companyId: req.user.companyId, amount, allowances, deductions, expenses, allowanceItems, deductionItems, effectiveFrom, notes: notes || null },
    });
    res.status(201).json({ success: true, message: 'Salary added successfully', salary });
  } catch (error) {
    console.error('Error adding engineer salary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add salary',
      ...(process.env.NODE_ENV !== 'production' ? { details: error.message } : {}),
    });
  }
});

// Get single engineer by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const engineer = await prisma.engineer.findFirst({
      where: {
        id: parseInt(id),
        companyId: req.user.companyId
      },
      select: {
        id: true, name: true, empId: true, email: true, phone: true,
        alternatePhone: true, designation: true, address: true,  // <-- add designation
        status: true,
        profileImage: true, username: true, plainPassword: true,
        createdAt: true, updatedAt: true,
        projects: {
          select: {
            id: true,
            name: true,
            projectId: true,
            status: true
          }
        }
      }
    });

    if (!engineer) {
      return res.status(404).json({ success: false, error: 'Engineer not found' });
    }

    res.json({
      success: true,
      engineer: {
        ...engineer,
        status: normalizeEngineerStatus(engineer.status)
      }
    });
  } catch (error) {
    console.error('Error fetching engineer:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch engineer' });
  }
});

// Create new engineer
router.post('/', authenticateToken, upload.single('profileImage'), async (req, res) => {
  try {
    const { name, phone, alternatePhone, empId, address, username, password, designation, status, email } = req.body;
    const adminUserId = req.user?.userId || req.user?.id || req.user?.engineerId;
    const fallbackCompanyId = req.user?.companyId;
    const missingFields = [];
    if (!name?.trim()) missingFields.push('name');
    if (!phone?.trim()) missingFields.push('phone');
    if (!empId?.trim()) missingFields.push('empId');
    if (!address?.trim()) missingFields.push('address');
    if (!email?.trim()) missingFields.push('email');
    if (!username?.trim()) missingFields.push('username');
    if (!password) missingFields.push('password');

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields
      });
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ success: false, error: 'Phone number must be 10 digits' });
    }

    if (alternatePhone && !phoneRegex.test(alternatePhone)) {
      return res.status(400).json({ success: false, error: 'Alternate phone number must be 10 digits' });
    }

    const normalizedEmail = email.trim();
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      return res.status(400).json({ success: false, error: 'Enter a valid engineer email' });
    }

    const normalizedStatus = (status || 'Active').trim();
    if (!['Active', 'Inactive'].includes(normalizedStatus)) {
      return res.status(400).json({ success: false, error: 'Invalid engineer status' });
    }

    const normalizedEmpId = empId.trim();
    const normalizedUsername = username.trim();

    const admin = await prisma.user.findUnique({
      where: { id: adminUserId },
      select: { companyId: true, package: true, customMembers: true }
    });

    console.log('Admin package debug:', { userId: adminUserId, package: admin?.package, customMembers: admin?.customMembers });

    if (!admin) {
      return res.status(400).json({ success: false, error: 'Admin account not found.' });
    }

    const companyId = fallbackCompanyId || admin.companyId;
    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: 'Company context is missing for this request.'
      });
    }

    const existingEngineer = await prisma.engineer.findFirst({
      where: { empId: normalizedEmpId, companyId }
    });

    if (existingEngineer) {
      return res.status(400).json({ success: false, error: 'Employee ID already exists' });
    }

    const existingEmail = await prisma.engineer.findFirst({
      where: { email: normalizedEmail, companyId }
    });

    if (existingEmail) {
      return res.status(400).json({ success: false, error: 'Engineer email already exists' });
    }

    if (username) {
      if (username.length < 4) {
        return res.status(400).json({ success: false, error: 'Username must be at least 4 characters' });
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).json({ success: false, error: 'Username can only contain letters, numbers, and underscores' });
      }

      const existingUsername = await prisma.engineer.findFirst({
        where: { username: normalizedUsername, companyId }
      });
      if (existingUsername) {
        return res.status(400).json({ success: false, error: 'Username already taken. Please choose a different username.' });
      }

      if (password.length < 6) {
        return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
      }
    }

    const pkg = admin.package?.toLowerCase();
    let memberLimit;
    if (pkg === 'basic') memberLimit = 5;
    else if (pkg === 'premium') memberLimit = 10;
    else if (pkg === 'advanced') memberLimit = admin.customMembers || 999;
    else memberLimit = 5; // fallback

    const existingEngineersCount = await prisma.engineer.count({
      where: { companyId }
    });

    if (existingEngineersCount >= memberLimit) {
      return res.status(400).json({
        success: false,
        error: `Cannot add more engineers. Your ${admin.package} package allows maximum ${memberLimit} site engineers. You currently have ${existingEngineersCount} engineers. Please upgrade your package to add more.`
      });
    }

    let hashedPassword = null;
    if (password && username) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const profileImagePath = req.file ? `/uploads/engineers/${req.file.filename}` : null;

    const engineer = await prisma.engineer.create({
      data: {
        name: name.trim(),
        empId: normalizedEmpId,
        email: normalizedEmail,
        phone: phone.trim(),
        alternatePhone: alternatePhone || null,
        designation: designation || null,
        address: address.trim(),
        status: normalizedStatus,
        profileImage: profileImagePath,
        username: normalizedUsername,
        password: hashedPassword,
        plainPassword: password,
        companyId
      },
      select: {
  id: true, name: true, empId: true, email: true, phone: true,
  alternatePhone: true, designation: true, address: true,  // <-- add designation
  status: true,
  profileImage: true, username: true, createdAt: true, updatedAt: true
}
    });

    await sendEngineerWelcomeEmail({
      engineer,
      email: engineer.email,
      password
    });

    res.status(201).json({
      success: true,
      message: 'Engineer added successfully',
      engineer: {
        ...engineer,
        status: normalizeEngineerStatus(engineer.status)
      }
    });
  } catch (error) {
    console.error('Error creating engineer:', error);
    if (req.file) {
      fs.unlink(req.file.path, (err) => { if (err) console.error('Error deleting file:', err); });
    }
    res.status(500).json({ success: false, error: 'Failed to create engineer' });
  }
});

// Update engineer
router.put('/:id', authenticateToken, upload.single('profileImage'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, alternatePhone, empId, address, username, password, designation, status, email } = req.body;
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: 'Company context is missing for this request.'
      });
    }
    const existingEngineer = await prisma.engineer.findFirst({
      where: { id: parseInt(id), companyId }
    });

    if (!existingEngineer) {
      return res.status(404).json({ success: false, error: 'Engineer not found' });
    }

    if (!name || !phone || !empId || !address || !email) {
      return res.status(400).json({ success: false, error: 'Name, phone, employee ID, email, and address are required' });
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ success: false, error: 'Phone number must be 10 digits' });
    }

    if (alternatePhone && !phoneRegex.test(alternatePhone)) {
      return res.status(400).json({ success: false, error: 'Alternate phone number must be 10 digits' });
    }

    const normalizedEmail = email.trim();
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      return res.status(400).json({ success: false, error: 'Enter a valid engineer email' });
    }

    const normalizedStatus = status ? status.trim() : existingEngineer.status || 'Active';
    if (!['Active', 'Inactive'].includes(normalizedStatus)) {
      return res.status(400).json({ success: false, error: 'Invalid engineer status' });
    }

    const duplicateEngineer = await prisma.engineer.findFirst({
      where: { empId: empId.trim(), companyId, NOT: { id: parseInt(id) } }
    });

    if (duplicateEngineer) {
      return res.status(400).json({ success: false, error: 'Employee ID already exists' });
    }

    const duplicateEmail = await prisma.engineer.findFirst({
      where: { email: normalizedEmail, companyId, NOT: { id: parseInt(id) } }
    });

    if (duplicateEmail) {
      return res.status(400).json({ success: false, error: 'Engineer email already exists' });
    }

    if (username) {
      if (username.length < 4) {
        return res.status(400).json({ success: false, error: 'Username must be at least 4 characters' });
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).json({ success: false, error: 'Username can only contain letters, numbers, and underscores' });
      }

      const duplicateUsername = await prisma.engineer.findFirst({
        where: { username: username.trim(), companyId, NOT: { id: parseInt(id) } }
      });
      if (duplicateUsername) {
       return res.status(400).json({ success: false, error: 'Username already taken. Please choose a different username.' });
      }
    }

    let hashedPassword = existingEngineer.password;
    let plainPasswordToStore = existingEngineer.plainPassword;
    
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
      }
      hashedPassword = await bcrypt.hash(password, 10);
      plainPasswordToStore = password;
    }

    let profileImagePath = existingEngineer.profileImage;
    if (req.file) {
      if (existingEngineer.profileImage) {
        const oldImagePath = path.join(process.cwd(), existingEngineer.profileImage);
        if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
      }
      profileImagePath = `/uploads/engineers/${req.file.filename}`;
    }

    const engineer = await prisma.engineer.update({
      where: { id: parseInt(id) },
      data: {
        name: name.trim(),
        empId: empId.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        alternatePhone: alternatePhone || null,
        designation: designation || null,
        address: address.trim(),
        status: normalizedStatus,
        profileImage: profileImagePath,
        username: username ? username.trim() : null,
        password: hashedPassword,
        plainPassword: plainPasswordToStore
      },
      select: {
  id: true, name: true, empId: true, email: true, phone: true,
  alternatePhone: true, designation: true, address: true,  // <-- add designation
  status: true,
  profileImage: true, username: true, plainPassword: true, createdAt: true, updatedAt: true
}
    });

    if (password) {
      await sendEngineerPasswordUpdatedEmail({
        engineer,
        email: engineer.email
      });
    }

    res.json({
      success: true,
      message: 'Engineer updated successfully',
      engineer: {
        ...engineer,
        status: normalizeEngineerStatus(engineer.status)
      }
    });
  } catch (error) {
    console.error('Error updating engineer:', error);
    if (req.file) {
      fs.unlink(req.file.path, (err) => { if (err) console.error('Error deleting file:', err); });
    }
    res.status(500).json({ success: false, error: 'Failed to update engineer' });
  }
});

// Delete engineer
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const engineer = await prisma.engineer.findFirst({
      where: { id: parseInt(id), companyId: req.user.companyId }
    });

    if (!engineer) {
      return res.status(404).json({ success: false, error: 'Engineer not found' });
    }

    if (engineer.profileImage) {
      const imagePath = path.join(process.cwd(), engineer.profileImage);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    await prisma.engineer.delete({ where: { id: parseInt(id) } });

    res.json({ success: true, message: 'Engineer deleted successfully' });
  } catch (error) {
    console.error('Error deleting engineer:', error);
    res.status(500).json({ success: false, error: 'Failed to delete engineer' });
  }
});

export default router;

