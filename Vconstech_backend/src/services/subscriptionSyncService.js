// import { prisma } from '../config/database.js';
// import bcrypt from 'bcryptjs';
// import { randomInt } from 'crypto';
// import {
//   ensureDirectPricingCustomer,
//   sendCustomerStatusEvent
// } from './crmIntegrationClient.js';
// import { sendEmail } from '../utils/mailer.js';

// const TRIAL_DAYS = Number(process.env.ERP_TRIAL_DAYS || 7);
// const TRIAL_EXPIRY_INTERVAL_MS = Number(
//   process.env.ERP_TRIAL_EXPIRY_INTERVAL_MS || 24 * 60 * 60 * 1000
// );
// let trialExpiryJob = null;

// const PURCHASE_FLOWS = {
//   TRIAL_UPGRADE: 'TRIAL_UPGRADE',
//   DIRECT_WEBSITE_PURCHASE: 'DIRECT_WEBSITE_PURCHASE'
// };

// const addDays = (date, days) => {
//   const next = new Date(date);
//   next.setDate(next.getDate() + days);
//   return next;
// };

// const buildEventId = ({ action, userId }) => `${action}-${userId}`;

// const normalizeSubscriptionStatus = (status) =>
//   String(status || '').trim().toUpperCase().replace(/\s+/g, '_');

// const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

// const getCustomerWhere = (customerId) => {
//   const filters = [
//     { crmCustomerId: String(customerId) },
//     { erpCustomerId: String(customerId) }
//   ];

//   if (
//     /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
//       String(customerId)
//     )
//   ) {
//     filters.push({ id: String(customerId) });
//   }

//   return { OR: filters };
// };

// const toStatusResponse = (user) => ({
//   userId: user.id,
//   crmLeadId: user.crmLeadId,
//   crmCustomerId: user.crmCustomerId,
//   erpCustomerId: user.erpCustomerId,
//   status: user.subscriptionStatus,
//   accountStatus: user.accountStatus,
//   isActive: user.isActive,
//   plan: user.subscriptionPlan,
//   trialStartDate: user.trialStartDate,
//   trialEndDate: user.trialEndDate,
//   subscriptionStartedAt: user.subscriptionStartedAt
// });

// const getUserForSubscription = async ({ userId, invitationId }) => {
//   if (userId) {
//     return prisma.user.findUnique({ where: { id: userId } });
//   }

//   if (invitationId) {
//     const invitation = await prisma.crmInvitation.findUnique({
//       where: { invitationId },
//       include: { registeredUser: true }
//     });
//     return invitation?.registeredUser || null;
//   }

//   return null;
// };

// const getUserByCustomerId = async (customerId) =>
//   prisma.user.findFirst({
//     where: getCustomerWhere(customerId)
//   });

// const toPricingCustomerResponse = (user) => ({
//   userId: user.id,
//   crmLeadId: user.crmLeadId,
//   crmCustomerId: user.crmCustomerId,
//   erpCustomerId: user.erpCustomerId,
//   name: user.name,
//   companyName: user.company?.name || '',
//   email: user.email,
//   phone: user.phoneNumber || '',
//   city: user.city || '',
//   address: user.address || '',
//   subscriptionStatus: user.subscriptionStatus,
//   subscriptionPlan: user.subscriptionPlan,
//   accountStatus: user.accountStatus
// });

// const getLoginUrl = () =>
//   process.env.ERP_LOGIN_URL ||
//   process.env.ERP_FRONTEND_URL ||
//   process.env.CLIENT_URL ||
//   'http://localhost:5173';

// const getInvitationBaseUrl = () => {
//   const configured =
//     process.env.ERP_INVITATION_FRONTEND_URL ||
//     process.env.ERP_FRONTEND_URL ||
//     process.env.CLIENT_URL ||
//     'http://localhost:5173/registration/invitations/:invitationId';

//   return configured.trim().replace(/\/$/, '');
// };

// const buildInvitationUrl = (invitationId) => {
//   const baseUrl = getInvitationBaseUrl();
//   if (baseUrl.includes(':invitationId')) {
//     return baseUrl.replace(':invitationId', encodeURIComponent(invitationId));
//   }

//   if (/\/(registration\/)?invitations\/?$/.test(baseUrl)) {
//     return `${baseUrl}/${encodeURIComponent(invitationId)}`;
//   }

//   return `${baseUrl}/registration/invitations/${encodeURIComponent(invitationId)}`;
// };

// const getUserForPricingPurchase = async ({
//   userId,
//   customerId,
//   crmCustomerId,
//   erpCustomerId,
//   email
// }) => {
//   if (userId) {
//     return prisma.user.findUnique({ where: { id: String(userId) } });
//   }

//   const filters = [];
//   if (customerId) filters.push(...getCustomerWhere(customerId).OR);
//   if (crmCustomerId) filters.push({ crmCustomerId: String(crmCustomerId) });
//   if (erpCustomerId) filters.push({ erpCustomerId: String(erpCustomerId) });
//   if (email) filters.push({ email: normalizeEmail(email) });

//   if (filters.length === 0) return null;

//   return prisma.user.findFirst({
//     where: { OR: filters },
//     orderBy: { createdAt: 'asc' }
//   });
// };

// const buildPricingReference = ({ paymentId, orderId, email, erpCustomerId, crmCustomerId }) => {
//   const reference =
//     paymentId ||
//     orderId ||
//     erpCustomerId ||
//     crmCustomerId ||
//     normalizeEmail(email);

//   return String(reference || '').trim().replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80);
// };

// const normalizePurchaseFlow = (flow) =>
//   String(flow || '').trim().toUpperCase().replace(/[\s-]+/g, '_');

// const inferPurchaseFlow = ({ purchaseFlow, userId, customerId, crmCustomerId, erpCustomerId }) => {
//   const normalized = normalizePurchaseFlow(purchaseFlow);
//   if (normalized === PURCHASE_FLOWS.TRIAL_UPGRADE) return PURCHASE_FLOWS.TRIAL_UPGRADE;
//   if (normalized === PURCHASE_FLOWS.DIRECT_WEBSITE_PURCHASE) return PURCHASE_FLOWS.DIRECT_WEBSITE_PURCHASE;

//   return userId || customerId || crmCustomerId || erpCustomerId
//     ? PURCHASE_FLOWS.TRIAL_UPGRADE
//     : PURCHASE_FLOWS.DIRECT_WEBSITE_PURCHASE;
// };

// const normalizeText = (value) => String(value || '').trim();

// const normalizePackage = (plan) => {
//   const selectedPlan = normalizeText(plan);
//   const normalized = selectedPlan.toLowerCase();
//   if (normalized.includes('advanced')) return 'Advanced';
//   if (normalized.includes('premium')) return 'Premium';
//   if (normalized.includes('basic')) return 'Basic';
//   if (normalized.includes('free')) return 'Free';
//   return selectedPlan || null;
// };

// const formatClientErpCustomerId = (clientId) =>
//   `ERP-CUST-${String(clientId).padStart(6, '0')}`;

// const generateSecureTemporaryPassword = (length = 14) => {
//   const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!';
//   return Array.from({ length }, () => chars[randomInt(chars.length)]).join('');
// };

// const findCompanyId = async ({ tx, companyName, requestedCompanyId }) => {
//   if (requestedCompanyId) {
//     const company = await tx.company.findUnique({
//       where: { id: requestedCompanyId },
//       select: { id: true }
//     });
//     if (company) return company.id;
//   }

//   if (companyName) {
//     const existing = await tx.company.findFirst({ where: { name: companyName } });
//     if (existing) return existing.id;
//     const created = await tx.company.create({ data: { name: companyName } });
//     return created.id;
//   }

//   if (process.env.ERP_DEFAULT_COMPANY_ID) {
//     const company = await tx.company.findUnique({
//       where: { id: process.env.ERP_DEFAULT_COMPANY_ID },
//       select: { id: true }
//     });
//     if (company) return company.id;
//   }

//   const firstCompany = await tx.company.findFirst({
//     orderBy: { createdAt: 'asc' },
//     select: { id: true }
//   });

//   return firstCompany?.id || null;
// };

// const findOrCreatePricingClient = async ({
//   tx,
//   companyId,
//   name,
//   companyName,
//   email,
//   phone
// }) => {
//   const contactFilters = [];
//   if (email) contactFilters.push({ clientEmail: email });
//   if (phone) contactFilters.push({ clientPhone: phone });

//   if (contactFilters.length > 0) {
//     const existing = await tx.client.findFirst({
//       where: { companyId, OR: contactFilters },
//       orderBy: { createdAt: 'asc' }
//     });
//     if (existing) return existing;
//   }

//   return tx.client.create({
//     data: {
//       companyId,
//       clientName: name,
//       companyName: companyName || '',
//       clientPhone: phone || '',
//       clientEmail: email || '',
//       clientAddress: '',
//       clientGST: ''
//     }
//   });
// };

// const createDirectPricingUser = async ({
//   customer,
//   plan,
//   companyId,
//   companyName,
//   name,
//   email,
//   phone
// }) => {
//   const temporaryPassword = generateSecureTemporaryPassword();
//   const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
//   const selectedPackage = normalizePackage(plan);

//   const user = await prisma.$transaction(async (tx) => {
//     const resolvedCompanyId = await findCompanyId({
//       tx,
//       companyName,
//       requestedCompanyId: companyId
//     });

