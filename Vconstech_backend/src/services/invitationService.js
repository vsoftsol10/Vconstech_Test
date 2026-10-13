import { prisma } from '../config/database.js';
import bcrypt from 'bcryptjs';

const INVITED_STATUS = 'INVITED';
const REGISTERING_STATUS = 'REGISTERING';
const REGISTERED_STATUS = 'REGISTERED';

const formatClientId = (clientId) =>
  `ERP-CUST-${String(clientId).padStart(6, '0')}`;

const formatInvitationId = (invitationId) =>
  `ERP-INV-${String(invitationId).padStart(6, '0')}`;

const pickFirst = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== '');

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const normalizeText = (value) => String(value || '').trim();

const getInvitationCustomer = (invitation) => {
  const customerPayload = invitation.requestPayload?.customer || {};

  return {
    clientId: invitation.client.id,
    name: pickFirst(customerPayload.name, invitation.client.clientName),
    companyName: pickFirst(customerPayload.companyName, invitation.client.companyName),
    email: pickFirst(customerPayload.email, invitation.client.clientEmail),
    phone: pickFirst(customerPayload.phone, invitation.client.clientPhone),
    address: pickFirst(customerPayload.address, invitation.client.clientAddress),
    location: pickFirst(customerPayload.location, customerPayload.city),
    city: pickFirst(customerPayload.city, customerPayload.location),
    subscriptionPlan: pickFirst(
      customerPayload.subscriptionPlan,
      invitation.requestPayload?.pricingPurchase?.plan,
      invitation.requestPayload?.plan
    ),
    employeeCount: pickFirst(
      customerPayload.employeeCount,
      customerPayload.customMembers,
      invitation.requestPayload?.customMembers,
      invitation.requestPayload?.pricingPurchase?.customMembers
    )
  };
};

const normalizePackage = (plan) => {
  const selectedPlan = normalizeText(plan);
  const normalized = selectedPlan.toLowerCase();
  if (normalized.includes('advanced')) return 'Advanced';
  if (normalized.includes('premium')) return 'Premium';
  if (normalized.includes('basic')) return 'Basic';
  if (normalized.includes('free')) return 'Free';
  return selectedPlan || null;
};

const findOrCreateCustomerCompany = async (tx, companyName, fallbackCompanyId) => {
  const name = normalizeText(companyName);
  if (!name) return fallbackCompanyId;

  let company = await tx.company.findFirst({ where: { name } });
  if (!company) {
    company = await tx.company.create({ data: { name } });
  }

  return company.id;
};

const findCompanyId = async (requestedCompanyId) => {
  if (requestedCompanyId) {
    const company = await prisma.company.findUnique({
      where: { id: requestedCompanyId },
      select: { id: true }
    });
    if (company) return company.id;
  }

  if (process.env.ERP_DEFAULT_COMPANY_ID) {
    const company = await prisma.company.findUnique({
      where: { id: process.env.ERP_DEFAULT_COMPANY_ID },
      select: { id: true }
    });
    if (company) return company.id;
  }

  const firstCompany = await prisma.company.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { id: true }
  });

  return firstCompany?.id || null;
};

const findExistingInvitation = async ({ idempotencyKey, crmLeadId, crmCustomerId }) =>
  prisma.crmInvitation.findFirst({
    where: {
      OR: [
        { idempotencyKey },
        { crmLeadId },
        { crmCustomerId }
      ]
    },
    include: { client: true }
  });

const findExistingClient = async ({ companyId, email, phone }) => {
  const contactFilters = [];

  if (email) contactFilters.push({ clientEmail: email });
  if (phone) contactFilters.push({ clientPhone: phone });

  if (contactFilters.length === 0) return null;

  return prisma.client.findFirst({
    where: {
      companyId,
      OR: contactFilters
    },
    orderBy: { createdAt: 'asc' }
  });
};

const createDraftClient = async ({ companyId, customer }) =>
  prisma.client.create({
    data: {
      companyId,
      clientName: customer.name,
      companyName: customer.companyName || '',
      clientPhone: customer.phone || '',
      clientEmail: customer.email || '',
      clientAddress: customer.address || '',
      clientGST: ''
    }
  });

