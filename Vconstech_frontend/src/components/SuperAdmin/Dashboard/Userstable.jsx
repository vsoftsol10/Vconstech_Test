import React, { useState, useMemo } from "react";
import { Edit, Trash2, Download, Loader2, Eye, X, User, Mail, Phone, Building2, MapPin, Package, Users, Search, Filter, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { getToken } from '../../../utils/tabToken';
import { showToast } from '../../../components/common/Toast';

const API_URL = import.meta.env.VITE_API_URL;

const ROWS_PER_PAGE = 10;

const getExportToken = () => {
  const superAdminToken = localStorage.getItem("token") || "";
  if (superAdminToken.startsWith("super_admin_token_")) return superAdminToken;

  const existingToken = getToken() || superAdminToken;
  if (existingToken) return existingToken;

  const nextToken = `super_admin_token_${Date.now()}`;
  localStorage.setItem("token", nextToken);
  return nextToken;
};

// ─── View User Modal ──────────────────────────────────────────────────────────
const ViewUserModal = ({ user, onClose }) => {
  if (!user) return null;

  const getMemberCount = (user) => {
    if (user.package === "Basic") return "5";
    if (user.package === "Premium") return "10";
    if (user.package === "Free")    return "2";
    return user.customMembers || "N/A";
  };

  const fields = [
    { icon: User,      label: "Full Name",    value: user.name },
    { icon: Mail,      label: "Email",        value: user.email },
    { icon: Phone,     label: "Phone",        value: user.phoneNumber },
    { icon: User,      label: "Role",         value: user.role?.replace("_", " ") },
    { icon: Building2, label: "Company",      value: user.company?.name || "N/A" },
    { icon: MapPin,    label: "City",         value: user.city },
    { icon: Package,   label: "Package",      value: user.package || "N/A" },
    { icon: Users,     label: "Members",      value: getMemberCount(user) },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm transition-opacity duration-300 p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "modalIn 0.22s cubic-bezier(.4,0,.2,1)" }}
      >
        <div className="bg-[#ffbe2a] px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md">
              <span className="text-[#ffbe2a] font-bold text-xl uppercase">
                {user.name?.charAt(0) || "?"}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-yellow-900 uppercase tracking-widest opacity-70">
                Customer Profile
              </p>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">{user.name}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/60 hover:bg-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-700" />
          </button>
        </div>

        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex items-start gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100"
            >
              <div className="mt-0.5 w-8 h-8 rounded-lg bg-[#ffbe2a]/20 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-[#c98f00]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
                <p className="text-sm font-semibold text-gray-800 truncate">{value || "—"}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 pb-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.94) translateY(10px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);     }
        }
      `}</style>
    </div>
  );
};

// ─── Self-contained Toggle Button ────────────────────────────────────────────
const ToggleButton = ({ user }) => {
  const resolveInitial = (u) => {
    if (typeof u.isActive === "boolean") return u.isActive;
    if (typeof u.active  === "boolean") return u.active;
    if (typeof u.status  === "string")  return u.status === "active";
    return false;
  };

  const [isActive, setIsActive] = useState(resolveInitial(user));
  const [loading,  setLoading]  = useState(false);
  const [errored,  setErrored]  = useState(false);

  const handleToggle = async () => {
    if (loading) return;
    const next = !isActive;
    setIsActive(next);
    setErrored(false);
    setLoading(true);

    try {
      const res  = await fetch(`${API_URL}/superadmin/toggle-active/${user.id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ isActive: next }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed");
    } catch (err) {
      console.error("Toggle error:", err);
      setIsActive(!next);
      setErrored(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        title={isActive ? "Click to Deactivate" : "Click to Activate"}
        className={`relative inline-flex h-6 w-12 shrink-0 items-center rounded-full border-2 border-transparent
          transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1
          ${loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
          ${isActive ? "bg-green-500 focus:ring-green-400" : "bg-gray-300 focus:ring-gray-400"}
        `}
      >
        {loading ? (
          <span className="absolute inset-0 flex items-center justify-center">
            <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </span>
        ) : (
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow
              ring-0 transition-transform duration-200
              ${isActive ? "translate-x-6" : "translate-x-0"}
            `}
          />
        )}
      </button>

      <span className={`text-xs font-semibold ${errored ? "text-red-500" : isActive ? "text-green-600" : "text-gray-400"}`}>
        {errored ? "Failed!" : isActive ? "Active" : "Inactive"}
      </span>
    </div>
  );
};

// ─── Package Filter Dropdown ──────────────────────────────────────────────────
const PACKAGE_OPTIONS = ["All", "Basic", "Premium", "Advanced","Free"];

const PackageFilter = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all
          ${value !== "All"
            ? "border-[#ffbe2a] bg-[#ffbe2a]/10 text-[#8a6200]"
            : "border-gray-200 bg-white text-gray-600 hover:border-[#ffbe2a] hover:bg-[#ffbe2a]/5"
          }`}
      >
        <Filter className="w-4 h-4" />
        <span>{value === "All" ? "Package" : value}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-44 bg-white border-2 border-[#ffbe2a] rounded-xl shadow-lg z-20 overflow-hidden">
            {PACKAGE_OPTIONS.map((pkg) => (
              <button
                key={pkg}
                type="button"
                onClick={() => { onChange(pkg); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors
                  ${value === pkg
                    ? "bg-[#ffbe2a] text-gray-900"
                    : "text-gray-700 hover:bg-[#ffbe2a]/15"
                  }`}
              >
                {pkg === "All" ? "All Packages" : pkg}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Search & Filter Bar ──────────────────────────────────────────────────────
const SearchFilterBar = ({ searchQuery, onSearchChange, packageFilter, onPackageChange, totalCount, filteredCount }) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by name, email, phone, company, city…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border-2 border-gray-200 focus:border-[#ffbe2a] focus:outline-none text-sm text-gray-800 placeholder-gray-400 bg-white transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
          >
            <X className="w-3 h-3 text-gray-600" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">
          Showing{" "}
          <span className="font-bold text-gray-800">{filteredCount}</span>
          {filteredCount !== totalCount && (
            <> of <span className="font-bold text-gray-800">{totalCount}</span></>
          )}{" "}
          user{filteredCount !== 1 ? "s" : ""}
        </span>

        <PackageFilter value={packageFilter} onChange={onPackageChange} />
      </div>
    </div>
  );
};

// ─── Pagination ───────────────────────────────────────────────────────────────
const Pagination = ({ currentPage, totalPages, onPageChange, from, to, total }) => {
  if (totalPages <= 1) return null;

  // Build page number array with ellipsis logic
  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

    const pages = [];
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-1">
      {/* Info text */}
      <p className="text-sm text-gray-500 shrink-0">
        Showing <span className="font-semibold text-gray-800">{from}–{to}</span> of{" "}
        <span className="font-semibold text-gray-800">{total}</span> users
      </p>

      {/* Page controls */}
      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all border-2
            ${currentPage === 1
              ? "border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50"
              : "border-gray-200 text-gray-600 hover:border-[#ffbe2a] hover:bg-[#ffbe2a]/10 hover:text-[#8a6200]"
            }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, idx) =>
            page === "..." ? (
              <span key={`ellipsis-${idx}`} className="px-2 py-2 text-gray-400 text-sm select-none">
                …
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`min-w-[36px] px-2 py-2 rounded-lg text-sm font-semibold transition-all border-2
                  ${currentPage === page
                    ? "border-[#ffbe2a] bg-[#ffbe2a] text-gray-900 shadow-sm"
                    : "border-gray-200 text-gray-600 hover:border-[#ffbe2a] hover:bg-[#ffbe2a]/10 hover:text-[#8a6200]"
                  }`}
              >
                {page}
              </button>
            )
          )}
        </div>

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all border-2
            ${currentPage === totalPages
              ? "border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50"
              : "border-gray-200 text-gray-600 hover:border-[#ffbe2a] hover:bg-[#ffbe2a]/10 hover:text-[#8a6200]"
            }`}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ─── Main Table ───────────────────────────────────────────────────────────────
const UsersTable = ({ users, loading, onEdit, onDelete }) => {
  const [downloadingId, setDownloadingId] = useState(null);
  const [viewingUser,   setViewingUser]   = useState(null);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [packageFilter, setPackageFilter] = useState("All");
  const [currentPage,   setCurrentPage]   = useState(1);

  const getMemberCount = (user) => {
    if (user.package === "Free")    return "2";
    if (user.package === "Basic") return "5";
    if (user.package === "Premium")     return "10";
    return user.customMembers || "N/A";
  };

  // ── Filtered users ──
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter((u) => {
      const matchSearch =
        !q ||
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phoneNumber?.toLowerCase().includes(q) ||
        u.company?.name?.toLowerCase().includes(q) ||
        u.city?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q);

      const matchPackage =
        packageFilter === "All" || (u.package || "N/A") === packageFilter;

      return matchSearch && matchPackage;
    });
  }, [users, searchQuery, packageFilter]);

  // ── Reset to page 1 whenever filters change ──
  const handleSearchChange = (val) => { setSearchQuery(val); setCurrentPage(1); };
  const handlePackageChange = (val) => { setPackageFilter(val); setCurrentPage(1); };

  // ── Pagination calculations ──
  const totalPages  = Math.max(1, Math.ceil(filteredUsers.length / ROWS_PER_PAGE));
  const safePage    = Math.min(currentPage, totalPages);
  const startIndex  = (safePage - 1) * ROWS_PER_PAGE;
  const endIndex    = startIndex + ROWS_PER_PAGE;
  const pagedUsers  = filteredUsers.slice(startIndex, endIndex);

  const fromRow = filteredUsers.length === 0 ? 0 : startIndex + 1;
  const toRow   = Math.min(endIndex, filteredUsers.length);

  const handleDownload = async (user) => {
    setDownloadingId(user.id);
    try {
      const token = getExportToken();
      const response = await fetch(`${API_URL}/superadmin/users/${user.id}/export`, {
        method:  "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Download failed");
      }

      const blob     = await response.blob();
      const url      = URL.createObjectURL(blob);
      const a        = document.createElement("a");
      const safeName = (user.name || "user").replace(/[^a-z0-9]/gi, "_");
      a.href         = url;
      a.download     = `${safeName}_data_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      showToast(`Failed to download data: ${error.message}`, "error");
    } finally {
      setDownloadingId(null);
    }
  };

  const headers = ["Name", "Email", "Phone", "Role", "Company", "City", "Package", "Members", "Activate", "Actions"];
  const hasActiveFilters = packageFilter !== "All" || searchQuery.trim();

  return (
    <>
      {viewingUser && (
        <ViewUserModal user={viewingUser} onClose={() => setViewingUser(null)} />
      )}

      {/* ── Search & Filter Bar ── */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        packageFilter={packageFilter}
        onPackageChange={handlePackageChange}
        totalCount={users.length}
        filteredCount={filteredUsers.length}
      />

      {/* ── Active Filter Chips ── */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Active filters:</span>

          {searchQuery.trim() && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
              <Search className="w-3 h-3" />
              "{searchQuery.trim()}"
              <button onClick={() => handleSearchChange("")} className="hover:text-blue-900 ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {packageFilter !== "All" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffbe2a]/20 border border-[#ffbe2a] text-[#7a5a00] text-xs font-semibold">
              <Package className="w-3 h-3" />
              Package: {packageFilter}
              <button onClick={() => handlePackageChange("All")} className="hover:text-[#4a3200] ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            onClick={() => { handleSearchChange(""); handlePackageChange("All"); }}
            className="text-xs text-gray-400 hover:text-red-500 font-semibold underline transition-colors ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white shadow-md overflow-x-auto">
        <table className="border w-full">
          <thead className="bg-gray-100">
            <tr>
              {headers.map((h) => (
                <th
                  key={h}
                  className="border-2 border-[#ffbe2a] p-3 text-left font-semibold text-gray-700"
                >
                  <div className="flex items-center gap-1.5">
                    {h}
                    {h === "Package" && packageFilter !== "All" && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#ffbe2a] text-[10px] font-bold text-gray-900 leading-none">
                        {packageFilter}
                        <button
                          onClick={() => handlePackageChange("All")}
                          className="hover:opacity-70 transition-opacity"
                          title="Clear package filter"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    )}
                    {h === "Name" && searchQuery.trim() && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-blue-100 text-[10px] font-bold text-blue-700 leading-none">
                        <Search className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={headers.length} className="border-2 border-[#ffbe2a] p-8 text-center">
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin h-8 w-8 text-[#ffbe2a]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="ml-3 text-gray-600">Loading users...</span>
                  </div>
                </td>
              </tr>
            ) : pagedUsers.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="border-2 border-[#ffbe2a] p-8 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <Search className="w-10 h-10 opacity-30" />
                    <p className="text-base font-semibold">No users match your filters</p>
                    <button
                      onClick={() => { handleSearchChange(""); handlePackageChange("All"); }}
                      className="mt-1 text-sm text-[#c98f00] hover:underline font-semibold"
                    >
                      Clear filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              pagedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="border-2 border-[#ffbe2a] p-3">{user.name}</td>
                  <td className="border-2 border-[#ffbe2a] p-3">{user.email}</td>
                  <td className="border-2 border-[#ffbe2a] p-3">{user.phoneNumber}</td>
                  <td className="border-2 border-[#ffbe2a] p-3">{user.role.replace("_", " ")}</td>
                  <td className="border-2 border-[#ffbe2a] p-3">{user.company?.name || "N/A"}</td>
                  <td className="border-2 border-[#ffbe2a] p-3">{user.city}</td>
                  <td className="border-2 border-[#ffbe2a] p-3">
                    {user.package ? (
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-bold
                        ${user.package === "Premium"  ? "bg-purple-100 text-purple-700" :
                          user.package === "Basic"    ? "bg-blue-100 text-blue-700"    :
                          user.package === "Advanced" ? "bg-emerald-100 text-emerald-700" :
                                                       "bg-gray-100 text-gray-600"}`}
                      >
                        {user.package}
                      </span>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="border-2 border-[#ffbe2a] p-3">{getMemberCount(user)}</td>

                  <td className="border-2 border-[#ffbe2a] p-3 text-center">
                    <ToggleButton user={user} />
                  </td>

                  <td className="border-2 border-[#ffbe2a] p-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setViewingUser(user)}
                        className="p-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition-colors"
                        title="View User Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onEdit(user)}
                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        title="Edit User"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onDelete(user)}
                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDownload(user)}
                        disabled={downloadingId === user.id}
                        className={`p-2 text-white rounded-lg transition-colors flex items-center justify-center ${
                          downloadingId === user.id ? "bg-green-300 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"
                        }`}
                        title="Download User Data as Excel"
                      >
                        {downloadingId === user.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      <Pagination
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        from={fromRow}
        to={toRow}
        total={filteredUsers.length}
      />
    </>
  );
};

export default UsersTable;
