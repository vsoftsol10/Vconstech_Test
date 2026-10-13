// src/api/materialAPI.js
const API_BASE_URL = import.meta.env.VITE_API_URL;
import { getAuthToken } from '../utils/auth';

// Helper to handle API responses
const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw {
      status: response.status,
      error: data.error || 'An error occurred',
      details: data.details
    };
  }
  
  return data;
};

// Helper to get user from localStorage
const getUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (err) {
    console.error('Error parsing user from localStorage:', err);
    return null;
  }
};

export const materialAPI = {
  /**
   * Get dashboard data (metrics + recent usage logs)
   * @returns {Object} { metrics: {...}, usageLogs: [...] }
   */
  getDashboardData: async () => {
    const token = getAuthToken();
    
    console.log('🌐 Fetching dashboard data...');
    
    const response = await fetch(`${API_BASE_URL}/materials/dashboard`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await handleResponse(response);
    console.log('📥 Dashboard data:', result);
    return result.data;
  },

  /**
   * Get all materials
   * @returns {Array} List of materials
   */
  getMaterials: async () => {
    const token = getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/materials`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await handleResponse(response);
    return result.materials;
  },

  /**
   * Create a new material (Admin only - adds directly to database)
   * @param {Object} materialData - Material details
   * @returns {Object} Created material
   */
  create: async (materialData) => {
    const token = getAuthToken();
    const user = getUser();
    
    if (!user || !user.companyId) {
      throw new Error('User or company information not found');
    }
    
    console.log('📤 Creating material:', materialData);
    
    // Match the Prisma schema exactly
    const body = {
      name: materialData.name,
      category: materialData.category,
      unit: materialData.unit,
      defaultRate: materialData.defaultRate ? parseFloat(materialData.defaultRate) : null,
      quantity: materialData.quantityNeeded ? parseFloat(materialData.quantityNeeded) : (materialData.quantity ? parseFloat(materialData.quantity) : null),
      vendor: materialData.vendor || null,
      description: materialData.description || null,
      type: materialData.type || null, // Optional field from schema
      companyId: user.companyId // ✅ Required field!
    };
    
    console.log('📤 Request body:', body);
    
    const response = await fetch(`${API_BASE_URL}/materials`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    const result = await handleResponse(response);
    console.log('✅ Material created:', result);
    return result;
  },

  /**
   * Add material to a specific project (Admin only)
   * @param {Object} data - { materialId, projectId, assigned (quantityNeeded) }
   * @returns {Object} Created project material
   */
  addToProject: async (data) => {
    const token = getAuthToken();
    
    console.log('📤 Adding material to project:', data);
    
    // Match ProjectMaterial schema - it uses "assigned" not "quantityNeeded"
    const body = {
      materialId: parseInt(data.materialId),
      projectId: parseInt(data.projectId),
      assigned: parseFloat(data.quantityNeeded || data.assigned), // ✅ Schema uses "assigned"
      used: 0 // Default value
    };
    
    console.log('📤 Request body:', body);
    
    const response = await fetch(`${API_BASE_URL}/project-materials`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    const result = await handleResponse(response);
    console.log('✅ Material added to project:', result);
    return result;
  },

  /**
   * Get material usage statistics
   * @param {Object} filters - { projectId?, materialId?, startDate?, endDate? }
   * @returns {Array} Usage statistics
   */
  getUsageStats: async (filters = {}) => {
    const token = getAuthToken();
    const queryParams = new URLSearchParams();
    
    if (filters.projectId) queryParams.append('projectId', filters.projectId);
    if (filters.materialId) queryParams.append('materialId', filters.materialId);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    
    const url = `${API_BASE_URL}/materials/usage-stats${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await handleResponse(response);
    return result.stats;
  },

  /**
   * Get project-wise material usage summary
   * @returns {Array} Project usage summary
   */
  getProjectSummary: async () => {
    const token = getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/materials/project-summary`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await handleResponse(response);
    return result.summary;
  }
};

/**
 * Material Request API (for Site Engineers to request materials)
 */
export const materialRequestAPI = {
  /**
   * Create a material request (Site Engineer)
   * @param {Object} requestData - Request details
   * @returns {Object} Created request
   */
  create: async (requestData) => {
    const token = getAuthToken();
    const user = getUser();
    
    if (!user) {
      throw new Error('User information not found');
    }
    
    console.log('📤 Creating material request:', requestData);
    
    // Match MaterialRequest schema
    const body = {
      // Request type: GLOBAL or PROJECT
      type: requestData.requestType === 'global' ? 'GLOBAL' : 'PROJECT',
      
      // Material details
      name: requestData.name,
      category: requestData.category,
      unit: requestData.unit,
      defaultRate: parseFloat(requestData.defaultRate),
      vendor: requestData.vendor || null,
      description: requestData.description || null,
      
      // Project-specific fields
      projectId: requestData.projectId ? parseInt(requestData.projectId) : null,
      quantity: requestData.quantityNeeded ?? requestData.quantity ?? null,
      
      // Status will default to PENDING in backend
      // employeeId will be set from token in backend
    };
    
    console.log('📤 Request body:', body);
    
    const response = await fetch(`${API_BASE_URL}/material-requests`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    const result = await handleResponse(response);
    console.log('✅ Material request created:', result);
    return result;
  },

  /**
   * Get all material requests (Admin only)
   * @returns {Array} List of requests
   */
  getAll: async () => {
    const token = getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/material-requests`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await handleResponse(response);
    return result.requests;
  },

  /**
   * Get my requests (Site Engineer)
   * @returns {Array} My requests
   */
  getMyRequests: async () => {
    const token = getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/material-requests/my-requests`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await handleResponse(response);
    return result.requests;
  },

  /**
   * Approve a material request (Admin only)
   * @param {number} id - Request ID
   * @param {string} approvalNotes - Notes from admin
   * @returns {Object} Updated request
   */
  approve: async (id, approvalNotes = '') => {
    const token = getAuthToken();
    
    console.log('📤 Approving request:', id);
    
    const response = await fetch(`${API_BASE_URL}/material-requests/${id}/approve`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ approvalNotes: approvalNotes || 'Request approved' })
    });
    
    const result = await handleResponse(response);
    console.log('✅ Request approved:', result);
    return result;
  },

  /**
   * Reject a material request (Admin only)
   * @param {number} id - Request ID
   * @param {string} rejectionReason - Reason for rejection
   * @returns {Object} Updated request
   */
  reject: async (id, rejectionReason) => {
    const token = getAuthToken();
    
    if (!rejectionReason || rejectionReason.trim() === '') {
      throw new Error('Rejection reason is required');
    }
    
    console.log('📤 Rejecting request:', id);
    
    const response = await fetch(`${API_BASE_URL}/material-requests/${id}/reject`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ rejectionReason: rejectionReason.trim() })
    });
    
    const result = await handleResponse(response);
    console.log('✅ Request rejected:', result);
    return result;
  }
};
