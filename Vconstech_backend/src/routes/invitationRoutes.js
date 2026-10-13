import express from 'express';
import { apiKeyAuth } from '../middlewares/apiKeyAuth.js';
import { createInvitation } from '../controllers/invitationController.js';

const router = express.Router();

router.use(apiKeyAuth);
router.post('/', createInvitation);

export default router;
