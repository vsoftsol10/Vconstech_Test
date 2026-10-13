import axios from 'axios';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeBaseUrl = (url) => {
  if (!url) return '';
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

const summarizeResponseBody = (body) => {
  if (!body) return body;
  if (typeof body !== 'string') return body;

  const trimmed = body.trim();
  const preview = trimmed.replace(/\s+/g, ' ').slice(0, 300);

  return {
    type: trimmed.startsWith('<!DOCTYPE html') || trimmed.startsWith('<html') ? 'html' : 'text',
    preview,
    truncated: trimmed.length > preview.length
  };
};

const isRetryable = (error) => {
  if (!error.response) return true;
  return [408, 429, 500, 502, 503, 504].includes(error.response.status);
};

const requestWithRetry = async (operation) => {
  const attempts = Number(process.env.CRM_API_RETRY_ATTEMPTS || 3);
  const delayMs = Number(process.env.CRM_API_RETRY_DELAY_MS || 500);
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === attempts || !isRetryable(error)) throw error;
      await sleep(delayMs * attempt);
    }
  }

  throw lastError;
};

const createClient = () => {
  const baseURL = normalizeBaseUrl(process.env.CRM_BASE_URL);
  if (!baseURL) {
    const error = new Error('CRM_BASE_URL is not configured');
    error.statusCode = 500;
    throw error;
  }

  const client = axios.create({
    baseURL,
    timeout: Number(process.env.CRM_API_TIMEOUT_MS || 10000),
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.CRM_API_KEY || process.env.ERP_API_KEY || ''
    }
  });

  client.interceptors.request.use((config) => {
    console.log('[ERP->CRM] Request', {
      method: config.method?.toUpperCase(),
      url: `${config.baseURL}${config.url}`,
      body: config.data
    });
    return config;
  });

  client.interceptors.response.use(
    (response) => {
      console.log('[ERP->CRM] Response', {
        status: response.status,
        url: response.config?.url,
        body: response.data
      });
      return response;
    },
    (error) => {
      console.error('[ERP->CRM] Error', {
        message: error.message,
        status: error.response?.status,
        body: summarizeResponseBody(error.response?.data)
      });
      return Promise.reject(error);
    }
  );

  return client;
};

export const sendCustomerStatusEvent = async (payload) => {
  try {
    const client = createClient();
    const response = await requestWithRetry(() =>
      client.post('/api/integration/customer-status-events', payload)
    );
    return response.data;
  } catch (error) {
    const normalized = new Error(
      error.response?.data?.error || error.response?.data?.message || error.message
    );
    normalized.statusCode = error.response?.status || error.statusCode || 502;
    normalized.details = summarizeResponseBody(error.response?.data) || error.details;
    throw normalized;
  }
};

export const ensureDirectPricingCustomer = async (payload) => {
  try {
    const client = createClient();
    const response = await requestWithRetry(() =>
      client.post('/api/integration/direct-pricing-purchases', payload)
    );
    return response.data;
  } catch (error) {
    const normalized = new Error(
      error.response?.data?.error || error.response?.data?.message || error.message
    );
    normalized.statusCode = error.response?.status || error.statusCode || 502;
    normalized.details = summarizeResponseBody(error.response?.data) || error.details;
    throw normalized;
  }
};