const createInvitationForClient = async ({
  input,
  companyId,
  client,
  requestPayload
}) => {
  const erpCustomerId = formatClientId(client.id);

  const invitation = await prisma.crmInvitation.create({
    data: {
      idempotencyKey: input.idempotencyKey,
      crmLeadId: input.crmLeadId,
      crmCustomerId: input.crmCustomerId,
      companyId,
      clientId: client.id,
      erpCustomerId,
      status: INVITED_STATUS,
      requestPayload
    },
    include: { client: true }
  });

  const invitationId = formatInvitationId(invitation.id);

  return prisma.crmInvitation.update({
    where: { id: invitation.id },
    data: { invitationId },
    include: { client: true }
  });
};

const toApiResponse = (invitation) => ({
  invitationId: invitation.invitationId,
  erpCustomerId: invitation.erpCustomerId,
  status: invitation.status,
  clientId: invitation.clientId,
  alreadyExists: true
});

export const createCrmInvitation = async ({ input, requestPayload }) => {
  const existingInvitation = await findExistingInvitation(input);
  if (existingInvitation) {
    return toApiResponse(existingInvitation);
  }

  const companyId = await findCompanyId(input.companyId);
  if (!companyId) {
    const error = new Error('No ERP company is available for CRM invitation');
    error.statusCode = 400;
    error.details = {
      companyId: 'Provide companyId/erpCompanyId or configure ERP_DEFAULT_COMPANY_ID'
    };
    throw error;
  }

  const client =
    (await findExistingClient({
      companyId,
      email: input.customer.email,
      phone: input.customer.phone
    })) ||
    (await createDraftClient({
      companyId,
      customer: input.customer
    }));

  const existingClientInvitation = await prisma.crmInvitation.findFirst({
    where: {
      clientId: client.id,
      crmLeadId: input.crmLeadId
    }
  });

  if (existingClientInvitation) {
    return toApiResponse(existingClientInvitation);
  }

  const invitation = await createInvitationForClient({
    input,
    companyId,
    client,
    requestPayload
  });

  return {
    ...toApiResponse(invitation),
    alreadyExists: false
  };
};

const toPublicInvitation = (invitation) => {
  const customer = getInvitationCustomer(invitation);

  return {
    invitationId: invitation.invitationId,
    erpCustomerId: invitation.erpCustomerId,
    status: invitation.status,
    crmLeadId: invitation.crmLeadId,
    crmCustomerId: invitation.crmCustomerId,
    customer
  };
};

const getPricingPurchase = (requestPayload) => {
  const payload = requestPayload || {};
  const plan =
    payload.pricingPurchase?.plan ||
    payload.customer?.subscriptionPlan ||
    payload.plan;

  const paymentStatus = String(
    payload.customer?.paymentStatus || payload.paymentStatus || ''
  ).toUpperCase();

  if (payload.source !== 'PRICING_WEBSITE' && paymentStatus !== 'PAID') {
    return null;
  }

  if (!plan) return null;

  return {
    plan,
    paymentId: payload.pricingPurchase?.paymentId,
    orderId: payload.pricingPurchase?.orderId,
    skipCrmSync: !payload.crmCustomerId || String(payload.crmCustomerId).startsWith('pricing-customer-')
  };
};

export const getRegistrationInvitation = async (invitationId) => {
  const invitation = await prisma.crmInvitation.findUnique({
    where: { invitationId },
    include: { client: true, registeredUser: true }
  });

  if (!invitation) {
    const error = new Error('Invitation not found');
    error.statusCode = 404;
    throw error;
  }

  if (!invitation.client) {
    const error = new Error('Invitation customer record is missing');
    error.statusCode = 409;
    throw error;
  }

  if (invitation.status !== INVITED_STATUS) {
    const error = new Error('Invitation is not available for registration');
    error.statusCode = 409;
    error.details = {
      status: invitation.status,
      registeredUserId: invitation.registeredUserId
    };
    throw error;
  }

  return toPublicInvitation(invitation);
};

