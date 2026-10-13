import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Edit,
  Trash2,
  Phone,
  MapPin,
  User,
  Filter,
  ChevronDown,
  MoreVertical,
  WalletCards,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import SidePannel from "../../components/common/SidePannel";
import DeleteConfirmationModal from "../../components/AddSiteEngineer/DeleteConfirmationModal";
import AddEngineerModal from "../../components/AddSiteEngineer/AddEngineerModal";
import EditEngineerModal from "../../components/AddSiteEngineer/EditEngineerModal";
import { AddSalaryModal, SalaryHistoryModal } from "../../components/AddSiteEngineer/EngineerSalaryModals";
import Toast from "../../components/common/Toast";
import LoadingScreen from "../../components/common/Loadingscreen";
import Pagination, { DEFAULT_PAGE_SIZE } from "../../components/common/Pagination";
import { getToken } from '../../utils/tabToken';
const API_URL = import.meta.env.VITE_API_URL;
const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || API_URL.replace(/\/api\/?$/, "");


const getImageUrl = (profileImage) => {
  if (!profileImage) return null;
  if (profileImage.startsWith("http")) return profileImage;
  return `${BACKEND_URL}${profileImage}`;
};

const getAllEngineers = async () => {
  const token = getToken();
  if (!token) throw new Error("No authentication token found");
  const response = await fetch(`${API_URL}/engineers`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  if (!response.ok) {
    if (response.status === 401) throw { error: "Session expired. Please login again." };
    throw new Error("Failed to fetch engineers");
  }
  return await response.json();
};

const createEngineer = async (engineerData) => {
  const token = getToken();
  if (!token) throw new Error("No authentication token found");
  const formData = new FormData();
  formData.append("name", engineerData.name);
  formData.append("phone", engineerData.phone);
  formData.append("alternatePhone", engineerData.alternatePhone);
  formData.append("designation", engineerData.designation || "");
  formData.append("status", engineerData.status || "Active");
  formData.append("empId", engineerData.empId);
  formData.append("email", engineerData.email);
  formData.append("address", engineerData.address);
  formData.append("username", engineerData.username);
  formData.append("password", engineerData.password);
  if (engineerData.profileImage) formData.append("profileImage", engineerData.profileImage);
  const response = await fetch(`${API_URL}/engineers`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!response.ok) { const error = await response.json(); throw error; }
  return await response.json();
};

const updateEngineer = async (id, engineerData) => {
  const token = getToken();
  if (!token) throw new Error("No authentication token found");
  const formData = new FormData();
  formData.append("name", engineerData.name);
  formData.append("phone", engineerData.phone);
  formData.append("alternatePhone", engineerData.alternatePhone);
  formData.append("designation", engineerData.designation || "");
  formData.append("status", engineerData.status || "Active");
  formData.append("empId", engineerData.empId);
  formData.append("email", engineerData.email);
  formData.append("address", engineerData.address);
  formData.append("username", engineerData.username);
  if (engineerData.password) formData.append("password", engineerData.password);
  if (engineerData.profileImage) formData.append("profileImage", engineerData.profileImage);
  const response = await fetch(`${API_URL}/engineers/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!response.ok) { const error = await response.json(); throw error; }
  return await response.json();
};

const deleteEngineer = async (id) => {
  const token = getToken();
  if (!token) throw new Error("No authentication token found");
  const response = await fetch(`${API_URL}/engineers/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  if (!response.ok) { const error = await response.json(); throw error; }
  return await response.json();
};

const AddEngineers = () => {
  const navigate = useNavigate();
  const [engineers, setEngineers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEngineer, setSelectedEngineer] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [packageInfo, setPackageInfo] = useState(null);
  const [toast, setToast] = useState(null);
  const [actionMenuId, setActionMenuId] = useState(null);
  const [actionMenuPosition, setActionMenuPosition] = useState({ top: 0, left: 0 });
  const [showAddSalaryModal, setShowAddSalaryModal] = useState(false);
  const [showSalaryHistoryModal, setShowSalaryHistoryModal] = useState(false);
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [isSalaryLoading, setIsSalaryLoading] = useState(false);
  const actionMenuRef = useRef(null);
  const actionButtonRef = useRef(null);

  /* ── NEW: working filter (by designation) ── */
  const [filterDesignation, setFilterDesignation] = useState("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterDropdownRef = useRef(null);

  /* -- NEW: status filter -- */
  const [filterStatus, setFilterStatus] = useState("all");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const statusDropdownRef = useRef(null);

  /* ── NEW: working sort ── */
  const [sortOrder, setSortOrder] = useState("name-asc");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const sortDropdownRef = useRef(null);

  /* ── NEW: pagination ── */
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_PAGE_SIZE);

  const showToast = (message, type = "info") => setToast({ message, type });

  useEffect(() => {
      document.title = "Vconstech - Admin";
    }, []);

  const fetchEngineers = async () => {
    setIsLoading(true);
    const token = getToken();
    if (!token) { setEngineers([]); setIsLoading(false); return; }
    try {
      const response = await getAllEngineers();
      if (response?.success && response.engineers) setEngineers(response.engineers);
      else setEngineers([]);
    } catch (error) {
      console.error("Error fetching engineers:", error);
      if (["Session expired. Please login again.", "Unauthorized"].includes(error.error || error.message)) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      } else setEngineers([]);
    } finally { setIsLoading(false); }
  };

  const fetchPackageInfo = async () => {
    const token = getToken();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.package) {
      const pkg = user.package.toLowerCase();
      let limit = pkg === "free" ? 2: pkg === "basic" ? 5 : pkg === "premium" ? 10 : pkg === "advanced" ? (user.customMembers || 999) : 5;
      setPackageInfo({ package: user.package, limit });
    } else {
      try {
        const response = await fetch(`${API_URL}/engineers/me`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            const pkg = data.user.package?.toLowerCase();
            let limit = pkg === "free" ? 2: pkg === "basic" ? 5 : pkg === "premium" ? 10 : pkg === "advanced" ? (data.user.customMembers || 999) : 5;
            setPackageInfo({ package: data.user.package, limit });
            localStorage.setItem("user", JSON.stringify(data.user));
          }
        }
      } catch (error) { console.error("Error fetching package info:", error); }
    }
  };

  useEffect(() => { fetchEngineers(); fetchPackageInfo(); }, []);

  useEffect(() => {
    if (!showFilterDropdown && !showStatusDropdown && !showSortDropdown) return undefined;

    const handleClickOutside = (event) => {
      if (!filterDropdownRef.current?.contains(event.target)) {
        setShowFilterDropdown(false);
      }
      if (!statusDropdownRef.current?.contains(event.target)) {
        setShowStatusDropdown(false);
      }
      if (!sortDropdownRef.current?.contains(event.target)) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilterDropdown, showStatusDropdown, showSortDropdown]);

  useEffect(() => {
    const closeActionMenu = (event) => {
      if (!actionMenuRef.current?.contains(event.target) && !actionButtonRef.current?.contains(event.target)) setActionMenuId(null);
    };
    document.addEventListener("mousedown", closeActionMenu);
    return () => document.removeEventListener("mousedown", closeActionMenu);
  }, []);

  const filteredEngineers = engineers.filter(
    (eng) =>
      (eng.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eng.empId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (eng.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        eng.phone.includes(searchTerm)) &&
      (filterDesignation === "all" || (eng.designation || "Unassigned") === filterDesignation) &&
      (filterStatus === "all" || (eng.status || "Active") === filterStatus)
  );

  /* NEW: unique designation options for the filter dropdown, derived from live data */
  const designationOptions = Array.from(
    new Set(engineers.map((eng) => eng.designation || "Unassigned"))
  );

  const getStatusBadgeClasses = (status) => {
    return (status || "Active") === "Inactive"
      ? "text-red-700 bg-red-100"
      : "text-green-700 bg-green-100";
  };

  const sortedEngineers = [...filteredEngineers].sort((a, b) => {
    if (sortOrder === "name-asc") return a.name.localeCompare(b.name);
    if (sortOrder === "name-desc") return b.name.localeCompare(a.name);
    if (sortOrder === "empid") return a.empId.localeCompare(b.empId);
    return 0;
  });

  /* NEW: pagination derived data */
  const totalPages = Math.max(1, Math.ceil(sortedEngineers.length / rowsPerPage));
  const paginatedEngineers = sortedEngineers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDesignation, filterStatus, sortOrder]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const handleDelete = async (id) => {
    try {
      const response = await deleteEngineer(id);
      if (response.success) {
        await fetchEngineers();
        setShowDeleteModal(false);
        setSelectedEngineer(null);
        showToast("Engineer deleted successfully!", "success");
      }
    } catch (error) {
      showToast(error.error || "Failed to delete engineer", "error");
    }
  };

  const handleEdit = (engineer) => { setSelectedEngineer(engineer); setShowEditModal(true); };

  const fetchSalaryHistory = async (engineer) => {
    setIsSalaryLoading(true);
    try {
      const response = await fetch(`${API_URL}/engineers/${engineer.id}/salaries`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch salary history");
      setSalaryHistory(data.salaries || []);
    } catch (error) {
      setSalaryHistory([]);
      showToast(error.message || "Failed to fetch salary history", "error");
    } finally { setIsSalaryLoading(false); }
  };

  const openSalaryHistory = async (engineer) => {
    setSelectedEngineer(engineer);
    setShowSalaryHistoryModal(true);
    setActionMenuId(null);
    await fetchSalaryHistory(engineer);
  };

  const openAddSalary = async (engineer) => {
    setSelectedEngineer(engineer);
    setActionMenuId(null);
    setShowAddSalaryModal(true);
  };

  const handleAddSalary = async (salary) => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`${API_URL}/engineers/${selectedEngineer.id}/salaries`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify(salary),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to add salary");
      showToast("Salary added successfully!", "success");
      return true;
    } catch (error) {
      showToast(error.message || "Failed to add salary", "error");
      return false;
    } finally { setIsSubmitting(false); }
  };

  const openActionMenu = (engineer, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (actionMenuId === engineer.id) return setActionMenuId(null);
    setActionMenuPosition({ top: rect.bottom + 8, left: Math.max(12, rect.right - 176) });
    setActionMenuId(engineer.id);
  };

  const renderActionsMenu = (engineer) => (
    <div>
      <button ref={actionMenuId === engineer.id ? actionButtonRef : null} type="button" onClick={(event) => openActionMenu(engineer, event)} className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-yellow-50 hover:text-yellow-700" title="Actions" aria-label={`Actions for ${engineer.name}`} aria-expanded={actionMenuId === engineer.id}>
        <MoreVertical className="h-5 w-5" />
      </button>
      {actionMenuId === engineer.id && createPortal(<div ref={actionMenuRef} style={actionMenuPosition} className="fixed z-[60] w-44 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-xl">
        <button onClick={() => { handleEdit(engineer); setActionMenuId(null); }} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-blue-50"><Edit className="h-4 w-4 text-blue-600" />Edit</button>
        <button onClick={() => openAddSalary(engineer)} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-yellow-50"><WalletCards className="h-4 w-4 text-yellow-600" />Add salary</button>
        <button onClick={() => openSalaryHistory(engineer)} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-yellow-50"><Eye className="h-4 w-4 text-yellow-700" />View salary</button>
        <div className="my-1 border-t border-gray-100" />
        <button onClick={() => { setSelectedEngineer(engineer); setShowDeleteModal(true); setActionMenuId(null); }} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" />Delete</button>
      </div>, document.body)}
    </div>
  );

  const handleAddEngineer = async (engineerData) => {
    try {
      setIsSubmitting(true);
      const response = await createEngineer(engineerData);
      if (response.success) {
        setShowAddModal(false);
        await fetchEngineers();
        showToast("Engineer added successfully!", "success");
        return { success: true };
      }
      return { success: false, error: response.error || "Failed to add engineer" };
    } catch (error) {
      return { success: false, error: error.error || error.message || "Failed to add engineer" };
    } finally { setIsSubmitting(false); }
  };

  const handleUpdateEngineer = async (id, engineerData) => {
    setIsSubmitting(true);
    try {
      const response = await updateEngineer(id, engineerData);
      if (response.success) {
        await fetchEngineers();
        setShowEditModal(false);
        setSelectedEngineer(null);
        showToast("Engineer updated successfully!", "success");
        return true;
      }
      return false;
    } catch (error) {
      showToast(error.error || "Failed to update engineer", "error");
      return false;
    } finally { setIsSubmitting(false); }
  };

  const handleAddClick = () => {
    if (packageInfo && engineers.length >= packageInfo.limit) {
      showToast(
        `Cannot add more engineers. Your ${packageInfo.package} package allows ${packageInfo.limit} engineers. Please upgrade to add more.`,
        "warning"
      );
      return;
    }
    setShowAddModal(true);
  };
  if (isLoading) return <LoadingScreen message="Loading engineers..." />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Navbar */}

      {/* SidePannel — handles desktop sidebar + mobile bottom nav internally */}

      {/* Main content */}
      <div className="pt-20 md:pl-64 md:pt-25">
        <div className="px-3 sm:px-4 lg:px-6 pt-4 pb-24 md:pb-8 max-w-7xl mx-auto space-y-4">

          {/* Page header */}
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Engineers List</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {isLoading ? "Loading..." : `${filteredEngineers.length} / ${packageInfo?.limit ?? "..."} Engineers`}
              </p>
            </div>
            <button
              onClick={handleAddClick}
              className="flex items-center gap-2 bg-yellow-400 text-black px-4 py-2.5 rounded-xl hover:bg-yellow-500 transition-colors text-sm font-semibold shadow-sm"
            >
              <User className="w-4 h-4" />
              Add Engineer
            </button>
          </div>

          {/* Search / Filter / Sort row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, employee ID, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent shadow-sm"
              />
            </div>
            {/* Filter (by designation) */}
            <div className="relative" ref={filterDropdownRef}>
              <button
                type="button"
                onPointerDown={() => { setShowFilterDropdown((isOpen) => !isOpen); setShowStatusDropdown(false); setShowSortDropdown(false); }}
                onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setShowFilterDropdown((isOpen) => !isOpen); setShowStatusDropdown(false); setShowSortDropdown(false); } }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Filter className="pointer-events-none w-4 h-4 text-gray-500" />
                {filterDesignation === "all" ? "Filter" : filterDesignation}
                {filterDesignation !== "all" && <span className="w-2 h-2 bg-yellow-500 rounded-full" />}
              </button>
              {showFilterDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1">
                  <p className="text-xs font-semibold text-gray-400 px-3 py-1.5 uppercase tracking-wide">Designation</p>
                  <button
                    onClick={() => { setFilterDesignation("all"); setShowFilterDropdown(false); }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${filterDesignation === "all" ? "bg-yellow-50 text-yellow-800 font-medium" : "hover:bg-gray-50 text-gray-700"}`}
                  >
                    All Designations
                  </button>
                  {designationOptions.map((d) => (
                    <button key={d}
                      onClick={() => { setFilterDesignation(d); setShowFilterDropdown(false); }}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${filterDesignation === d ? "bg-yellow-50 text-yellow-800 font-medium" : "hover:bg-gray-50 text-gray-700"}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filter (by status) */}
            <div className="relative" ref={statusDropdownRef}>
              <button
                type="button"
                onPointerDown={() => { setShowStatusDropdown((isOpen) => !isOpen); setShowFilterDropdown(false); setShowSortDropdown(false); }}
                onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setShowStatusDropdown((isOpen) => !isOpen); setShowFilterDropdown(false); setShowSortDropdown(false); } }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Filter className="pointer-events-none w-4 h-4 text-gray-500" />
                {filterStatus === "all" ? "Status" : filterStatus}
                {filterStatus !== "all" && <span className="w-2 h-2 bg-yellow-500 rounded-full" />}
              </button>
              {showStatusDropdown && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1">
                  <p className="text-xs font-semibold text-gray-400 px-3 py-1.5 uppercase tracking-wide">Status</p>
                  {["all", "Active", "Inactive"].map((status) => (
                    <button
                      key={status}
                      onClick={() => { setFilterStatus(status); setShowStatusDropdown(false); }}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${filterStatus === status ? "bg-yellow-50 text-yellow-800 font-medium" : "hover:bg-gray-50 text-gray-700"}`}
                    >
                      {status === "all" ? "All" : status}
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
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap shadow-sm"
              >
                Sort by:{" "}
                <span className="font-semibold text-gray-900">
                  {sortOrder === "name-asc" ? "Name A–Z" : sortOrder === "name-desc" ? "Name Z–A" : "Employee ID"}
                </span>
                <ChevronDown className="pointer-events-none w-4 h-4 text-gray-500" />
              </button>
              {showSortDropdown && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1">
                  {[
                    { val: "name-asc", label: "Name A–Z" },
                    { val: "name-desc", label: "Name Z–A" },
                    { val: "empid", label: "Employee ID" },
                  ].map((opt) => (
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

          {/* ── Desktop Table (lg+) ── */}
          {!isLoading && (
            <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-yellow-400">
                    <tr>
                      {["Engineer", "Employee ID", "Designation", "Contact", "Address", "Actions"].map((h) => (
                        <th
                          key={h}
                          className={`px-5 py-3.5 text-left text-xs font-bold text-black uppercase tracking-wide ${h === "Actions" ? "text-center w-32" : ""}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {paginatedEngineers.map((engineer) => (
                      <tr key={engineer.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-11 w-11 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {engineer.profileImage ? (
                                <img src={getImageUrl(engineer.profileImage)} alt={engineer.name} className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-purple-600 font-semibold text-sm">
                                  {engineer.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{engineer.name}</p>
                              <p className="text-xs text-gray-500">{engineer.email || "Engineer"}</p>
                              <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-[10px] font-semibold rounded-full ${getStatusBadgeClasses(engineer.status)}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${((engineer.status || "Active") === "Inactive") ? "bg-red-500" : "bg-green-500"}`} />
                                {engineer.status || "Active"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700">{engineer.empId}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700">{engineer.designation || "—"}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="h-7 w-7 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                              <Phone className="w-3.5 h-3.5 text-orange-500" />
                            </span>
                            <div>
                              <p className="text-sm text-gray-800">{engineer.phone}</p>
                              {engineer.email && <p className="text-xs text-gray-500">{engineer.email}</p>}
                              {engineer.alternatePhone && <p className="text-xs text-gray-400">{engineer.alternatePhone}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-gray-700 max-w-xs truncate">{engineer.address}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap w-32">
                          <div className="flex justify-center">{renderActionsMenu(engineer)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredEngineers.length === 0 && (
                <div className="text-center py-12">
                  <User className="mx-auto h-10 w-10 text-gray-300" />
                  <p className="mt-2 text-sm font-medium text-gray-600">No engineers found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {searchTerm ? "Try adjusting your search." : "Get started by adding a new engineer."}
                  </p>
                </div>
              )}
              {filteredEngineers.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalItems={sortedEngineers.length}
                  pageSize={rowsPerPage}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setRowsPerPage}
                />
              )}
            </div>
          )}

          {/* ── Mobile / Tablet Cards (below lg) ── */}
          {!isLoading && (
            <div className="lg:hidden space-y-3">
              {sortedEngineers.map((engineer) => (
                <div key={engineer.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  {/* Top: avatar + name + actions */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {engineer.profileImage ? (
                          <img src={getImageUrl(engineer.profileImage)} alt={engineer.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-purple-600 font-semibold text-base">
                            {engineer.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">{engineer.name}</h3>
                        <p className="text-xs text-gray-500">{engineer.empId}</p>
                        {engineer.email && (
                          <p className="text-xs text-gray-500 mt-0.5">{engineer.email}</p>
                        )}
                        {engineer.designation && (
                          <p className="text-xs text-yellow-700 font-medium mt-0.5">{engineer.designation}</p>
                        )}
                        <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-[10px] font-semibold rounded-full ${getStatusBadgeClasses(engineer.status)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${((engineer.status || "Active") === "Inactive") ? "bg-red-500" : "bg-green-500"}`} />
                          {engineer.status || "Active"}
                        </span>
                      </div>
                    </div>
                    {renderActionsMenu(engineer)}
                  </div>

                  {/* Bottom: contact + address */}
                  <div className="space-y-1.5 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-3 h-3 text-orange-500" />
                      </span>
                      <div className="text-xs text-gray-700">
                        {engineer.phone}
                        {engineer.alternatePhone && <span className="text-gray-400"> · {engineer.alternatePhone}</span>}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-600">{engineer.address}</p>
                    </div>
                  </div>
                </div>
              ))}

              {filteredEngineers.length === 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
                  <User className="mx-auto h-10 w-10 text-gray-300" />
                  <p className="mt-2 text-sm font-medium text-gray-600">No engineers found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {searchTerm ? "Try adjusting your search." : "Get started by adding a new engineer."}
                  </p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Modals */}
      <AddEngineerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddEngineer}
        isSubmitting={isSubmitting}
      />
      <EditEngineerModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedEngineer(null); }}
        onSubmit={handleUpdateEngineer}
        isSubmitting={isSubmitting}
        engineer={selectedEngineer}
      />
      <AddSalaryModal
        isOpen={showAddSalaryModal}
        engineer={selectedEngineer}
        isSubmitting={isSubmitting}
        onSubmit={handleAddSalary}
        onClose={() => { setShowAddSalaryModal(false); setSelectedEngineer(null); }}
      />
      <SalaryHistoryModal
        isOpen={showSalaryHistoryModal}
        engineer={selectedEngineer}
        salaries={salaryHistory}
        isLoading={isSalaryLoading}
        onClose={() => { setShowSalaryHistoryModal(false); setSelectedEngineer(null); setSalaryHistory([]); }}
      />
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        engineer={selectedEngineer}
        onConfirm={handleDelete}
        onCancel={() => { setShowDeleteModal(false); setSelectedEngineer(null); }}
      />
    </div>
  );
};

export default AddEngineers;
