import { useState, useEffect, useMemo, useRef } from "react";
import {
  Trash2,
  Upload,
  X,
  Save,
  FolderOpen,
  ChevronRight,
  ExternalLink,
  AlertCircle,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Loader,
  Search,
  Filter,
  ArrowUpDown,
  LayoutGrid,
  List,
  FolderPlus,
  ChevronDown,
} from "lucide-react";
import EmployeeNavbar from "../../components/Employee/EmployeeNavbar";
import Pagination, { DEFAULT_PAGE_SIZE } from "../../components/common/Pagination";
import UploadFilesModal from "../../components/common/UploadFilesModal";
import { getAuthHeaders } from "../../utils/auth";
import { focusFirstInvalidField, validateFields } from "../../utils/formValidation";
import { getStatusDisplay } from "../../utils/dashboardUtils";
import {
  getFileExtension,
  getFileIcon,
  getMimeType,
  isImageFile,
  isPdfFile,
  isOfficeFile,
  blobToBase64,
  getFileTypeMeta,
  getFileTabCategory,
  getFileCategory,
  FILTER_OPTIONS,
  CARD_ACCENTS,
  TABS,
} from "../billing-refactored/utils/fileManagementHelpers";

// ─── File Viewer Modal ────────────────────────────────────────────────────────

const FileViewerModal = ({ file, dataUri, rawBlob, onClose, onDownload }) => {
  const [zoom, setZoom]           = useState(1);
  const [rotation, setRotation]   = useState(0);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [pdfError, setPdfError]   = useState(false);
  const fileName = file?.fileName || file?.filename || "File";

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    if (!isPdfFile(file)) return;
    const t = setTimeout(() => setPdfLoaded(true), 3000);
    return () => clearTimeout(t);
  }, [file]);

  const renderContent = () => {
    if (isImageFile(file)) {
      return (
        <div className="w-full h-full overflow-auto flex items-center justify-center bg-gray-900 p-4">
          <img
            src={dataUri}
            alt={fileName}
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: "center center",
              transition: "transform 0.2s ease",
              maxWidth: zoom <= 1 ? "100%" : "none",
              maxHeight: zoom <= 1 ? "100%" : "none",
              objectFit: "contain",
              borderRadius: "12px",
              boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
            }}
          />
        </div>
      );
    }
    if (isPdfFile(file)) {
      return (
        <div className="relative w-full h-full bg-gray-200">
          {!pdfLoaded && !pdfError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader size={36} className="animate-spin text-yellow-500" />
                <p className="text-sm text-gray-600 font-medium">Loading PDF…</p>
              </div>
            </div>
          )}
          {pdfError ? (
            <FallbackDownload file={file} onDownload={onDownload} message="Your browser could not render this PDF inline." />
          ) : (
            <embed
              src={dataUri}
              type="application/pdf"
              className="w-full h-full"
              onLoad={() => setPdfLoaded(true)}
              onError={() => { setPdfLoaded(true); setPdfError(true); }}
            />
          )}
        </div>
      );
    }
    if (isOfficeFile(file)) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-50">
          <div className="text-center py-12 px-8 max-w-md">
            <span className="text-7xl mb-5 block">{getFileIcon(file)}</span>
            <p className="text-lg font-bold text-gray-800 mb-2">{fileName}</p>
            <p className="text-sm text-gray-500 mb-1">
              <strong>{getFileExtension(file).toUpperCase()}</strong> files cannot be previewed in the browser.
            </p>
            <p className="text-xs text-gray-400 mb-6">Download and open with Microsoft Office or LibreOffice.</p>
            <button onClick={onDownload}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2.5 px-6 rounded-xl shadow-sm flex items-center gap-2 mx-auto transition-colors">
              <Download size={18} /> Download File
            </button>
          </div>
        </div>
      );
    }
    return <FallbackDownload file={file} onDownload={onDownload} message="Preview not available for this file type." />;
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm transition-opacity duration-300"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative bg-white rounded-2xl border border-gray-100 shadow-2xl flex flex-col overflow-hidden"
        style={{ width: "92vw", maxWidth: "1100px", height: "92vh" }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-yellow-50 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl">{getFileIcon(file)}</span>
            <span className="font-bold text-black text-sm md:text-base truncate max-w-xs md:max-w-lg">{fileName}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isImageFile(file) && (
              <>
                <button onClick={() => setZoom(z => Math.max(0.25, +(z - 0.25).toFixed(2)))}
                  className="p-1.5 rounded-lg hover:bg-yellow-200 transition-colors" title="Zoom out">
                  <ZoomOut size={16} />
                </button>
                <span className="text-xs font-medium text-gray-600 w-10 text-center select-none">
                  {Math.round(zoom * 100)}%
                </span>
                <button onClick={() => setZoom(z => Math.min(5, +(z + 0.25).toFixed(2)))}
                  className="p-1.5 rounded-lg hover:bg-yellow-200 transition-colors" title="Zoom in">
                  <ZoomIn size={16} />
                </button>
                <button onClick={() => setRotation(r => (r + 90) % 360)}
                  className="p-1.5 rounded-lg hover:bg-yellow-200 transition-colors" title="Rotate 90°">
                  <RotateCw size={16} />
                </button>
                <div className="w-px h-5 bg-gray-300 mx-1" />
              </>
            )}
            <button onClick={onDownload}
              className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-colors">
              <Download size={14} /> Download
            </button>
            <button onClick={onClose}
              className="ml-1 p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors"
              title="Close (Esc)">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">{renderContent()}</div>
      </div>
    </div>
  );
};

