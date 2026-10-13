import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import {
  Plus, Search, Filter, IndianRupee, FileText,
  CheckCircle, Clock, AlertCircle, ChevronDown,
  LayoutGrid, List, Eye, Pencil, Trash2, MapPin, Calendar,
  MoreVertical,
} from "lucide-react";
import Navbar from "../../components/common/Navbar";
import SidePannel from "../../components/common/SidePannel";
import ProjectFormModal from "../../components/ProjectManagement/ProjectFormModal";
import ProjectDetailsModal from "../../components/ProjectManagement/ProjectDetailsModal";
import { projectAPI } from "../../api/projectAPI";
import { Download } from "lucide-react";
import LoadingScreen from "../../components/common/Loadingscreen";
import Pagination, { DEFAULT_PAGE_SIZE } from "../../components/common/Pagination";
import { getToken } from "../../utils/tabToken";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const loadProjectReportService = async () => {
  const { default: service } = await import("../../services/projectReportService");
  return service;
};

const projectReportService = {
  generateReport: async (...args) => (await loadProjectReportService()).generateReport(...args),
  downloadReport: async (...args) => (await loadProjectReportService()).downloadReport(...args),
  downloadAllProjectsReport: async (...args) => (await loadProjectReportService()).downloadAllProjectsReport(...args),
};

/* ── Kanban column config ── */
const COLUMNS = [
  { status: "Planning",    label: "Planning",    dotColor: "#3b82f6", badgeBg: "bg-blue-50",   badgeText: "text-blue-600"  },
  { status: "In Progress", label: "In Progress", dotColor: "#22c55e", badgeBg: "bg-green-50",  badgeText: "text-green-600" },
  { status: "On Hold",     label: "On Hold",     dotColor: "#f97316", badgeBg: "bg-orange-50", badgeText: "text-orange-600"},
  { status: "Completed",   label: "Completed",   dotColor: "#a855f7", badgeBg: "bg-purple-50", badgeText: "text-purple-600"},
];

/* ── Inline card component (kanban style) ── */
import KanbanProjectCard from "../../components/ProjectManagement/ProjectCard";

import { showToast } from '../../components/common/Toast';

