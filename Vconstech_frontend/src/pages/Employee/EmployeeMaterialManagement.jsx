import { useEffect, useState } from "react";
import EmployeeMaterialsTab from "../../components/Employee/EmployeeMaterial/EmployeeMaterialsTab";
import EmployeeProjectsTab from "../../components/Employee/EmployeeMaterial/EmployeeProjectsTab";
import EmployeeRequestTab from "../../components/Employee/EmployeeMaterial/EmployeeRequestTab";
import EmployeeNavbar from "../../components/Employee/EmployeeNavbar";
import { materialRequestAPI, usageLogAPI, notificationAPI } from "../../api/materialService";
import { getToken } from '../../utils/tabToken';
import { isProjectExecutionEnabled } from '../../utils/dashboardUtils';

import useEmployeeMaterialData from "../../hooks/Useemployeematerialdata";
import NotificationsDropdown from "../../components/Employee/EmployeeMaterial/Notificationsdropdown";
import AddMaterialModal from "../../components/Employee/EmployeeMaterial/Addmaterialmodal";
import AddProjectMaterialModal from "../../components/Employee/EmployeeMaterial/Addprojectmaterialmodal";
import LogUsageModal from "../../components/Employee/EmployeeMaterial/Logusagemodal";
import { showToast } from '../../components/common/Toast';

const TABS = ["materials", "projects", "my-requests"];
const API_URL = import.meta.env.VITE_API_URL;

const TAB_LABELS = {
  materials: "Materials",
  projects: "Projects",
  "my-requests": "My Requests",
};

