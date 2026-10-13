// src/services/materialService.js
import axios from 'axios';
import { getToken, removeToken } from '../utils/tabToken';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
const token = getToken();  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============ MATERIAL APIs ============
export const materialAPI = {
  // ============ NEW DASHBOARD APIs ============
  // Get dashboard data (metrics + recent usage logs)
  getDashboardData: async () => {
    const response = await api.get('/materials/dashboard');
    return response.data.data; // Returns { metrics: {...}, usageLogs: [...] }
  },

  // Get material usage statistics
  getUsageStats: async (filters = {}) => {
    const response = await api.get('/materials/usage-stats', { params: filters });
    return response.data.stats;
  },

  // Get project-wise material usage summary
  getProjectSummary: async () => {
    const response = await api.get('/materials/project-summary');
    return response.data.summary;
  },

  // ============ EXISTING APIs ============
  // Get all materials
  getAll: async (params = {}) => {
    const response = await api.get('/materials', { params });
    return response.data?.materials || [];
  },

  getApprovedByProject: async (projectId) => {
    const response = await api.get('/materials/approved', {
      params: { projectId }
    });
    return response.data;
  },

  // Get material by ID
  getById: async (id) => {
    const response = await api.get(`/materials/${id}`);
    return response.data;
  },

  // Get categories
  getCategories: async () => {
    const response = await api.get('/materials/categories');
    return response.data;
  },

  // Create material (Admin only)
  create: async (data) => {
    const isFormData = data instanceof FormData;
    const response = await api.post('/materials', data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  // Update material (Admin only)
  update: async (id, data) => {
    const isFormData = data instanceof FormData;
    const response = await api.put(`/materials/${id}`, data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  // Delete material (Admin only)
  delete: async (id) => {
    const response = await api.delete(`/materials/${id}`);
    return response.data;
  },
};

// ============ PROJECT MATERIAL APIs ============
export const projectMaterialAPI = {
  // Get all materials for a project
  getByProject: async (projectId) => {
    const response = await api.get(`/project-materials/${projectId}`);
    return response.data;
  },

  // Add material to project (Admin only)
  add: async (data) => {
    const response = await api.post('/project-materials', data);
    return response.data;
  },

  // Update project material (Admin only)
  update: async (id, data) => {
    const response = await api.put(`/project-materials/${id}`, data);
    return response.data;
  },

  // Remove material from project (Admin only)
  remove: async (id) => {
    const response = await api.delete(`/project-materials/${id}`);
    return response.data;
  },
};

// ============ MATERIAL REQUEST APIs ============
export const materialRequestAPI = {
  // Get ALL requests (Admin only)
  getAll: async () => {
    const response = await api.get('/material-requests');
    return response.data;
  },

  // Get my requests (Employee)
  getMyRequests: async () => {
    const response = await api.get('/material-requests/my-requests');
    return response.data;
  },

  // Get pending requests (Admin only)
  getPending: async () => {
    const response = await api.get('/material-requests/pending');
    return response.data;
  },

  // Add admin comment — request stays PENDING (Admin only)
addComment: async (id, adminComment) => {
  if (!adminComment || adminComment.trim() === '') {
    throw new Error('Comment cannot be empty');
  }
  const response = await api.put(`/material-requests/${id}/comment`, {
    adminComment: adminComment.trim(),
  });
  return response.data;
},
  // Create material request (Employee)
  create: async (data) => {
  const isFormData = data instanceof FormData;
  const response = await api.post('/material-requests', data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
  });
  return response.data;
},

  // Approve request (Admin only)
  approve: async (id, approvalNotes = '') => {
    try {
      const response = await api.put(`/material-requests/${id}/approve`, {
        approvalNotes: approvalNotes || 'Request approved',
      });
      return response.data;
    } catch (error) {
      console.error('Approve API Error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Reject request (Admin only)
  reject: async (id, rejectionReason) => {
    try {
      if (!rejectionReason || rejectionReason.trim() === '') {
        throw new Error('Rejection reason is required');
      }
      
      const response = await api.put(`/material-requests/${id}/reject`, {
        rejectionReason: rejectionReason.trim(),
      });
      return response.data;
    } catch (error) {
      console.error('Reject API Error:', error.response?.data || error.message);
      throw error;
    }
  },
};

// ============ USAGE LOG APIs ============
export const usageLogAPI = {
  // Get usage logs for a project
  getByProject: async (projectId) => {
    const response = await api.get('/usage-logs', { params: { projectId } });
    return response.data;
  },

  // Create usage log (Employee)
  create: async (data) => {
    const response = await api.post('/usage-logs', data);
    return response.data;
  },

  // Update usage log
  update: async (id, data) => {
    const response = await api.put(`/usage-logs/${id}`, data);
    return response.data;
  },

  // Delete usage log (Admin only)
  delete: async (id) => {
    const response = await api.delete(`/usage-logs/${id}`);
    return response.data;
  },
};

// ============ NOTIFICATION APIs ============
export const notificationAPI = {
  // Get all notifications
  getAll: async (unreadOnly = false) => {
    const response = await api.get('/notifications', { params: { unreadOnly } });
    return response.data;
  },

  // Mark as read
  markAsRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  // Mark all as read
  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },

  // Delete notification
  delete: async (id) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },

  // Clear read notifications
  clearRead: async () => {
    const response = await api.delete('/notifications/clear-read');
    return response.data;
  },
};

// ============ PROJECT APIs (if needed) ============
export const projectAPI = {
  // Get all projects
  getAll: async () => {
    const response = await api.get('/projects');
    return response.data;
  },

  getAssignedToMe: async () => {
    const response = await api.get('/engineers/my-projects');
    return response.data;
  },

  // Get project by ID
  getById: async (id) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },
};

export default api;