//     if (!resolvedCompanyId) {
//       const error = new Error('No ERP company is available for direct pricing purchase');
//       error.statusCode = 400;
//       error.details = {
//         companyId: 'Provide companyId/erpCompanyId or configure ERP_DEFAULT_COMPANY_ID'
//       };
//       throw error;
//     }

//     const client = await findOrCreatePricingClient({
//       tx,
//       companyId: resolvedCompanyId,
//       name,
//       companyName,
//       email,
//       phone
//     });
//     const erpCustomerId = customer.erp_customer_id || formatClientErpCustomerId(client.id);

//     return tx.user.create({
//       data: {
//         name,
//         email,
//         password: hashedPassword,
//         role: 'Admin',
//         companyId: resolvedCompanyId,
//         phoneNumber: phone || '',
//         city: '',
//         address: '',
//         gstNumber: '',
//         isActive: true,
//         clientId: client.id,
//         crmLeadId: null,
//         crmCustomerId: String(customer.id),
//         erpCustomerId,
//         accountStatus: 'ACTIVE',
//         package: selectedPackage,
//         subscriptionPlan: plan
//       }
//     });
//   });

//   return { user, temporaryPassword };
// };

// const linkExistingUserToPricingCustomer = async ({
//   user,
//   customer,
//   companyId,
//   companyName,
//   name,
//   email,
//   phone,
//   plan
// }) =>
//   prisma.$transaction(async (tx) => {
//     const resolvedCompanyId =
//       user.companyId ||
//       (await findCompanyId({
//         tx,
//         companyName,
//         requestedCompanyId: companyId
//       }));

//     if (!resolvedCompanyId) {
//       const error = new Error('No ERP company is available for direct pricing purchase');
//       error.statusCode = 400;
//       error.details = {
//         companyId: 'Provide companyId/erpCompanyId or configure ERP_DEFAULT_COMPANY_ID'
//       };
//       throw error;
//     }

//     let clientId = user.clientId;
//     if (!clientId) {
//       const client = await findOrCreatePricingClient({
//         tx,
//         companyId: resolvedCompanyId,
//         name,
//         companyName,
//         email,
//         phone
//       });
//       clientId = client.id;
//     }

//     return tx.user.update({
//       where: { id: user.id },
//       data: {
//         companyId: resolvedCompanyId,
//         clientId,
//         crmCustomerId: String(customer.id),
//         erpCustomerId: user.erpCustomerId || customer.erp_customer_id || formatClientErpCustomerId(clientId),
//         phoneNumber: user.phoneNumber || phone || '',
//         subscriptionPlan: plan
//       }
//     });
//   });

// const sendPaymentSuccessfulAccountEmail = async ({
//   user,
//   plan,
//   temporaryPassword,
//   reusedExistingUser
// }) => {
//   const loginUrl = getLoginUrl();
//   const passwordLine = temporaryPassword
//     ? `<p style="margin:0"><strong>Temporary Password:</strong> ${temporaryPassword}</p>`
//     : `<p style="margin:0"><strong>Temporary Password:</strong> Not generated. Use your existing ERP password.</p>`;

//   const result = await sendEmail({
//     to: user.email,
//     subject: 'Payment Successful – Your ERP Account is Ready',
//     html: `
//       <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:560px;margin:auto">
//         <h2 style="margin-bottom:12px">Your ERP Account is Ready</h2>
//         <p>Hi <strong>${user.name || 'Customer'}</strong>,</p>
//         <p>Your payment was successful and your ERP subscription is active.</p>
//         <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:20px 0">
//           <p style="margin:0 0 8px"><strong>Customer Name:</strong> ${user.name || 'Customer'}</p>
//           <p style="margin:0 0 8px"><strong>Purchased Plan:</strong> ${plan}</p>
//           <p style="margin:0 0 8px"><strong>ERP Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
//           <p style="margin:0 0 8px"><strong>Registered Email:</strong> ${user.email}</p>
//           ${passwordLine}
//         </div>
//         ${
//           reusedExistingUser
//             ? '<p>Your existing ERP account was reused. No invitation or registration is required.</p>'
//             : '<p>Please log in with the temporary password and change it from your profile.</p>'
//         }
//         <p>Best Regards,<br/><strong>Vconstech ERP</strong></p>
//       </div>
//     `
//   });

//   return {
//     sent: result.success,
//     to: user.email,
//     subject: 'Payment Successful – Your ERP Account is Ready',
//     loginUrl,
//     ...(temporaryPassword ? { temporaryPasswordIncluded: true } : {}),
//     ...(result.success ? {} : { error: result.error, code: result.code })
//   };
// };

// const sendSubscriptionActivatedEmail = async ({ user, plan }) => {
//   const loginUrl = getLoginUrl();

//   await sendEmail({
//     to: user.email,
//     subject: 'Subscription Activated Successfully',
//     html: `
//       <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:560px;margin:auto">
//         <h2 style="margin-bottom:12px">Subscription Activated Successfully</h2>
//         <p>Hi <strong>${user.name || 'Customer'}</strong>,</p>
//         <p>Your ERP subscription has been activated successfully.</p>
//         <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:20px 0">
//           <p style="margin:0 0 8px"><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
//           <p style="margin:0 0 8px"><strong>Registered Email:</strong> ${user.email}</p>
//           <p style="margin:0"><strong>Subscription Plan:</strong> ${plan}</p>
//         </div>
//         <p>Your existing login credentials remain unchanged.</p>
//         <p>Best Regards,<br/><strong>Vconstech ERP</strong></p>
//       </div>
//     `
//   });
// };

// const sendPricingInvitationEmail = async ({ name, email, invitationId, plan }) => {
//   if (!email) {
//     const error = new Error('Customer email is required to send ERP invitation');
//     error.statusCode = 400;
//     throw error;
//   }

//   const invitationUrl = buildInvitationUrl(invitationId);

//   await sendEmail({
//     to: email,
//     subject: 'Complete your Vconstech ERP registration',
//     html: `
//       <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:560px;margin:auto">
//         <h2 style="margin-bottom:12px">Complete your Vconstech ERP registration</h2>
//         <p>Hi <strong>${name || 'Customer'}</strong>,</p>
//         <p>Your payment was successful. Please complete your ERP registration and create your password.</p>
//         <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:20px 0">
//           <p style="margin:0 0 8px"><strong>Subscription Plan:</strong> ${plan}</p>
//           <p style="margin:0 0 12px"><strong>Invitation ID:</strong> ${invitationId}</p>
//           <a href="${invitationUrl}" style="background:#ffbe01;color:#1a1a1a;padding:10px 14px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:700">Complete registration</a>
//         </div>
//         <p style="font-size:13px;color:#6b7280">If the button does not work, open this link: <a href="${invitationUrl}">${invitationUrl}</a></p>
//         <p>Best Regards,<br/><strong>Vconstech ERP</strong></p>
//       </div>
//     `
//   });

//   return invitationUrl;
// };

// const assertSyncUser = (user) => {
//   if (!user) {
//     const error = new Error('ERP user not found');
//     error.statusCode = 404;
//     throw error;
//   }

//   if (!user.crmCustomerId || !user.erpCustomerId) {
//     const error = new Error('ERP user is not linked to CRM customer data');
//     error.statusCode = 409;
//     throw error;
//   }
// };

// const retryPendingCrmSync = async ({ eventId, payload }) => {
//   const event = await prisma.customerSubscription.findUnique({
//     where: { eventId }
//   });

//   if (!event || event.crmSyncStatus === 'SYNCED') {
//     return null;
//   }

//   return syncCrmAndMark({ event, payload });
// };

// const recordSubscriptionEvent = async ({
//   tx,
//   user,
//   eventId,
//   action,
//   status,
//   plan,
//   trialStartDate,
//   trialEndDate,
//   purchaseDate
// }) =>
//   tx.customerSubscription.upsert({
//     where: { eventId },
//     create: {
//       userId: user.id,
//       crmCustomerId: user.crmCustomerId,
//       erpCustomerId: user.erpCustomerId,
//       eventId,
//       action,
//       status,
//       plan,
//       trialStartDate,
//       trialEndDate,
//       purchaseDate,
//       crmSyncStatus: 'PENDING'
//     },
//     update: {
//       status,
//       plan,
//       trialStartDate,
//       trialEndDate,
//       purchaseDate,
//       crmSyncStatus: 'PENDING'
//     }
//   });

// const syncCrmAndMark = async ({ event, payload }) => {
//   const crmResponse = await sendCustomerStatusEvent(payload);

//   await prisma.customerSubscription.update({
//     where: { eventId: event.eventId },
//     data: {
//       crmSyncedAt: new Date(),
//       crmSyncStatus: 'SYNCED',
//       crmSyncPayload: crmResponse
//     }
//   });

//   return crmResponse;
// };

// const trySyncCrmAndMark = async ({ event, payload }) => {
//   try {
//     return {
//       synced: true,
//       response: await syncCrmAndMark({ event, payload })
//     };
//   } catch (error) {
//     console.error('[ERP->CRM] Subscription sync left pending', {
//       eventId: event.eventId,
//       message: error.message,
//       details: error.details
//     });

//     return {
//       synced: false,
//       status: 'PENDING',
//       error: error.message,
//       details: error.details
//     };
//   }
// };

// export const startFreeTrial = async ({ userId, invitationId }) => {
//   const user = await getUserForSubscription({ userId, invitationId });
//   assertSyncUser(user);

