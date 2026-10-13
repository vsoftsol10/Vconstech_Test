import express from 'express';
import {
  registerInvitation,
  validateInvitation
} from '../controllers/registrationController.js';

const router = express.Router();

router.get('/invitations/:invitationId', validateInvitation);
router.post('/invitations/:invitationId/register', registerInvitation);

export default router;
