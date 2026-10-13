import { useEffect, useState } from "react";
import {
  materialRequestAPI,
  projectMaterialAPI,
  materialAPI,
} from "../../../api/materialService";
import { projectAPI } from "../../../api/projectAPI";
import { getToken } from "../../../utils/tabToken";

import { showToast } from '../../common/Toast';

export const useRequestTabData = () => {
  const [requestStatusFilter, setRequestStatusFilter] = useState("All");
  const [materialRequests, setMaterialRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectMaterials, setProjectMaterials] = useState([]);
  const [error, setError] = useState(null);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [materialTypeFilter, setMaterialTypeFilter] = useState("global");

  const fetchMaterials = async () => {
    try {
      const materials = await materialAPI.getAll();
      setMaterials(materials || []);
    } catch (err) {
      console.error("Error fetching materials:", err);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await projectAPI.getProjectSelectorOptions();
      if (data.projects && Array.isArray(data.projects)) {
        setProjects(data.projects.map(project => ({
          ...project,
          name: project.projectName || project.name
        })));
        if (data.projects.length > 0) setSelectedProject(data.projects[0].id);
      }
    } catch (err) {
      setError("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterialRequests = async () => {
    try {
      setLoading(true);
      const token = getToken();
      let role = "Site_Engineer";
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          role = payload.role;
        } catch (e) {}
      }
      const data =
        role.toUpperCase() === "ADMIN"
          ? await materialRequestAPI.getAll()
          : await materialRequestAPI.getMyRequests();

      if (data.success) {
        setMaterialRequests(data.requests || []);
      } else {
        setError(data.error || "Failed to load material requests");
      }
    } catch (err) {
      if (err.response?.status === 403) {
        try {
          const data = await materialRequestAPI.getMyRequests();
          if (data.success) setMaterialRequests(data.requests || []);
        } catch {
          setError("Failed to load material requests");
        }
      } else {
        setError("Failed to load material requests");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectMaterials = async (projectId) => {
    try {
      setLoading(true);
      const data = await projectMaterialAPI.getByProject(projectId);
      if (data.success) setProjectMaterials(data.projectMaterials || []);
    } catch (err) {
      setError("Failed to load project materials");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptConfirm = async (requestId) => {
    try {
      await materialRequestAPI.approve(
        requestId,
        "Your Request has been APPROVED",
      );
      fetchMaterialRequests();
      if (selectedProject) fetchProjectMaterials(selectedProject);
    } catch (err) {
      showToast(
        `Failed to accept request: ${err.response?.data?.error || err.message}`,
        "error"
      );
    }
  };

  const handleRejectClick = (requestId) => {
    setSelectedRequestId(requestId);
  };

  const handleRejectConfirm = async (rejectReason) => {
    if (rejectReason.trim() && selectedRequestId) {
      try {
        await materialRequestAPI.reject(selectedRequestId, rejectReason);
        setSelectedRequestId(null);
        fetchMaterialRequests();
      } catch (err) {
        showToast(
          `Failed to reject request: ${err.response?.data?.error || err.message}`,
          "error"
        );
      }
    }
  };

  const handleCommandConfirm = async (commandNote, viewRequest) => {
  if (commandNote.trim() && viewRequest) {
    try {
      // ✅ Call addComment — does NOT approve the request
      await materialRequestAPI.addComment(viewRequest.id, commandNote);
      fetchMaterialRequests();
    } catch (err) {
      showToast(
        `Failed to send comment: ${err.response?.data?.error || err.message}`,
        "error"
      );
    }
  }
};

  useEffect(() => {
    const token = getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserRole(payload.role);
      } catch (e) {
        setUserRole("Site_Engineer");
      }
    }
    fetchProjects();
    fetchMaterialRequests();
    fetchMaterials();
  }, []);

  return {
    requestStatusFilter,
    setRequestStatusFilter,
    materialRequests,
    loading,
    materials,
    userRole,
    projects,
    selectedProject,
    projectMaterials,
    error,
    materialTypeFilter,
    setMaterialTypeFilter,
    selectedRequestId,
    setSelectedRequestId,
    fetchMaterials,
    fetchProjects,
    fetchMaterialRequests,
    fetchProjectMaterials,
    handleAcceptConfirm,
    handleRejectClick,
    handleRejectConfirm,
    handleCommandConfirm,
  };
};