const EmployeeMaterialManagement = () => {
  const {
    materials, projects, usageLogs, materialRequests, notifications,
    categories, selectedProject, setSelectedProject, loading, setLoading, error,
    fetchProjectMaterials, fetchUsageLogs, fetchMaterialRequests, fetchNotifications,
    getProjectMaterialsWithDetails, unreadCount, getSelectedMaterialRemaining,
  } = useEmployeeMaterialData();

  const [activeTab, setActiveTab] = useState("materials");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [showAddProjectMaterial, setShowAddProjectMaterial] = useState(false);
  const [showUsageLog, setShowUsageLog] = useState(false);
  const selectedProjectData = projects.find((project) => Number(project.id) === Number(selectedProject));
  const executableProjects = projects.filter((project) => isProjectExecutionEnabled(project.status));
  const canExecuteSelectedProject = isProjectExecutionEnabled(selectedProjectData?.status);
  const canRequestMaterials = executableProjects.length > 0;

    useEffect(() => {
        document.title = "Vconstech - Engineer";
      }, []);

  // ============ COMPUTED ============

  const filteredMaterials = materials.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.vendor?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "All" || m.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // ============ HANDLERS ============

const handleSubmitMaterialRequest = async (newMaterial, requestType) => {
  try {
    if (requestType === 'PROJECT' && !isProjectExecutionEnabled(projects.find((p) => Number(p.id) === Number(newMaterial.projectId))?.status)) {
      showToast("Material requests are available only when the project is In Progress.", "warning");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('name', newMaterial.name || '');
    formData.append('category', newMaterial.category || '');
    formData.append('unit', newMaterial.unit || '');
    formData.append('defaultRate', parseFloat(newMaterial.defaultRate) || 0);
    formData.append('vendor', newMaterial.vendor || '');
    formData.append('description', newMaterial.description || '');
    formData.append('type', requestType);
    formData.append('quantity', newMaterial.quantity);
    if (newMaterial.dueDate) formData.append('dueDate', newMaterial.dueDate);
    if (requestType === 'PROJECT') {
      formData.append('projectId', parseInt(newMaterial.projectId));
    }
    // Attach file if present
    if (newMaterial.quotationFile) {
      formData.append('files', newMaterial.quotationFile);
    }

    await materialRequestAPI.create(formData);
      await fetchMaterialRequests();
      await fetchNotifications();
      setShowAddMaterial(false);
      showToast("Material request submitted successfully! You will be notified once it is reviewed.", "success");
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to submit material request", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProjectMaterial = async (newProjectMaterial) => {
    try {
      if (!canExecuteSelectedProject) {
        showToast("Project material requests are available only when the selected project is In Progress.", "warning");
        return;
      }

      setLoading(true);
      const material = materials.find((m) => m.id === parseInt(newProjectMaterial.materialId));
      const requestData = {
        name: material?.name,
        category: material?.category,
        unit: material?.unit,
        defaultRate: material?.defaultRate,
        type: "PROJECT_MATERIAL",
        projectId: parseInt(selectedProject),
        materialId: parseInt(newProjectMaterial.materialId),
        quantity: parseFloat(newProjectMaterial.assigned),
      };
      await materialRequestAPI.create(requestData);
      await fetchMaterialRequests();
      await fetchNotifications();
      setShowAddProjectMaterial(false);
      showToast("Project material request submitted successfully!", "success");
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to submit project material request", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUsageLog = async (newUsageLog) => {
    try {
      if (!canExecuteSelectedProject) {
        showToast("Usage logging is available only when the selected project is In Progress.", "warning");
        return;
      }

      setLoading(true);
      const projectMaterialsWithDetails = getProjectMaterialsWithDetails();
      const selectedMaterialId = parseInt(newUsageLog.materialId);
      const quantityToLog = parseFloat(newUsageLog.quantity);
      const projectMaterial = projectMaterialsWithDetails.find(
        (pm) => pm.materialId === selectedMaterialId
      );

      if (!projectMaterial) {
        showToast("Selected material not found in project!", "warning");
        return;
      }

      if (quantityToLog > projectMaterial.remaining) {
        showToast(
          `You are trying to log ${quantityToLog - projectMaterial.remaining} ` +
          `${projectMaterial.material?.unit} more than available.\n` +
          `Please reduce the quantity or request more materials.`,
          "warning"
        );
        return;
      }

      const response = await usageLogAPI.create({
        projectId: parseInt(selectedProject),
        materialId: selectedMaterialId,
        quantity: quantityToLog,
        remarks: newUsageLog.remarks || null,
        date: newUsageLog.date,
      });

      if (response.warning) showToast(`Warning: ${response.warning}`, "warning");

      await fetchProjectMaterials(selectedProject);
      await fetchUsageLogs(selectedProject);
      setShowUsageLog(false);
      showToast("Usage logged successfully!", "success");
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to log usage", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditUsageLog = async (originalLog, _index, updatedData) => {
    try {
      if (!canExecuteSelectedProject) {
        showToast("Usage changes are available only when the selected project is In Progress.", "warning");
        return;
      }

      setLoading(true);
      const projectMaterialsWithDetails = getProjectMaterialsWithDetails();
      const projectMaterial = projectMaterialsWithDetails.find(
        (pm) => pm.materialId === originalLog.materialId
      );

      if (!projectMaterial) {
        showToast("Material not found in project!", "warning");
        return;
      }

      const newRemaining =
        projectMaterial.remaining + originalLog.quantity - updatedData.quantity;

      if (newRemaining < 0) {
        showToast(
          `Cannot update to ${updatedData.quantity} ${projectMaterial.material?.unit}!\n\n` +
          `Current used: ${projectMaterial.used} ${projectMaterial.material?.unit}\n` +
          `Assigned: ${projectMaterial.assigned} ${projectMaterial.material?.unit}\n` +
          `This change would exceed available quantity by ${Math.abs(newRemaining)} ` +
          `${projectMaterial.material?.unit}\n\nPlease use a smaller quantity.`,
          "warning"
        );
        return;
      }

      await usageLogAPI.update(originalLog.id, {
        quantity: parseFloat(updatedData.quantity),
        remarks: updatedData.remarks || null,
      });

      await fetchProjectMaterials(selectedProject);
      await fetchUsageLogs(selectedProject);
      showToast("Usage log updated successfully!", "success");
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to update usage log", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      if (usageLogs.length === 0) {
        showToast("No usage logs found for this project. Please log some usage first.", "info");
        return;
      }

      if (!selectedProjectData?.name) {
        showToast("Please select a valid project before downloading the report.", "warning");
        return;
      }

      const reportData = {
        projectId: selectedProjectData.id,
        projectName: selectedProjectData.name,
        generatedDate: new Date().toLocaleDateString("en-IN"),
        generatedTime: new Date().toLocaleTimeString("en-IN"),
        usageLogs: usageLogs.map((log) => {
          const quantity = parseFloat(log.quantity) || 0;
          const rate = parseFloat(log.material?.defaultRate) || 0;
          return {
            date: new Date(log.date).toLocaleDateString("en-IN"),
            materialName: log.material?.name || "N/A",
            category: log.material?.category || "N/A",
            quantity,
            unit: log.material?.unit || "unit",
            rate,
            cost: quantity * rate,
            remarks: log.remarks || "-",
          };
        }),
        totalEntries: usageLogs.length,
        grandTotal: usageLogs.reduce((total, log) => {
          return total + (parseFloat(log.quantity) || 0) * (parseFloat(log.material?.defaultRate) || 0);
        }, 0),
      };

      const response = await fetch(`${API_URL}/reports/usage-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) throw new Error("Failed to generate PDF report");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportData.projectName.replace(/\s+/g, "_")}_Usage_Report_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading PDF report:", error);
      showToast("Failed to download PDF report. Please try again.", "error");
    }
  };


  const handleMarkNotificationAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      await fetchNotifications();
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

 const handleUpdateRequest = async (updatedRequest, formData) => {
  try {
    setLoading(true);

    // ✅ Always send formData — multer handles both file and non-file cases
    await fetch(`${API_URL}/material-requests/${updatedRequest.id}`, {
      method: 'PUT',
      headers: { 
        Authorization: `Bearer ${getToken()}`,
        // ✅ Do NOT set Content-Type manually — browser sets it with boundary automatically
      },
      body: formData,
    });

    await fetchMaterialRequests();
    await fetchNotifications(); // ✅ refresh notifications too
    showToast('Request updated successfully!', 'success');
  } catch (err) {
    showToast('Failed to update request', 'error');
  } finally {
    setLoading(false);
  }
};

  // ============ RENDER ============

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployeeNavbar />

      {/* ── Header ── */}
      <div className="mt-25 bg-white border-b border-gray-100 mt-16 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 leading-tight truncate">
              Material Management
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Track and manage materials across all projects
            </p>
          </div>
          <div className="shrink-0">
            <NotificationsDropdown
              notifications={notifications}
              unreadCount={unreadCount}
              show={showNotifications}
              onToggle={() => setShowNotifications((v) => !v)}
              onMarkAsRead={handleMarkNotificationAsRead}
            />
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  flex-1 sm:flex-none py-3 sm:py-4 px-3 sm:px-6
                  border-b-2 font-semibold text-sm transition-colors whitespace-nowrap
                  ${activeTab === tab
                    ? "border-yellow-500 text-yellow-600"
                    : "border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200"
                  }
                `}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-yellow-500 animate-spin" />
            <p className="text-sm text-gray-400">Loading...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-5">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Tab panels */}
        {!loading && activeTab === "materials" && (
  <EmployeeMaterialsTab
    materials={filteredMaterials}
    searchTerm={searchTerm}
    setSearchTerm={setSearchTerm}
    filterCategory={filterCategory}
    setFilterCategory={setFilterCategory}
    categories={categories}
    projects={executableProjects}
    loading={loading}
    onAddMaterial={handleSubmitMaterialRequest}
    canRequestMaterials={canRequestMaterials}
  />
)}

        {!loading && activeTab === "projects" && (
          <EmployeeProjectsTab
            projects={projects}
            selectedProject={selectedProject}
            setSelectedProject={setSelectedProject}
            projectMaterials={getProjectMaterialsWithDetails()}
            usageLogs={usageLogs}
            onAddProjectMaterial={() => setShowAddProjectMaterial(true)}
            onLogUsage={() => setShowUsageLog(true)}
            onEditUsage={handleEditUsageLog}
            onDownloadReport={handleDownloadReport}
            canExecuteSelectedProject={canExecuteSelectedProject}
          />
        )}

        {!loading && activeTab === "my-requests" && (
  <EmployeeRequestTab 
    requests={materialRequests} 
    onUpdateRequest={handleUpdateRequest}   // ← ADD THIS
  />
)}
      </div>

      {/* ── Modals ── */}
      <AddMaterialModal
        isOpen={showAddMaterial}
        onClose={() => setShowAddMaterial(false)}
        onSubmit={handleSubmitMaterialRequest}
        categories={categories}
        projects={executableProjects}
        loading={loading}
      />

      <AddProjectMaterialModal
        isOpen={showAddProjectMaterial}
        onClose={() => setShowAddProjectMaterial(false)}
        onSubmit={handleAddProjectMaterial}
        materials={materials}
        loading={loading}
      />

      <LogUsageModal
        isOpen={showUsageLog}
        onClose={() => setShowUsageLog(false)}
        onSubmit={handleAddUsageLog}
        projectMaterialsWithDetails={getProjectMaterialsWithDetails()}
        getSelectedMaterialRemaining={getSelectedMaterialRemaining}
        loading={loading}
      />
    </div>
  );
};

export default EmployeeMaterialManagement;
