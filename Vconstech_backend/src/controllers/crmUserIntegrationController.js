import bcrypt from 'bcryptjs';
import { prisma } from '../config/database.js';

const PLANS = new Set(['Free Trial', 'Basic', 'Premium', 'Advanced']);
const FIELDS = new Set(['crmCustomerId', 'name', 'email', 'phone', 'companyName', 'address', 'city', 'gstNumber', 'plan', 'startDate', 'endDate', 'customMembers', 'customProjectLimit', 'customPrice', 'temporaryPassword']);
const SUBSCRIPTION_FIELDS = new Set(['crmCustomerId', 'plan', 'startDate', 'trialEndDate', 'customMembers', 'customProjectLimit', 'customPrice']);
const text = (value) => typeof value === 'string' ? value.trim() : '';
const email = (value) => text(value).toLowerCase();
const validDate = (value) => value && !Number.isNaN(new Date(value).getTime());
const isPositiveInteger = (value) => Number.isInteger(value) && value >= 0;
const isNonNegativeNumber = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0;

export const validateCrmUserPayload = (payload) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return 'Request body must be an object';
  if (Object.keys(payload).some((key) => !FIELDS.has(key))) return 'Unknown fields are not allowed';
  for (const field of ['crmCustomerId', 'name', 'email', 'companyName', 'plan', 'startDate', 'endDate', 'temporaryPassword']) {
    if (!text(payload[field])) return `${field} is required`;
  }
  if (!/^\S+@\S+\.\S+$/.test(email(payload.email))) return 'email is invalid';
  if (!PLANS.has(text(payload.plan))) return 'plan is invalid';
  if (!validDate(payload.startDate) || !validDate(payload.endDate) || new Date(payload.endDate) <= new Date(payload.startDate)) return 'startDate and endDate must define a valid period';
  if (payload.temporaryPassword.length < 12) return 'temporaryPassword must be at least 12 characters';
  if (payload.phone !== undefined && typeof payload.phone !== 'string') return 'phone must be a string';
  if (payload.customMembers !== undefined && !isPositiveInteger(payload.customMembers)) return 'customMembers must be a non-negative integer';
  if (payload.customProjectLimit !== undefined && !isPositiveInteger(payload.customProjectLimit)) return 'customProjectLimit must be a non-negative integer';
  if (payload.customPrice !== undefined && !isNonNegativeNumber(payload.customPrice)) return 'customPrice must be a non-negative number';
  return null;
};

export const validateCrmSubscriptionPayload = (payload) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return 'Request body must be an object';
  if (Object.keys(payload).some((key) => !SUBSCRIPTION_FIELDS.has(key))) return 'Unknown fields are not allowed';
  for (const field of ['crmCustomerId', 'plan', 'startDate', 'trialEndDate']) {
    if (!text(payload[field])) return `${field} is required`;
  }
  if (!PLANS.has(text(payload.plan))) return 'plan is invalid';
  if (!validDate(payload.startDate) || !validDate(payload.trialEndDate) || new Date(payload.trialEndDate) <= new Date(payload.startDate)) return 'startDate and trialEndDate must define a valid period';
  for (const field of ['customMembers', 'customProjectLimit']) {
    if (payload[field] !== undefined && (!Number.isInteger(payload[field]) || payload[field] <= 0)) return `${field} must be a positive integer`;
  }
  if (payload.customPrice !== undefined && (!isNonNegativeNumber(payload.customPrice) || payload.customPrice <= 0)) return 'customPrice must be greater than 0';
  if (text(payload.plan) === 'Advanced') {
    for (const field of ['customMembers', 'customProjectLimit', 'customPrice']) {
      if (payload[field] === undefined || payload[field] === null) return `${field} is required for Advanced`;
    }
  }
  return null;
};

const findOrCreateCompany = async (tx, companyName) => {
  let company = await tx.company.findFirst({ where: { name: companyName } });
  if (!company) company = await tx.company.create({ data: { name: companyName } });
  return company.id;
};

const findOrCreateClient = async (tx, companyId, input) => {
  const contacts = [{ clientEmail: email(input.email) }];
  if (text(input.phone)) contacts.push({ clientPhone: text(input.phone) });
  const existing = await tx.client.findFirst({ where: { companyId, OR: contacts }, orderBy: { createdAt: 'asc' } });
  if (existing) return existing;
  return tx.client.create({ data: { companyId, clientName: text(input.name), companyName: text(input.companyName), clientEmail: email(input.email), clientPhone: text(input.phone), clientAddress: text(input.address), clientGST: text(input.gstNumber) } });
};