/* ── Format helpers (used by table view) ── */
const fmtDate = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const fmtBudget = (v) => {
  if (!v) return "₹0";
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(2)}L`;
  if (v >= 1000)     return `₹${(v / 1000).toFixed(0)}K`;
  return `₹${v}`;
};

const getProgressForStatus = (status, progress) => {
  if (status === "Planning") return 0;
  if (status === "Completed") return 100;

  const parsedProgress = Number.parseInt(progress, 10);
  return Number.isNaN(parsedProgress) ? 0 : parsedProgress;
};

const ProjectManagement = () => {
  const navigate = useNavigate();
  const { projectId: requestedProjectId } = useParams();
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [sortOrder, setSortOrder] = useState("latest");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const typeFilterRef = useRef(null);
  const statusFilterRef = useRef(null);
  const sortDropdownRef = useRef(null);
  const actionMenuRef = useRef(null);
  const statusOverridesRef = useRef(new Map());
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [actionMenuPosition, setActionMenuPosition] = useState({ top: 0, left: 0 });

  const toggleTypeFilter = () => {
    setShowFilterDropdown((isOpen) => !isOpen);
    setShowSortDropdown(false);
    setShowStatusDropdown(false);
  };

  /* ── NEW: status filter dropdown ── */
  const [filterStatus, setFilterStatus] = useState("all");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  /* ── NEW: table pagination ── */
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_PAGE_SIZE);
  const [editingProject, setEditingProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [packageInfo, setPackageInfo] = useState(null);

  /* ── NEW: view mode toggle (cards / table) — UI only, no backend impact ── */
  const [viewMode, setViewMode] = useState("cards");

  const [newProject, setNewProject] = useState({
    name: "", projectId: "", client: "", type: "Residential",
    budget: "", quotationAmount: "", startDate: "", endDate: "",
    location: "", assignedEmployee: "", description: "",
  });

  const getAuthToken = () => getToken();

  const fetchPackageInfo = async () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.package) {
      const pkg = user.package.toLowerCase();
      const limit = pkg === "free" ? 2 : pkg === "basic" ? 5 : pkg === "premium" ? 15 : pkg === "advanced" ? (user.customMembers || 999) : 1;
      setPackageInfo({ package: user.package, limit });
    } else {
      try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/engineers/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            const pkg = data.user.package?.toLowerCase();
            const limit = pkg === "free" ? 1 : pkg === "basic" ? 5 : pkg === "premium" ? 15 : pkg === "advanced" ? (data.user.customMembers || 999) : 1;
            setPackageInfo({ package: data.user.package, limit });
            localStorage.setItem("user", JSON.stringify(data.user));
          }
        }
      } catch (err) { console.error("Error fetching package info:", err); }
    }
  };

  useEffect(() => { document.title = "Vconstech - Admin"; }, []);

  useEffect(() => {
    if (!showFilterDropdown && !showStatusDropdown && !showSortDropdown && !openActionMenuId) return undefined;

    const handleClickOutside = (event) => {
      if (!typeFilterRef.current?.contains(event.target)) {
        setShowFilterDropdown(false);
      }
      if (!statusFilterRef.current?.contains(event.target)) {
        setShowStatusDropdown(false);
      }
      if (!sortDropdownRef.current?.contains(event.target)) {
        setShowSortDropdown(false);
      }
      if (!actionMenuRef.current?.contains(event.target)) {
        setOpenActionMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilterDropdown, showStatusDropdown, showSortDropdown, openActionMenuId]);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      if (mounted) await Promise.all([loadProjects(), fetchPackageInfo()]);
    };
    fetchData();
    return () => { mounted = false; };
  }, []);

  // A dashboard card can link directly to this project's existing detail view.
  useEffect(() => {
    if (!requestedProjectId || projects.length === 0) return;

    const project = projects.find(
      (item) => String(item.id) === requestedProjectId || String(item.dbId) === requestedProjectId
    );

    if (project) setSelectedProject(project);
  }, [projects, requestedProjectId]);

  const closeProjectDetails = () => {
    setSelectedProject(null);
    if (requestedProjectId) navigate("/project", { replace: true });
  };

  const handleStatusChangeInline = async (projectId, newStatus) => {
    const project = projects.find((item) => item.id === projectId);
    if (!project) {
      const error = new Error("Project not found");
      showToast(error.message, "error");
      throw error;
    }

    setProjects((currentProjects) => currentProjects.map((item) => (
      item.id === projectId ? { ...item, status: newStatus } : item
    )));
    statusOverridesRef.current.set(projectId, newStatus);
    setSelectedProject((currentProject) => (
      currentProject?.id === projectId ? { ...currentProject, status: newStatus } : currentProject
    ));

    try {
      const result = await projectAPI.updateProjectStatus(project.dbId, newStatus);
      const savedStatus = transformStatus(result.project?.status) || newStatus;

      statusOverridesRef.current.delete(projectId);
      setProjects((currentProjects) => currentProjects.map((item) => (
        item.id === projectId ? { ...item, status: savedStatus } : item
      )));
      setSelectedProject((currentProject) => (
        currentProject?.id === projectId ? { ...currentProject, status: savedStatus } : currentProject
      ));
      showToast(`Project status updated to ${savedStatus}`, "success");
    } catch (err) {
      console.error("Failed to update status:", err);
      showToast(err.error || "Status could not be confirmed. It will stay selected until the next refresh.", "warning");
      throw err;
    }
  };

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const projectsData = await projectAPI.getProjects();
      const enrichedProjects = projectsData.projects || [];
      const transformedProjects = enrichedProjects.map((project) => {
        const backendStatus = transformStatus(project.status);
        const pendingStatus = statusOverridesRef.current.get(project.projectId);

        // Do not let an older in-flight list response overwrite a just-selected status.
        if (pendingStatus === backendStatus) {
          statusOverridesRef.current.delete(project.projectId);
        }

        return {
        id: project.projectId,
        dbId: project.id,
        name: project.name,
        client: project.clientName,
        type: project.projectType,
        status: pendingStatus || backendStatus,
        progress: getProgressForStatus(pendingStatus || backendStatus, project.actualProgress ?? project.progress ?? 0),
        budget: project.budget || 0,
        spent: project.spent || 0,
        spentBreakdown: project.spentBreakdown,
        startDate: project.startDate ? new Date(project.startDate).toISOString().split("T")[0] : "",
        endDate: project.endDate ? new Date(project.endDate).toISOString().split("T")[0] : "",
        location: project.location || "",
        team: project.assignedEngineer ? [project.assignedEngineer.name] : [],
        assignedEmployee: project.assignedEngineer ? project.assignedEngineer.id.toString() : "",
        assignedEngineerName: project.assignedEngineer ? project.assignedEngineer.name : "",
        assignedEngineerEmpId: project.assignedEngineer ? project.assignedEngineer.empId : "",
        tasks: { total: project._count?.materialUsed || 0, completed: 0 },
        description: project.description || "",
        };
      });
      setProjects(transformedProjects);
    } catch (err) {
      console.error("Failed to load projects:", err);
      setError(err.error || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const transformStatus = (status) => {
    const map = { PENDING: "Planning", ONGOING: "In Progress", ON_HOLD: "On Hold", COMPLETED: "Completed" };
    return map[status] || status;
  };

  const transformStatusToBackend = (status) => {
    const map = { Planning: "PENDING", "In Progress": "ONGOING", "On Hold": "ON_HOLD", Completed: "COMPLETED" };
    return map[status] || "PENDING";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":   return "bg-purple-100 text-purple-700";
      case "In Progress": return "bg-green-100 text-green-700";
      case "Planning":    return "bg-blue-100 text-blue-700";
      case "On Hold":     return "bg-orange-100 text-orange-700";
      default:            return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Completed":   return <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />;
      case "In Progress": return <Clock className="w-3 h-3 sm:w-4 sm:h-4" />;
      case "Planning":    return <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />;
      case "On Hold":     return <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />;
      default: return null;
    }
  };

  /* NEW: helper only used by table view for progress bar color, mirrors kanban column dot colors */
  const getStatusDotColor = (status) => {
    const col = COLUMNS.find((c) => c.status === status);
    return col ? col.dotColor : "#9ca3af";
  };

  const filteredProjects = useMemo(() => projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.client || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || project.type === filterType;
    const matchesStatus = filterStatus === "all" || project.status === filterStatus;
    return matchesSearch && matchesFilter && matchesStatus;
  }), [projects, searchQuery, filterType, filterStatus]);

  const sortedProjects = useMemo(() => [...filteredProjects].sort((a, b) => {
    if (sortOrder === "latest") return new Date(b.startDate) - new Date(a.startDate);
    if (sortOrder === "oldest") return new Date(a.startDate) - new Date(b.startDate);
    if (sortOrder === "name") return a.name.localeCompare(b.name);
    return 0;
  }), [filteredProjects, sortOrder]);

  const getColumnProjects = (status) => sortedProjects.filter((p) => p.status === status);

  /* ── NEW: pagination derived data (table view only) ── */
  const totalPages = Math.max(1, Math.ceil(sortedProjects.length / rowsPerPage));
  const paginatedProjects = useMemo(() => sortedProjects.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  ), [sortedProjects, currentPage, rowsPerPage]);
  const activeActionProject = useMemo(
    () => sortedProjects.find((project) => project.id === openActionMenuId),
    [sortedProjects, openActionMenuId]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType, filterStatus, sortOrder, viewMode]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const handleNewProjectClick = () => {
    if (packageInfo && projects.length >= packageInfo.limit) {
      showToast(`Cannot add more projects. Your ${packageInfo.package} package allows ${packageInfo.limit} projects. Please upgrade to add more.`, "warning");
      return;
    }
    setShowNewProjectModal(true);
  };

  const handleDownloadReport = async (project) => {
    try {
      const report = await projectReportService.generateReport(project);
      await projectReportService.downloadReport(report, project.name);
      if (report.failedSections?.length) {
        showToast(`Report generated with unavailable sections: ${report.failedSections.map(({ label }) => label).join(', ')}`, "warning");
      }
    } catch (error) {
      showToast("Failed to generate report: " + error.message, "error");
    }
  };

  const handleProgressUpdate = async () => {
    try { await loadProjects(); } catch (err) { console.error("Failed to reload projects:", err); }
  };

  const handleActionMenuClick = (event, projectId) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 176;
    const viewportPadding = 8;
    setActionMenuPosition({
      top: rect.bottom + 4,
      left: Math.min(
        window.innerWidth - menuWidth - viewportPadding,
        Math.max(viewportPadding, rect.right - menuWidth)
      ),
    });
    setOpenActionMenuId((currentId) => (currentId === projectId ? null : projectId));
    setShowFilterDropdown(false);
    setShowStatusDropdown(false);
    setShowSortDropdown(false);
  };

  const runProjectAction = (action) => {
    setOpenActionMenuId(null);
    action();
  };

  const handleCreateProject = async (file) => {
    if (!newProject.name || !newProject.client || !newProject.location) {
      throw new Error("Please fill in all required fields (Name, ID, Client, and Location)");
    }
    try {
      await projectAPI.createProject(newProject, file);
      await loadProjects();
      setShowNewProjectModal(false);
      setNewProject({ name: "", projectId: "", client: "", type: "Residential", budget: "", startDate: "", endDate: "", location: "", assignedEmployee: "", description: "" });
      showToast("Project created successfully!", "success");
    } catch (err) {
      console.error("Create project failed:", err);
      showToast(`Failed to create project: ${err.message || err.error || "Unknown error"}`, "error");
      throw err;
    }
  };

  const handleEditProject = (project) => {
    setEditingProject({ ...project, client: project.client, status: project.status, progress: project.progress || 0 });
    setShowEditModal(true);
  };

  const handleUpdateProject = async (file) => {
    if (!editingProject.name || !editingProject.client) throw new Error("Please fill in all required fields");
    try {
      const normalizedStatus = editingProject.status ? transformStatusToBackend(editingProject.status) : undefined;
      const normalizedProgress = getProgressForStatus(editingProject.status, editingProject.progress);
      const projectData = {
        name: editingProject.name, client: editingProject.client, type: editingProject.type,
        budget: editingProject.budget, quotationAmount: editingProject.quotationAmount,
        startDate: editingProject.startDate, endDate: editingProject.endDate,
        location: editingProject.location, assignedEmployee: editingProject.assignedEmployee,
        description: editingProject.description,
        status: normalizedStatus,
        progress: normalizedProgress,
      };
      await projectAPI.updateProject(editingProject.dbId, projectData, file);
      await loadProjects();
      setShowEditModal(false);
      setSelectedProject(null);
      setEditingProject(null);
      showToast("Project updated successfully!", "success");
    } catch (err) {
      console.error("Update failed:", err);
      throw err;
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) return;
    try {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;
      await projectAPI.deleteProject(project.dbId);
      await loadProjects();
      if (selectedProject && selectedProject.id === projectId) setSelectedProject(null);
      showToast("Project deleted successfully!", "success");
    } catch (err) {
      console.error("Failed to delete project:", err);
      showToast(err.error || "Failed to delete project", "error");
    }
  };

  if (loading) return <LoadingScreen message="Loading Projects..." />;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-20 md:pl-64 md:pt-25">
        {/* ── Desktop header ── */}
        <div className="hidden md:flex items-center justify-between px-6 pt-4 pb-4">
          <div>
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-gray-900">Project Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {loading ? "Loading..." : `${projects.length} / ${packageInfo?.limit ?? "..."} Projects`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* NEW: Cards / Table view toggle */}
            <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm mr-1">
              <button
                onClick={() => setViewMode("cards")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === "cards" ? "bg-yellow-400 text-black shadow-sm" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <LayoutGrid className="w-4 h-4" /> Cards
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === "table" ? "bg-yellow-400 text-black shadow-sm" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <List className="w-4 h-4" /> Table
              </button>
            </div>

            <button onClick={handleNewProjectClick}
              className="flex items-center gap-2 bg-yellow-400 text-black px-4 py-2.5 rounded-xl hover:bg-yellow-500 transition-colors text-sm font-semibold shadow-sm">
              <Plus className="w-4 h-4" /> New Project
            </button>
            <button onClick={() => projectReportService.downloadAllProjectsReport(projects)}
              className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors">
              <Download className="w-4 h-4" /> Download All Reports
            </button>
          </div>
        </div>

        {/* ── Mobile sticky header ── */}
        <div className="md:hidden bg-white border-b border-gray-200 px-3 py-3 sticky top-16 z-30">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold leading-tight tracking-tight text-gray-900">Project Management</h1>
              <p className="text-xs text-gray-500">{projects.length} / {packageInfo?.limit ?? "..."} Projects</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => projectReportService.downloadAllProjectsReport(projects)}
                className="flex items-center gap-1 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium">
                <Download className="w-3.5 h-3.5" /> Reports
              </button>
              <button onClick={handleNewProjectClick}
                className="flex items-center gap-1 bg-yellow-400 text-black px-3 py-1.5 rounded-lg text-xs font-semibold">
                <Plus className="w-3.5 h-3.5" /> New
              </button>
            </div>
          </div>
          {/* NEW: mobile view toggle */}
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl p-1 w-fit">
            <button
              onClick={() => setViewMode("cards")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                viewMode === "cards" ? "bg-yellow-400 text-black shadow-sm" : "text-gray-500"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Cards
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                viewMode === "table" ? "bg-yellow-400 text-black shadow-sm" : "text-gray-500"
              }`}
            >
              <List className="w-3.5 h-3.5" /> Table
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            <p className="font-medium">Error loading projects</p>
            <p className="text-xs mt-0.5">{error}</p>
            <button onClick={loadProjects} className="mt-1.5 text-xs underline">Try again</button>
          </div>
        )}

        {/* ── Search + Filter row ── */}
        <div className="px-4 md:px-6 pb-4">
          <div className="flex flex-col gap-2 md:flex-row">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent shadow-sm"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 md:contents">
            {/* Filter */}
            <div className="relative" ref={typeFilterRef}>
              <button
                type="button"
                onPointerDown={toggleTypeFilter}
                onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggleTypeFilter(); } }}
                className="flex w-full cursor-pointer touch-manipulation items-center justify-center gap-2 px-2 py-2.5 md:w-auto md:px-4 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 shadow-sm"
              >
                <Filter className="pointer-events-none w-4 h-4" />
                <span className="pointer-events-none">Filter</span>
                {filterType !== "all" && <span className="pointer-events-none w-2 h-2 bg-yellow-500 rounded-full" />}
              </button>
              {showFilterDropdown && (
                <div className="absolute left-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1 md:left-auto md:right-0">
                  <p className="text-xs font-semibold text-gray-400 px-3 py-1.5 uppercase tracking-wide">Type</p>
                  {["all", "Residential", "Commercial", "Industrial", "Renovation"].map((type) => (
                    <button key={type}
                      onClick={() => { setFilterType(type); setShowFilterDropdown(false); }}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${filterType === type ? "bg-yellow-50 text-yellow-800 font-medium" : "hover:bg-gray-50 text-gray-700"}`}
                    >
                      {type === "all" ? "All Types" : type}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* NEW: Status filter */}
            <div className="relative" ref={statusFilterRef}>
              <button
                type="button"
                onPointerDown={() => { setShowStatusDropdown((isOpen) => !isOpen); setShowFilterDropdown(false); setShowSortDropdown(false); }}
                onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setShowStatusDropdown((isOpen) => !isOpen); setShowFilterDropdown(false); setShowSortDropdown(false); } }}
                className="flex w-full cursor-pointer items-center justify-center gap-1 px-2 py-2.5 md:w-auto md:gap-2 md:px-4 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 shadow-sm [&_svg]:pointer-events-none [&_span]:pointer-events-none"
              >
                {filterStatus === "all" ? "All Status" : filterStatus}
                <ChevronDown className="w-4 h-4" style={{ pointerEvents: "none" }} />
                {filterStatus !== "all" && <span className="w-2 h-2 bg-yellow-500 rounded-full" />}
              </button>
              {showStatusDropdown && (
                <div className="absolute left-1/2 mt-2 w-44 -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1 md:left-auto md:right-0 md:translate-x-0">
                  <p className="text-xs font-semibold text-gray-400 px-3 py-1.5 uppercase tracking-wide">Status</p>
                  <button
                    onClick={() => { setFilterStatus("all"); setShowStatusDropdown(false); }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${filterStatus === "all" ? "bg-yellow-50 text-yellow-800 font-medium" : "hover:bg-gray-50 text-gray-700"}`}
                  >
                    All Status
                  </button>
                  {COLUMNS.map((col) => (
                    <button key={col.status}
                      onClick={() => { setFilterStatus(col.status); setShowStatusDropdown(false); }}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${filterStatus === col.status ? "bg-yellow-50 text-yellow-800 font-medium" : "hover:bg-gray-50 text-gray-700"}`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.dotColor }} />
                      {col.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort */}
            <div className="relative" ref={sortDropdownRef}>
              <button
                type="button"
                onPointerDown={() => { setShowSortDropdown((isOpen) => !isOpen); setShowFilterDropdown(false); setShowStatusDropdown(false); }}
                onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setShowSortDropdown((isOpen) => !isOpen); setShowFilterDropdown(false); setShowStatusDropdown(false); } }}
                className="flex w-full cursor-pointer items-center justify-center gap-1 px-2 py-2.5 md:w-auto md:gap-2 md:px-4 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 shadow-sm [&_svg]:pointer-events-none [&_span]:pointer-events-none"
              >
                Sort by: {sortOrder === "latest" ? "Latest" : sortOrder === "oldest" ? "Oldest" : "Name"}
                <ChevronDown className="w-4 h-4" style={{ pointerEvents: "none" }} />
              </button>
              {showSortDropdown && (
                <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1">
                  {[{ val: "latest", label: "Latest" }, { val: "oldest", label: "Oldest" }, { val: "name", label: "Name A–Z" }].map((opt) => (
                    <button key={opt.val}
                      onClick={() => { setSortOrder(opt.val); setShowSortDropdown(false); }}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${sortOrder === opt.val ? "bg-yellow-50 text-yellow-800 font-medium" : "hover:bg-gray-50 text-gray-700"}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            </div>
          </div>
        </div>

        {/* ── CARDS VIEW (Kanban Board) ── */}
        {viewMode === "cards" && (
          <div className="px-4 md:px-6 pb-24 md:pb-10 overflow-x-auto">
            <div className="flex gap-4 min-w-max md:min-w-0 md:grid md:grid-cols-4">
              {COLUMNS.map((col) => {
                const colProjects = getColumnProjects(col.status);
                return (
                  <div key={col.status} className="w-72 md:w-auto flex flex-col">
                    {/* Column header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: col.dotColor }} />
                        <span className="font-semibold text-gray-800 text-sm">{col.label}</span>
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                          {colProjects.length}
                        </span>
                      </div>
                    </div>

                    {/* Cards */}
                    <div className="flex flex-col gap-3 flex-1">
                      {colProjects.map((project) => (
                        <KanbanProjectCard
                          key={project.id}
                          project={project}
                          onView={setSelectedProject}
                          onEdit={handleEditProject}
                          onDelete={handleDeleteProject}
                          getStatusColor={getStatusColor}
                          getStatusIcon={getStatusIcon}
                          onStatusChange={handleStatusChangeInline}
                          onProgressUpdate={handleProgressUpdate}
                          onDownloadReport={handleDownloadReport}
                          columnColor={col.dotColor}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TABLE VIEW ── */}
        {viewMode === "table" && (
          <div className="px-4 md:px-6 pb-24 md:pb-10">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead>
                    <tr className="bg-yellow-400">
                      <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wide">Project</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wide">Client</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wide hidden md:table-cell">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wide">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wide hidden lg:table-cell">Timeline</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wide">Budget</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wide">Progress</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-black uppercase tracking-wide w-16">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedProjects.map((project) => {
                      const dotColor = getStatusDotColor(project.status);
                      const isOverBudget = project.budget > 0 && (project.spent / project.budget) * 100 > 100;
                      return (
                        <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{project.name}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                  <span>{project.id}</span>
                                  {project.location && (
                                    <span className="flex items-center gap-0.5 truncate">
                                      <MapPin size={10} /> {project.location}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{project.client}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 hidden md:table-cell">{project.type}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(project.status)}`}>
                              {getStatusIcon(project.status)} {project.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell whitespace-nowrap">
                            <span className="flex items-center gap-1">
                              <Calendar size={11} className="text-gray-400" />
                              {fmtDate(project.startDate)} – {fmtDate(project.endDate)}
                            </span>
                          </td>
                          <td className={`px-4 py-3 text-sm font-bold ${isOverBudget ? "text-red-600" : "text-gray-900"}`}>
                            {fmtBudget(project.budget)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 min-w-[110px]">
                              <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                                <div className="h-full rounded-full" style={{ width: `${project.progress}%`, backgroundColor: dotColor }} />
                              </div>
                              <span className="text-xs font-bold text-gray-700">{project.progress}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 w-16">
                            <div className="flex justify-center">
                              <button
                                onMouseDown={(event) => event.stopPropagation()}
                                onClick={(event) => handleActionMenuClick(event, project.id)}
                                className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Project actions"
                              >
                                <MoreVertical size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {paginatedProjects.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-400">
                          No projects found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* NEW: Pagination bar (replaces the old "Add Project" row) */}
              {sortedProjects.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalItems={sortedProjects.length}
                  pageSize={rowsPerPage}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setRowsPerPage}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ProjectFormModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        project={newProject}
        onChange={setNewProject}
        onSubmit={handleCreateProject}
        title="Create New Project"
        submitLabel="Create Project"
      />
      <ProjectFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        project={editingProject || {}}
        onChange={setEditingProject}
        onSubmit={handleUpdateProject}
        title="Edit Project"
        submitLabel="Update Project"
        isEditMode
      />
      <ProjectDetailsModal
        project={selectedProject}
        onClose={closeProjectDetails}
        getStatusColor={getStatusColor}
        getStatusIcon={getStatusIcon}
        onQuickAction={(action) => showToast(`${action} feature will be available soon!`, "info")}
      />
      {activeActionProject && createPortal(
        <div
          ref={actionMenuRef}
          className="fixed z-[9999] w-44 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 text-sm shadow-lg"
          style={{ top: actionMenuPosition.top, left: actionMenuPosition.left }}
        >
          <button
            onClick={() => runProjectAction(() => setSelectedProject(activeActionProject))}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Eye size={15} className="text-gray-400" /> View Project
          </button>
          <button
            onClick={() => runProjectAction(() => handleEditProject(activeActionProject))}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Pencil size={15} className="text-gray-400" /> Edit Project
          </button>
          <button
            onClick={() => runProjectAction(() => handleDownloadReport(activeActionProject))}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Download size={15} className="text-gray-400" /> Download Report
          </button>
          <div className="my-1 border-t border-gray-100" />
          <button
            onClick={() => runProjectAction(() => handleDeleteProject(activeActionProject.id))}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-red-600 transition-colors hover:bg-red-50"
          >
            <Trash2 size={15} /> Delete Project
          </button>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ProjectManagement;
