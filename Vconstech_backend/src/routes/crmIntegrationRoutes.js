import express from 'express';
import { crmApiKeyAuth } from '../middlewares/apiKeyAuth.js';
import { createCrmUser, resetCrmUserPassword, updateCrmUserSubscription } from '../controllers/crmUserIntegrationController.js';

const router = express.Router();
router.use(crmApiKeyAuth);
router.post('/users', createCrmUser);
router.post('/users/:erpUserId/reset-password', resetCrmUserPassword);
router.put('/users/:erpUserId/subscription', updateCrmUserSubscription);
export default router;