//   if (user.subscriptionStatus === 'SUBSCRIPTION_ACTIVE') {
//     return {
//       idempotent: true,
//       status: user.subscriptionStatus,
//       user,
//       skippedTrial: true
//     };
//   }

//   const eventId = buildEventId({ action: 'TRIAL_ACTIVE', userId: user.id });

//   if (user.subscriptionStatus === 'TRIAL_ACTIVE') {
//     let crm = null;
//     try {
//       crm = await retryPendingCrmSync({
//         eventId,
//         payload: {
//           eventId,
//           crmCustomerId: user.crmCustomerId,
//           crmLeadId: user.crmLeadId,
//           erpCustomerId: user.erpCustomerId,
//           status: 'TRIAL_ACTIVE',
//           trialStartDate: user.trialStartDate,
//           trialEndDate: user.trialEndDate
//         }
//       });
//     } catch (error) {
//       crm = {
//         synced: false,
//         status: 'PENDING',
//         error: error.message,
//         details: error.details
//       };
//     }

//     return {
//       idempotent: true,
//       status: user.subscriptionStatus,
//       user,
//       ...(crm ? { retriedCrmSync: crm.synced !== false, crm } : {})
//     };
//   }

//   const now = new Date();
//   const trialEndDate = addDays(now, TRIAL_DAYS);

//   const result = await prisma.$transaction(async (tx) => {
//     const updatedUser = await tx.user.update({
//       where: { id: user.id },
//       data: {
//         isActive: true,
//         accountStatus: 'ACTIVE',
//         subscriptionStatus: 'TRIAL_ACTIVE',
//         trialStartDate: now,
//         trialEndDate
//       }
//     });

//     const event = await recordSubscriptionEvent({
//       tx,
//       user: updatedUser,
//       eventId,
//       action: 'START_FREE_TRIAL',
//       status: 'TRIAL_ACTIVE',
//       trialStartDate: now,
//       trialEndDate
//     });

//     return { user: updatedUser, event };
//   });

//   const crm = await trySyncCrmAndMark({
//     event: result.event,
//     payload: {
//       eventId,
//       crmCustomerId: result.user.crmCustomerId,
//       crmLeadId: result.user.crmLeadId,
//       erpCustomerId: result.user.erpCustomerId,
//       status: 'TRIAL_ACTIVE',
//       trialStartDate: now,
//       trialEndDate
//     }
//   });

//   return { idempotent: false, status: 'TRIAL_ACTIVE', user: result.user, crm };
// };

// export const activateSubscription = async ({
//   userId,
//   invitationId,
//   plan = 'DEFAULT',
//   skipCrmSync = false
// }) => {
//   const user = await getUserForSubscription({ userId, invitationId });
//   assertSyncUser(user);

//   const eventId = buildEventId({
//     action: `SUBSCRIPTION_ACTIVE-${plan}`,
//     userId: user.id
//   });

//   if (user.subscriptionStatus === 'SUBSCRIPTION_ACTIVE' && user.subscriptionPlan === plan) {
//     const crm = await retryPendingCrmSync({
//       eventId,
//       payload: {
//         eventId,
//         crmCustomerId: user.crmCustomerId,
//         crmLeadId: user.crmLeadId,
//         erpCustomerId: user.erpCustomerId,
//         status: 'SUBSCRIPTION_ACTIVE',
//         plan,
//         purchaseDate: user.subscriptionStartedAt
//       }
//     });
//     return {
//       idempotent: true,
//       status: user.subscriptionStatus,
//       user,
//       ...(crm ? { retriedCrmSync: true, crm } : {})
//     };
//   }

//   const purchaseDate = new Date();

//   const result = await prisma.$transaction(async (tx) => {
//     const updatedUser = await tx.user.update({
//       where: { id: user.id },
//       data: {
//         isActive: true,
//         accountStatus: 'ACTIVE',
//         subscriptionStatus: 'SUBSCRIPTION_ACTIVE',
//         subscriptionStartedAt: purchaseDate,
//         subscriptionPlan: plan
//       }
//     });

//     const event = await recordSubscriptionEvent({
//       tx,
//       user: updatedUser,
//       eventId,
//       action: 'ACTIVATE_SUBSCRIPTION',
//       status: 'SUBSCRIPTION_ACTIVE',
//       plan,
//       purchaseDate
//     });

//     return { user: updatedUser, event };
//   });

//   let crm = null;

//   if (skipCrmSync) {
//     await prisma.customerSubscription.update({
//       where: { eventId: result.event.eventId },
//       data: {
//         crmSyncedAt: new Date(),
//         crmSyncStatus: 'SKIPPED',
//         crmSyncPayload: { reason: 'CRM sync skipped for direct pricing purchase' }
//       }
//     });
//   } else {
//     crm = await syncCrmAndMark({
//       event: result.event,
//       payload: {
//         eventId,
//         crmCustomerId: result.user.crmCustomerId,
//         crmLeadId: result.user.crmLeadId,
//         erpCustomerId: result.user.erpCustomerId,
//         status: 'SUBSCRIPTION_ACTIVE',
//         plan,
//         purchaseDate
//       }
//     });
//   }

//   return { idempotent: false, status: 'SUBSCRIPTION_ACTIVE', user: result.user, crm };
// };

// const syncExpiredTrialEvent = async (event) => {
//   const user = await prisma.user.findUnique({ where: { id: event.userId } });
//   if (!user) {
//     return { userId: event.userId, status: 'SKIPPED', reason: 'ERP user not found' };
//   }

//   const crm = await syncCrmAndMark({
//     event,
//     payload: {
//       eventId: event.eventId,
//       crmCustomerId: user.crmCustomerId,
//       crmLeadId: user.crmLeadId,
//       erpCustomerId: user.erpCustomerId,
//       status: 'TRIAL_EXPIRED',
//       trialStartDate: user.trialStartDate,
//       trialEndDate: user.trialEndDate
//     }
//   });

//   return { userId: user.id, status: 'TRIAL_EXPIRED', crm, retriedCrmSync: true };
// };

// export const expireTrials = async () => {
//   const now = new Date();
//   const users = await prisma.user.findMany({
//     where: {
//       subscriptionStatus: 'TRIAL_ACTIVE',
//       trialEndDate: { lt: now }
//     }
//   });

//   const results = [];
//   const processedEventIds = new Set();

//   for (const user of users) {
//     const eventId = buildEventId({ action: 'TRIAL_EXPIRED', userId: user.id });
//     processedEventIds.add(eventId);

//     const result = await prisma.$transaction(async (tx) => {
//       const updatedUser = await tx.user.update({
//         where: { id: user.id },
//         data: {
//           isActive: false,
//           accountStatus: 'TRIAL_EXPIRED',
//           subscriptionStatus: 'TRIAL_EXPIRED'
//         }
//       });

//       const event = await recordSubscriptionEvent({
//         tx,
//         user: updatedUser,
//         eventId,
//         action: 'EXPIRE_TRIAL',
//         status: 'TRIAL_EXPIRED',
//         trialStartDate: user.trialStartDate,
//         trialEndDate: user.trialEndDate
//       });

//       return { user: updatedUser, event };
//     });

//     const crm = await syncCrmAndMark({
//       event: result.event,
//       payload: {
//         eventId,
//         crmCustomerId: result.user.crmCustomerId,
//         crmLeadId: result.user.crmLeadId,
//         erpCustomerId: result.user.erpCustomerId,
//         status: 'TRIAL_EXPIRED',
//         trialStartDate: result.user.trialStartDate,
//         trialEndDate: result.user.trialEndDate
//       }
//     });

//     results.push({ userId: user.id, status: 'TRIAL_EXPIRED', crm });
//   }

//   const pendingExpiredEvents = await prisma.customerSubscription.findMany({
//     where: {
//       status: 'TRIAL_EXPIRED',
//       crmSyncStatus: { not: 'SYNCED' }
//     }
//   });

//   for (const event of pendingExpiredEvents) {
//     if (processedEventIds.has(event.eventId)) continue;
//     results.push(await syncExpiredTrialEvent(event));
//   }

//   return { expired: users.length, processed: results.length, results };
// };

// export const getSubscriptionStatus = async ({ customerId }) => {
//   const user = await prisma.user.findFirst({
//     where: getCustomerWhere(customerId)
//   });

//   if (!user) {
//     const error = new Error('ERP customer subscription status not found');
//     error.statusCode = 404;
//     throw error;
//   }

//   return toStatusResponse(user);
// };

// export const getPricingCustomerDetails = async ({
//   userId,
//   customerId,
//   crmCustomerId,
//   erpCustomerId,
//   email
// }) => {
//   if (!userId && !customerId && !crmCustomerId && !erpCustomerId && !email) {
//     const error = new Error('Customer identifier is required');
//     error.statusCode = 400;
//     error.details = {
//       customer: 'Provide userId, customerId, crmCustomerId, erpCustomerId, or email'
//     };
//     throw error;
//   }

//   const user = await getUserForPricingPurchase({
//     userId,
//     customerId,
//     crmCustomerId,
//     erpCustomerId,
//     email
//   });

//   if (!user) {
//     const error = new Error('ERP customer not found');
//     error.statusCode = 404;
//     throw error;
//   }

