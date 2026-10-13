import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'node:fs';
import { isStrongPassword, isSubscriptionExpired, isTemporaryPasswordExpired, PASSWORD_CHANGE_PURPOSE } from '../src/utils/passwordSecurity.js';
import { updateCrmUserSubscription, validateCrmUserPayload, validateCrmSubscriptionPayload } from '../src/controllers/crmUserIntegrationController.js';
import { authenticateToken } from '../src/middlewares/authMiddlewares.js';
import { crmApiKeyAuth } from '../src/middlewares/apiKeyAuth.js';
import { prisma } from '../src/config/database.js';

const validPayload = () => ({
  crmCustomerId: 'crm-1', name: 'Ada', email: 'ada@example.com', phone: '1234567890', companyName: 'Ada Co',
  address: 'Address', city: 'City', gstNumber: 'GST', plan: 'Advanced', startDate: '2030-01-01T00:00:00.000Z',
  endDate: '2030-02-01T00:00:00.000Z', customMembers: 2, customProjectLimit: 3, customPrice: 4, temporaryPassword: 'TempPassword1!'
});

test('temporary passwords are bcrypt hashes and verify without exposing plaintext', async () => {
  const secret = 'TempPassword1!';
  const hash = await bcrypt.hash(secret, 10);
  assert.notEqual(hash, secret);
  assert.equal(await bcrypt.compare(secret, hash), true);
  assert.equal(await bcrypt.compare('wrong', hash), false);
});

test('CRM payload validation allowlists fields and rejects unknown plans', () => {
  assert.equal(validateCrmUserPayload(validPayload()), null);
  assert.match(validateCrmUserPayload({ ...validPayload(), plan: 'Enterprise' }), /plan is invalid/);
  assert.match(validateCrmUserPayload({ ...validPayload(), unexpected: true }), /Unknown fields/);
});

test('CRM subscription validation rejects invalid plans and requires valid Advanced limits', () => {
  const valid = { crmCustomerId: 'crm-1', plan: 'Advanced', startDate: '2030-01-01T00:00:00.000Z', trialEndDate: '2030-02-01T00:00:00.000Z', customMembers: 2, customProjectLimit: 3, customPrice: 4 };
  assert.equal(validateCrmSubscriptionPayload(valid), null);
  assert.match(validateCrmSubscriptionPayload({ ...valid, plan: 'Enterprise' }), /plan is invalid/);
  assert.match(validateCrmSubscriptionPayload({ ...valid, customMembers: 0 }), /positive integer/);
  assert.match(validateCrmSubscriptionPayload({ ...valid, extra: true }), /Unknown fields/);
});

test('login subscription expiry permits legacy null subscription fields and blocks expired accounts', () => {
  const now = new Date('2030-01-15T00:00:00.000Z');
  assert.equal(isSubscriptionExpired({ subscriptionPlan: null, subscriptionStatus: null, trialEndDate: null }, now), false);
  assert.equal(isSubscriptionExpired({ trialEndDate: new Date('2030-01-01T00:00:00.000Z'), accountStatus: 'ACTIVE' }, now), true);
  assert.equal(isSubscriptionExpired({ subscriptionStatus: 'SUBSCRIPTION_EXPIRED' }, now), true);
});

test('forced change policy requires a strong password and detects temporary-password expiry', () => {
  assert.equal(isStrongPassword('TempPassword1!'), true);
  assert.equal(isStrongPassword('short'), false);
  assert.equal(isTemporaryPasswordExpired({ passwordExpiresAt: new Date('2020-01-01') }, new Date('2030-01-01')), true);
  assert.equal(isTemporaryPasswordExpired({ passwordExpiresAt: null }, new Date('2030-01-01')), false);
});

test('restricted token has a password-change-only purpose claim', () => {
  const token = jwt.sign({ userId: 'user-1', purpose: PASSWORD_CHANGE_PURPOSE }, 'test-secret');
  const decoded = jwt.verify(token, 'test-secret');
  assert.equal(decoded.purpose, PASSWORD_CHANGE_PURPOSE);
  assert.notEqual(decoded.purpose, undefined);
});

