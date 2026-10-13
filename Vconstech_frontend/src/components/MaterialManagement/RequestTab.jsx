import React, { useState, useEffect } from "react";
import { useRequestTabData } from "./RequestTab/useRequestTabData";
import RequestTabHeader from "./RequestTab/RequestTabHeader";
import RequestTable from "./RequestTab/RequestTable";
import RequestCardView from "./RequestTab/RequestCardView";
import ViewModal from "./RequestTab/ViewModal";
import RejectModal from "./RequestTab/RejectModal";
import CommandModal from "./RequestTab/CommandModal";
import Pagination, { DEFAULT_PAGE_SIZE } from "../../components/common/Pagination";

const RequestTab = () => {
  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewRequest, setViewRequest] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showCommandModal, setShowCommandModal] = useState(false);
  const [commandNote, setCommandNote] = useState("");
  const [selectedProjectFilter, setSelectedProjectFilter] = useState("All");

  // UI-only: pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Data and handlers from custom hook
  const {
    requestStatusFilter,
    setRequestStatusFilter,
    materialRequests,
    loading,
    error,
    materialTypeFilter,
    setMaterialTypeFilter,
    handleAcceptConfirm,
    handleRejectClick,
    handleRejectConfirm: hookHandleRejectConfirm,
    handleCommandConfirm: hookHandleCommandConfirm,
  } = useRequestTabData();

  const getRequestDescription = (request) =>
    request.description ||
    request.engineerNote ||
    request.note ||
    request.remarks ||
    request.comment ||
    "No description provided.";

  // Filtering logic (unchanged)
  const filteredMaterialRequests = materialRequests
    .filter(
      (req) =>
        requestStatusFilter === "All" || req.status === requestStatusFilter,
    )
    .filter((req) => {
      if (materialTypeFilter === "global") {
        return !req.project && !req.projectName && !req.projectId;
      }
      return req.project || req.projectName || req.projectId;
    })
    .filter((req) => {
      if (materialTypeFilter === "project" && selectedProjectFilter !== "All") {
        const projectName = req.project?.name || req.projectName || "";
        return projectName === selectedProjectFilter;
      }
      return true;
    });

  // UI-only: reset to page 1 whenever the filtered set changes
  useEffect(() => {
    setCurrentPage(1);
  }, [requestStatusFilter, materialTypeFilter, selectedProjectFilter, materialRequests.length]);

  // UI-only: paginated slice passed down to table/card view
  const paginatedRequests = filteredMaterialRequests.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Unique project names for filter dropdown
  const projectNames = [
    ...new Set(
      materialRequests
        .filter((r) => r.project || r.projectName || r.projectId)
        .map((r) => r.project?.name || r.projectName || "")
        .filter(Boolean),
    ),
  ];

  // Table headers
  const globalHeaders = ["Vendor", "Name", "Date", "Material", "Quantity", "Unit", ""];
  const projectHeaders = ["Vendor", "Name", "Project", "Date", "Material", "Quantity", "Unit", ""];
  const headers = materialTypeFilter === "global" ? globalHeaders : projectHeaders;

  // Event handlers
  const handleTabSwitch = (tab) => {
    setMaterialTypeFilter(tab);
    setSelectedProjectFilter("All");
    setRequestStatusFilter("All");
  };

  const handleViewRequest = (request) => {
    setViewRequest(request);
    setShowViewModal(true);
  };

  const handleRejectFromModal = (requestId) => {
    handleRejectClick(requestId);
    setShowViewModal(false);
    setViewRequest(null);
    setShowRejectModal(true);
    setRejectReason("");
  };

  const handleRejectConfirm = async () => {
    await hookHandleRejectConfirm(rejectReason);
    setShowRejectModal(false);
    setRejectReason("");
  };

  const handleCommandConfirm = async () => {
    await hookHandleCommandConfirm(commandNote, viewRequest);
    setShowCommandModal(false);
    setCommandNote("");
    setShowViewModal(false);
    setViewRequest(null);
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <RequestTabHeader
          materialTypeFilter={materialTypeFilter}
          onTabSwitch={handleTabSwitch}
          requestStatusFilter={requestStatusFilter}
          onStatusFilterChange={setRequestStatusFilter}
          selectedProjectFilter={selectedProjectFilter}
          onProjectFilterChange={setSelectedProjectFilter}
          projectNames={projectNames}
        />

        <RequestTable
          headers={headers}
          filteredRequests={paginatedRequests}
          loading={loading}
          materialTypeFilter={materialTypeFilter}
          onViewRequest={handleViewRequest}
        />

        <RequestCardView
          filteredRequests={paginatedRequests}
          loading={loading}
          materialTypeFilter={materialTypeFilter}
          onViewRequest={handleViewRequest}
          onAccept={handleAcceptConfirm}
          onReject={handleRejectClick}
        />

        <Pagination
          currentPage={currentPage}
          totalItems={filteredMaterialRequests.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      <ViewModal
        isOpen={showViewModal}
        viewRequest={viewRequest}
        onClose={() => {
          setShowViewModal(false);
          setViewRequest(null);
        }}
        onAccept={async (id) => {
          await handleAcceptConfirm(id);
          setShowViewModal(false);
          setViewRequest(null);
        }}
        onReject={handleRejectFromModal}
        onCommand={() => setShowCommandModal(true)}
        getRequestDescription={getRequestDescription}
      />

      <RejectModal
        isOpen={showRejectModal}
        rejectReason={rejectReason}
        onReasonChange={(e) => setRejectReason(e.target.value)}
        onConfirm={handleRejectConfirm}
        onCancel={() => {
          setShowRejectModal(false);
          setRejectReason("");
        }}
      />

      <CommandModal
        isOpen={showCommandModal}
        commandNote={commandNote}
        onNoteChange={(e) => setCommandNote(e.target.value)}
        onConfirm={handleCommandConfirm}
        onCancel={() => {
          setShowCommandModal(false);
          setCommandNote("");
        }}
      />
    </div>
  );
};

export default RequestTab;