//   const userWithCompany = await prisma.user.findUnique({
//     where: { id: user.id },
//     select: {
//       id: true,
//       name: true,
//       email: true,
//       phoneNumber: true,
//       city: true,
//       address: true,
//       crmLeadId: true,
//       crmCustomerId: true,
//       erpCustomerId: true,
//       subscriptionStatus: true,
//       subscriptionPlan: true,
//       accountStatus: true,
//       company: {
//         select: {
//           name: true
//         }
//       }
//     }
//   });

//   return toPricingCustomerResponse(userWithCompany);
// };

// export const setSubscriptionStatus = async ({
//   customerId,
//   status,
//   accountStatus,
//   isActive,
//   plan
// }) => {
//   const current = await getUserByCustomerId(customerId);

//   if (!current) {
//     const error = new Error('ERP customer subscription status not found');
//     error.statusCode = 404;
//     throw error;
//   }

//   const normalizedStatus = normalizeSubscriptionStatus(status);

//   if (normalizedStatus === 'SUBSCRIPTION_ACTIVE') {
//     const subscription = await activateSubscription({
//       userId: current.id,
//       plan: plan || current.subscriptionPlan || 'DEFAULT'
//     });

//     return toStatusResponse(subscription.user);
//   }

//   const updated = await prisma.user.update({
//     where: { id: current.id },
//     data: {
//       ...(status ? { subscriptionStatus: normalizedStatus } : {}),
//       ...(accountStatus ? { accountStatus } : {}),
//       ...(typeof isActive === 'boolean' ? { isActive } : {}),
//       ...(plan ? { subscriptionPlan: plan } : {})
//     }
//   });

//   return toStatusResponse(updated);
// };

// const processTrialUpgradePurchaseSuccess = async ({
//   userId,
//   customerId,
//   crmCustomerId,
//   erpCustomerId,
//   email,
//   plan,
// }) => {
//   const selectedPlan = String(plan || '').trim();
//   if (!selectedPlan) {
//     const error = new Error('Subscription plan is required');
//     error.statusCode = 400;
//     error.details = { plan: 'Provide the purchased subscription plan' };
//     throw error;
//   }

//   const user = await getUserForPricingPurchase({
//     userId,
//     customerId,
//     crmCustomerId,
//     erpCustomerId,
//     email
//   });

//   if (!user) {
//     const error = new Error('ERP user not found for trial upgrade purchase');
//     error.statusCode = 404;
//     error.details = {
//       purchaseFlow: PURCHASE_FLOWS.TRIAL_UPGRADE,
//       user: 'Trial upgrade requires an existing ERP user'
//     };
//     throw error;
//   }

//   const activation = await activateSubscription({
//     userId: user.id,
//     plan: selectedPlan
//   });

//   const emailResult =
//     activation.idempotent
//       ? {
//           sent: false,
//           skipped: true,
//           reason: 'pricing purchase already processed',
//           to: activation.user.email,
//           subject: 'Payment Successful â€“ Your ERP Account is Ready'
//         }
//       : await sendPaymentSuccessfulAccountEmail({
//           user: activation.user,
//           plan: selectedPlan,
//           temporaryPassword: null,
//           reusedExistingUser: true
//         });

//   return {
//     purchaseFlow: PURCHASE_FLOWS.TRIAL_UPGRADE,
//     idempotent: activation.idempotent,
//     status: activation.status,
//     user: toStatusResponse(activation.user),
//     email: emailResult,
//     crm: activation.crm || null,
//     retriedCrmSync: activation.retriedCrmSync || false
//   };
// };

// const processDirectWebsitePurchaseSuccess = async ({
//   userId,
//   customerId,
//   crmCustomerId,
//   erpCustomerId,
//   email,
//   plan,
//   name,
//   companyName,
//   phone,
//   paymentId,
//   orderId,
//   companyId
// }) => {
//   const selectedPlan = String(plan || '').trim();
//   if (!selectedPlan) {
//     const error = new Error('Subscription plan is required');
//     error.statusCode = 400;
//     error.details = { plan: 'Provide the purchased subscription plan' };
//     throw error;
//   }

//   const customerEmail = normalizeEmail(email);
//   const customerName = normalizeText(name || companyName || customerEmail);
//   if (!customerName || !customerEmail) {
//     const error = new Error('Customer name and email are required');
//     error.statusCode = 400;
//     error.details = {
//       name: 'Provide customer name or companyName',
//       email: 'Provide customer registered email'
//     };
//     throw error;
//   }

//   const crmResult = await ensureDirectPricingCustomer({
//     name: customerName,
//     companyName,
//     email: customerEmail,
//     phone,
//     plan: selectedPlan,
//     paymentId,
//     orderId
//   });
//   const crmCustomer = crmResult?.data?.customer;
//   if (!crmCustomer?.id) {
//     const error = new Error('CRM customer was not returned for direct pricing purchase');
//     error.statusCode = 502;
//     error.details = crmResult;
//     throw error;
//   }

//   let user = await getUserForPricingPurchase({
//     userId,
//     customerId: customerId || crmCustomer.id,
//     crmCustomerId: crmCustomerId || crmCustomer.id,
//     erpCustomerId,
//     email: customerEmail
//   });
//   let temporaryPassword = null;
//   let reusedExistingUser = Boolean(user);

//   if (!user) {
//     const created = await createDirectPricingUser({
//       customer: crmCustomer,
//       plan: selectedPlan,
//       companyId,
//       companyName,
//       name: customerName,
//       email: customerEmail,
//       phone
//     });
//     user = created.user;
//     temporaryPassword = created.temporaryPassword;
//   } else if (
//     !user.crmCustomerId ||
//     String(user.crmCustomerId) !== String(crmCustomer.id) ||
//     !user.erpCustomerId
//   ) {
//     user = await linkExistingUserToPricingCustomer({
//       user,
//       customer: crmCustomer,
//       companyId,
//       companyName,
//       name: customerName,
//       email: customerEmail,
//       phone,
//       plan: selectedPlan
//     });
//   }

//   const activation = await activateSubscription({
//     userId: user.id,
//     plan: selectedPlan
//   });

//   const emailResult =
//     activation.idempotent && !temporaryPassword
//       ? {
//           sent: false,
//           skipped: true,
//           reason: 'pricing purchase already processed',
//           to: activation.user.email,
//           subject: 'Payment Successful – Your ERP Account is Ready'
//         }
//       : await sendPaymentSuccessfulAccountEmail({
//           user: activation.user,
//           plan: selectedPlan,
//           temporaryPassword,
//           reusedExistingUser
//         });

//   return {
//     purchaseFlow: PURCHASE_FLOWS.DIRECT_WEBSITE_PURCHASE,
//     idempotent: activation.idempotent,
//     status: activation.status,
//     user: toStatusResponse(activation.user),
//     crmCustomer: {
//       id: crmCustomer.id,
//       created: crmResult.data?.created === true
//     },
//     email: emailResult,
//     crm: activation.crm || null,
//     retriedCrmSync: activation.retriedCrmSync || false
//   };
// };

// export const processPricingPurchaseSuccess = async (input) => {
//   const purchaseFlow = inferPurchaseFlow(input);

//   if (purchaseFlow === PURCHASE_FLOWS.TRIAL_UPGRADE) {
//     return processTrialUpgradePurchaseSuccess(input);
//   }

//   return processDirectWebsitePurchaseSuccess(input);
// };

// export const activatePricingInvitationRegistration = async ({ registration }) => {
//   const pricingPurchase = registration?.pricingPurchase;
//   const plan = String(pricingPurchase?.plan || '').trim();

//   if (!registration?.user?.id || !plan) {
//     return null;
//   }

//   const activation = await activateSubscription({
//     userId: registration.user.id,
//     plan,
//     skipCrmSync: pricingPurchase.skipCrmSync === true
//   });

//   await sendSubscriptionActivatedEmail({
//     user: activation.user,
//     plan
//   });

//   return {
//     idempotent: activation.idempotent,
//     status: activation.status,
//     user: toStatusResponse(activation.user),
//     email: {
//       to: activation.user.email,
//       subject: 'Subscription Activated Successfully'
//     },
//     crm: activation.crm || null
//   };
// };

// export const runTrialExpiryJob = async () => {
//   try {
//     const result = await expireTrials();
//     console.log('[TrialExpiryJob] Completed', {
//       expired: result.expired,
//       processed: result.processed
//     });
//     return result;
//   } catch (error) {
//     console.error('[TrialExpiryJob] Failed', {
//       message: error.message,
//       details: error.details
//     });
//     throw error;
//   }
// };

// export const scheduleTrialExpiryJob = () => {
//   if (trialExpiryJob) return trialExpiryJob;

//   runTrialExpiryJob().catch(() => {});

//   trialExpiryJob = setInterval(() => {
//     runTrialExpiryJob().catch(() => {});
//   }, TRIAL_EXPIRY_INTERVAL_MS);

//   trialExpiryJob.unref?.();
//   console.log('[TrialExpiryJob] Scheduled', {
//     intervalMs: TRIAL_EXPIRY_INTERVAL_MS
//   });

//   return trialExpiryJob;
// };

import { prisma } from '../config/database.js';
import bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import {
  ensureDirectPricingCustomer,
  sendCustomerStatusEvent
} from './crmIntegrationClient.js';
import { sendEmail } from '../utils/mailer.js';

