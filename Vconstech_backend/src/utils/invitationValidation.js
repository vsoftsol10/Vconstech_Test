const normalizeString = (value) => String(value || '').trim();
const normalizeEmail = (value) => normalizeString(value).toLowerCase();
const normalizePhone = (value) => normalizeString(value).replace(/\D/g, '');

const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

export const validateInvitationPayload = (payload = {}) => {
  const customer = payload.customer || {};

  const values = {
    source: normalizeString(payload.source || 'CRM'),
    event: normalizeString(payload.event || 'LEAD_WON'),
    idempotencyKey: normalizeString(payload.idempotencyKey),
    crmLeadId: normalizeString(payload.crmLeadId),
    crmCustomerId: normalizeString(payload.crmCustomerId),
    companyId: normalizeString(payload.erpCompanyId || payload.companyId),
    customer: {
      name: normalizeString(customer.name),
      companyName: normalizeString(customer.companyName),
      email: normalizeEmail(customer.email),
      phone: normalizePhone(customer.phone),
      address: normalizeString(customer.address),
      location: normalizeString(customer.location || customer.city),
      channel: normalizeString(customer.channel),
      subscriptionPlan: normalizeString(customer.subscriptionPlan),
      paymentStatus: normalizeString(customer.paymentStatus)
    }
  };

  const errors = {};

  if (!values.crmLeadId) errors.crmLeadId = 'CRM Lead ID is required';
  if (!values.crmCustomerId) errors.crmCustomerId = 'CRM Customer ID is required';
  if (!values.customer.name) errors.customerName = 'Customer name is required';

  if (!values.customer.email && !values.customer.phone) {
    errors.customerContact = 'Customer email or phone is required';
  }

  if (values.customer.email && !EMAIL_PATTERN.test(values.customer.email)) {
    errors.customerEmail = 'Customer email is invalid';
  }

  return {
    values: {
      ...values,
      idempotencyKey:
        values.idempotencyKey ||
        `crm-lead-${values.crmLeadId}-customer-${values.crmCustomerId}`
    },
    errors
  };
};

export const validateRegistrationPayload = (payload = {}) => {
  const values = {
    name: normalizeString(payload.name),
    email: normalizeEmail(payload.email),
    password: String(payload.password || ''),
    companyName: normalizeString(payload.companyName),
    phoneNumber: normalizePhone(payload.phoneNumber || payload.phone),
    city: normalizeString(payload.city),
    address: normalizeString(payload.address),
    gstNumber: normalizeString(payload.gstNumber)
  };

  const errors = {};

  if (!values.name) errors.name = 'Name is required';
  if (values.email && !EMAIL_PATTERN.test(values.email)) {
    errors.email = 'Email is invalid';
  }
  if (!values.password) errors.password = 'Password is required';
  else if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }

  return { values, errors };
};