test('restricted token is rejected by normal authentication middleware', async () => {
  process.env.JWT_SECRET = 'test-secret';
  const token = jwt.sign({ userId: 'user-1', purpose: PASSWORD_CHANGE_PURPOSE }, process.env.JWT_SECRET);
  let statusCode;
  let nextCalled = false;
  await new Promise((resolve) => authenticateToken(
    { headers: { authorization: `Bearer ${token}` } },
    { status: (code) => { statusCode = code; return { json: resolve }; } },
    () => { nextCalled = true; resolve(); }
  ));
  assert.equal(statusCode, 403);
  assert.equal(nextCalled, false);
});

test('provisioning checks idempotency before hashing and never logs or returns a password', () => {
  const source = fs.readFileSync(new URL('../src/controllers/crmUserIntegrationController.js', import.meta.url), 'utf8');
  const provisioner = source.slice(source.indexOf('export const createCrmUser'), source.indexOf('export const resetCrmUserPassword'));
  assert.ok(source.indexOf('const existing = await prisma.user.findFirst') < source.indexOf('await bcrypt.hash(input.temporaryPassword, 10)'));
  assert.doesNotMatch(provisioner, /console\.(log|error)\([^\n]*temporaryPassword/);
  assert.doesNotMatch(provisioner, /json\([^\n]*temporaryPassword/);
});

test('CRM provisioning assigns the required subscription and Advanced customization fields', () => {
  const source = fs.readFileSync(new URL('../src/controllers/crmUserIntegrationController.js', import.meta.url), 'utf8');
  for (const field of [
    "role: 'Admin'", 'package:', 'subscriptionPlan:', 'subscriptionStartedAt:', 'trialEndDate:',
    "accountStatus: 'ACTIVE'", 'isActive: true', 'customMembers:', 'customProjectLimit:', 'customPrice:'
  ]) assert.match(source, new RegExp(field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('active password-handling paths do not log or return plaintext passwords', () => {
  const files = [
    '../src/controllers/crmUserIntegrationController.js',
    '../src/routes/authRoute.js',
    '../src/controllers/userController.js',
    '../src/routes/webhookRoute.js'
  ];
  for (const path of files) {
    const source = fs.readFileSync(new URL(path, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /console\.(log|warn|error)\([^\n]*\b(temporaryPassword|newPassword|currentPassword|plainPassword)\s*[,)}]/);
    assert.doesNotMatch(source, /json\([^\n]*\b(temporaryPassword|newPassword|currentPassword|plainPassword)\s*[:,}]/);
  }
});

test('CRM subscription endpoint registers the update handler behind CRM API-key auth', () => {
  const source = fs.readFileSync(new URL('../src/routes/crmIntegrationRoutes.js', import.meta.url), 'utf8');
  assert.match(source, /router\.use\(crmApiKeyAuth\)/);
  assert.match(source, /router\.put\('\/users\/:erpUserId\/subscription', updateCrmUserSubscription\)/);
});

test('CRM API key middleware rejects a request without an API key', () => {
  process.env.CRM_TO_ERP_API_KEY = 'test-crm-key';
  let statusCode;
  crmApiKeyAuth(
    { get: () => undefined },
    { status: (code) => { statusCode = code; return { json: () => {} }; } },
    () => assert.fail('next must not be called without an API key')
  );
  assert.equal(statusCode, 401);
});

const subscriptionPayload = (overrides = {}) => ({
  crmCustomerId: 'crm-1', plan: 'Basic', startDate: '2030-01-01T00:00:00.000Z',
  trialEndDate: '2031-01-01T00:00:00.000Z', ...overrides
});

const responseRecorder = () => {
  const response = { statusCode: 200, body: undefined };
  response.status = (code) => { response.statusCode = code; return response; };
  response.json = (body) => { response.body = body; return response; };
  return response;
};

test('CRM subscription renewal updates only subscription fields and is idempotent', async (t) => {
  const originalFindUnique = prisma.user.findUnique;
  const originalUpdate = prisma.user.update;
  let updateData;
  prisma.user.findUnique = async () => ({ id: 'erp-1', crmCustomerId: 'crm-1' });
  prisma.user.update = async ({ data }) => {
    updateData = data;
    return { id: 'erp-1', subscriptionPlan: data.subscriptionPlan, trialEndDate: data.trialEndDate };
  };
  t.after(() => { prisma.user.findUnique = originalFindUnique; prisma.user.update = originalUpdate; });

  const first = responseRecorder();
  await updateCrmUserSubscription({ params: { erpUserId: 'erp-1' }, body: subscriptionPayload() }, first);
  const second = responseRecorder();
  await updateCrmUserSubscription({ params: { erpUserId: 'erp-1' }, body: subscriptionPayload() }, second);
  assert.deepEqual(first.body, second.body);
  assert.deepEqual(Object.keys(first.body).sort(), ['erpUserId', 'plan', 'trialEndDate']);
  assert.equal(updateData.subscriptionPlan, 'Basic');
  assert.equal(updateData.package, 'Basic');
  assert.equal(updateData.subscriptionStatus, 'SUBSCRIPTION_ACTIVE');
  assert.equal(updateData.customMembers, undefined);
});

test('CRM subscription renewal reactivates an expired user', async (t) => {
  const originalFindUnique = prisma.user.findUnique;
  const originalUpdate = prisma.user.update;
  let updateData;
  prisma.user.findUnique = async () => ({ id: 'erp-1', crmCustomerId: 'crm-1', isActive: false, subscriptionStatus: 'SUBSCRIPTION_EXPIRED' });
  prisma.user.update = async ({ data }) => { updateData = data; return { id: 'erp-1', subscriptionPlan: data.subscriptionPlan, trialEndDate: data.trialEndDate }; };
  t.after(() => { prisma.user.findUnique = originalFindUnique; prisma.user.update = originalUpdate; });

  await updateCrmUserSubscription({ params: { erpUserId: 'erp-1' }, body: subscriptionPayload() }, responseRecorder());
  assert.equal(updateData.isActive, true);
  assert.equal(updateData.accountStatus, 'ACTIVE');
  assert.equal(updateData.subscriptionStatus, 'SUBSCRIPTION_ACTIVE');
});

test('CRM subscription renewal updates Advanced limits', async (t) => {
  const originalFindUnique = prisma.user.findUnique;
  const originalUpdate = prisma.user.update;
  let updateData;
  prisma.user.findUnique = async () => ({ id: 'erp-1', crmCustomerId: 'crm-1' });
  prisma.user.update = async ({ data }) => { updateData = data; return { id: 'erp-1', subscriptionPlan: data.subscriptionPlan, trialEndDate: data.trialEndDate }; };
  t.after(() => { prisma.user.findUnique = originalFindUnique; prisma.user.update = originalUpdate; });

  await updateCrmUserSubscription({ params: { erpUserId: 'erp-1' }, body: subscriptionPayload({ plan: 'Advanced', customMembers: 7, customProjectLimit: 8, customPrice: 9 }) }, responseRecorder());
  assert.equal(updateData.customMembers, 7);
  assert.equal(updateData.customProjectLimit, 8);
  assert.equal(updateData.customPrice, 9);
});

test('CRM subscription renewal rejects a mismatched crmCustomerId with 409', async (t) => {
  const originalFindUnique = prisma.user.findUnique;
  prisma.user.findUnique = async () => ({ id: 'erp-1', crmCustomerId: 'different-crm-id' });
  t.after(() => { prisma.user.findUnique = originalFindUnique; });
  const response = responseRecorder();
  await updateCrmUserSubscription({ params: { erpUserId: 'erp-1' }, body: subscriptionPayload() }, response);
  assert.equal(response.statusCode, 409);
  assert.match(response.body.error, /does not match/);
});