const TRIAL_DAYS = Number(process.env.ERP_TRIAL_DAYS || 7);
const PAID_SUBSCRIPTION_DURATION_MONTHS = Number(process.env.ERP_PAID_SUBSCRIPTION_MONTHS || 12);
const TRIAL_EXPIRY_INTERVAL_MS = Number(
  process.env.ERP_TRIAL_EXPIRY_INTERVAL_MS || 24 * 60 * 60 * 1000
);
let trialExpiryJob = null;

const PURCHASE_FLOWS = {
  TRIAL_UPGRADE: 'TRIAL_UPGRADE',
  DIRECT_WEBSITE_PURCHASE: 'DIRECT_WEBSITE_PURCHASE'
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const addMonths = (date, months) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

const buildEventId = ({ action, userId }) => `${action}-${userId}`;

const normalizeSubscriptionStatus = (status) =>
  String(status || '').trim().toUpperCase().replace(/\s+/g, '_');

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const parseErpCustomerClientId = (customerId) => {
  const raw = String(customerId || '').trim();
  const match = raw.match(/^ERP-CUST-(\d+)$/i);
  if (!match) return null;

  const clientId = Number.parseInt(match[1], 10);
  return Number.isInteger(clientId) && clientId > 0 ? clientId : null;
};

const getCustomerWhere = (customerId) => {
  const filters = [
    { crmCustomerId: String(customerId) },
    { erpCustomerId: String(customerId) }
  ];

  const clientId = parseErpCustomerClientId(customerId);
  if (clientId) {
    filters.push({ clientId });
  }

  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      String(customerId)
    )
  ) {
    filters.push({ id: String(customerId) });
  }

  return { OR: filters };
};

const toStatusResponse = (user) => ({
  userId: user.id,
  crmLeadId: user.crmLeadId,
  crmCustomerId: user.crmCustomerId,
  erpCustomerId: user.erpCustomerId,
  status: user.subscriptionStatus,
  accountStatus: user.accountStatus,
  isActive: user.isActive,
  plan: user.subscriptionPlan,
  trialStartDate: user.trialStartDate,
  trialEndDate: user.trialEndDate,
  subscriptionStartedAt: user.subscriptionStartedAt
});

const getUserForSubscription = async ({ userId, invitationId }) => {
  if (userId) {
    return prisma.user.findUnique({ where: { id: userId } });
  }

  if (invitationId) {
    const invitation = await prisma.crmInvitation.findUnique({
      where: { invitationId },
      include: { registeredUser: true }
    });
    return invitation?.registeredUser || null;
  }

  return null;
};

const getUserByCustomerId = async (customerId) =>
  prisma.user.findFirst({
    where: getCustomerWhere(customerId)
  });

const toPricingCustomerResponse = (user) => ({
  userId: user.id,
  crmLeadId: user.crmLeadId,
  crmCustomerId: user.crmCustomerId,
  erpCustomerId: user.erpCustomerId,
  name: user.name,
  companyName: user.company?.name || '',
  email: user.email,
  phone: user.phoneNumber || '',
  city: user.city || '',
  address: user.address || '',
  subscriptionStatus: user.subscriptionStatus,
  subscriptionPlan: user.subscriptionPlan,
  accountStatus: user.accountStatus
});

const getLoginUrl = () =>
  process.env.ERP_LOGIN_URL ||
  process.env.ERP_FRONTEND_URL ||
  process.env.CLIENT_URL ||
  'http://localhost:5173';

const getInvitationBaseUrl = () => {
  const configured =
    process.env.ERP_INVITATION_FRONTEND_URL ||
    process.env.ERP_FRONTEND_URL ||
    process.env.CLIENT_URL ||
    'http://localhost:5173/registration/invitations/:invitationId';

  return configured.trim().replace(/\/$/, '');
};

const buildInvitationUrl = (invitationId) => {
  const baseUrl = getInvitationBaseUrl();
  if (baseUrl.includes(':invitationId')) {
    return baseUrl.replace(':invitationId', encodeURIComponent(invitationId));
  }

  if (/\/(registration\/)?invitations\/?$/.test(baseUrl)) {
    return `${baseUrl}/${encodeURIComponent(invitationId)}`;
  }

  return `${baseUrl}/registration/invitations/${encodeURIComponent(invitationId)}`;
};

const getUserForPricingPurchase = async ({
  userId,
  customerId,
  crmCustomerId,
  erpCustomerId,
  email
}) => {
  if (userId) {
    return prisma.user.findUnique({ where: { id: String(userId) } });
  }

  const filters = [];
  if (customerId) filters.push(...getCustomerWhere(customerId).OR);
  if (crmCustomerId) filters.push({ crmCustomerId: String(crmCustomerId) });
  if (erpCustomerId) filters.push({ erpCustomerId: String(erpCustomerId) });
  if (email) filters.push({ email: normalizeEmail(email) });

  if (filters.length === 0) return null;

  return prisma.user.findFirst({
    where: { OR: filters },
    orderBy: { createdAt: 'asc' }
  });
};

const buildPricingReference = ({ paymentId, orderId, email, erpCustomerId, crmCustomerId }) => {
  const reference =
    paymentId ||
    orderId ||
    erpCustomerId ||
    crmCustomerId ||
    normalizeEmail(email);

  return String(reference || '').trim().replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80);
};

const normalizePurchaseFlow = (flow) =>
  String(flow || '').trim().toUpperCase().replace(/[\s-]+/g, '_');

const inferPurchaseFlow = ({ purchaseFlow, userId, customerId, crmCustomerId, erpCustomerId }) => {
  const normalized = normalizePurchaseFlow(purchaseFlow);
  if (normalized === PURCHASE_FLOWS.TRIAL_UPGRADE) return PURCHASE_FLOWS.TRIAL_UPGRADE;
  if (normalized === PURCHASE_FLOWS.DIRECT_WEBSITE_PURCHASE) return PURCHASE_FLOWS.DIRECT_WEBSITE_PURCHASE;

  return userId || customerId || crmCustomerId || erpCustomerId
    ? PURCHASE_FLOWS.TRIAL_UPGRADE
    : PURCHASE_FLOWS.DIRECT_WEBSITE_PURCHASE;
};

const normalizeText = (value) => String(value || '').trim();

const normalizePackage = (plan) => {
  const selectedPlan = normalizeText(plan);
  const normalized = selectedPlan.toLowerCase();
  if (normalized.includes('advanced')) return 'Advanced';
  if (normalized.includes('premium')) return 'Premium';
  if (normalized.includes('basic')) return 'Basic';
  if (normalized.includes('free')) return 'Free';
  return selectedPlan || null;
};

const formatClientErpCustomerId = (clientId) =>
  `ERP-CUST-${String(clientId).padStart(6, '0')}`;

const generateSecureTemporaryPassword = (length = 14) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!';
  return Array.from({ length }, () => chars[randomInt(chars.length)]).join('');
};

const findCompanyId = async ({ tx, companyName, requestedCompanyId }) => {
  if (requestedCompanyId) {
    const company = await tx.company.findUnique({
      where: { id: requestedCompanyId },
      select: { id: true }
    });
    if (company) return company.id;
  }

  if (companyName) {
    const existing = await tx.company.findFirst({ where: { name: companyName } });
    if (existing) return existing.id;
    const created = await tx.company.create({ data: { name: companyName } });
    return created.id;
  }

  if (process.env.ERP_DEFAULT_COMPANY_ID) {
    const company = await tx.company.findUnique({
      where: { id: process.env.ERP_DEFAULT_COMPANY_ID },
      select: { id: true }
    });
    if (company) return company.id;
  }

  const firstCompany = await tx.company.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { id: true }
  });

  return firstCompany?.id || null;
};

const findOrCreatePricingClient = async ({
  tx,
  companyId,
  name,
  companyName,
  email,
  phone
}) => {
  const contactFilters = [];
  if (email) contactFilters.push({ clientEmail: email });
  if (phone) contactFilters.push({ clientPhone: phone });

  if (contactFilters.length > 0) {
    const existing = await tx.client.findFirst({
      where: { companyId, OR: contactFilters },
      orderBy: { createdAt: 'asc' }
    });
    if (existing) return existing;
  }

  return tx.client.create({
    data: {
      companyId,
      clientName: name,
      companyName: companyName || '',
      clientPhone: phone || '',
      clientEmail: email || '',
      clientAddress: '',
      clientGST: ''
    }
  });
};

const createDirectPricingUser = async ({
  customer,
  plan,
  companyId,
  companyName,
  name,
  email,
  phone
}) => {
  const temporaryPassword = generateSecureTemporaryPassword();
  const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
  const selectedPackage = normalizePackage(plan);

  const user = await prisma.$transaction(async (tx) => {
    const resolvedCompanyId = await findCompanyId({
      tx,
      companyName,
      requestedCompanyId: companyId
    });

    if (!resolvedCompanyId) {
      const error = new Error('No ERP company is available for direct pricing purchase');
      error.statusCode = 400;
      error.details = {
        companyId: 'Provide companyId/erpCompanyId or configure ERP_DEFAULT_COMPANY_ID'
      };
      throw error;
    }

    const client = await findOrCreatePricingClient({
      tx,
      companyId: resolvedCompanyId,
      name,
      companyName,
      email,
      phone
    });
    const erpCustomerId = customer.erp_customer_id || formatClientErpCustomerId(client.id);

    return tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'Admin',
        companyId: resolvedCompanyId,
        phoneNumber: phone || '',
        city: '',
        address: '',
        gstNumber: '',
        isActive: true,
        clientId: client.id,
        crmLeadId: null,
        crmCustomerId: String(customer.id),
        erpCustomerId,
        accountStatus: 'ACTIVE',
        package: selectedPackage,
        subscriptionPlan: plan
      }
    });
  });

  return { user, temporaryPassword };
};

