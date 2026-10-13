import React, { useEffect, useRef, useState } from "react";
import { materialRequestAPI, projectMaterialAPI, materialAPI } from '../../api/materialService';
import { createPortal } from "react-dom";
import { projectAPI } from "../../api/projectAPI";
import { getToken } from '../../utils/tabToken';
import Pagination, { DEFAULT_PAGE_SIZE } from "../../components/common/Pagination";
import { showToast } from "../common/Toast";

const formatCurrency = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
}).format(Number(value || 0));

const formatQuantity = (value) => {
  if (value === null || value === undefined || value === "") return "--";
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return "--";
  return Number.isInteger(numericValue) ? String(numericValue) : numericValue.toFixed(2).replace(/\.00$/, "");
};

const getMaterialStockDetails = (material) => {
  const totalPurchasedQuantity = Number(material?.quantity || 0);
  const allocatedFromProjects = Array.isArray(material?.projectMaterials)
    ? material.projectMaterials.reduce((sum, pm) => sum + Number(pm?.assigned || 0), 0)
    : null;
  const allocatedQuantity = allocatedFromProjects !== null
    ? allocatedFromProjects
    : material?.allocatedQuantity !== undefined && material?.allocatedQuantity !== null
      ? Number(material.allocatedQuantity || 0)
      : Math.max(totalPurchasedQuantity - Number(material?.availableQuantity || 0), 0);
  const availableStock = Math.max(totalPurchasedQuantity - allocatedQuantity, 0);

  return {
    totalPurchasedQuantity,
    allocatedQuantity,
    availableStock,
  };
};

const formatQuantityWithUnit = (value, unit) => {
  const quantity = formatQuantity(value);
  if (quantity === "--") return "--";
  return unit ? `${quantity} ${unit}` : quantity;
};

const ACTION_MENU_WIDTH = 176;
const ACTION_MENU_HEIGHT = 128;
const ACTION_MENU_OFFSET = 8;

const getActionMenuPosition = (rect) => {
  const left = Math.min(
    window.innerWidth - ACTION_MENU_WIDTH - ACTION_MENU_OFFSET,
    Math.max(ACTION_MENU_OFFSET, rect.right - ACTION_MENU_WIDTH)
  );
  const spaceAbove = rect.top;
  const spaceBelow = window.innerHeight - rect.bottom;
  const openAbove = spaceAbove >= ACTION_MENU_HEIGHT + ACTION_MENU_OFFSET || spaceAbove > spaceBelow;
  const top = openAbove
    ? Math.max(ACTION_MENU_OFFSET, rect.top - ACTION_MENU_HEIGHT - ACTION_MENU_OFFSET)
    : Math.min(window.innerHeight - ACTION_MENU_HEIGHT - ACTION_MENU_OFFSET, rect.bottom + ACTION_MENU_OFFSET);

  return { top, left };
};