export const createCrmUser = async (req, res) => {
  const error = validateCrmUserPayload(req.body);
  if (error) return res.status(400).json({ error });
  const input = req.body;
  const normalizedEmail = email(input.email);
  try {
    const existing = await prisma.user.findFirst({ where: { OR: [{ crmCustomerId: text(input.crmCustomerId) }, { email: normalizedEmail }] }, select: { id: true, clientId: true } });
    if (existing) return res.status(200).json({ erpUserId: existing.id, clientId: existing.clientId });

    const password = await bcrypt.hash(input.temporaryPassword, 10);
    const result = await prisma.$transaction(async (tx) => {
      const duplicate = await tx.user.findFirst({ where: { OR: [{ crmCustomerId: text(input.crmCustomerId) }, { email: normalizedEmail }] }, select: { id: true, clientId: true } });
      if (duplicate) return duplicate;
      const companyId = await findOrCreateCompany(tx, text(input.companyName));
      const client = await findOrCreateClient(tx, companyId, input);
      const startDate = new Date(input.startDate);
      const user = await tx.user.create({ data: {
        name: text(input.name), email: normalizedEmail, password, role: 'Admin', companyId, clientId: client.id,
        phoneNumber: text(input.phone), address: text(input.address), city: text(input.city), gstNumber: text(input.gstNumber),
        crmCustomerId: text(input.crmCustomerId), package: input.plan === 'Free Trial' ? 'Free' : input.plan,
        subscriptionPlan: input.plan, subscriptionStartedAt: startDate, trialStartDate: startDate, trialEndDate: new Date(input.endDate),
        subscriptionStatus: input.plan === 'Free Trial' ? 'TRIAL_ACTIVE' : 'SUBSCRIPTION_ACTIVE', accountStatus: 'ACTIVE', isActive: true,
        mustChangePassword: true, passwordExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ...(input.plan === 'Advanced' ? { customMembers: input.customMembers ?? null, customProjectLimit: input.customProjectLimit ?? null, customPrice: input.customPrice ?? null } : {})
      }, select: { id: true, clientId: true } });
      return user;
    });
    return res.status(201).json({ erpUserId: result.id, clientId: result.clientId });
  } catch (err) {
    // Do not include request payloads: they contain a temporary password.
    if (err.code === 'P2002') {
      const existing = await prisma.user.findFirst({ where: { OR: [{ crmCustomerId: text(input.crmCustomerId) }, { email: normalizedEmail }] }, select: { id: true, clientId: true } });
      if (existing) return res.status(200).json({ erpUserId: existing.id, clientId: existing.clientId });
    }
    console.error('CRM user provisioning failed:', err.message);
    return res.status(500).json({ error: 'Unable to provision CRM user' });
  }
};

export const resetCrmUserPassword = async (req, res) => {
  const password = req.body?.temporaryPassword;
  if (typeof password !== 'string' || password.length < 12 || Object.keys(req.body || {}).some((key) => key !== 'temporaryPassword')) return res.status(400).json({ error: 'A temporaryPassword of at least 12 characters is required' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.update({ where: { id: req.params.erpUserId }, data: { password: hash, mustChangePassword: true, passwordExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }, select: { id: true } });
    return res.json({ erpUserId: user.id });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'User not found' });
    console.error('CRM password reset failed:', err.message);
    return res.status(500).json({ error: 'Unable to reset password' });
  }
};

export const updateCrmUserSubscription = async (req, res) => {
  const error = validateCrmSubscriptionPayload(req.body);
  if (error) return res.status(400).json({ error });

  const input = req.body;
  const plan = text(input.plan);
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.erpUserId },
      select: { id: true, crmCustomerId: true }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.crmCustomerId !== text(input.crmCustomerId)) {
      return res.status(409).json({ error: 'crmCustomerId does not match this user' });
    }

    const startDate = new Date(input.startDate);
    const trialEndDate = new Date(input.trialEndDate);
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionPlan: plan,
        package: plan === 'Free Trial' ? 'Free' : plan,
        subscriptionStartedAt: startDate,
        trialStartDate: startDate,
        trialEndDate,
        subscriptionStatus: plan === 'Free Trial' ? 'TRIAL_ACTIVE' : 'SUBSCRIPTION_ACTIVE',
        isActive: true,
        accountStatus: 'ACTIVE',
        ...(plan === 'Advanced' ? {
          customMembers: input.customMembers,
          customProjectLimit: input.customProjectLimit,
          customPrice: input.customPrice
        } : {})
      },
      select: { id: true, subscriptionPlan: true, trialEndDate: true }
    });
    return res.json({ erpUserId: updatedUser.id, plan: updatedUser.subscriptionPlan, trialEndDate: updatedUser.trialEndDate });
  } catch (err) {
    console.error('CRM subscription update failed:', err.message);
    return res.status(500).json({ error: 'Unable to update CRM user subscription' });
  }
};
