import {
  getRegistrationInvitation,
  registerInvitationAccount
} from '../services/invitationService.js';
import { activatePricingInvitationRegistration } from '../services/subscriptionSyncService.js';
import { sendEmail } from '../utils/mailer.js';
import { validateRegistrationPayload } from '../utils/invitationValidation.js';

const ERP_PORTAL_URL = 'https://erp.thevsoft.com';
const EMPLOYEE_LOGIN_URL = 'https://erp.thevsoft.com/employee-login';

const getLoginUrl = () => ERP_PORTAL_URL;

const getEmployeeLoginUrl = () => EMPLOYEE_LOGIN_URL;

const sendInvitationWelcomeEmail = async ({ registration }) => {
  if (registration.idempotent || !registration.user?.email) return null;

  const loginUrl = getLoginUrl();
  const employeeLoginUrl = getEmployeeLoginUrl();

  const emailResult = await sendEmail({
    to: registration.user.email,
    subject: 'Welcome to Vconstech ERP - Your account is ready',
    html: `
      <div style="margin:0;padding:24px;background:#fff8e1">
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:620px;margin:auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
          <div style="background:#ffbe01;padding:24px 28px;color:#1a1a1a">
            <h2 style="margin:0;font-size:24px;line-height:1.3">Welcome to Vconstech ERP</h2>
          </div>
          <div style="padding:28px">
            <p style="margin:0 0 10px;font-size:16px">Hi <strong>${registration.user.name || 'Customer'}</strong>,</p>
            <p style="margin:0 0 22px;color:#374151">Your ERP account has been created successfully from your registration invitation.</p>
            <div style="background:#fff8e1;border:1px solid #ffbe01;border-radius:12px;padding:18px;margin:0 0 20px">
              <h3 style="margin:0 0 14px;font-size:17px;color:#1a1a1a">ERP Login</h3>
              <p style="margin:0 0 8px;color:#4b5563"><strong style="color:#111827">Registered Email:</strong><br/>${registration.user.email}</p>
              <p style="margin:0 0 16px;color:#4b5563"><strong style="color:#111827">ERP Login URL:</strong></p>
              <a href="${loginUrl}" style="background:#ffbe01;color:#1a1a1a;padding:12px 18px;border:1px solid #d89f00;border-radius:8px;text-decoration:none;display:inline-block;font-weight:700">Login to ERP Portal</a>
            </div>
            <p style="margin:0 0 20px;color:#374151">Please use the password you created during registration to log in.</p>
            <div style="background:#fff8e1;border:1px solid #ffbe01;border-radius:12px;padding:18px;margin:0 0 22px">
              <h3 style="margin:0 0 14px;font-size:17px;color:#1a1a1a">Employee Portal</h3>
              <p style="margin:0 0 16px;color:#4b5563"><strong style="color:#111827">Employee Login URL</strong></p>
              <a href="${employeeLoginUrl}" style="background:#ffbe01;color:#1a1a1a;padding:12px 18px;border:1px solid #d89f00;border-radius:8px;text-decoration:none;display:inline-block;font-weight:700">Login to Employee Portal</a>
              <p style="margin:16px 0 0;font-size:13px;color:#6b7280">Use this Employee Portal only if you are logging in as an Employee / Engineer.</p>
            </div>
            <p style="margin:0;color:#374151">Best Regards,<br/><strong>Vconstech ERP</strong></p>
          </div>
        </div>
      </div>
    `
  });

  return {
    sent: emailResult.success,
    to: registration.user.email,
    subject: 'Welcome to Vconstech ERP - Your account is ready',
    loginUrl,
    ...(emailResult.success ? {} : { error: emailResult.error, code: emailResult.code })
  };
};

export const validateInvitation = async (req, res) => {
  try {
    const invitation = await getRegistrationInvitation(req.params.invitationId);

    console.log('[ERP Registration] Invitation validated', {
      invitationId: req.params.invitationId,
      crmLeadId: invitation.crmLeadId,
      crmCustomerId: invitation.crmCustomerId
    });

    res.json({
      success: true,
      invitation
    });
  } catch (error) {
    console.error('[ERP Registration] Invitation validation failed', {
      invitationId: req.params.invitationId,
      message: error.message
    });

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      details: error.details
    });
  }
};

export const registerInvitation = async (req, res) => {
  const { values, errors } = validateRegistrationPayload(req.body);

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid registration payload',
      errors
    });
  }

  try {
    const registration = await registerInvitationAccount({
      invitationId: req.params.invitationId,
      input: values
    });

    const paidSubscription = await activatePricingInvitationRegistration({
      registration
    });
    const welcomeEmail = await sendInvitationWelcomeEmail({
      registration
    });

    console.log('[ERP Registration] Account registered', {
      invitationId: registration.invitationId,
      userId: registration.user.id,
      clientId: registration.clientId,
      welcomeEmailSent: welcomeEmail?.sent === true,
      welcomeEmailError: welcomeEmail?.sent === false ? welcomeEmail.error : undefined
    });

    res.status(registration.idempotent ? 200 : 201).json({
      success: true,
      message: 'ERP account registered successfully',
      registration,
      ...(welcomeEmail ? { welcomeEmail } : {}),
      ...(paidSubscription ? { paidSubscription } : {})
    });
  } catch (error) {
    console.error('[ERP Registration] Registration failed', {
      invitationId: req.params.invitationId,
      message: error.message,
      details: error.details
    });

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      details: error.details
    });
  }
};
