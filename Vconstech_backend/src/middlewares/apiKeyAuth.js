import crypto from 'crypto';

const safeCompare = (left, right) => {
  if (!left || !right) return false;

  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));

  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const getProvidedApiKey = (req) => {
  const apiKey = req.get('x-api-key');
  const authHeader = req.get('authorization');

  if (apiKey) return apiKey;
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);

  return '';
};

export const apiKeyAuth = (req, res, next) => {
  const expectedApiKey = process.env.ERP_API_KEY;

  if (!expectedApiKey) {
    return res.status(500).json({
      success: false,
      error: 'ERP_API_KEY is not configured'
    });
  }

  if (!safeCompare(getProvidedApiKey(req), expectedApiKey)) {
    return res.status(401).json({
      success: false,
      error: 'Invalid integration credentials'
    });
  }

  next();
};

// Kept separate so a CRM credential cannot call other ERP integration endpoints.
export const crmApiKeyAuth = (req, res, next) => {
  const expectedApiKey = process.env.CRM_TO_ERP_API_KEY;
  if (!expectedApiKey) {
    return res.status(500).json({ success: false, error: 'CRM_TO_ERP_API_KEY is not configured' });
  }
  if (!safeCompare(getProvidedApiKey(req), expectedApiKey)) {
    return res.status(401).json({ success: false, error: 'Invalid integration credentials' });
  }
  next();
};