const linkExistingUserToPricingCustomer = async ({
  user,
  customer,
  companyId,
  companyName,
  name,
  email,
  phone,
  plan
}) =>
  prisma.$transaction(async (tx) => {
    const resolvedCompanyId =
      user.companyId ||
      (await findCompanyId({
        tx,
        companyName,
        requestedCompanyId: companyId
      }));

    if (!resolvedCompanyId) {
      const error = new Error('No ERP company is available for direct pricing purchase');
      error.statusCode = 400;
      error.details = {
        companyId: 'Provide companyId/erpCompanyId or configure ERP_DEFAULT_COMPANY_ID'
      };
      throw error;
    }

    let clientId = user.clientId;
    if (!clientId) {
      const client = await findOrCreatePricingClient({
        tx,
        companyId: resolvedCompanyId,
        name,
        companyName,
        email,
        phone
      });
      clientId = client.id;
    }

    return tx.user.update({
      where: { id: user.id },
      data: {
        companyId: resolvedCompanyId,
        clientId,
        crmCustomerId: String(customer.id),
        erpCustomerId: user.erpCustomerId || customer.erp_customer_id || formatClientErpCustomerId(clientId),
        phoneNumber: user.phoneNumber || phone || '',
        subscriptionPlan: plan
      }
    });
  });

const sendPaymentSuccessfulAccountEmail = async ({
  user,
  plan,
  temporaryPassword,
  reusedExistingUser
}) => {
  const loginUrl = getLoginUrl();
  const passwordLine = temporaryPassword
    ? `<p style="margin:0"><strong>Temporary Password:</strong> ${temporaryPassword}</p>`
    : `<p style="margin:0"><strong>Temporary Password:</strong> Not generated. Use your existing ERP password.</p>`;

  const result = await sendEmail({
    to: user.email,
    subject: 'Payment Successful – Your ERP Account is Ready',
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:560px;margin:auto">
        <h2 style="margin-bottom:12px">Your ERP Account is Ready</h2>
        <p>Hi <strong>${user.name || 'Customer'}</strong>,</p>
        <p>Your payment was successful and your ERP subscription is active.</p>
        <div style="background:#fff8e1;border:1px solid #ffbe01;border-radius:12px;padding:16px;margin:20px 0">
          <p style="margin:0 0 8px"><strong>Customer Name:</strong> ${user.name || 'Customer'}</p>
          <p style="margin:0 0 8px"><strong>Purchased Plan:</strong> ${plan}</p>
          <p style="margin:0 0 8px"><strong>ERP Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
          <p style="margin:0 0 8px"><strong>Registered Email:</strong> ${user.email}</p>
          ${passwordLine}
        </div>
        ${
          reusedExistingUser
            ? '<p>Your existing ERP account was reused. No invitation or registration is required.</p>'
            : '<p>Please log in with the temporary password and change it from your profile.</p>'
        }
        <p>Best Regards,<br/><strong>Vconstech ERP</strong></p>
      </div>
    `
  });

  return {
    sent: result.success,
    to: user.email,
    subject: 'Payment Successful – Your ERP Account is Ready',
    loginUrl,
    ...(temporaryPassword ? { temporaryPasswordIncluded: true } : {}),
    ...(result.success ? {} : { error: result.error, code: result.code })
  };
};

const sendSubscriptionActivatedEmail = async ({ user, plan }) => {
  const loginUrl = getLoginUrl();

  await sendEmail({
    to: user.email,
    subject: 'Subscription Activated Successfully',
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:560px;margin:auto">
        <h2 style="margin-bottom:12px">Subscription Activated Successfully</h2>
        <p>Hi <strong>${user.name || 'Customer'}</strong>,</p>
        <p>Your ERP subscription has been activated successfully.</p>
        <div style="background:#fff8e1;border:1px solid #ffbe01;border-radius:12px;padding:16px;margin:20px 0">
          <p style="margin:0 0 8px"><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
          <p style="margin:0 0 8px"><strong>Registered Email:</strong> ${user.email}</p>
          <p style="margin:0"><strong>Subscription Plan:</strong> ${plan}</p>
        </div>
        <p>Your existing login credentials remain unchanged.</p>
        <p>Best Regards,<br/><strong>Vconstech ERP</strong></p>
      </div>
    `
  });
};

