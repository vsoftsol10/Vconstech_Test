// import {
//   activateSubscription,
//   expireTrials,
//   getPricingCustomerDetails,
//   getSubscriptionStatus,
//   processPricingPurchaseSuccess,
//   setSubscriptionStatus,
//   startFreeTrial
// } from '../services/subscriptionSyncService.js';

// const sendError = (res, error) =>
//   res.status(error.statusCode || 500).json({
//     success: false,
//     error: error.message,
//     details: error.details
//   });

// export const startTrial = async (req, res) => {
//   try {
//     const data = await startFreeTrial({
//       userId: req.user?.userId || req.body.userId,
//       invitationId: req.body.invitationId
//     });
//     res.status(data.idempotent ? 200 : 201).json({ success: true, data });
//   } catch (error) {
//     sendError(res, error);
//   }
// };

// export const buyPlan = async (req, res) => {
//   try {
//     const data = await activateSubscription({
//       userId: req.user?.userId || req.body.userId,
//       invitationId: req.body.invitationId,
//       plan: req.body.plan || 'DEFAULT'
//     });
//     res.status(data.idempotent ? 200 : 201).json({ success: true, data });
//   } catch (error) {
//     sendError(res, error);
//   }
// };

// export const expireTrialsHandler = async (req, res) => {
//   try {
//     const data = await expireTrials();
//     res.json({ success: true, data });
//   } catch (error) {
//     sendError(res, error);
//   }
// };

// export const getCustomerStatus = async (req, res) => {
//   try {
//     const data = await getSubscriptionStatus({
//       customerId: req.params.customerId
//     });
//     res.json({ success: true, data });
//   } catch (error) {
//     sendError(res, error);
//   }
// };

// export const getPricingCustomer = async (req, res) => {
//   try {
//     const data = await getPricingCustomerDetails({
//       userId: req.query.userId,
//       customerId: req.query.customerId,
//       crmCustomerId: req.query.crmCustomerId,
//       erpCustomerId: req.query.erpCustomerId,
//       email: req.query.email
//     });
//     res.json({ success: true, data });
//   } catch (error) {
//     sendError(res, error);
//   }
// };

// export const updateCustomerStatus = async (req, res) => {
//   try {
//     const data = await setSubscriptionStatus({
//       customerId: req.params.customerId,
//       status: req.body.status,
//       accountStatus: req.body.accountStatus,
//       isActive: req.body.isActive,
//       plan: req.body.plan
//     });
//     res.json({ success: true, data });
//   } catch (error) {
//     sendError(res, error);
//   }
// };

// export const pricingPurchaseSuccess = async (req, res) => {
//   try {
//     const data = await processPricingPurchaseSuccess({
//       purchaseFlow: req.body.purchaseFlow,
//       userId: req.body.userId,
//       customerId: req.body.customerId,
//       crmCustomerId: req.body.crmCustomerId,
//       erpCustomerId: req.body.erpCustomerId,
//       email: req.body.email,
//       plan: req.body.plan,
//       name: req.body.name,
//       companyName: req.body.companyName,
//       phone: req.body.phone,
//       paymentId: req.body.paymentId,
//       orderId: req.body.orderId,
//       companyId: req.body.companyId || req.body.erpCompanyId
//     });

//     res.status(data.idempotent ? 200 : 201).json({ success: true, data });
//   } catch (error) {
//     sendError(res, error);
//   }
// };


import {
  activateSubscription,
  expireTrials,
  getPricingCustomerDetails,
  getSubscriptionStatus,
  processPricingPurchaseSuccess,
  setSubscriptionStatus,
  startFreeTrial
} from '../services/subscriptionSyncService.js';

const sendError = (res, error) =>
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message,
    details: error.details
  });

export const startTrial = async (req, res) => {
  try {
    const data = await startFreeTrial({
      userId: req.user?.userId || req.body.userId,
      invitationId: req.body.invitationId
    });
    res.status(data.idempotent ? 200 : 201).json({ success: true, data });
  } catch (error) {
    sendError(res, error);
  }
};

export const buyPlan = async (req, res) => {
  try {
    const data = await activateSubscription({
      userId: req.user?.userId || req.body.userId,
      invitationId: req.body.invitationId,
      plan: req.body.plan || 'DEFAULT'
    });
    res.status(data.idempotent ? 200 : 201).json({ success: true, data });
  } catch (error) {
    sendError(res, error);
  }
};

export const expireTrialsHandler = async (req, res) => {
  try {
    const data = await expireTrials();
    res.json({ success: true, data });
  } catch (error) {
    sendError(res, error);
  }
};

export const getCustomerStatus = async (req, res) => {
  try {
    const data = await getSubscriptionStatus({
      customerId: req.params.customerId
    });
    res.json({ success: true, data });
  } catch (error) {
    sendError(res, error);
  }
};

export const getPricingCustomer = async (req, res) => {
  try {
    const data = await getPricingCustomerDetails({
      userId: req.query.userId,
      customerId: req.query.customerId,
      crmCustomerId: req.query.crmCustomerId,
      erpCustomerId: req.query.erpCustomerId,
      email: req.query.email
    });
    res.json({ success: true, data });
  } catch (error) {
    sendError(res, error);
  }
};

export const updateCustomerStatus = async (req, res) => {
  try {
    const data = await setSubscriptionStatus({
      customerId: req.params.customerId,
      status: req.body.status,
      accountStatus: req.body.accountStatus,
      isActive: req.body.isActive,
      plan: req.body.plan,
      purchaseDate:
        req.body.purchaseDate ||
        req.body.subscriptionStartedAt ||
        req.body.subscriptionStartDate ||
        req.body.startDate,
      subscriptionEndDate:
        req.body.subscriptionEndDate ||
        req.body.trialEndDate ||
        req.body.renewalDate ||
        req.body.endDate ||
        req.body.expiryDate
    });
    res.json({ success: true, data });
  } catch (error) {
    sendError(res, error);
  }
};

export const pricingPurchaseSuccess = async (req, res) => {
  try {
    const data = await processPricingPurchaseSuccess({
      purchaseFlow: req.body.purchaseFlow,
      userId: req.body.userId,
      customerId: req.body.customerId,
      crmCustomerId: req.body.crmCustomerId,
      erpCustomerId: req.body.erpCustomerId,
      email: req.body.email,
      plan: req.body.plan,
      name: req.body.name,
      companyName: req.body.companyName,
      phone: req.body.phone,
      paymentId: req.body.paymentId,
      orderId: req.body.orderId,
      companyId: req.body.companyId || req.body.erpCompanyId
    });

    res.status(data.idempotent ? 200 : 201).json({ success: true, data });
  } catch (error) {
    sendError(res, error);
  }
};