const FallbackDownload = ({ file, onDownload, message }) => (
  <div className="w-full h-full flex items-center justify-center bg-gray-50">
    <div className="text-center py-16 px-8 max-w-sm">
      <span className="text-6xl mb-4 block">{getFileIcon(file)}</span>
      <p className="text-base font-bold text-gray-700 mb-2">{file?.fileName || file?.filename}</p>
      <p className="text-sm text-gray-500 mb-6">{message}</p>
      <button onClick={onDownload}
        className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2.5 px-6 rounded-xl shadow-sm flex items-center gap-2 mx-auto transition-colors">
        <Download size={18} /> Download to view
      </button>
    </div>
  </div>
);

// ─── Main Page Component ──────────────────────────────────────────────────────

const FileManagement = ({ mode = "admin" }) => {
  const isEmployeeMode = mode === "employee";
  const [projects, setProjects]               = useState([]);
  const [projectFileCounts, setProjectFileCounts] = useState({});
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectFiles, setProjectFiles]       = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [filesLoading, setFilesLoading]       = useState(false);
  const [showAddFileForm, setShowAddFileForm] = useState(false);
  const [saveMessage, setSaveMessage]         = useState("");
  const [errorMessage, setErrorMessage]       = useState("");
  const [viewMode, setViewMode]               = useState("projects");
  const [viewerState, setViewerState]         = useState(null);
  const [viewLoading, setViewLoading]         = useState(false);

  // UI-only state for the redesigned layout (search / sort / filter / view / tabs / pagination)
  const [searchQuery, setSearchQuery]   = useState("");
  const [sortOption, setSortOption]     = useState("date-desc");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [filterType, setFilterType]     = useState("");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [layoutMode, setLayoutMode]     = useState("list"); // "list" | "grid"
  const [activeTab, setActiveTab]       = useState("all");
  const [currentPage, setCurrentPage]   = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_PAGE_SIZE);

  // Refs used to detect outside clicks so the Files-page Filter/Sort dropdowns auto-close
  const fileFilterMenuRef = useRef(null);
  const fileSortMenuRef   = useRef(null);

  // UI-only state for the Projects landing page: search + status filter + Card/Table toggle
  const [projectSearchQuery, setProjectSearchQuery]         = useState("");
  const [projectStatusFilter, setProjectStatusFilter]       = useState("");
  const [showProjectFilterMenu, setShowProjectFilterMenu]   = useState(false);
  const [projectViewMode, setProjectViewMode]               = useState("card"); // "card" | "table"
  // Ref used to detect outside clicks so the Projects filter dropdown auto-closes
  const projectFilterMenuRef = useRef(null);

  // ── Real folders (backend-backed) for the currently open project ──
  const [folders, setFolders]                             = useState([]);
  const [foldersLoading, setFoldersLoading]                = useState(false);
  const [selectedFolderId, setSelectedFolderId]            = useState(null);
  const [showCreateFolderModal, setShowCreateFolderModal]  = useState(false);
  const [newFolderName, setNewFolderName]                  = useState("");
  const [creatingFolder, setCreatingFolder]                = useState(false);

  // ── Bulk select + zip download ──
  const [selectedFileIds, setSelectedFileIds]   = useState([]);
  const [isZipDownloading, setIsZipDownloading] = useState(false);

  const API_BASE_URL  = import.meta.env.VITE_API_URL;
  const projectsLabel = isEmployeeMode ? "My Projects" : "Projects";
  const emptyProjectsText = isEmployeeMode
    ? "You will see assigned projects here once they are assigned to you"
    : "Projects will appear here once they are created";

  useEffect(() => {
    document.title = isEmployeeMode ? "Vconstech - Engineer" : "Vconstech - Admin";
  }, [isEmployeeMode]);

  // Close any open dropdown (Projects filter, Files filter, Files sort) when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (projectFilterMenuRef.current && !projectFilterMenuRef.current.contains(event.target)) {
        setShowProjectFilterMenu(false);
      }
      if (fileFilterMenuRef.current && !fileFilterMenuRef.current.contains(event.target)) {
        setShowFilterMenu(false);
      }
      if (fileSortMenuRef.current && !fileSortMenuRef.current.contains(event.target)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showSuccessMessage = (message) => {
    setSaveMessage(message);
    setErrorMessage("");
    setTimeout(() => setSaveMessage(""), 3000);
  };

  const showErrorMessage = (message) => {
    setErrorMessage(message);
    setSaveMessage("");
    setTimeout(() => setErrorMessage(""), 5000);
  };

  const fetchWithAuth = async (url, options = {}) => {
    const token = getAuthHeaders ? null : null; // no-op guard, token check happens via getAuthHeaders below
    const response = await fetch(url, { ...options, headers: { ...options.headers, ...getAuthHeaders() } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed");
    return data;
  };

  // Fetches file counts per project (reuses the existing files endpoint) so the
  // landing page cards can show "X files" like the reference design.
  const fetchAllFileCounts = async (projectList) => {
    try {
      const entries = await Promise.all(
        projectList.map(async (p) => {
          try {
            const data = await fetchWithAuth(`${API_BASE_URL}/projects/${p.id}/files`);
            return [p.id, (data.files || []).length];
          } catch {
            return [p.id, 0];
          }
        })
      );
      setProjectFileCounts(Object.fromEntries(entries));
    } catch {
      // Non-fatal — cards just fall back to showing no count
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth(`${API_BASE_URL}${isEmployeeMode ? "/engineers/my-projects" : "/projects"}`);
      const list = data.projects || [];
      setProjects(list);
      fetchAllFileCounts(list);
    } catch (e) { showErrorMessage(`Failed to load ${isEmployeeMode ? "assigned projects" : "projects"}: ` + e.message); }
    finally     { setLoading(false); }
  };

  const fetchProjectFiles = async (projectId) => {
    try {
      setFilesLoading(true);
      const data = await fetchWithAuth(`${API_BASE_URL}/projects/${projectId}/files`);
      setProjectFiles(data.files || []);
    } catch (e) { showErrorMessage("Failed to load project files: " + e.message); }
    finally     { setFilesLoading(false); }
  };

  // Fetches real folders for the open project (each folder includes _count.files)
  const fetchFolders = async (projectId) => {
    try {
      setFoldersLoading(true);
      const data = await fetchWithAuth(`${API_BASE_URL}/projects/${projectId}/folders`);
      setFolders(data.folders || []);
    } catch (e) {
      showErrorMessage("Failed to load folders: " + e.message);
    } finally {
      setFoldersLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, [isEmployeeMode]);

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;
    try {
      await fetchWithAuth(`${API_BASE_URL}/projects/${selectedProject.id}/files/${fileId}`, { method: "DELETE" });
      showSuccessMessage("File deleted successfully!");
      await fetchProjectFiles(selectedProject.id);
      fetchAllFileCounts(projects);
      fetchFolders(selectedProject.id);
      setSelectedFileIds((prev) => prev.filter((id) => id !== fileId));
    } catch (e) { showErrorMessage("Failed to delete file: " + e.message); }
  };

  const handleOpenProject = async (project) => {
    setSelectedProject(project);
    setViewMode("files");
    setSearchQuery("");
    setActiveTab("all");
    setFilterType("");
    setCurrentPage(1);
    setSelectedFolderId(null);
    setSelectedFileIds([]);
    await fetchProjectFiles(project.id);
    await fetchFolders(project.id);
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
    setViewMode("projects");
    setShowAddFileForm(false);
    setProjectFiles([]);
    setFolders([]);
    setSelectedFolderId(null);
    setSelectedFileIds([]);
  };

  // Called by UploadFilesModal after every upload attempt to refresh the file list/counts
  const handleUploadSuccess = async () => {
    await fetchProjectFiles(selectedProject.id);
    fetchAllFileCounts(projects);
    fetchFolders(selectedProject.id);
  };

  // Creates a folder inside the currently open project via POST /projects/:id/folders
  const handleCreateFolder = async () => {
    const errors = validateFields([
      { name: 'folderName', value: newFolderName, label: 'Folder name', rules: ['name'] },
    ]);
    if (Object.keys(errors).length) {
      showErrorMessage(errors.folderName);
      focusFirstInvalidField(errors);
      return;
    }
    try {
      setCreatingFolder(true);
      await fetchWithAuth(`${API_BASE_URL}/projects/${selectedProject.id}/folders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFolderName.trim() }),
      });
      showSuccessMessage("Folder created successfully!");
      setNewFolderName("");
      setShowCreateFolderModal(false);
      await fetchFolders(selectedProject.id);
    } catch (e) {
      showErrorMessage("Failed to create folder: " + e.message);
    } finally {
      setCreatingFolder(false);
    }
  };

  // Selecting a folder card filters the file list down to that folder's files
  const handleSelectFolder = (folder) => {
    setSelectedFolderId(folder.id);
    setActiveTab("all");
    setCurrentPage(1);
  };

  // Toggles a single file's checkbox in the bulk-select list
  const toggleSelectFile = (fileId) => {
    setSelectedFileIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  const fetchFileData = async (file) => {
    const url = `${API_BASE_URL}/projects/${selectedProject.id}/files/${file.id}/download`;
    const response = await fetch(url, { method: "GET", headers: getAuthHeaders() });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Failed: ${response.status} ${response.statusText}`);
    }
    const rawBlob   = await response.blob();
    const mimeType  = getMimeType(file);
    const typedBlob = new Blob([rawBlob], { type: mimeType });
    const dataUri   = await blobToBase64(typedBlob);
    return { rawBlob: typedBlob, dataUri };
  };

  const handleViewFile = async (file) => {
    try {
      if (!file.id) throw new Error("File ID not found");
      setViewLoading(file.id);
      const { rawBlob, dataUri } = await fetchFileData(file);
      setViewerState({ file, dataUri, rawBlob });
    } catch (e) { showErrorMessage("Failed to open file: " + e.message); }
    finally     { setViewLoading(false); }
  };

  const handleModalDownload = () => {
    if (!viewerState) return;
    const { file, rawBlob } = viewerState;
    const blobUrl = window.URL.createObjectURL(rawBlob);
    const link    = document.createElement("a");
    link.href     = blobUrl;
    link.download = file.fileName || file.filename || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
  };

  // Bulk-downloads the selected files as a zip via POST /projects/:id/files/download-zip
  const handleDownloadSelected = async () => {
    if (selectedFileIds.length === 0 || !selectedProject) return;
    try {
      setIsZipDownloading(true);
      const response = await fetch(`${API_BASE_URL}/projects/${selectedProject.id}/files/download-zip`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ fileIds: selectedFileIds }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Failed: ${response.status} ${response.statusText}`);
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      const safeName = (selectedProject.name || "files").replace(/[^a-z0-9]+/gi, "_");
      link.download = `${safeName}-selected-files.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch (e) {
      showErrorMessage("Failed to download selected files: " + e.message);
    } finally {
      setIsZipDownloading(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    const statusMap = {
      PENDING:       "bg-yellow-100 border-yellow-300 text-yellow-800",
      Pending:       "bg-yellow-100 border-yellow-300 text-yellow-800",
      ONGOING:       "bg-blue-100 border-blue-300 text-blue-800",
      Ongoing:       "bg-blue-100 border-blue-300 text-blue-800",
      "In Progress": "bg-blue-100 border-blue-300 text-blue-800",
      COMPLETED:     "bg-green-100 border-green-300 text-green-800",
      Completed:     "bg-green-100 border-green-300 text-green-800",
    };
    return statusMap[status] || "bg-gray-100 border-gray-300 text-gray-800";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  };

  // ── UI-only: unique project statuses for the Projects-page Filter dropdown ──
  const projectStatusOptions = useMemo(
    () => [...new Set(projects.map((p) => p.status).filter(Boolean))],
    [projects]
  );

  // ── UI-only: projects filtered by search (name/description) + status for the Projects landing page ──
  const visibleProjects = useMemo(() => {
    let list = [...projects];

    if (projectSearchQuery.trim()) {
      const q = projectSearchQuery.trim().toLowerCase();
      list = list.filter((p) => {
        const nameMatch = (p.name || "").toLowerCase().includes(q);
        const descMatch = (p.description || "").toLowerCase().includes(q);
        return nameMatch || descMatch;
      });
    }

    if (projectStatusFilter) list = list.filter((p) => p.status === projectStatusFilter);

    return list;
  }, [projects, projectSearchQuery, projectStatusFilter]);

  // ── Derived data for the files page: search + tab + folder + filter + sort + pagination ──
  const visibleFiles = useMemo(() => {
    let list = [...projectFiles];

    if (activeTab === "folders") return [];
    if (activeTab !== "all") list = list.filter((f) => getFileTabCategory(f) === activeTab);

    // Filter by the currently selected real folder (if any)
    if (selectedFolderId) list = list.filter((f) => f.folderId === selectedFolderId);

    // Search by File Name, Project Name, Uploaded By
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((f) => {
        const nameMatch = (f.fileName || f.filename || "").toLowerCase().includes(q);
        const projectMatch = (selectedProject?.name || "").toLowerCase().includes(q);
        const uploaderMatch = (f.uploadedBy || f.uploaderName || f.uploaderEmail || "")
          .toLowerCase()
          .includes(q);
        return nameMatch || projectMatch || uploaderMatch;
      });
    }

    // Filter by file category (PDF / Word / Excel / Image / CAD / ZIP / Other)
    if (filterType) list = list.filter((f) => getFileCategory(f) === filterType);

    list.sort((a, b) => {
      const nameA = (a.fileName || a.filename || "").toLowerCase();
      const nameB = (b.fileName || b.filename || "").toLowerCase();
      const dateA = new Date(a.uploadedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.uploadedAt || b.createdAt || 0).getTime();
      const sizeA = a.size ?? a.fileSize ?? 0;
      const sizeB = b.size ?? b.fileSize ?? 0;
      switch (sortOption) {
        case "name-asc":  return nameA.localeCompare(nameB);
        case "name-desc": return nameB.localeCompare(nameA);
        case "date-asc":  return dateA - dateB;
        case "size-desc": return sizeB - sizeA;
        case "size-asc":  return sizeA - sizeB;
        case "date-desc":
        default:          return dateB - dateA;
      }
    });

    return list;
  }, [projectFiles, activeTab, searchQuery, filterType, sortOption, selectedProject, selectedFolderId]);

  const totalPages = Math.max(1, Math.ceil(visibleFiles.length / itemsPerPage));
  const paginatedFiles = visibleFiles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => { setCurrentPage(1); }, [searchQuery, activeTab, filterType, sortOption, selectedFolderId]);
  useEffect(() => { setSelectedFileIds([]); }, [searchQuery, activeTab, filterType, sortOption, selectedFolderId, selectedProject]);

  // ── Bulk-select helpers for the currently visible page ──
  const allOnPageSelected = paginatedFiles.length > 0 && paginatedFiles.every((f) => selectedFileIds.includes(f.id));
  const toggleSelectAllOnPage = () => {
    if (allOnPageSelected) {
      setSelectedFileIds((prev) => prev.filter((id) => !paginatedFiles.some((f) => f.id === id)));
    } else {
      setSelectedFileIds((prev) => [...new Set([...prev, ...paginatedFiles.map((f) => f.id)])]);
    }
  };

  const sortLabels = {
    "date-desc": "Latest",
    "date-asc":  "Oldest",
    "name-asc":  "Name (A-Z)",
    "name-desc": "Name (Z-A)",
    "size-desc": "Largest File",
    "size-asc":  "Smallest File",
  };

  const selectedFolderName = folders.find((f) => f.id === selectedFolderId)?.name || null;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* File viewer modal */}
      {viewerState && (
        <FileViewerModal
          file={viewerState.file}
          dataUri={viewerState.dataUri}
          rawBlob={viewerState.rawBlob}
          onClose={() => setViewerState(null)}
          onDownload={handleModalDownload}
        />
      )}

      {/* Create Folder modal */}
      {showCreateFolderModal && selectedProject && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm transition-opacity duration-300 p-4"
          onClick={(e) => { if (e.target === e.currentTarget && !creatingFolder) { setShowCreateFolderModal(false); setNewFolderName(""); } }}
        >
          <div className="relative bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center">
                  <FolderPlus size={18} className="text-yellow-500" />
                </div>
                <h3 className="text-base font-bold text-gray-900">New Folder</h3>
              </div>
              <button
                onClick={() => { if (!creatingFolder) { setShowCreateFolderModal(false); setNewFolderName(""); } }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Folder Name</label>
              <input
                name="folderName"
                type="text"
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreateFolder(); }}
                placeholder="e.g. Contracts"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white shadow-sm"
              />
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/60">
              <button
                onClick={() => { setShowCreateFolderModal(false); setNewFolderName(""); }}
                disabled={creatingFolder}
                className="font-semibold text-sm py-2.5 px-4 rounded-xl border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={creatingFolder || !newFolderName.trim()}
                className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold text-sm py-2.5 px-4 rounded-xl shadow-sm transition-colors"
              >
                {creatingFolder ? <Loader size={14} className="animate-spin" /> : <FolderPlus size={14} />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {isEmployeeMode && (
        <nav className="fixed top-0 left-0 right-0 z-50 h-16">
          <EmployeeNavbar />
        </nav>
      )}

      {/* Main content */}
      <div className={`pt-20 md:pt-25 ${isEmployeeMode ? "" : "md:pl-64"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-24 md:pb-10">

          {/* Success / Error banners */}
          {saveMessage && (
            <div className="mb-4 p-3 md:p-4 bg-green-50 border border-green-200 rounded-2xl text-green-800 text-center font-medium text-sm flex items-center justify-center gap-2 shadow-sm">
              <Save size={16} /> {saveMessage}
            </div>
          )}
          {errorMessage && (
            <div className="mb-4 p-3 md:p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-center font-medium text-sm flex items-center justify-center gap-2 shadow-sm">
              <AlertCircle size={16} /> {errorMessage}
            </div>
          )}

          {/* ══════════════════════════ Breadcrumb ══════════════════════════ */}
          <div className="mb-4 flex items-center gap-1.5 text-sm">
            <button
              onClick={handleBackToProjects}
              className={viewMode === "projects" ? "font-semibold text-black" : "text-gray-500 hover:text-black"}
            >
              File Management
            </button>
            {viewMode === "files" && (
              <>
                <ChevronRight size={15} className="text-gray-400" />
                <span className="font-semibold text-black truncate max-w-[220px]">{selectedProject?.name}</span>
              </>
            )}
          </div>

          {/* ══════════════════════════ Header row ══════════════════════════ */}
          {viewMode === "projects" ? (
            <>
              <div className="mb-4">
                <h1 className="text-2xl font-bold leading-tight tracking-tight text-gray-900 mb-1">File Management</h1>
                <p className="text-sm text-gray-500">
                  {isEmployeeMode
                    ? "Access and manage documents for your assigned projects."
                    : "Access and manage all your project documents in one place."}
                </p>
              </div>

              {/* Search + Filter + Card/Table toggle */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={projectSearchQuery}
                    onChange={(e) => setProjectSearchQuery(e.target.value)}
                    placeholder="Search projects..."
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white shadow-sm"
                  />
                </div>

                {/* Filter projects by status */}
                <div className="relative" ref={projectFilterMenuRef}>
                  <button
                    onClick={() => setShowProjectFilterMenu((s) => !s)}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium border shadow-sm transition-colors w-full sm:w-auto justify-center ${
                      projectStatusFilter
                        ? "bg-yellow-50 border-yellow-300 text-yellow-800"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Filter size={15} className={projectStatusFilter ? "text-yellow-600" : "text-gray-500"} />
                    {projectStatusFilter || "Filter"}
                    <ChevronDown size={14} className="text-gray-400" />
                  </button>
                  {showProjectFilterMenu && (
                    <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-1">
                      <button
                        onClick={() => { setProjectStatusFilter(""); setShowProjectFilterMenu(false); }}
                        className={`w-full text-left px-3 py-2 text-sm ${
                          projectStatusFilter === ""
                            ? "bg-yellow-50 text-yellow-800 font-medium"
                            : "hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        {isEmployeeMode ? "All Assigned Projects" : "All Projects"}
                      </button>
                      {projectStatusOptions.map((status) => (
                        <button
                          key={status}
                          onClick={() => { setProjectStatusFilter(status); setShowProjectFilterMenu(false); }}
                          className={`w-full text-left px-3 py-2 text-sm ${
                            projectStatusFilter === status
                              ? "bg-yellow-50 text-yellow-800 font-medium"
                              : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card / Table segmented toggle */}
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl p-1 flex-shrink-0 self-center sm:self-auto">
                  <button
                    onClick={() => setProjectViewMode("card")}
                    className={`p-2 rounded-lg transition-colors ${
                      projectViewMode === "card" ? "bg-yellow-400 text-black" : "text-gray-500 hover:text-black"
                    }`}
                    title="Card view"
                  >
                    <LayoutGrid size={16} />
                  </button>
                  <button
                    onClick={() => setProjectViewMode("table")}
                    className={`p-2 rounded-lg transition-colors ${
                      projectViewMode === "table" ? "bg-yellow-400 text-black" : "text-gray-500 hover:text-black"
                    }`}
                    title="Table view"
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
              <div className="flex items-start gap-3">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${CARD_ACCENTS[(projects.findIndex(p => p.id === selectedProject?.id)) % CARD_ACCENTS.length] || CARD_ACCENTS[0]}`}>
                  <FolderOpen size={26} />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-black">{selectedProject?.name}</h1>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {visibleFiles.length} {visibleFiles.length === 1 ? "file" : "files"}
                    {activeTab !== "all" ? ` in ${TABS.find(t => t.key === activeTab)?.label}` : ""}
                    {selectedFolderName ? ` — ${selectedFolderName}` : ""}
                  </p>
                  {selectedProject?.description && (
                    <p className="text-sm text-gray-500 mt-1 max-w-lg">{selectedProject.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setShowCreateFolderModal(true)}
                  className="flex items-center gap-2 bg-white hover:bg-gray-50 text-black font-semibold text-sm py-2.5 px-4 rounded-xl border border-gray-200 shadow-sm transition-colors"
                >
                  <FolderPlus size={16} /> New Folder
                </button>
                <button
                  onClick={() => setShowAddFileForm(true)}
                  className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold text-sm py-2.5 px-4 rounded-xl shadow-sm transition-colors"
                >
                  <Upload size={16} /> Upload Files
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════ Upload form (modal, now its own component) ══════════════════════════ */}
          {showAddFileForm && selectedProject && (
            <UploadFilesModal
              selectedProject={selectedProject}
              apiBaseUrl={API_BASE_URL}
              selectedFolderId={selectedFolderId}
              selectedFolderName={selectedFolderName}
              folders={folders}
              onClose={() => setShowAddFileForm(false)}
              onUploadSuccess={handleUploadSuccess}
              showSuccessMessage={showSuccessMessage}
              showErrorMessage={showErrorMessage}
            />
          )}

          {/* ══════════════════════════ Projects grid (landing page) ══════════════════════════ */}
          {viewMode === "projects" && (
            <div>
              {loading ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-400 mx-auto mb-4" />
                  <p className="text-sm font-medium text-gray-600">
                    {isEmployeeMode ? "Loading assigned projects..." : "Loading projects..."}
                  </p>
                </div>
              ) : projects.length > 0 ? (
                <>
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{projectsLabel}</h2>

                  {visibleProjects.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                      <FolderOpen size={44} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-base font-medium text-gray-700 mb-1">
                        {projectSearchQuery || projectStatusFilter ? "No projects match your search" : `No ${isEmployeeMode ? "assigned projects" : "projects"} found`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {projectSearchQuery || projectStatusFilter ? "Try a different search or filter." : emptyProjectsText}
                      </p>
                    </div>
                  ) : projectViewMode === "card" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {visibleProjects.map((project, idx) => (
                        <div
                          key={project.id}
                          onClick={() => handleOpenProject(project)}
                          className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 hover:shadow-md hover:border-yellow-300 transition-all cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${CARD_ACCENTS[idx % CARD_ACCENTS.length]}`}>
                              <FolderOpen size={20} />
                            </div>
                            <ChevronRight size={18} className="text-gray-300 mt-2" />
                          </div>
                          <h3 className="font-semibold text-gray-900 text-base mb-1 truncate">{project.name}</h3>
                          <p className="text-xs text-gray-500 mb-3">
                            {projectFileCounts[project.id] ?? "…"} files
                          </p>
                          <div className="flex flex-wrap gap-2 items-center mb-2">
                            <span className={`text-xs px-2 py-0.5 rounded-md font-medium border ${getStatusBadgeColor(project.status)}`}>
                              {getStatusDisplay(project.status)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {project.description || "Project documents and files"}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-yellow-400 text-left text-black">
                            <th className="py-3 px-4 font-bold uppercase tracking-wide text-xs">Project</th>
                            <th className="py-3 px-4 font-bold uppercase tracking-wide text-xs hidden sm:table-cell">Status</th>
                            <th className="py-3 px-4 font-bold uppercase tracking-wide text-xs hidden md:table-cell">Files</th>
                            <th className="py-3 px-4 font-bold uppercase tracking-wide text-xs hidden lg:table-cell">Description</th>
                            <th className="py-3 px-4 font-bold uppercase tracking-wide text-xs text-center w-20">Open</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleProjects.map((project, idx) => (
                            <tr
                              key={project.id}
                              onClick={() => handleOpenProject(project)}
                              className="border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer"
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${CARD_ACCENTS[idx % CARD_ACCENTS.length]}`}>
                                    <FolderOpen size={16} />
                                  </span>
                                  <span className="font-medium text-gray-900 truncate">{project.name}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 hidden sm:table-cell">
                                <span className={`text-xs px-2 py-0.5 rounded-md font-medium border ${getStatusBadgeColor(project.status)}`}>
                                  {getStatusDisplay(project.status)}
                                </span>
                              </td>
                              <td className="py-3 px-4 hidden md:table-cell text-gray-500">
                                {projectFileCounts[project.id] ?? "…"} files
                              </td>
                              <td className="py-3 px-4 hidden lg:table-cell text-gray-500 truncate max-w-xs">
                                {project.description || "—"}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <ChevronRight size={18} className="text-gray-400 inline-block" />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <FolderOpen size={44} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-base font-medium text-gray-700 mb-1">No {isEmployeeMode ? "assigned projects" : "projects"} found</p>
                  <p className="text-sm text-gray-500">{emptyProjectsText}</p>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════ Files page ══════════════════════════ */}
          {viewMode === "files" && selectedProject && (
            <div>
              {/* Search + Filter + Sort + View toggle + New Folder / Upload Files
                  (kept in this toolbar row, not just the page header above, so
                  they stay reachable while browsing inside a folder / after
                  scrolling past the header — see 3rd screenshot bug) */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-3">
                <div className="relative flex-1 min-w-[160px]">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search files..."
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white shadow-sm"
                  />
                </div>

                {/* Filter dropdown */}
                <div className="relative" ref={fileFilterMenuRef}>
                  <button
                    onClick={() => { setShowFilterMenu((s) => !s); setShowSortMenu(false); }}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium border shadow-sm transition-colors ${
                      filterType
                        ? "bg-yellow-50 border-yellow-300 text-yellow-800"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Filter size={15} /> {filterType ? FILTER_OPTIONS.find(o => o.key === filterType)?.label : "Filter"}
                  </button>
                  {showFilterMenu && (
                    <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-1">
                      {FILTER_OPTIONS.map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => { setFilterType(opt.key); setShowFilterMenu(false); }}
                          className={`w-full text-left px-3 py-2 text-sm ${
                            filterType === opt.key
                              ? "bg-yellow-50 text-yellow-800 font-medium"
                              : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sort dropdown */}
                <div className="relative" ref={fileSortMenuRef}>
                  <button
                    onClick={() => { setShowSortMenu((s) => !s); setShowFilterMenu(false); }}
                    className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
                  >
                    <ArrowUpDown size={15} /> Sort: {sortLabels[sortOption]} <ChevronDown size={14} />
                  </button>
                  {showSortMenu && (
                    <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-1">
                      {Object.entries(sortLabels).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => { setSortOption(key); setShowSortMenu(false); }}
                          className={`w-full text-left px-3 py-2 text-sm ${
                            sortOption === key
                              ? "bg-yellow-50 text-yellow-800 font-medium"
                              : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* List / Grid segmented toggle */}
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl p-1 flex-shrink-0">
                  <button
                    onClick={() => setLayoutMode("list")}
                    className={`p-2 rounded-lg transition-colors ${
                      layoutMode === "list" ? "bg-yellow-400 text-black" : "text-gray-500 hover:text-black"
                    }`}
                    title="List view"
                  >
                    <List size={16} />
                  </button>
                  <button
                    onClick={() => setLayoutMode("grid")}
                    className={`p-2 rounded-lg transition-colors ${
                      layoutMode === "grid" ? "bg-yellow-400 text-black" : "text-gray-500 hover:text-black"
                    }`}
                    title="Grid view"
                  >
                    <LayoutGrid size={16} />
                  </button>
                </div>
              </div>

              {/* Active folder pill */}
              {selectedFolderId && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs font-medium px-3 py-1.5 rounded-full">
                    <FolderOpen size={12} />
                    {selectedFolderName || "Folder"}
                    <button
                      onClick={() => setSelectedFolderId(null)}
                      className="ml-1 hover:text-yellow-900"
                      title="Clear folder filter"
                    >
                      <X size={12} />
                    </button>
                  </span>
                </div>
              )}

              {/* Tabs */}
              <div className="flex items-center gap-5 border-b border-gray-200 mb-4 overflow-x-auto">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`pb-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === tab.key
                        ? "border-yellow-400 text-black"
                        : "border-transparent text-gray-500 hover:text-black"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Bulk-select bar — always visible on the files list (not just once
                  something is selected), so "Download Selected" is discoverable
                  up front. The button itself is disabled until 1+ files are checked. */}
              {activeTab !== "folders" && (
                <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2.5 mb-4">
                  <span className="text-sm font-medium text-yellow-800">
                    {selectedFileIds.length > 0
                      ? `${selectedFileIds.length} file${selectedFileIds.length === 1 ? "" : "s"} selected`
                      : "Select files to download as a zip"}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedFileIds([])}
                      disabled={selectedFileIds.length === 0}
                      className="text-xs font-medium text-gray-500 hover:text-gray-700 px-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleDownloadSelected}
                      disabled={isZipDownloading || selectedFileIds.length === 0}
                      className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold text-xs sm:text-sm py-2 px-4 rounded-xl shadow-sm transition-colors"
                    >
                      {isZipDownloading ? <Loader size={14} className="animate-spin" /> : <Download size={14} />}
                      Download Selected
                    </button>
                  </div>
                </div>
              )}

              {/* Content */}
              {filesLoading ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-400 mx-auto mb-4" />
                  <p className="text-sm font-medium text-gray-600">Loading files...</p>
                </div>
              ) : activeTab === "folders" ? (
                foldersLoading ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-400 mx-auto mb-4" />
                    <p className="text-sm font-medium text-gray-600">Loading folders...</p>
                  </div>
                ) : folders.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <FolderOpen size={44} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-base font-medium text-gray-700 mb-1">No folders yet</p>
                    <p className="text-sm text-gray-500 mb-4">Create a folder to organize files in this project.</p>
                    <button
                      onClick={() => setShowCreateFolderModal(true)}
                      className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold text-sm py-2.5 px-4 rounded-xl shadow-sm transition-colors"
                    >
                      <FolderPlus size={16} /> New Folder
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {folders.map((folder, idx) => (
                      <div
                        key={folder.id}
                        onClick={() => handleSelectFolder(folder)}
                        className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 hover:shadow-md hover:border-yellow-300 transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${CARD_ACCENTS[idx % CARD_ACCENTS.length]}`}>
                            <FolderOpen size={20} />
                          </div>
                          <ChevronRight size={18} className="text-gray-300 mt-2" />
                        </div>
                        <h3 className="font-semibold text-gray-900 text-base mb-1 truncate">{folder.name}</h3>
                        <p className="text-xs text-gray-500">
                          {folder._count?.files ?? 0} {folder._count?.files === 1 ? "file" : "files"}
                        </p>
                      </div>
                    ))}
                  </div>
                )
              ) : visibleFiles.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <Filter size={44} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-base font-medium text-gray-700 mb-1">
                    {searchQuery || filterType || selectedFolderId ? "No files match your search" : "No files uploaded yet"}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    {searchQuery || filterType || selectedFolderId ? "Try a different search or filter, or upload a new file here." : "Click \"Upload Files\" to add documents to this project"}
                  </p>
                  <button
                    onClick={() => setShowAddFileForm(true)}
                    className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold text-sm py-2.5 px-4 rounded-xl shadow-sm transition-colors"
                  >
                    <Upload size={16} /> Upload Files
                  </button>
                </div>
              ) : layoutMode === "list" ? (
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-yellow-400 text-left text-black">
                        <th className="py-3 px-4 w-10">
                          <input
                            type="checkbox"
                            checked={allOnPageSelected}
                            onChange={toggleSelectAllOnPage}
                            className="w-4 h-4 accent-black cursor-pointer"
                            title="Select all on this page"
                          />
                        </th>
                        <th className="py-3 px-4 font-bold uppercase tracking-wide text-xs">Name</th>
                        <th className="py-3 px-4 font-bold uppercase tracking-wide text-xs hidden sm:table-cell">Type</th>
                        <th className="py-3 px-4 font-bold uppercase tracking-wide text-xs hidden md:table-cell">Uploaded</th>
                        <th className="py-3 px-4 font-bold uppercase tracking-wide text-xs text-center w-32">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedFiles.map((file) => {
                        const meta = getFileTypeMeta(file);
                        return (
                          <tr key={file.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                            <td className="py-3 px-4 w-10">
                              <input
                                type="checkbox"
                                checked={selectedFileIds.includes(file.id)}
                                onChange={() => toggleSelectFile(file.id)}
                                className="w-4 h-4 accent-yellow-400 cursor-pointer"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="font-medium text-gray-900 truncate">{file.fileName || file.filename}</span>
                                {file.documentType && (
                                  <span className="hidden lg:inline text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-md font-medium flex-shrink-0">
                                    {file.documentType}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 hidden sm:table-cell">
                              <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${meta.badge}`}>
                                {meta.label}
                              </span>
                            </td>
                            <td className="py-3 px-4 hidden md:table-cell text-gray-500">
                              {formatDate(file.uploadedAt || file.createdAt)}
                            </td>
                            <td className="py-3 px-4 w-32">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleViewFile(file)}
                                  disabled={viewLoading === file.id}
                                  className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 disabled:opacity-60 text-blue-600 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                >
                                  {viewLoading === file.id
                                    ? <Loader size={13} className="animate-spin" />
                                    : <ExternalLink size={13} />
                                  }
                                  <span className="hidden sm:inline">View</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteFile(file.id)}
                                  className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
                                  title="Delete File"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedFiles.map((file) => {
                    const meta = getFileTypeMeta(file);
                    return (
                      <div key={file.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedFileIds.includes(file.id)}
                              onChange={() => toggleSelectFile(file.id)}
                              className="w-4 h-4 accent-yellow-400 cursor-pointer"
                            />
                            <span className="text-3xl">{getFileIcon(file)}</span>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${meta.badge}`}>{meta.label}</span>
                        </div>
                        <p className="font-medium text-gray-900 text-sm mb-1 truncate">{file.fileName || file.filename}</p>
                        <p className="text-xs text-gray-500 mb-3">{formatDate(file.uploadedAt || file.createdAt)}</p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewFile(file)}
                            disabled={viewLoading === file.id}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 disabled:opacity-60 text-blue-600 py-1.5 rounded-lg text-xs font-medium transition-colors"
                          >
                            {viewLoading === file.id
                              ? <Loader size={13} className="animate-spin" />
                              : <ExternalLink size={13} />
                            }
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteFile(file.id)}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
                            title="Delete File"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {visibleFiles.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalItems={visibleFiles.length}
                  pageSize={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setItemsPerPage}
                  className="mt-4 px-0 sm:px-0"
                />
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default FileManagement;
