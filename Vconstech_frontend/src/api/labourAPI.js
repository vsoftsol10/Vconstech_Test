// src/services/labourApi.js

import { getAuthToken } from '../utils/auth';

const API_URL = `${import.meta.env.VITE_API_URL}/labours`;


// Helper function to get auth token
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

const getUploadHeaders = () => {
  const token = getAuthToken();
  return {
    'Authorization': `Bearer ${token}`
  };
};

const getBinaryHeaders = () => {
  const token = getAuthToken();
  return {
    'Authorization': `Bearer ${token}`
  };
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(`Expected JSON but got ${contentType || 'unknown'} from ${response.url}: ${text.slice(0, 80)}`);
  }

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'An error occurred');
  }
  
  return data;
};

const handleBinaryResponse = async (response) => {
  if (!response.ok) {
    const errorText = await response.text();
    let message = errorText || 'An error occurred';

    try {
      const data = JSON.parse(errorText);
      message = data.error || message;
    } catch (parseError) {
      // Fall back to the raw response text when the server does not return JSON.
    }

    throw new Error(message);
  }

  return response.blob();
};

// ==================== LABOUR CRUD OPERATIONS ====================

/**
 * Get all labourers
 * @param {number} projectId - Optional project ID to filter labourers
 * @returns {Promise<Object>} Response with labourers array
 */
export const getAllLabourers = async (projectId = null) => {
  try {
    const url = projectId 
      ? `${API_URL}?projectId=${projectId}` 
      : API_URL;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Get all labourers error:', error);
    throw error;
  }
};

/**
 * Get single labourer by ID
 * @param {number} id - Labourer ID
 * @returns {Promise<Object>} Response with labourer data
 */
export const getLabourerById = async (id) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Get labourer by ID error:', error);
    throw error;
  }
};

/**
 * Create new labourer
 * @param {Object} labourData - Labourer information
 * @param {string} labourData.name - Labourer name
 * @param {string} labourData.phone - Phone number
 * @param {string} labourData.address - Address (optional)
 * @param {number} labourData.projectId - Project ID (optional)
 * @returns {Promise<Object>} Response with created labourer
 */
export const createLabourer = async (labourData) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(labourData)
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Create labourer error:', error);
    throw error;
  }
};

export const uploadLabourList = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: getUploadHeaders(),
      body: formData
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Upload labour list error:', error);
    throw error;
  }
};

export const downloadLabourTemplate = async () => {
  try {
    const response = await fetch(`${API_URL}/template`, {
      method: 'GET',
      headers: getBinaryHeaders()
    });

    return await handleBinaryResponse(response);
  } catch (error) {
    console.error('Download labour template error:', error);
    throw error;
  }
};

/**
 * Update labourer details
 * @param {number} id - Labourer ID
 * @param {Object} labourData - Updated labourer information
 * @returns {Promise<Object>} Response with updated labourer
 */
export const updateLabourer = async (id, labourData) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(labourData)
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Update labourer error:', error);
    throw error;
  }
};

/**
 * Delete labourer
 * @param {number} id - Labourer ID
 * @returns {Promise<Object>} Response confirming deletion
 */
export const deleteLabourer = async (id) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Delete labourer error:', error);
    throw error;
  }
};

// ==================== PAYMENT OPERATIONS ====================

/**
 * Add payment to labourer
 * @param {number} labourId - Labourer ID
 * @param {Object} paymentData - Payment information
 * @param {number} paymentData.amount - Payment amount
 * @param {string} paymentData.date - Payment date (ISO format)
 * @param {string} paymentData.remarks - Payment remarks (optional)
 * @returns {Promise<Object>} Response with created payment
 */
export const addPayment = async (labourId, paymentData) => {
  try {
    const response = await fetch(`${API_URL}/${labourId}/payments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(paymentData)
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Add payment error:', error);
    throw error;
  }
};

export const saveAttendance = async (attendanceData) => {
  const response = await fetch(`${API_URL}/attendance`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(attendanceData) });
  return handleResponse(response);
};

export const getLabourAttendance = async (labourId) => {
  const response = await fetch(`${API_URL}/${labourId}/attendance`, { method: 'GET', headers: getAuthHeaders() });
  return handleResponse(response);
};

/**
 * Get all payments for a labourer
 * @param {number} labourId - Labourer ID
 * @returns {Promise<Object>} Response with payments array
 */
export const getLabourerPayments = async (labourId) => {
  try {
    const response = await fetch(`${API_URL}/${labourId}/payments`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Get labourer payments error:', error);
    throw error;
  }
};

/**
 * Delete payment
 * @param {number} labourId - Labourer ID
 * @param {number} paymentId - Payment ID
 * @returns {Promise<Object>} Response confirming deletion
 */
export const deletePayment = async (labourId, paymentId) => {
  try {
    const response = await fetch(`${API_URL}/${labourId}/payments/${paymentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Delete payment error:', error);
    throw error;
  }
};

// ==================== PROJECT & STATISTICS ====================

/**
 * Get labourers by project
 * @param {number} projectId - Project ID
 * @returns {Promise<Object>} Response with labourers array
 */
export const getLabourersByProject = async (projectId) => {
  try {
    const response = await fetch(`${API_URL}/project/${projectId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Get labourers by project error:', error);
    throw error;
  }
};

/**
 * Get labour statistics
 * @param {number} projectId - Optional project ID to filter statistics
 * @returns {Promise<Object>} Response with statistics data
 */
export const getLabourStatistics = async (projectId = null) => {
  try {
    const url = projectId 
      ? `${API_URL}/statistics?projectId=${projectId}` 
      : `${API_URL}/statistics`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Get labour statistics error:', error);
    throw error;
  }
};

// ==================== EXPORTS ====================

const labourApi = {
  getAllLabourers,
  getLabourerById,
  createLabourer,
  uploadLabourList,
  downloadLabourTemplate,
  updateLabourer,
  deleteLabourer,
  addPayment,
  saveAttendance,
  getLabourAttendance,
  getLabourerPayments,
  deletePayment,
  getLabourersByProject,
  getLabourStatistics
};

export default labourApi;
