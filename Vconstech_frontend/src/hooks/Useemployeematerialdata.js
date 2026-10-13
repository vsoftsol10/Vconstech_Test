import { useState, useEffect } from "react";
import {
  materialAPI,
  projectMaterialAPI,
  materialRequestAPI,
  usageLogAPI,
  notificationAPI,
  projectAPI,
} from "../api/materialService";

const useEmployeeMaterialData = () => {
  const [materials, setMaterials] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectMaterials, setProjectMaterials] = useState([]);
  const [usageLogs, setUsageLogs] = useState([]);
  const [materialRequests, setMaterialRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ============ FETCHERS ============

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const materials = await materialAPI.getAll();
      setMaterials(materials || []);
    } catch (err) {
      console.error("Failed to fetch materials:", err);
      setError("Failed to load materials");
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await projectAPI.getAssignedToMe();
      setProjects(response.projects || []);
      if (response.projects?.length > 0) {
        setSelectedProject((prev) => prev ?? response.projects[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await materialAPI.getCategories();
      setCategories(["All", ...(response.categories || [])]);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const fetchProjectMaterials = async (projectId) => {
    if (!projectId) return;
    try {
      const response = await projectMaterialAPI.getByProject(projectId);
      setProjectMaterials(response.projectMaterials || []);
    } catch (err) {
      console.error("Failed to fetch project materials:", err);
    }
  };

  const fetchUsageLogs = async (projectId) => {
    if (!projectId) return;
    try {
      const response = await usageLogAPI.getByProject(projectId);
      setUsageLogs(response.usageLogs || []);
    } catch (err) {
      console.error("Failed to fetch usage logs:", err);
    }
  };

  const fetchMaterialRequests = async () => {
    try {
      const response = await materialRequestAPI.getMyRequests();
      setMaterialRequests(response.requests || []);
    } catch (err) {
      console.error("Failed to fetch requests:", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getAll();
      setNotifications(response.notifications || []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  // ============ EFFECTS ============

  useEffect(() => {
    fetchMaterials();
    fetchProjects();
    fetchCategories();
    fetchMaterialRequests();
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectMaterials(selectedProject);
      fetchUsageLogs(selectedProject);
    }
  }, [selectedProject]);

  // ============ COMPUTED ============

  const getProjectMaterialsWithDetails = () =>
    projectMaterials.map((pm) => ({ ...pm, remaining: pm.assigned - pm.used }));

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getSelectedMaterialRemaining = (materialId) => {
    if (!materialId) return null;
    const pm = projectMaterials.find(
      (pm) => pm.materialId === parseInt(materialId)
    );
    if (!pm) return null;
    return { remaining: pm.assigned - pm.used, unit: pm.material?.unit };
  };

  return {
    // State
    materials,
    projects,
    projectMaterials,
    usageLogs,
    materialRequests,
    notifications,
    categories,
    selectedProject,
    setSelectedProject,
    loading,
    setLoading,
    error,
    // Fetchers
    fetchMaterials,
    fetchProjects,
    fetchProjectMaterials,
    fetchUsageLogs,
    fetchMaterialRequests,
    fetchNotifications,
    // Computed
    getProjectMaterialsWithDetails,
    unreadCount,
    getSelectedMaterialRemaining,
  };
};

export default useEmployeeMaterialData;
