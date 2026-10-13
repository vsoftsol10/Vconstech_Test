import { useState, useEffect } from 'react';
import { projectAPI } from '../api/projectAPI';
import { materialRequestAPI } from '../api/materialService';
import { getToken, setToken } from '../utils/tabToken';
import { isProjectExecutionEnabled } from '../utils/dashboardUtils';
import { showToast } from '../components/common/Toast';

const useEmployeeDashboard = () => {
  const [employeeName, setEmployeeName] = useState('Loading...');
  const [assignedProjects, setAssignedProjects] = useState([]);
  const [materialRequests, setMaterialRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [recentFiles, setRecentFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showProgressSlider, setShowProgressSlider] = useState({});
  const [tempProgress, setTempProgress] = useState({});
  const [isUpdatingProgress, setIsUpdatingProgress] = useState({});
  
  const [showProgressMessage, setShowProgressMessage] = useState({});
  const [progressMessage, setProgressMessage] = useState({});
  const [isSubmittingMessage, setIsSubmittingMessage] = useState({});
  
  const [dailyProgressHistory, setDailyProgressHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  const getTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-IN');
  };

  const fetchRecentFiles = async (projects, token) => {
    try {
      if (projects.length === 0) {
        setRecentFiles([]);
        return;
      }

      const filePromises = projects.map(project =>
        fetch(`${API_BASE_URL}/projects/${project.id}/files`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        .then(res => res.json())
        .then(data => ({
          projectName: project.name,
          files: data.files || []
        }))
        .catch(() => ({ projectName: project.name, files: [] }))
      );

      const projectFilesData = await Promise.all(filePromises);
      
      const allFiles = projectFilesData.flatMap(({ projectName, files }) =>
        files.map(file => ({ ...file, projectName }))
      );

      const sortedFiles = allFiles
        .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
        .slice(0, 5);

      setRecentFiles(sortedFiles);
    } catch (error) {
      console.error('Error fetching recent files:', error);
      setRecentFiles([]);
    }
  };

  const fetchDailyProgressHistory = async (engineerId) => {
    try {
      setLoadingHistory(true);
const token = getToken();      
      const response = await fetch(`${API_BASE_URL}/daily-progress/engineer/${engineerId}?limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch daily progress history');
      }

      const data = await response.json();
      setDailyProgressHistory(data.updates || []);
    } catch (error) {
      console.error('Error fetching daily progress history:', error);
      setDailyProgressHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleProgressUpdate = async (projectId) => {
    const newProgress = tempProgress[projectId];
    const project = assignedProjects.find(p => p.id === projectId);
    const currentProgress = project?.progress || 0;

    if (!isProjectExecutionEnabled(project?.status)) {
      showToast('Progress updates are available only when the project is In Progress.', 'warning');
      setShowProgressSlider({ ...showProgressSlider, [projectId]: false });
      return;
    }
    
    if (newProgress === currentProgress) {
      setShowProgressSlider({ ...showProgressSlider, [projectId]: false });
      return;
    }

    setIsUpdatingProgress({ ...isUpdatingProgress, [projectId]: true });
    try {
      await projectAPI.updateProjectProgress(projectId, newProgress);
      
      setAssignedProjects(prev => 
        prev.map(p => p.id === projectId ? { ...p, progress: newProgress } : p)
      );
      
      setShowProgressSlider({ ...showProgressSlider, [projectId]: false });
      setShowProgressMessage({ ...showProgressMessage, [projectId]: true });
      
    } catch (error) {
      console.error('Error updating progress:', error);
      showToast(error.error || 'Failed to update progress. Please try again.', 'error');
    } finally {
      setIsUpdatingProgress({ ...isUpdatingProgress, [projectId]: false });
    }
  };

  const handleSubmitProgressMessage = async (projectId) => {
    const message = progressMessage[projectId]?.trim();
    const project = assignedProjects.find(p => p.id === projectId);

    if (!isProjectExecutionEnabled(project?.status)) {
      showToast('Daily updates are available only when the project is In Progress.', 'warning');
      setShowProgressMessage({ ...showProgressMessage, [projectId]: false });
      return;
    }
    
    if (!message) {
      showToast('Please enter a progress message', 'warning');
      return;
    }

    setIsSubmittingMessage({ ...isSubmittingMessage, [projectId]: true });
    
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/daily-progress`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: projectId,
          message: message
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit progress message');
      }

      setProgressMessage({ ...progressMessage, [projectId]: '' });
      setShowProgressMessage({ ...showProgressMessage, [projectId]: false });
      
      showToast('Daily progress update submitted successfully!', 'success');
      
      const profileData = JSON.parse(localStorage.getItem('profileData'));
      if (profileData?.user?.id) {
        fetchDailyProgressHistory(profileData.user.id);
      }
      
    } catch (error) {
      console.error('Error submitting progress message:', error);
      showToast('Failed to submit progress message: ' + error.message, 'error');
    } finally {
      setIsSubmittingMessage({ ...isSubmittingMessage, [projectId]: false });
    }
  };

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        setLoading(true);
        setError(null);
        
       const token = getToken();
        
        if (!token) {
          setError('Authentication required. Please login.');
          return;
        }
        

        const profileResponse = await fetch(`${API_BASE_URL}/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!profileResponse.ok) throw new Error('Failed to fetch profile');

        const profileData = await profileResponse.json();
        localStorage.setItem('profileData', JSON.stringify(profileData));
        setEmployeeName(profileData.user.name || 'Employee');
        const engineerId = profileData.user.id;
        const materialRequestsPromise = materialRequestAPI.getMyRequests();
        const dailyProgressPromise = fetchDailyProgressHistory(engineerId);

        let myProjects = [];
        try {
          const projectsResponse = await fetch(`${API_BASE_URL}/engineers/my-projects`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (!projectsResponse.ok) {
            const errorData = await projectsResponse.json();
            throw new Error(errorData.error || 'Failed to fetch assigned projects');
          }

          const projectsData = await projectsResponse.json();
          
          myProjects = (projectsData.projects || [])
            .map(project => ({
              ...project,
              progress: project.actualProgress ?? project.progress ?? 0,
              dbId: project.id
            }));
          
          setAssignedProjects(myProjects);
          await fetchRecentFiles(myProjects, token);
        } catch (err) {
          console.error('Error fetching projects:', err);
          setAssignedProjects([]);
        }

        try {
          const requestsData = await materialRequestsPromise;
          
         const sortedRequests = (requestsData.requests || [])
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);
          
          setMaterialRequests(sortedRequests);
          
          const requestNotifications = sortedRequests.map(req => {
            const timeAgo = getTimeAgo(new Date(req.createdAt));
            const materialName = req.material?.name || req.name || 'Unknown Material';
            const status = req.status.toLowerCase();
            
            if (status === 'approved') {
              return {
                type: 'approval',
                message: `Material request for ${materialName} approved`,
                time: timeAgo
              };
            } else if (status === 'rejected') {
              return {
                type: 'rejection',
                message: `Material request for ${materialName} rejected - ${req.rejectionReason || 'See comments'}`,
                time: timeAgo
              };
            } else {
              return {
                type: 'update',
                message: `Material request for ${materialName} is pending`,
                time: timeAgo
              };
            }
          });
          
          setNotifications(requestNotifications);
        } catch (err) {
          console.error('Error fetching material requests:', err);
          setMaterialRequests([]);
        }

        await dailyProgressPromise;

      } catch (error) {
        console.error('Error fetching employee data:', error);
        setError('Failed to load dashboard data. Please try again.');
        setEmployeeName('Employee');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, []);

  return {
    employeeName,
    assignedProjects,
    materialRequests,
    notifications,
    recentFiles,
    loading,
    error,
    showProgressSlider,
    tempProgress,
    isUpdatingProgress,
    showProgressMessage,
    progressMessage,
    isSubmittingMessage,
    dailyProgressHistory,
    loadingHistory,
    setShowProgressSlider,
    setTempProgress,
    setShowProgressMessage,
    setProgressMessage,
    handleProgressUpdate,
    handleSubmitProgressMessage,
    fetchDailyProgressHistory
  };
};

export default useEmployeeDashboard;
