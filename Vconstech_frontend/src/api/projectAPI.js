import { getAuthToken } from '../utils/auth.js';
const API_BASE_URL = import.meta.env.VITE_API_URL;

const pendingRequests = new Map();

// Helper to deduplicate requests
const deduplicateRequest = async (key, requestFn) => {
  if (pendingRequests.has(key)) {
    console.log('⚠️ Duplicate request detected, using cached promise:', key);
    return pendingRequests.get(key);
  }

  const requestPromise = requestFn()
    .finally(() => {
      pendingRequests.delete(key);
    });

  pendingRequests.set(key, requestPromise);
  return requestPromise;
};

getAuthToken();

// Helper function to handle API responses
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

export const projectAPI = {
  // Get all projects
  getProjects: async (filters = {}) => {
  const token = getAuthToken();
  const queryParams = new URLSearchParams();
  
  if (filters.status) queryParams.append('status', filters.status);
  if (filters.projectType) queryParams.append('projectType', filters.projectType);
  
  const url = `${API_BASE_URL}/projects${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  
  console.log('🌐 Fetching from:', url);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const result = await handleResponse(response);
  console.log('📥 API Response:', result);
  
  // ✅ Map actualProgress to progress for ALL projects
  if (result.projects && Array.isArray(result.projects)) {
    result.projects = result.projects.map(project => ({
      ...project,
      progress: project.actualProgress ?? project.progress ?? 0,
      dbId: project.id // Keep the database ID for API calls
    }));
  }
  
  return result;
},
  getProjectSelectorOptions: async () => {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/projects/selector`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return handleResponse(response);
  },
  // Get single project
  getProjectById: async (id) => {
  const token = getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const result = await handleResponse(response);
  
  // ✅ Map actualProgress to progress for single project
  if (result.project) {
    result.project = {
      ...result.project,
      progress: result.project.actualProgress ?? result.project.progress ?? 0,
      dbId: result.project.id
    };
  }
  
  return result;
},

  // Create project
  createProject: async (projectData, file = null) => {
    const token = getAuthToken();
    
    const requestKey = `create-${projectData.projectId}-${projectData.name}`;
    
    return deduplicateRequest(requestKey, async () => {
      const body = {
        projectId: projectData.projectId,
        name: projectData.name,
        clientName: projectData.client,
        projectType: projectData.type,
        budget: projectData.budget || null,
        description: projectData.description || null,
        startDate: projectData.startDate || null,
        endDate: projectData.endDate || null,
        location: projectData.location || null,
        assignedUserId: projectData.assignedEmployee || null
      };
      
      console.log('📤 Creating project:', projectData.projectId);
      
      const response = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      const result = await handleResponse(response);
      
      if (file && result.project) {
        try {
          console.log('📤 Uploading file for project:', result.project.id);
          await projectAPI.uploadFile(result.project.id, file);
          console.log('✅ File uploaded successfully');
        } catch (err) {
          console.error('❌ File upload failed:', err);
          throw new Error(`Project created but file upload failed: ${err.error || err.message}`);
        }
      }
      
      return result;
    });
  },

  // Upload file
  uploadFile: async (projectId, file) => {
    const token = getAuthToken();
    
    console.log('Uploading file:', file.name, 'for project:', projectId);
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    return handleResponse(response);
  },

  // Update project
  // Update project
// Update project
updateProject: async (id, projectData, file = null) => {
  const token = getAuthToken();
  
  const body = {
    name: projectData.name,
    clientName: projectData.client,
    projectType: projectData.type,
    budget: projectData.budget || null,
    description: projectData.description || null,
    startDate: projectData.startDate || null,
    endDate: projectData.endDate || null,
    location: projectData.location || null,
    status: projectData.status || null,
    assignedUserId: projectData.assignedEmployee || null,
    actualProgress: projectData.progress !== undefined ? parseInt(projectData.progress) : undefined
  };
  
  const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
    method: 'PUT', // ✅ Changed from 'PATCH' to 'PUT'
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  
  const result = await handleResponse(response);
  
  if (file) {
  const projectId = result.project?.id || id; // fallback to the id param
  try {
    console.log('Uploading new file for project:', projectId);
    await projectAPI.uploadFile(projectId, file);
    console.log('File uploaded successfully');
  } catch (err) {
    console.error('File upload failed:', err);
    throw new Error(`Project updated but file upload failed: ${err.error || err.message}`);
  }
}

return result;
},

  // Update project status
  updateProjectStatus: async (id, status) => {
    const token = getAuthToken();
    
    const statusMap = {
      'Planning': 'PENDING',
      'In Progress': 'ONGOING',
      'On Hold': 'ON_HOLD',
      'Completed': 'COMPLETED'
    };
    const backendStatus = statusMap[status] || status;
    
    let response = await fetch(`${API_BASE_URL}/projects/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: backendStatus })
    });

    // Support a backend instance that has not yet been restarted with the
    // dedicated status route. The existing project update endpoint accepts
    // the same single status field.
    if (response.status === 404) {
      response = await fetch(`${API_BASE_URL}/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: backendStatus })
      });
    }
    
    return handleResponse(response);
  },

  // ✅ NEW: Update project progress
  updateProjectProgress: async (id, progress) => {
    const token = getAuthToken();
    
    console.log('📤 Updating progress for project:', id, 'to', progress);
    
    const response = await fetch(`${API_BASE_URL}/projects/${id}/progress`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ actualProgress: progress })
    });
    
    return handleResponse(response);
  },

  // Delete project
  deleteProject: async (id) => {
    const token = getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return handleResponse(response);
  },

  // Get employees (Site Engineers)
  getEmployees: async () => {
    const token = getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/employees`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return handleResponse(response);
  },

  // Get project files
  getProjectFiles: async (projectId) => {
    const token = getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/files`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return handleResponse(response);
  },

  // Delete project file
  deleteProjectFile: async (projectId, fileId) => {
    const token = getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return handleResponse(response);
  },
};
