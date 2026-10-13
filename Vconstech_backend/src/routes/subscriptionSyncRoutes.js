import express from 'express';
import {
  buyPlan,
  getCustomerStatus,
  getPricingCustomer,
  expireTrialsHandler,
  pricingPurchaseSuccess,
  startTrial,
  updateCustomerStatus
} from '../controllers/subscriptionSyncController.js';
import { apiKeyAuth } from '../middlewares/apiKeyAuth.js';
import { authenticateToken } from '../middlewares/authMiddlewares.js';

const router = express.Router();

router.post('/start-trial', authenticateToken, startTrial);
router.post('/buy-plan', authenticateToken, buyPlan);

router.post('/invitations/:invitationId/start-trial', (req, res, next) => {
  req.body.invitationId = req.params.invitationId;
  return startTrial(req, res, next);
});

router.post('/invitations/:invitationId/buy-plan', (req, res, next) => {
  req.body.invitationId = req.params.invitationId;
  return buyPlan(req, res, next);
});

router.post('/expire-trials', apiKeyAuth, expireTrialsHandler);
router.post('/pricing/purchase-success', apiKeyAuth, pricingPurchaseSuccess);
router.get('/pricing/customer', getPricingCustomer);
router.get('/customers/:customerId/status', apiKeyAuth, getCustomerStatus);
router.put('/customers/:customerId/status', apiKeyAuth, updateCustomerStatus);

export default router;
