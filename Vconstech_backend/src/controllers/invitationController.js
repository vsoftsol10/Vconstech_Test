import { createCrmInvitation } from '../services/invitationService.js';
import { validateInvitationPayload } from '../utils/invitationValidation.js';

export const createInvitation = async (req, res) => {
  console.log('[CRM Invitation] Incoming request', {
    crmLeadId: req.body?.crmLeadId,
    crmCustomerId: req.body?.crmCustomerId,
    idempotencyKey: req.body?.idempotencyKey
  });

  const { values, errors } = validateInvitationPayload(req.body);

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid invitation payload',
      errors
    });
  }

  try {
    const invitation = await createCrmInvitation({
      input: values,
      requestPayload: req.body
    });

    console.log('[CRM Invitation] Response', invitation);

    return res.status(invitation.alreadyExists ? 200 : 201).json({
      success: true,
      invitationId: invitation.invitationId,
      erpCustomerId: invitation.erpCustomerId,
      status: invitation.status,
      clientId: invitation.clientId,
      alreadyExists: invitation.alreadyExists
    });
  } catch (error) {
    console.error('[CRM Invitation] Error', {
      message: error.message,
      details: error.details
    });

    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
      details: error.details
    });
  }
};