const sendPricingInvitationEmail = async ({ name, email, invitationId, plan }) => {
  if (!email) {
    const error = new Error('Customer email is required to send ERP invitation');
    error.statusCode = 400;
    throw error;
  }

  const invitationUrl = buildInvitationUrl(invitationId);

  await sendEmail({
    to: email,
    subject: 'Complete your Vconstech ERP registration',
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:560px;margin:auto">
        <h2 style="margin-bottom:12px">Complete your Vconstech ERP registration</h2>
        <p>Hi <strong>${name || 'Customer'}</strong>,</p>
        <p>Your payment was successful. Please complete your ERP registration and create your password.</p>
        <div style="background:#fff8e1;border:1px solid #ffbe01;border-radius:12px;padding:16px;margin:20px 0">
          <p style="margin:0 0 8px"><strong>Subscription Plan:</strong> ${plan}</p>
          <p style="margin:0 0 12px"><strong>Invitation ID:</strong> ${invitationId}</p>
          <a href="${invitationUrl}" style="background:#ffbe01;color:#1a1a1a;padding:10px 14px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:700">Complete registration</a>
        </div>
        <p style="font-size:13px;color:#6b7280">If the button does not work, open this link: <a href="${invitationUrl}">${invitationUrl}</a></p>
        <p>Best Regards,<br/><strong>Vconstech ERP</strong></p>
      </div>
    `
  });

  return invitationUrl;
};

const assertSyncUser = (user) => {
  if (!user) {
    const error = new Error('ERP user not found');
    error.statusCode = 404;
    throw error;
  }

  if (!user.crmCustomerId || !user.erpCustomerId) {
    const error = new Error('ERP user is not linked to CRM customer data');
    error.statusCode = 409;
    throw error;
  }
};

const retryPendingCrmSync = async ({ eventId, payload }) => {
  const event = await prisma.customerSubscription.findUnique({
    where: { eventId }
  });

  if (!event || event.crmSyncStatus === 'SYNCED') {
    return null;
  }

  return syncCrmAndMark({ event, payload });
};

const recordSubscriptionEvent = async ({
  tx,
  user,
  eventId,
  action,
  status,
  plan,
  trialStartDate,
  trialEndDate,
  purchaseDate
}) =>
  tx.customerSubscription.upsert({
    where: { eventId },
    create: {
      userId: user.id,
      crmCustomerId: user.crmCustomerId,
      erpCustomerId: user.erpCustomerId,
      eventId,
      action,
      status,
      plan,
      trialStartDate,
      trialEndDate,
      purchaseDate,
      crmSyncStatus: 'PENDING'
    },
    update: {
      status,
      plan,
      trialStartDate,
      trialEndDate,
      purchaseDate,
      crmSyncStatus: 'PENDING'
    }
  });

const syncCrmAndMark = async ({ event, payload }) => {
  const crmResponse = await sendCustomerStatusEvent(payload);

  await prisma.customerSubscription.update({
    where: { eventId: event.eventId },
    data: {
      crmSyncedAt: new Date(),
      crmSyncStatus: 'SYNCED',
      crmSyncPayload: crmResponse
    }
  });

  return crmResponse;
};

const trySyncCrmAndMark = async ({ event, payload }) => {
  try {
    return {
      synced: true,
      response: await syncCrmAndMark({ event, payload })
    };
  } catch (error) {
    console.error('[ERP->CRM] Subscription sync left pending', {
      eventId: event.eventId,
      message: error.message,
      details: error.details
    });

    return {
      synced: false,
      status: 'PENDING',
      error: error.message,
      details: error.details
    };
  }
};

export const startFreeTrial = async ({ userId, invitationId }) => {
  const user = await getUserForSubscription({ userId, invitationId });
  assertSyncUser(user);

  if (user.subscriptionStatus === 'SUBSCRIPTION_ACTIVE') {
    return {
      idempotent: true,
      status: user.subscriptionStatus,
      user,
      skippedTrial: true
    };
  }

  const eventId = buildEventId({ action: 'TRIAL_ACTIVE', userId: user.id });

  if (user.subscriptionStatus === 'TRIAL_ACTIVE') {
    let crm = null;
    try {
      crm = await retryPendingCrmSync({
        eventId,
        payload: {
          eventId,
          crmCustomerId: user.crmCustomerId,
          crmLeadId: user.crmLeadId,
          erpCustomerId: user.erpCustomerId,
          status: 'TRIAL_ACTIVE',
          trialStartDate: user.trialStartDate,
          trialEndDate: user.trialEndDate
        }
      });
    } catch (error) {
      crm = {
        synced: false,
        status: 'PENDING',
        error: error.message,
        details: error.details
      };
    }

    return {
      idempotent: true,
      status: user.subscriptionStatus,
      user,
      ...(crm ? { retriedCrmSync: crm.synced !== false, crm } : {})
    };
  }

  const now = new Date();
  const trialEndDate = addDays(now, TRIAL_DAYS);

  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: {
        isActive: true,
        accountStatus: 'ACTIVE',
        subscriptionStatus: 'TRIAL_ACTIVE',
        trialStartDate: now,
        trialEndDate
      }
    });

    const event = await recordSubscriptionEvent({
      tx,
      user: updatedUser,
      eventId,
      action: 'START_FREE_TRIAL',
      status: 'TRIAL_ACTIVE',
      trialStartDate: now,
      trialEndDate
    });

    return { user: updatedUser, event };
  });

  const crm = await trySyncCrmAndMark({
    event: result.event,
    payload: {
      eventId,
      crmCustomerId: result.user.crmCustomerId,
      crmLeadId: result.user.crmLeadId,
      erpCustomerId: result.user.erpCustomerId,
      status: 'TRIAL_ACTIVE',
      trialStartDate: now,
      trialEndDate
    }
  });

  return { idempotent: false, status: 'TRIAL_ACTIVE', user: result.user, crm };
};

export const activateSubscription = async ({
  userId,
  invitationId,
  plan = 'DEFAULT',
  purchaseDate,
  subscriptionEndDate,
  skipCrmSync = false
}) => {
  const user = await getUserForSubscription({ userId, invitationId });
  assertSyncUser(user);
  const requestedPurchaseDate = purchaseDate ? new Date(purchaseDate) : null;
  const requestedEndDate = subscriptionEndDate ? new Date(subscriptionEndDate) : null;
  const hasCustomDates =
    (requestedPurchaseDate && !Number.isNaN(requestedPurchaseDate.getTime())) ||
    (requestedEndDate && !Number.isNaN(requestedEndDate.getTime()));

  const eventId = buildEventId({
    action: `SUBSCRIPTION_ACTIVE-${plan}`,
    userId: user.id
  });

  if (!hasCustomDates && user.subscriptionStatus === 'SUBSCRIPTION_ACTIVE' && user.subscriptionPlan === plan) {
    const crm = await retryPendingCrmSync({
      eventId,
      payload: {
        eventId,
        crmCustomerId: user.crmCustomerId,
        crmLeadId: user.crmLeadId,
        erpCustomerId: user.erpCustomerId,
        status: 'SUBSCRIPTION_ACTIVE',
        plan,
        purchaseDate: user.subscriptionStartedAt
      }
    });
    return {
      idempotent: true,
      status: user.subscriptionStatus,
      user,
      ...(crm ? { retriedCrmSync: true, crm } : {})
    };
  }

  const nextPurchaseDate =
    requestedPurchaseDate && !Number.isNaN(requestedPurchaseDate.getTime())
      ? requestedPurchaseDate
      : new Date();
  // Paid plans always run for one year. Ignore an externally supplied shorter
  // end date so a monthly CRM default cannot deactivate the account early.
  const nextEndDate = addMonths(nextPurchaseDate, PAID_SUBSCRIPTION_DURATION_MONTHS);

  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: {
        isActive: true,
        accountStatus: 'ACTIVE',
        subscriptionStatus: 'SUBSCRIPTION_ACTIVE',
        subscriptionStartedAt: nextPurchaseDate,
        trialStartDate: nextPurchaseDate,
        trialEndDate: nextEndDate,
        subscriptionPlan: plan,
        package: plan
      }
    });

    const event = await recordSubscriptionEvent({
      tx,
      user: updatedUser,
      eventId,
      action: 'ACTIVATE_SUBSCRIPTION',
      status: 'SUBSCRIPTION_ACTIVE',
      plan,
      purchaseDate: nextPurchaseDate
    });

    return { user: updatedUser, event };
  });

  let crm = null;

  if (skipCrmSync) {
    await prisma.customerSubscription.update({
      where: { eventId: result.event.eventId },
      data: {
        crmSyncedAt: new Date(),
        crmSyncStatus: 'SKIPPED',
        crmSyncPayload: { reason: 'CRM sync skipped for direct pricing purchase' }
      }
    });
  } else {
    crm = await syncCrmAndMark({
      event: result.event,
      payload: {
        eventId,
        crmCustomerId: result.user.crmCustomerId,
        crmLeadId: result.user.crmLeadId,
        erpCustomerId: result.user.erpCustomerId,
        status: 'SUBSCRIPTION_ACTIVE',
        plan,
        purchaseDate: nextPurchaseDate,
        subscriptionEndDate: nextEndDate
      }
    });
  }

  return { idempotent: false, status: 'SUBSCRIPTION_ACTIVE', user: result.user, crm };
};

const syncExpiredSubscriptionEvent = async (event) => {
  const user = await prisma.user.findUnique({ where: { id: event.userId } });
  if (!user) {
    return { userId: event.userId, status: 'SKIPPED', reason: 'ERP user not found' };
  }

  const crm = await trySyncCrmAndMark({
    event,
    payload: {
      eventId: event.eventId,
      crmCustomerId: user.crmCustomerId,
      crmLeadId: user.crmLeadId,
      erpUserId: user.id,
      erpCustomerId: user.erpCustomerId,
      status: event.status,
      trialStartDate: user.trialStartDate,
      trialEndDate: user.trialEndDate
    }
  });

  return { userId: user.id, status: event.status, crm, retriedCrmSync: true };
};

export const expireTrials = async () => {
  const now = new Date();
  // Repair accounts left in an inconsistent state by an earlier failed/interrupted run.
  // They are already marked expired, so no new expiry event is needed.
  const repairedTrials = await prisma.user.updateMany({
    where: { subscriptionStatus: 'TRIAL_EXPIRED', isActive: true },
    data: { isActive: false, accountStatus: 'TRIAL_EXPIRED' }
  });
  const repairedSubscriptions = await prisma.user.updateMany({
    where: { subscriptionStatus: 'SUBSCRIPTION_EXPIRED', isActive: true },
    data: { isActive: false, accountStatus: 'SUBSCRIPTION_EXPIRED' }
  });
  const users = await prisma.user.findMany({
    where: {
      subscriptionStatus: { in: ['TRIAL_ACTIVE', 'SUBSCRIPTION_ACTIVE'] },
      trialEndDate: { lt: now }
    }
  });

  const results = [];
  const processedEventIds = new Set();

  for (const user of users) {
    const isPaidSubscription = user.subscriptionStatus === 'SUBSCRIPTION_ACTIVE';
    const expiredStatus = isPaidSubscription ? 'SUBSCRIPTION_EXPIRED' : 'TRIAL_EXPIRED';
    const eventId = buildEventId({ action: expiredStatus, userId: user.id });
    processedEventIds.add(eventId);

    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          isActive: false,
          accountStatus: expiredStatus,
          subscriptionStatus: expiredStatus
        }
      });

      const event = await recordSubscriptionEvent({
        tx,
        user: updatedUser,
        eventId,
        action: isPaidSubscription ? 'EXPIRE_SUBSCRIPTION' : 'EXPIRE_TRIAL',
        status: expiredStatus,
        trialStartDate: user.trialStartDate,
        trialEndDate: user.trialEndDate
      });

      return { user: updatedUser, event };
    });

    const crm = await trySyncCrmAndMark({
      event: result.event,
      payload: {
        eventId,
        crmCustomerId: result.user.crmCustomerId,
        crmLeadId: result.user.crmLeadId,
        erpUserId: result.user.id,
        erpCustomerId: result.user.erpCustomerId,
        status: expiredStatus,
        trialStartDate: result.user.trialStartDate,
        trialEndDate: result.user.trialEndDate
      }
    });

    results.push({ userId: user.id, status: expiredStatus, crm });
  }

  const pendingExpiredEvents = await prisma.customerSubscription.findMany({
    where: {
      status: { in: ['TRIAL_EXPIRED', 'SUBSCRIPTION_EXPIRED'] },
      crmSyncStatus: { not: 'SYNCED' }
    }
  });

  for (const event of pendingExpiredEvents) {
    if (processedEventIds.has(event.eventId)) continue;
    results.push(await syncExpiredSubscriptionEvent(event));
  }

  return {
    expired: users.length,
    repaired: repairedTrials.count + repairedSubscriptions.count,
    processed: results.length,
    results
  };
};

export const getSubscriptionStatus = async ({ customerId }) => {
  const user = await prisma.user.findFirst({
    where: getCustomerWhere(customerId)
  });

  if (!user) {
    const error = new Error('ERP customer subscription status not found');
    error.statusCode = 404;
    throw error;
  }

  return toStatusResponse(user);
};

export const getPricingCustomerDetails = async ({
  userId,
  customerId,
  crmCustomerId,
  erpCustomerId,
  email
}) => {
  if (!userId && !customerId && !crmCustomerId && !erpCustomerId && !email) {
    const error = new Error('Customer identifier is required');
    error.statusCode = 400;
    error.details = {
      customer: 'Provide userId, customerId, crmCustomerId, erpCustomerId, or email'
    };
    throw error;
  }

  const user = await getUserForPricingPurchase({
    userId,
    customerId,
    crmCustomerId,
    erpCustomerId,
    email
  });

  if (!user) {
    const error = new Error('ERP customer not found');
    error.statusCode = 404;
    throw error;
  }

  const userWithCompany = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phoneNumber: true,
      city: true,
      address: true,
      crmLeadId: true,
      crmCustomerId: true,
      erpCustomerId: true,
      subscriptionStatus: true,
      subscriptionPlan: true,
      accountStatus: true,
      company: {
        select: {
          name: true
        }
      }
    }
  });

  return toPricingCustomerResponse(userWithCompany);
};

export const setSubscriptionStatus = async ({
  customerId,
  status,
  accountStatus,
  isActive,
  plan,
  purchaseDate,
  subscriptionEndDate
}) => {
  const current = await getUserByCustomerId(customerId);

  if (!current) {
    const error = new Error('ERP customer subscription status not found');
    error.statusCode = 404;
    throw error;
  }

  const normalizedStatus = normalizeSubscriptionStatus(status);

  if (normalizedStatus === 'SUBSCRIPTION_ACTIVE') {
    const requestedPurchaseDate = purchaseDate ? new Date(purchaseDate) : null;
    const nextPurchaseDate =
      requestedPurchaseDate && !Number.isNaN(requestedPurchaseDate.getTime())
        ? requestedPurchaseDate
        : new Date();
    const nextEndDate = addMonths(nextPurchaseDate, PAID_SUBSCRIPTION_DURATION_MONTHS);
    const selectedPlan = plan || current.subscriptionPlan || current.package || 'DEFAULT';

    const updated = await prisma.user.update({
      where: { id: current.id },
      data: {
        isActive: typeof isActive === 'boolean' ? isActive : true,
        accountStatus: accountStatus || 'ACTIVE',
        subscriptionStatus: 'SUBSCRIPTION_ACTIVE',
        subscriptionStartedAt: nextPurchaseDate,
        trialStartDate: nextPurchaseDate,
        trialEndDate: nextEndDate,
        subscriptionPlan: selectedPlan,
        package: selectedPlan
      }
    });

    return toStatusResponse(updated);
  }

  const updated = await prisma.user.update({
    where: { id: current.id },
    data: {
      ...(status ? { subscriptionStatus: normalizedStatus } : {}),
      ...(accountStatus ? { accountStatus } : {}),
      ...(typeof isActive === 'boolean' ? { isActive } : {}),
      ...(plan ? { subscriptionPlan: plan, package: plan } : {}),
      ...(purchaseDate ? { subscriptionStartedAt: new Date(purchaseDate), trialStartDate: new Date(purchaseDate) } : {}),
      ...(subscriptionEndDate ? { trialEndDate: new Date(subscriptionEndDate) } : {})
    }
  });

  return toStatusResponse(updated);
};

const processTrialUpgradePurchaseSuccess = async ({
  userId,
  customerId,
  crmCustomerId,
  erpCustomerId,
  email,
  plan,
}) => {
  const selectedPlan = String(plan || '').trim();
  if (!selectedPlan) {
    const error = new Error('Subscription plan is required');
    error.statusCode = 400;
    error.details = { plan: 'Provide the purchased subscription plan' };
    throw error;
  }

  const user = await getUserForPricingPurchase({
    userId,
    customerId,
    crmCustomerId,
    erpCustomerId,
    email
  });

  if (!user) {
    const error = new Error('ERP user not found for trial upgrade purchase');
    error.statusCode = 404;
    error.details = {
      purchaseFlow: PURCHASE_FLOWS.TRIAL_UPGRADE,
      user: 'Trial upgrade requires an existing ERP user'
    };
    throw error;
  }

  const activation = await activateSubscription({
    userId: user.id,
    plan: selectedPlan
  });

  const emailResult =
    activation.idempotent
      ? {
          sent: false,
          skipped: true,
          reason: 'pricing purchase already processed',
          to: activation.user.email,
          subject: 'Payment Successful â€“ Your ERP Account is Ready'
        }
      : await sendPaymentSuccessfulAccountEmail({
          user: activation.user,
          plan: selectedPlan,
          temporaryPassword: null,
          reusedExistingUser: true
        });

  return {
    purchaseFlow: PURCHASE_FLOWS.TRIAL_UPGRADE,
    idempotent: activation.idempotent,
    status: activation.status,
    user: toStatusResponse(activation.user),
    email: emailResult,
    crm: activation.crm || null,
    retriedCrmSync: activation.retriedCrmSync || false
  };
};

const processDirectWebsitePurchaseSuccess = async ({
  userId,
  customerId,
  crmCustomerId,
  erpCustomerId,
  email,
  plan,
  name,
  companyName,
  phone,
  paymentId,
  orderId,
  companyId
}) => {
  const selectedPlan = String(plan || '').trim();
  if (!selectedPlan) {
    const error = new Error('Subscription plan is required');
    error.statusCode = 400;
    error.details = { plan: 'Provide the purchased subscription plan' };
    throw error;
  }

  const customerEmail = normalizeEmail(email);
  const customerName = normalizeText(name || companyName || customerEmail);
  if (!customerName || !customerEmail) {
    const error = new Error('Customer name and email are required');
    error.statusCode = 400;
    error.details = {
      name: 'Provide customer name or companyName',
      email: 'Provide customer registered email'
    };
    throw error;
  }

  const crmResult = await ensureDirectPricingCustomer({
    name: customerName,
    companyName,
    email: customerEmail,
    phone,
    plan: selectedPlan,
    paymentId,
    orderId
  });
  const crmCustomer = crmResult?.data?.customer;
  if (!crmCustomer?.id) {
    const error = new Error('CRM customer was not returned for direct pricing purchase');
    error.statusCode = 502;
    error.details = crmResult;
    throw error;
  }

  let user = await getUserForPricingPurchase({
    userId,
    customerId: customerId || crmCustomer.id,
    crmCustomerId: crmCustomerId || crmCustomer.id,
    erpCustomerId,
    email: customerEmail
  });
  let temporaryPassword = null;
  let reusedExistingUser = Boolean(user);

  if (!user) {
    const created = await createDirectPricingUser({
      customer: crmCustomer,
      plan: selectedPlan,
      companyId,
      companyName,
      name: customerName,
      email: customerEmail,
      phone
    });
    user = created.user;
    temporaryPassword = created.temporaryPassword;
  } else if (
    !user.crmCustomerId ||
    String(user.crmCustomerId) !== String(crmCustomer.id) ||
    !user.erpCustomerId
  ) {
    user = await linkExistingUserToPricingCustomer({
      user,
      customer: crmCustomer,
      companyId,
      companyName,
      name: customerName,
      email: customerEmail,
      phone,
      plan: selectedPlan
    });
  }

  const activation = await activateSubscription({
    userId: user.id,
    plan: selectedPlan
  });

  const emailResult =
    activation.idempotent && !temporaryPassword
      ? {
          sent: false,
          skipped: true,
          reason: 'pricing purchase already processed',
          to: activation.user.email,
          subject: 'Payment Successful – Your ERP Account is Ready'
        }
      : await sendPaymentSuccessfulAccountEmail({
          user: activation.user,
          plan: selectedPlan,
          temporaryPassword,
          reusedExistingUser
        });

  return {
    purchaseFlow: PURCHASE_FLOWS.DIRECT_WEBSITE_PURCHASE,
    idempotent: activation.idempotent,
    status: activation.status,
    user: toStatusResponse(activation.user),
    crmCustomer: {
      id: crmCustomer.id,
      created: crmResult.data?.created === true
    },
    email: emailResult,
    crm: activation.crm || null,
    retriedCrmSync: activation.retriedCrmSync || false
  };
};

export const processPricingPurchaseSuccess = async (input) => {
  const purchaseFlow = inferPurchaseFlow(input);

  if (purchaseFlow === PURCHASE_FLOWS.TRIAL_UPGRADE) {
    return processTrialUpgradePurchaseSuccess(input);
  }

  return processDirectWebsitePurchaseSuccess(input);
};

export const activatePricingInvitationRegistration = async ({ registration }) => {
  const pricingPurchase = registration?.pricingPurchase;
  const plan = String(pricingPurchase?.plan || '').trim();

  if (!registration?.user?.id || !plan) {
    return null;
  }

  const activation = await activateSubscription({
    userId: registration.user.id,
    plan,
    skipCrmSync: pricingPurchase.skipCrmSync === true
  });

  await sendSubscriptionActivatedEmail({
    user: activation.user,
    plan
  });

  return {
    idempotent: activation.idempotent,
    status: activation.status,
    user: toStatusResponse(activation.user),
    email: {
      to: activation.user.email,
      subject: 'Subscription Activated Successfully'
    },
    crm: activation.crm || null
  };
};

export const runTrialExpiryJob = async () => {
  try {
    const result = await expireTrials();
    console.log('[TrialExpiryJob] Completed', {
      expired: result.expired,
      processed: result.processed
    });
    return result;
  } catch (error) {
    console.error('[TrialExpiryJob] Failed', {
      message: error.message,
      details: error.details
    });
    throw error;
  }
};

export const scheduleTrialExpiryJob = () => {
  if (trialExpiryJob) return trialExpiryJob;

  if (process.env.ERP_TRIAL_EXPIRY_RUN_ON_STARTUP === 'true') {
    runTrialExpiryJob().catch(() => {});
  }

  trialExpiryJob = setInterval(() => {
    runTrialExpiryJob().catch(() => {});
  }, TRIAL_EXPIRY_INTERVAL_MS);

  trialExpiryJob.unref?.();
  console.log('[TrialExpiryJob] Scheduled', {
    intervalMs: TRIAL_EXPIRY_INTERVAL_MS
  });

  return trialExpiryJob;
};