const RowActionsMenu = ({ pm, menuKey, isOpen, onToggle }) => {
  return (
    <div className="relative inline-flex justify-end">
      <button
        type="button"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onToggle(e, pm, menuKey);
        }}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors ${
          isOpen ? "bg-gray-50" : ""
        }`}
        aria-label="Open row actions"
        aria-expanded={isOpen}
      >
        <span className="text-lg leading-none">⋮</span>
      </button>
    </div>
  );
};

// Projects Tab Component
const ProjectsTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const dropdownRef = useRef(null);
  const [materials, setMaterials] = useState([]);
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    materialId: "",
    quantity: "",
  });

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedMaterialIndex, setSelectedMaterialIndex] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectMaterials, setProjectMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewingPM, setViewingPM] = useState(null);
  const [viewingMaterial, setViewingMaterial] = useState(null);
  const [editingPM, setEditingPM] = useState(null);
  const [deletingPM, setDeletingPM] = useState(null);
  const [openActionMenuKey, setOpenActionMenuKey] = useState(null);
  const [activeActionMenuRow, setActiveActionMenuRow] = useState(null);
  const [actionMenuPosition, setActionMenuPosition] = useState({ top: 0, left: 0 });
  const actionMenuRef = useRef(null);
  const [editForm, setEditForm] = useState({
    assigned: "",
    used: "",
    status: "ACTIVE",
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!viewingMaterial) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [viewingMaterial]);

  // --- UI-only: pagination + global materials filter state ---
  const [materialsAllocatedPage, setMaterialsAllocatedPage] = useState(1);
  const [materialsAllocatedPageSize, setMaterialsAllocatedPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [globalMaterialsPage, setGlobalMaterialsPage] = useState(1);
  const [globalMaterialsPageSize, setGlobalMaterialsPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [globalCategoryFilter, setGlobalCategoryFilter] = useState("All");
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");

  useEffect(() => {
    fetchProjects();
    fetchMaterialRequests();
    fetchMaterials();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectMaterials(selectedProject);
    }
  }, [selectedProject]);

  const fetchMaterials = async () => {
    try {
      const materials = await materialAPI.getAll();
      setMaterials(materials || []);
      console.log('Materials fetched:', materials);
    } catch (err) {
      console.error('Error fetching materials:', err);
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
        if (data.projects.length > 0) {
          setSelectedProject(data.projects[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectMaterials = async (projectId) => {
    try {
      setLoading(true);
      const data = await projectMaterialAPI.getByProject(projectId);
      if (data.success) {
        setProjectMaterials(data.projectMaterials || []);
      }
    } catch (err) {
      console.error('Error fetching project materials:', err);
      setError('Failed to load project materials');
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterialRequests = async () => {
    try {
      setLoading(true);
      const token = getToken();
      let userRole = 'Site_Engineer';

      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userRole = payload.role;
        } catch (e) {
          console.error('Error parsing token:', e);
        }
      }

      if (userRole.toUpperCase() === 'ADMIN') {
        await materialRequestAPI.getAll();
      } else {
        await materialRequestAPI.getMyRequests();
      }
    } catch (err) {
      console.error('Error fetching material requests:', err);
      if (err.response?.status === 403) {
        try {
          await materialRequestAPI.getMyRequests();
        } catch {
          setError('Failed to load material requests');
        }
      } else {
        setError('Failed to load material requests');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!openActionMenuKey) return undefined;

    const handleOutsideClick = (event) => {
      if (actionMenuRef.current?.contains(event.target)) {
        return;
      }
      setOpenActionMenuKey(null);
      setActiveActionMenuRow(null);
    };

    const closeActionMenu = () => {
      setOpenActionMenuKey(null);
      setActiveActionMenuRow(null);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("resize", closeActionMenu);
    window.addEventListener("scroll", closeActionMenu, true);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("resize", closeActionMenu);
      window.removeEventListener("scroll", closeActionMenu, true);
    };
  }, [openActionMenuKey]);

  const filteredProjects = React.useMemo(() => {
    if (!projects || projects.length === 0) {
      return [];
    }

    if (searchTerm.trim() === "") {
      return projects;
    }

    return projects.filter(project => {
      const searchLower = searchTerm.toLowerCase();
      const name = (project.name || '').toLowerCase();
      const status = (project.status || '').toLowerCase();
      return name.includes(searchLower) || status.includes(searchLower);
    });
  }, [projects, searchTerm]);

  const selectedProjectData = projects.find(p => p.id === selectedProject);

  // --- UI-only: reset to page 1 whenever the filtered set changes ---
  useEffect(() => {
    setMaterialsAllocatedPage(1);
  }, [selectedProject, projectMaterials.length]);

  useEffect(() => {
    setGlobalMaterialsPage(1);
  }, [globalCategoryFilter, globalSearchTerm]);

  const paginatedProjectMaterials = projectMaterials.slice(
    (materialsAllocatedPage - 1) * materialsAllocatedPageSize,
    materialsAllocatedPage * materialsAllocatedPageSize
  );

  // --- UI-only: global materials category filter + search ---
  const globalCategories = React.useMemo(() => {
    const cats = new Set(materials.map(m => m.category).filter(Boolean));
    return ["All", ...Array.from(cats)];
  }, [materials]);

  const filteredGlobalMaterials = React.useMemo(() => {
    let list = materials;
    if (globalCategoryFilter !== "All") {
      list = list.filter(m => m.category === globalCategoryFilter);
    }
    if (globalSearchTerm.trim() !== "") {
      const term = globalSearchTerm.toLowerCase();
      list = list.filter(m =>
        (m.name || '').toLowerCase().includes(term) ||
        (m.category || '').toLowerCase().includes(term)
      );
    }
    return list;
  }, [materials, globalCategoryFilter, globalSearchTerm]);

  const paginatedGlobalMaterials = filteredGlobalMaterials.slice(
    (globalMaterialsPage - 1) * globalMaterialsPageSize,
    globalMaterialsPage * globalMaterialsPageSize
  );
  const viewingMaterialStock = viewingMaterial ? getMaterialStockDetails(viewingMaterial) : null;

  const handleProjectSelect = (projectId) => {
    setSelectedProject(projectId);
    setSearchTerm("");
    setIsDropdownOpen(false);
  };

  const handleAddMaterial = async () => {
    if (newMaterial.materialId && newMaterial.quantity && selectedProject) {
      try {
        await projectMaterialAPI.add({
          projectId: selectedProject,
          materialId: parseInt(newMaterial.materialId),
          assigned: parseFloat(newMaterial.quantity)
        });

        setShowAddMaterialModal(false);
        setNewMaterial({ materialId: "", quantity: "" });
        fetchProjectMaterials(selectedProject);
      } catch (err) {
        console.error('Error adding material:', err);
        showToast('Failed to add material', 'error');
      }
    }
  };

  const handleRejectConfirm = async () => {
    if (rejectReason.trim() && selectedRequestId) {
      try {
        const result = await materialRequestAPI.reject(selectedRequestId, rejectReason);
        console.log('Reject result:', result);
        setShowRejectModal(false);
        setRejectReason("");
        setSelectedRequestId(null);
        fetchMaterialRequests();
      } catch (err) {
        console.error('Error rejecting request:', err);
        showToast(`Failed to reject request: ${err.response?.data?.error || err.message}`, "error");
      }
    }
  };

  const handleRejectCancel = () => {
    setShowRejectModal(false);
    setRejectReason("");
    setSelectedRequestId(null);
  };

  const handleStatusUpdateConfirm = async () => {
    if (selectedMaterialIndex !== null && newStatus) {
      try {
        const material = projectMaterials[selectedMaterialIndex];
        await projectMaterialAPI.update(material.id, { status: newStatus });

        setShowStatusModal(false);
        setSelectedMaterialIndex(null);
        setNewStatus("");

        if (selectedProject) {
          fetchProjectMaterials(selectedProject);
        }
      } catch (err) {
        console.error('Error updating status:', err);
        showToast('Failed to update status', 'error');
      }
    }
  };

  const handleStatusUpdateCancel = () => {
    setShowStatusModal(false);
    setSelectedMaterialIndex(null);
    setNewStatus("");
  };

  const handleViewRow = (pm) => {
    setViewingPM(pm);
  };

  const handleEditRow = (pm) => {
    setEditingPM(pm);
    setEditForm({
      assigned: pm.assigned ?? "",
      used: pm.used ?? "",
      status: pm.status ?? "ACTIVE",
    });
  };

  const handleDeleteRowClick = (pm) => {
    setDeletingPM(pm);
  };

  const getActionMenuKey = (pm) => `${pm.projectId ?? 'project'}-${pm.materialId ?? 'material'}-${pm.id}`;

  const closeActionMenu = () => {
    setOpenActionMenuKey(null);
    setActiveActionMenuRow(null);
  };

  const handleActionMenuToggle = (event, pm, menuKey) => {
    const buttonRect = event.currentTarget.getBoundingClientRect();

    setOpenActionMenuKey((current) => {
      if (current === menuKey) {
        setActiveActionMenuRow(null);
        return null;
      }

      setActionMenuPosition(getActionMenuPosition(buttonRect));
      setActiveActionMenuRow(pm);
      return menuKey;
    });
  };

  const runActionMenuItem = (action) => {
    if (!activeActionMenuRow) {
      closeActionMenu();
      return;
    }

    action(activeActionMenuRow);
    closeActionMenu();
  };

  const handleSaveEdit = async () => {
    if (!editingPM) {
      return;
    }

    try {
      setIsSavingEdit(true);
      await projectMaterialAPI.update(editingPM.id, {
        assigned: parseFloat(editForm.assigned),
        used: parseFloat(editForm.used),
        status: editForm.status,
      });

      setEditingPM(null);
      setEditForm({
        assigned: "",
        used: "",
        status: "ACTIVE",
      });

      if (selectedProject) {
        fetchProjectMaterials(selectedProject);
      }
    } catch (err) {
      console.error("Error saving edit:", err);
      showToast("Failed to update material", "error");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingPM) {
      return;
    }

    try {
      setIsDeleting(true);
      await projectMaterialAPI.remove(deletingPM.id);
      setDeletingPM(null);

      if (selectedProject) {
        fetchProjectMaterials(selectedProject);
      }
    } catch (err) {
      console.error("Error deleting material:", err);
      showToast("Failed to delete material", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 p-3 sm:p-4 md:p-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Top Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
          <div className="flex-1 w-full relative" ref={dropdownRef}>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Select Project
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder={selectedProjectData ? `${selectedProjectData.name} - ${selectedProjectData.status}` : "Search projects..."}
                className="w-full px-3 py-2 pr-10 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent shadow-sm text-sm"
              />
              <svg
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>

              {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg max-h-48 sm:max-h-60 overflow-y-auto">
                  {filteredProjects.length > 0 ? (
                    filteredProjects.map((project) => (
                      <div
                        key={project.id}
                        onClick={() => handleProjectSelect(project.id)}
                        className={`px-3 sm:px-4 py-2.5 sm:py-3 cursor-pointer hover:bg-yellow-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                          project.id === selectedProject ? "bg-yellow-50 text-yellow-800 font-medium" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-gray-900 text-sm sm:text-base truncate">{project.name}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{project.status}</div>
                          </div>
                          {project.id === selectedProject && (
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 ml-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-3 sm:px-4 py-2.5 sm:py-3 text-gray-500 text-xs sm:text-sm text-center">
                      No projects found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setShowAddMaterialModal(true)}
            disabled={!selectedProject}
            className="w-full sm:w-auto px-4 py-2.5 bg-yellow-400 text-black text-sm font-semibold rounded-xl shadow-sm hover:bg-yellow-500 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Material
          </button>
        </div>
      </div>

      {/* Materials Allocated Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">
            Materials Allocated
          </h2>


        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full text-sm divide-y divide-gray-100">
            <thead>
              <tr>
                {["Project Name", "Material", "Assigned", "Used", "Cost", "Actions"].map((header) => (
                  <th
                    key={header}
                    className="px-4 lg:px-6 py-3 text-left bg-yellow-400 font-bold text-black uppercase tracking-wide text-xs whitespace-nowrap"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 lg:px-6 py-8 text-center text-gray-500 text-sm">
                    Loading...
                  </td>
                </tr>
              ) : paginatedProjectMaterials.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 lg:px-6 py-8 text-center text-gray-500 text-sm">
                    No materials allocated yet
                  </td>
                </tr>
              ) : (
                paginatedProjectMaterials.map((pm) => (
                  <tr key={pm.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-4 lg:px-6 py-3 text-gray-700 font-medium text-sm">
                      {pm.project?.name || selectedProjectData?.name || 'N/A'}
                    </td>
                    <td className="px-4 lg:px-6 py-3 text-gray-600 text-sm">
                      {pm.material?.name || 'N/A'}
                    </td>
                    <td className="px-4 lg:px-6 py-3 text-gray-600 whitespace-nowrap text-sm">
                      {pm.assigned} {pm.material?.unit}
                    </td>
                    <td className="px-4 lg:px-6 py-3 text-gray-600 whitespace-nowrap text-sm">
                      {pm.used} {pm.material?.unit}
                    </td>
                    <td className="px-4 lg:px-6 py-3 text-gray-800 font-semibold whitespace-nowrap text-sm">
                      {formatCurrency((pm.material?.defaultRate || 0) * pm.used)}
                    </td>
                    <td className="px-4 lg:px-6 py-3">
                      <RowActionsMenu
                        pm={pm}
                        menuKey={getActionMenuKey(pm)}
                        isOpen={openActionMenuKey === getActionMenuKey(pm)}
                        onToggle={handleActionMenuToggle}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-gray-100">
          {loading ? (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              Loading...
            </div>
          ) : paginatedProjectMaterials.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              No materials allocated yet
            </div>
          ) : (
            paginatedProjectMaterials.map((pm) => (
              <div key={pm.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm">{pm.project?.name || selectedProjectData?.name || 'N/A'}</div>
                      <div className="text-gray-600 text-sm mt-0.5">{pm.material?.name || 'N/A'}</div>
                    </div>
                    <RowActionsMenu
                      pm={pm}
                      menuKey={getActionMenuKey(pm)}
                      isOpen={openActionMenuKey === getActionMenuKey(pm)}
                      onToggle={handleActionMenuToggle}
                    />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Assigned:</span>
                  <span className="text-gray-900 font-medium">{pm.assigned} {pm.material?.unit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Used:</span>
                  <span className="text-gray-900 font-medium">{pm.used} {pm.material?.unit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Cost:</span>
                  <span className="text-gray-900 font-semibold">{formatCurrency((pm.material?.defaultRate || 0) * pm.used)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <Pagination
          currentPage={materialsAllocatedPage}
          totalItems={projectMaterials.length}
          pageSize={materialsAllocatedPageSize}
          onPageChange={setMaterialsAllocatedPage}
          onPageSizeChange={setMaterialsAllocatedPageSize}
        />
      </div>

      {openActionMenuKey && activeActionMenuRow && createPortal(
        <div
          ref={actionMenuRef}
          onMouseDown={(e) => e.stopPropagation()}
          className="fixed z-[9999] w-44 rounded-xl border border-gray-100 bg-white shadow-lg py-1"
          style={{
            top: `${actionMenuPosition.top}px`,
            left: `${actionMenuPosition.left}px`,
          }}
        >
          {[
            ["View", handleViewRow],
            ["Edit", handleEditRow],
            ["Delete", handleDeleteRowClick],
          ].map(([label, action]) => (
            <button
              key={label}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                runActionMenuItem(action);
              }}
              className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                label === "Delete"
                  ? "text-red-700 hover:bg-red-50"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>,
        document.body
      )}

      {/* Global Materials List Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">
              Global Materials List
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              All available materials in the system
            </p>
          </div>

          {/* Search + category filter - UI-only, filters the array already in state */}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={globalSearchTerm}
                onChange={(e) => setGlobalSearchTerm(e.target.value)}
                placeholder="Search materials..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent shadow-sm"
              />
            </div>
            <select
              value={globalCategoryFilter}
              onChange={(e) => setGlobalCategoryFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent shadow-sm text-gray-700"
            >
              {globalCategories.map((cat) => (
                <option key={cat} value={cat}>{cat === "All" ? "All Categories" : cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full text-sm divide-y divide-gray-100">
            <thead>
              <tr>
                {["Material Name", "Category", "Available Stock", "Unit", "Unit Price", "Vendor Name", "View"].map((header) => (
                  <th
                    key={header}
                    className="px-4 lg:px-6 py-3 text-left font-bold bg-yellow-400 text-black uppercase tracking-wide text-xs whitespace-nowrap"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 lg:px-6 py-8 text-center text-gray-500 text-sm">
                    Loading...
                  </td>
                </tr>
              ) : paginatedGlobalMaterials.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 lg:px-6 py-8 text-center text-gray-500 text-sm">
                    No materials found
                  </td>
                </tr>
              ) : (
                paginatedGlobalMaterials.map((material) => (
                  <tr key={material.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-4 lg:px-6 py-3 text-gray-700 font-medium text-sm">
                      {material.name}
                    </td>
                    <td className="px-4 lg:px-6 py-3 text-gray-600 text-sm">
                      {material.category || 'N/A'}
                    </td>
                    <td className="px-4 lg:px-6 py-3 text-gray-600 text-sm">
                      {formatQuantityWithUnit(getMaterialStockDetails(material).availableStock, material.unit)}
                    </td>
                    <td className="px-4 lg:px-6 py-3 text-gray-600 whitespace-nowrap text-sm">
                      {material.unit}
                    </td>
                    <td className="px-4 lg:px-6 py-3 text-gray-600 whitespace-nowrap text-sm">
                      {formatCurrency(material.defaultRate)}
                    </td>
                    <td className="px-4 lg:px-6 py-3 text-gray-600 text-sm">
                      {material.vendor || '--'}
                    </td>
                    <td className="px-4 lg:px-6 py-3">
                      <button
                        type="button"
                        onClick={() => setViewingMaterial(material)}
                        className="px-3 py-1.5 bg-yellow-400 text-black text-xs font-semibold rounded-lg hover:bg-yellow-500 transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-gray-100">
          {loading ? (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              Loading...
            </div>
          ) : paginatedGlobalMaterials.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              No materials found
            </div>
          ) : (
            paginatedGlobalMaterials.map((material) => (
              <div key={material.id} className="p-4 space-y-2.5">
                <div className="font-medium text-gray-900 text-sm">
                  {material.name}
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Category:</span>
                  <span className="text-gray-900">{material.category || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Available Stock:</span>
                  <span className="text-gray-900">{formatQuantityWithUnit(getMaterialStockDetails(material).availableStock, material.unit)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Unit:</span>
                  <span className="text-gray-900">{material.unit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Unit Price:</span>
                  <span className="text-gray-900 font-semibold">{formatCurrency(material.defaultRate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Vendor:</span>
                  <span className="text-gray-900">{material.vendor || '--'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingMaterial(material)}
                  className="w-full mt-2 px-3 py-2 bg-yellow-400 text-black text-xs font-semibold rounded-lg hover:bg-yellow-500 transition-colors"
                >
                  View
                </button>
              </div>
            ))
          )}
        </div>

        <Pagination
          currentPage={globalMaterialsPage}
          totalItems={filteredGlobalMaterials.length}
          pageSize={globalMaterialsPageSize}
          onPageChange={setGlobalMaterialsPage}
          onPageSizeChange={setGlobalMaterialsPageSize}
        />
      </div>

      {/* -- View Material Modal -- */}
      {viewingPM && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                Material Details
              </h3>
              <button
                onClick={() => setViewingPM(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Project</span>
                <span className="font-medium text-gray-900">{viewingPM.project?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Material</span>
                <span className="font-medium text-gray-900">{viewingPM.material?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Category</span>
                <span className="text-gray-900">{viewingPM.material?.category || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Assigned</span>
                <span className="text-gray-900">{viewingPM.assigned} {viewingPM.material?.unit}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Used</span>
                <span className="text-gray-900">{viewingPM.used} {viewingPM.material?.unit}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Remaining</span>
                <span className="text-gray-900">{(viewingPM.assigned || 0) - (viewingPM.used || 0)} {viewingPM.material?.unit}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Rate</span>
                <span className="text-gray-900">{formatCurrency(viewingPM.material?.defaultRate)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Total Cost</span>
                <span className="font-semibold text-gray-900">{formatCurrency((viewingPM.material?.defaultRate || 0) * (viewingPM.used || 0))}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Status</span>
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    viewingPM.status === "ACTIVE"
                      ? "bg-green-100 text-green-800"
                      : viewingPM.status === "COMPLETED"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {viewingPM.status === "NOT_USED" ? "Not Used" : viewingPM.status}
                </span>
              </div>
            </div>

            <button
              onClick={() => setViewingPM(null)}
              className="w-full mt-6 px-4 py-2.5 bg-gray-100 text-gray-800 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {viewingMaterial && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4 px-4 sm:px-6 pt-4 sm:pt-6 pb-0 shrink-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                Material Details
              </h3>
              <button
                onClick={() => setViewingMaterial(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Material Name</span>
                  <span className="font-medium text-gray-900">{viewingMaterial.name || '--'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Category</span>
                  <span className="text-gray-900">{viewingMaterial.category || '--'}</span>
                </div>
                <div className="py-2 border-b border-gray-100">
                  <span className="text-gray-500 block mb-1">Description</span>
                  <span className="text-gray-900">{viewingMaterial.description || '--'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Total Purchased Quantity</span>
                  <span className="text-gray-900">{formatQuantity(viewingMaterialStock?.totalPurchasedQuantity)} {viewingMaterial.unit || ''}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Allocated Quantity</span>
                  <span className="text-gray-900">{formatQuantity(viewingMaterialStock?.allocatedQuantity)} {viewingMaterial.unit || ''}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Available Stock</span>
                  <span className="text-gray-900">{formatQuantityWithUnit(viewingMaterialStock?.availableStock, viewingMaterial.unit)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Unit</span>
                  <span className="text-gray-900">{viewingMaterial.unit || '--'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Unit Price</span>
                  <span className="text-gray-900">{formatCurrency(viewingMaterial.defaultRate)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Vendor Name</span>
                  <span className="text-gray-900">{viewingMaterial.vendor || '--'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Project Details</span>
                  <span className="text-gray-900 text-right">{viewingMaterial.projectName || '--'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Created Date</span>
                  <span className="text-gray-900">{viewingMaterial.createdAt ? new Date(viewingMaterial.createdAt).toLocaleDateString('en-IN') : '--'}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Last Updated</span>
                  <span className="text-gray-900">{viewingMaterial.updatedAt ? new Date(viewingMaterial.updatedAt).toLocaleDateString('en-IN') : '--'}</span>
                </div>
              </div>
            </div>

            <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-4 shrink-0 border-t border-gray-100 bg-white">
              <button
                onClick={() => setViewingMaterial(null)}
                className="w-full px-4 py-2.5 bg-gray-100 text-gray-800 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -- Edit Material Modal -- */}
      {editingPM && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
              Edit Allocated Material
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-4">
              {editingPM.material?.name} - {editingPM.project?.name}
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Assigned Qty</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={editForm.assigned}
                    onChange={(e) => setEditForm({ ...editForm, assigned: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Used Qty</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={editForm.used}
                    onChange={(e) => setEditForm({ ...editForm, used: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="NOT_USED">Not Used</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3 mt-6">
              <button
                onClick={() => setEditingPM(null)}
                disabled={isSavingEdit}
                className="flex-1 px-3 sm:px-4 py-2 bg-gray-100 text-gray-800 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSavingEdit || editForm.assigned === "" || editForm.used === ""}
                className="flex-1 px-3 sm:px-4 py-2 bg-yellow-400 text-black text-sm font-semibold rounded-xl shadow-sm hover:bg-yellow-500 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {isSavingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -- Delete Confirmation Modal -- */}
      {deletingPM && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              Delete Allocated Material
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to remove <span className="font-medium text-gray-900">{deletingPM.material?.name}</span> from <span className="font-medium text-gray-900">{deletingPM.project?.name}</span>? This cannot be undone.
            </p>
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => setDeletingPM(null)}
                disabled={isDeleting}
                className="flex-1 px-3 sm:px-4 py-2 bg-gray-100 text-gray-800 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 px-3 sm:px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
              Reject Material Request
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
              Please provide a reason for rejecting this material request:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none text-sm"
              rows="4"
              autoFocus
            />
            <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
              <button
                onClick={handleRejectCancel}
                className="flex-1 px-3 sm:px-4 py-2 bg-gray-100 text-gray-800 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!rejectReason.trim()}
                className="flex-1 px-3 sm:px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {showStatusModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
              Update Material Status
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-4">
              Material: <span className="font-medium">
                {selectedMaterialIndex !== null ? projectMaterials[selectedMaterialIndex]?.material?.name : ""}
              </span>
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Status
              </label>
              <div className="space-y-2">
                {["ACTIVE", "COMPLETED", "NOT_USED"].map((status) => (
                  <label
                    key={status}
                    className="flex items-center p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name="status"
                      value={status}
                      checked={newStatus === status}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-4 h-4 text-yellow-500 focus:ring-yellow-400"
                    />
                    <span className="ml-3 text-sm text-gray-900">
                      {status === "NOT_USED" ? "Not Used" : status.charAt(0) + status.slice(1).toLowerCase()}
                    </span>
                    <span
                      className={`ml-auto px-2 py-0.5 text-xs font-medium rounded-full ${
                        status === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : status === "COMPLETED"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {status === "NOT_USED" ? "Not Used" : status}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3 mt-6">
              <button
                onClick={handleStatusUpdateCancel}
                className="flex-1 px-3 sm:px-4 py-2 bg-gray-100 text-gray-800 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdateConfirm}
                disabled={!newStatus}
                className="flex-1 px-3 sm:px-4 py-2 bg-yellow-400 text-black text-sm font-semibold rounded-xl shadow-sm hover:bg-yellow-500 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddMaterialModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
              Add Material to Project
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-4">
              Project: <span className="font-medium">{selectedProjectData?.name}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Select Material
                </label>
                <select
                  value={newMaterial.materialId}
                  onChange={(e) => setNewMaterial({ ...newMaterial, materialId: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm"
                >
                  <option value="">Choose a material...</option>
                  {materials.length === 0 ? (
                    <option disabled>Loading materials...</option>
                  ) : (
                    materials.map((material) => (
                      <option key={material.id} value={material.id}>
                        {material.name} ({material.unit})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Quantity
                </label>
                <input
                  type="number"
                  value={newMaterial.quantity}
                  onChange={(e) => setNewMaterial({ ...newMaterial, quantity: e.target.value })}
                  placeholder="Enter quantity"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm"
                  min="0"
                  step="0.1"
                />
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddMaterialModal(false);
                  setNewMaterial({ materialId: "", quantity: "" });
                }}
                className="flex-1 px-3 sm:px-4 py-2 bg-gray-100 text-gray-800 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMaterial}
                disabled={!newMaterial.materialId || !newMaterial.quantity}
                className="flex-1 px-3 sm:px-4 py-2 bg-yellow-400 text-black text-sm font-semibold rounded-xl shadow-sm hover:bg-yellow-500 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                Add Material
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsTab;