export const registerInvitationAccount = async ({ invitationId, input }) => {
  const invitation = await prisma.crmInvitation.findUnique({
    where: { invitationId },
    include: {
      client: true,
      registeredUser: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          companyId: true,
          clientId: true,
          crmLeadId: true,
          crmCustomerId: true,
          erpCustomerId: true,
          isActive: true
        }
      }
    }
  });

  if (!invitation) {
    const error = new Error('Invitation not found');
    error.statusCode = 404;
    throw error;
  }

  if (invitation.status === REGISTERED_STATUS && invitation.registeredUser) {
    const submittedEmail = normalizeEmail(input.email || invitation.client?.clientEmail);
    const registeredEmail = normalizeEmail(invitation.registeredUser.email);

    if (submittedEmail && submittedEmail !== registeredEmail) {
      const error = new Error('Invitation has already been used by another email');
      error.statusCode = 409;
      error.details = { status: invitation.status };
      throw error;
    }

    return {
      user: invitation.registeredUser,
      invitationId: invitation.invitationId,
      erpCustomerId: invitation.erpCustomerId,
      status: invitation.status,
      clientId: invitation.client.id,
      crmLeadId: invitation.crmLeadId,
      crmCustomerId: invitation.crmCustomerId,
      pricingPurchase: getPricingPurchase(invitation.requestPayload),
      idempotent: true
    };
  }

  if (invitation.status !== INVITED_STATUS) {
    const error = new Error('Invitation has already been used or is no longer valid');
    error.statusCode = 409;
    error.details = { status: invitation.status };
    throw error;
  }

  if (!invitation.client) {
    const error = new Error('Invitation customer record is missing');
    error.statusCode = 409;
    throw error;
  }

  const invitedCustomer = getInvitationCustomer(invitation);
  const email = invitedCustomer.email || invitation.client.clientEmail;
  if (!email) {
    const error = new Error('Email is required to create the ERP account');
    error.statusCode = 400;
    error.details = { email: 'Provide email or ensure invitation customer has an email' };
    throw error;
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const error = new Error('An ERP user already exists for this email');
    error.statusCode = 409;
    error.details = { email };
    throw error;
  }

  const password = await bcrypt.hash(input.password, 10);
  const selectedPlan = normalizeText(invitedCustomer.subscriptionPlan);
  const selectedPackage = normalizePackage(selectedPlan);
  const employeeCount = invitedCustomer.employeeCount
    ? Number(invitedCustomer.employeeCount)
    : null;

  const result = await prisma.$transaction(async (tx) => {
    const locked = await tx.crmInvitation.updateMany({
      where: {
        invitationId,
        status: INVITED_STATUS
      },
      data: {
        status: REGISTERING_STATUS
      }
    });

    if (locked.count !== 1) {
      const error = new Error('Invitation has already been used or is no longer valid');
      error.statusCode = 409;
      throw error;
    }

    const clientCompanyName = normalizeText(invitedCustomer.companyName);
    const client = clientCompanyName
      ? await tx.client.update({
          where: { id: invitation.clientId },
          data: { companyName: clientCompanyName }
        })
      : invitation.client;
    const companyId = await findOrCreateCustomerCompany(
      tx,
      clientCompanyName,
      invitation.companyId
    );

    const user = await tx.user.create({
      data: {
        name: invitedCustomer.name || client.clientName,
        email,
        password,
        role: 'Admin',
        companyId,
        phoneNumber: invitedCustomer.phone || client.clientPhone || '',
        city: invitedCustomer.city || invitedCustomer.location || input.city || '',
        address: invitedCustomer.address || client.clientAddress || '',
        gstNumber: input.gstNumber || client.clientGST || '',
        isActive: true,
        clientId: client.id,
        crmLeadId: invitation.crmLeadId,
        crmCustomerId: invitation.crmCustomerId,
        erpCustomerId: invitation.erpCustomerId,
        accountStatus: 'ACTIVE',
        package: selectedPackage,
        customMembers: Number.isFinite(employeeCount) ? employeeCount : null,
        subscriptionPlan: selectedPlan || null
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyId: true,
        clientId: true,
        crmLeadId: true,
        crmCustomerId: true,
        erpCustomerId: true,
        isActive: true
      }
    });

    const updatedInvitation = await tx.crmInvitation.update({
      where: { invitationId },
      data: {
        status: REGISTERED_STATUS,
        registeredUserId: user.id,
        registeredAt: new Date()
      }
    });

    return { user, invitation: updatedInvitation, client };
  });

  return {
    user: result.user,
    invitationId: result.invitation.invitationId,
    erpCustomerId: result.invitation.erpCustomerId,
    status: result.invitation.status,
    clientId: result.client.id,
    crmLeadId: result.invitation.crmLeadId,
    crmCustomerId: result.invitation.crmCustomerId,
    pricingPurchase: getPricingPurchase(result.invitation.requestPayload)
  };
};
