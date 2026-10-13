import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FileText, AlertCircle, FolderOpen } from "lucide-react";
import EmployeeNavbar from "../../components/Employee/EmployeeNavbar";
import projectReportService from "../../services/projectReportService";
import useEmployeeDashboard from "../../hooks/useEmployeeDashboard";
import {
  getFileIcon,
  getFileType,
  formatFileSize,
  getStatusColor,
  getStatusDisplay,
  isProjectExecutionEnabled,
  handleViewFile,
  generatePrintContent,
} from "../../utils/dashboardUtils";

import KPICard from "../../components/Employee/EmployeeDashboard/KPICard";
import ProjectCard from "../../components/Employee/EmployeeDashboard/ProjectCard";
import MaterialRequestTable from "../../components/Employee/EmployeeDashboard/MaterialRequestTable";
import RecentFiles from "../../components/Employee/EmployeeDashboard/RecentFiles";
import DailyProgressHistory from "../../components/Employee/EmployeeDashboard/DailyProgressHistory";
import Notifications from "../../components/Employee/EmployeeDashboard/Notifications";
import QuickActions from "../../components/Employee/EmployeeDashboard/QuickActions";
import { showToast } from '../../components/common/Toast';

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  
  const {
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
    fetchDailyProgressHistory,
  } = useEmployeeDashboard();

  const currentDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const openProgressSlider = (projectId, currentProgress) => {
    setTempProgress({ ...tempProgress, [projectId]: currentProgress });
    setShowProgressSlider({ ...showProgressSlider, [projectId]: true });
  };

  const closeProgressSlider = (projectId) => {
    setShowProgressSlider({ ...showProgressSlider, [projectId]: false });
  };

  const handleProgressChange = (projectId, value) => {
    setTempProgress({ ...tempProgress, [projectId]: value });
  };

  const toggleProgressMessage = (projectId) => {
    setShowProgressMessage({
      ...showProgressMessage,
      [projectId]: !showProgressMessage[projectId],
    });
  };

  const closeProgressMessage = (projectId) => {
    setShowProgressMessage({ ...showProgressMessage, [projectId]: false });
    setProgressMessage({ ...progressMessage, [projectId]: "" });
  };

  const handleProgressMessageChange = (projectId, value) => {
    setProgressMessage({ ...progressMessage, [projectId]: value });
  };

  const handleDownloadReport = async (project) => {
    try {
      const report = await projectReportService.generateReport(project);
      await projectReportService.downloadReport(report, project.name);
      if (report.failedSections?.length) {
        showToast(`Report generated with unavailable sections: ${report.failedSections.map(({ label }) => label).join(', ')}`, "warning");
      }
    } catch (error) {
      console.error("❌ Error generating report:", error);
      showToast(`Failed to generate report: ${error.message}`, "error");
    }
  };

  const handlePrintHistory = () => {
    const printWindow = window.open("", "_blank");
    const printContent = generatePrintContent(dailyProgressHistory, employeeName);
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const approvedCount = materialRequests.filter(
    (r) => r.status?.toLowerCase() === "approved"
  ).length;
  const pendingCount = materialRequests.filter(
    (r) => r.status?.toLowerCase() === "pending"
  ).length;
  const rejectedCount = materialRequests.filter(
    (r) => r.status?.toLowerCase() === "rejected"
  ).length;
  const completedProjectsCount = assignedProjects.filter(
    (p) => p.status?.toLowerCase() === "completed"
  ).length;
  const hasExecutionProject = assignedProjects.some((project) =>
    isProjectExecutionEnabled(project.status)
  );

  useEffect(() => {
      document.title = "Vconstech - Engineer";
    }, []);

  useEffect(() => {
    if (location.hash !== "#daily-updates") {
      return;
    }

    const scrollToDailyUpdates = () => {
      const dailyUpdatesSection = document.getElementById("daily-updates");
      if (dailyUpdatesSection) {
        dailyUpdatesSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    const frame = requestAnimationFrame(scrollToDailyUpdates);
    return () => cancelAnimationFrame(frame);
  }, [location.hash]);

  const kpiData = [
    {
      icon: FolderOpen,
      label: "Active Projects",
      value: loading ? "..." : assignedProjects.length.toString(),
      color: "bg-blue-500",
      trend: `${assignedProjects.length} assigned`,
    },
    {
      icon: AlertCircle,
      label: "Material Requests",
      value: loading ? "..." : materialRequests.length.toString(),
      color: "bg-purple-500",
      trend: `${pendingCount} pending`,
    },
    {
      icon: FileText,
      label: "Completed",
      value: loading ? "..." : completedProjectsCount.toString(),
      color: "bg-green-500",
      trend: `${completedProjectsCount} finished`,
    },
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <EmployeeNavbar />
        <div className="mt-16 flex items-center justify-center p-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
              <h2 className="text-base font-semibold text-red-900">
                Error Loading Dashboard
              </h2>
            </div>
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 w-full px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 active:scale-95 transition-all"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const initials = employeeName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployeeNavbar />

      {/* ── Header ── */}
      <div className="mt-25 bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Hello, {employeeName} 👷‍♂️
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{currentDate}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center text-gray-900 font-bold text-sm shrink-0 shadow-sm">
            {initials}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">

        {/* ── KPI Cards — always 3 columns ── */}
        <div className="grid grid-cols-3 gap-3">
          {kpiData.map((kpi, index) => (
            <KPICard key={index} {...kpi} compact />
          ))}
        </div>

        {/* ── Quick Actions — mobile only pill row ── */}
        <div className="lg:hidden">
          <QuickActions
            onMaterialRequest={() => navigate("/employee/material-management")}
            onFileUpload={() => navigate("/employee/file-management")}
            canExecuteActions={hasExecutionProject}
            mobile
          />
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left / main column */}
          <div className="lg:col-span-2 space-y-5">

            {/* Projects */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-bold text-gray-900">My Assigned Projects</h2>
                <span className="text-xs text-gray-400 font-medium">
                  {assignedProjects.length} total
                </span>
              </div>

              {loading ? (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : assignedProjects.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  No projects assigned yet
                </div>
              ) : (
                <div className="space-y-3">
                  {assignedProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      showProgressSlider={showProgressSlider}
                      tempProgress={tempProgress}
                      isUpdatingProgress={isUpdatingProgress}
                      showProgressMessage={showProgressMessage}
                      progressMessage={progressMessage}
                      isSubmittingMessage={isSubmittingMessage}
                      onOpenProgressSlider={openProgressSlider}
                      onCloseProgressSlider={closeProgressSlider}
                      onUpdateProgress={handleProgressUpdate}
                      onProgressChange={handleProgressChange}
                      onToggleProgressMessage={toggleProgressMessage}
                      onCloseProgressMessage={closeProgressMessage}
                      onSubmitProgressMessage={handleSubmitProgressMessage}
                      onProgressMessageChange={handleProgressMessageChange}
                      onDownloadReport={handleDownloadReport}
                      getStatusColor={getStatusColor}
                      getStatusDisplay={getStatusDisplay}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Material Requests */}
            <MaterialRequestTable
              materialRequests={materialRequests}
              loading={loading}
              approvedCount={approvedCount}
              pendingCount={pendingCount}
              rejectedCount={rejectedCount}
              getStatusColor={getStatusColor}
              getStatusDisplay={getStatusDisplay}
            />
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            <RecentFiles
              recentFiles={recentFiles}
              loading={loading}
              onViewFile={(file) => handleViewFile(file, API_BASE_URL)}
              onNavigateToFiles={() => navigate("/employee/file-management")}
              getFileIcon={getFileIcon}
              getFileType={getFileType}
              formatFileSize={formatFileSize}
              compact
            />

            <Notifications notifications={notifications} loading={loading} />

            {/* Quick Actions — desktop sidebar only */}
            <div className="hidden lg:block">
              <QuickActions
                onMaterialRequest={() => navigate("/employee/material-management")}
                onFileUpload={() => navigate("/employee/file-management")}
                canExecuteActions={hasExecutionProject}
              />
            </div>

            <div id="daily-updates" className="scroll-mt-28">
              <DailyProgressHistory
                dailyProgressHistory={dailyProgressHistory}
                loadingHistory={loadingHistory}
                onPrintHistory={handlePrintHistory}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
