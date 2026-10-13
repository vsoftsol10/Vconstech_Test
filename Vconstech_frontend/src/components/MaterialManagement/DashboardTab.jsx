import React, { useState, useEffect, useRef } from "react";
// import {
//   Package, TrendingUp,IndianRupee,ClipboardList,Loader2,  Plus, X,Search,Filter,Calendar,ChevronDown, Check,
// } from "lucide-react";
import {
  Package, TrendingUp, IndianRupee, ClipboardList, Loader2, Plus, X,
  Search, Filter, Calendar, ChevronDown, Check,
  ArrowUp, ArrowDown,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { materialAPI, materialRequestAPI } from "../../api/materialAPI";
import { projectAPI } from "../../api/projectAPI";
// import Pagination from "../../components/common/Pagination";
import { getTodayDateInputValue } from "../../utils/formValidation";
import Pagination, { DEFAULT_PAGE_SIZE } from "../../components/common/Pagination";
import { showToast } from '../common/Toast';

const ROWS_PER_PAGE = 8;

const EmployeeModalMaterial = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-screen overflow-y-auto shadow-lg">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

const emptyMaterial = {
  requestType: 'global',
  projectId: '',
  name: '',
  category: '',
  unit: 'piece',
  defaultRate: '',
  quantityNeeded: '',
  vendor: '',
  description: '',
  dueDate: ''
};

const inputClass = "w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-black placeholder-gray-500 font-normal";

const StatCard = ({ icon: Icon, iconBg, iconColor, label, value, sublabel, sparklineColor, sparklinePoints }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-3.5">
    <div className="flex items-center justify-between mb-2">
      <span className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </span>
    </div>
    <div className="flex items-baseline gap-2">
      <p className="text-xl sm:text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs font-medium text-gray-500">{label}</p>
    </div>
    <p className="text-[11px] text-gray-400">{sublabel}</p>
  </div>
);

const getMetricNumber = (metrics, keys) => {
  const value = keys.map((key) => metrics?.[key]).find((item) => item !== undefined && item !== null);
  return Number(value || 0);
};

const getLogCost = (log) => {
  const explicitCost = log.totalCost ?? log.cost ?? log.amount ?? log.totalAmount;
  if (explicitCost !== undefined && explicitCost !== null) return Number(explicitCost || 0);

  const quantity = Number(log.quantity || log.used || 0);
  const rate = Number(log.rate || log.defaultRate || log.unitRate || log.price || 0);
  return quantity * rate;
};

const getUsageYear = (log) => {
  const rawDate = log.date || log.createdAt || log.updatedAt;
  const date = rawDate ? new Date(rawDate) : null;
  return date && !Number.isNaN(date.getTime()) ? String(date.getFullYear()) : null;
};

const formatIndianCurrency = (value, compact = false) => {
  const amount = Number(value || 0);
  if (!compact) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  if (amount >= 100000) {
    const lakhValue = amount / 100000;
    return `\u20B9${Number.isInteger(lakhValue) ? lakhValue : lakhValue.toFixed(1)}L`;
  }

  if (amount >= 1000) {
    const thousandValue = amount / 1000;
    return `\u20B9${Number.isInteger(thousandValue) ? thousandValue : thousandValue.toFixed(1)}K`;
  }

  return `\u20B9${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

const getNiceAxis = (maxValue, fallbackStep = 1) => {
  const max = Number(maxValue || 0);
  if (max <= 0) {
    return {
      domain: [0, fallbackStep * 4],
      ticks: Array.from({ length: 5 }, (_, index) => fallbackStep * index),
    };
  }

  const roughStep = max / 4;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / magnitude;
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  const step = niceNormalized * magnitude;
  const upper = step * Math.ceil(max / step);

  return {
    domain: [0, upper],
    ticks: Array.from({ length: 5 }, (_, index) => step * index),
  };
};

const buildMaterialTrendData = (metrics = {}, usageLogs = []) => {
  const totalCost = getMetricNumber(metrics, ['totalCost', 'cost', 'usedCost']);
  const yearly = new Map();
  let explicitCostTotal = 0;
  let totalQuantity = 0;

  (usageLogs || []).forEach((log) => {
    const year = getUsageYear(log);
    if (!year) return;

    const current = yearly.get(year) || {
      year,
      quantity: 0,
      cost: 0,
    };

    const quantity = Number(log.quantity || log.used || log.quantityUsed || 0);
    const cost = getLogCost(log);

    current.quantity += quantity;
    current.cost += cost;
    totalQuantity += quantity;
    explicitCostTotal += cost;
    yearly.set(year, current);
  });

  const trendData = Array.from(yearly.values())
    .sort((a, b) => Number(a.year) - Number(b.year))
    .map((item) => ({
      year: item.year,
      quantity: item.quantity,
      cost: item.cost,
    }));

  if (explicitCostTotal <= 0 && totalCost > 0 && totalQuantity > 0) {
    trendData.forEach((item) => {
      item.cost = (item.quantity / totalQuantity) * totalCost;
    });
  }

  if (trendData.length > 0) return trendData;
  if (totalCost > 0) {
    return [{
      year: String(new Date().getFullYear()),
      quantity: getMetricNumber(metrics, ['usedQuantity', 'totalQuantity', 'quantityUsed', 'quantity']),
      cost: totalCost,
    }];
  }

  return [];
};

const MaterialTrendsChart = ({ metrics, usageLogs }) => {
  const trendData = buildMaterialTrendData(metrics, usageLogs);
  const hasData = trendData.length > 0;
  const quantityAxis = getNiceAxis(Math.max(...trendData.map((item) => item.quantity), 0));
  const costAxis = getNiceAxis(Math.max(...trendData.map((item) => item.cost), 0), 25000);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">Material Trends</h2>
      </div>

      {!hasData ? (
        <div className="h-[280px] flex items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-sm font-medium text-gray-500">
          No material data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trendData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
              domain={quantityAxis.domain}
              ticks={quantityAxis.ticks}
              label={{ value: 'Material Quantity', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#000000' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
              domain={costAxis.domain}
              ticks={costAxis.ticks}
              tickFormatter={(v) => formatIndianCurrency(v, true)}
              label={{ value: 'Material Cost (\u20B9)', angle: 90, position: 'insideRight', fontSize: 11, fill: '#FFBE2A' }}
            />
            <Tooltip formatter={(value, name) => name === 'cost' ? [formatIndianCurrency(value), 'Material Cost'] : [value, 'Material Quantity']} />
            <Legend
              formatter={(value) => (value === 'quantity' ? 'Material Quantity' : 'Material Cost')}
              wrapperStyle={{ fontSize: 13 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="quantity"
              stroke="#000000"
              strokeWidth={3}
              dot={{ r: 4, fill: '#000000' }}
              activeDot={{ r: 6 }}
            >
              <LabelList dataKey="quantity" position="top" fontSize={11} fill="#000000" />
            </Line>
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cost"
              stroke="#FFBE2A"
              strokeWidth={3}
              dot={{ r: 4, fill: '#FFBE2A' }}
              activeDot={{ r: 6 }}
            >
              <LabelList dataKey="cost" position="top" fontSize={11} fill="#FFBE2A" formatter={(v) => formatIndianCurrency(v, true)} />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      )}
      <p className="text-[11px] text-gray-400 mt-2">
        Values are based on the material dashboard data returned by the backend.
      </p>
    </div>
  );
};

const DashboardTab = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    metrics: { totalMaterials: 0, activeMaterials: 0, totalCost: 0, pendingRequests: 0 },
    usageLogs: []
  });

  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState(emptyMaterial);
  const [searchTerm, setSearchTerm] = useState('');

  // const [usageLogsPage, setUsageLogsPage] = useState(1);
const [usageLogsPage, setUsageLogsPage] = useState(1);
const [usageLogsPageSize, setUsageLogsPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [projectFilter, setProjectFilter] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [appliedDateFrom, setAppliedDateFrom] = useState("");
  const [appliedDateTo, setAppliedDateTo] = useState("");
  const [isDateOpen, setIsDateOpen] = useState(false);
  const dateRef = useRef(null);

  const units = ['piece', 'kg', 'liters', 'sq ft', 'boxes', 'meters', 'bags'];

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role);
    fetchDashboardData();
    fetchProjects();
  }, []);

  useEffect(() => {
    setUsageLogsPage(1);
  }, [searchTerm, projectFilter, appliedDateFrom, appliedDateTo, dashboardData.usageLogs.length]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
      if (dateRef.current && !dateRef.current.contains(event.target)) {
        setIsDateOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);
      const result = await projectAPI.getProjectSelectorOptions();
      const mappedProjects = result.projects?.map(p => ({ id: p.id, name: p.projectName || p.name })) || [];
      setProjects(mappedProjects);
    } catch (err) {
      console.error(' Error fetching projects:', err);
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await materialAPI.getDashboardData();
      setDashboardData(data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.error || err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitMaterial = async () => {
    try {
      setSubmitting(true);
      if (userRole === 'ADMIN' || userRole === 'Admin') {
        if (newMaterial.requestType === 'global') {
          await materialAPI.create(newMaterial);
          showToast('Global material added successfully!', 'success');
        } else {
          const materialResult = await materialAPI.create(newMaterial);
          await materialAPI.addToProject({
            materialId: materialResult.material.id,
            projectId: newMaterial.projectId,
            quantityNeeded: newMaterial.quantityNeeded
          });
          showToast('Project-specific material added successfully!', 'success');
        }
      } else {
        await materialRequestAPI.create(newMaterial);
        showToast('Material request submitted successfully! Waiting for admin approval.', 'success');
      }
      setNewMaterial(emptyMaterial);
      setShowAddMaterial(false);
      fetchDashboardData();
    } catch (err) {
      console.error(' Failed to add material:', err);
      const errorMsg = err.details
        ? `${err.error}\n\nDetails: ${JSON.stringify(err.details, null, 2)}`
        : (err.error || err.message || 'Unknown error occurred');
      showToast(`Failed to add material:\n\n${errorMsg}`, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
        <span className="ml-3 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-800 font-medium">Error loading dashboard</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button onClick={fetchDashboardData} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { metrics, usageLogs } = dashboardData;

  const usageProjectNames = [
    ...new Set(usageLogs.map((log) => log.projectName).filter(Boolean)),
  ];

  const filteredUsageLogs = usageLogs
    .filter((log) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        log.materialName?.toLowerCase().includes(term) ||
        log.projectName?.toLowerCase().includes(term)
      );
    })
    .filter((log) => {
      if (projectFilter === "All") return true;
      return log.projectName === projectFilter;
    })
    .filter((log) => {
      if (!appliedDateFrom && !appliedDateTo) return true;
      if (!log.date) return false;
      const logDate = new Date(log.date);
      if (appliedDateFrom && logDate < new Date(appliedDateFrom)) return false;
      if (appliedDateTo) {
        const toEnd = new Date(appliedDateTo);
        toEnd.setHours(23, 59, 59, 999);
        if (logDate > toEnd) return false;
      }
      return true;
    });

 const paginatedUsageLogs = filteredUsageLogs.slice(
  (usageLogsPage - 1) * usageLogsPageSize,
  usageLogsPage * usageLogsPageSize
);

  const formatShort = (isoDate) =>
    new Date(isoDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const dateRangeLabel =
    appliedDateFrom && appliedDateTo
      ? `${formatShort(appliedDateFrom)} - ${formatShort(appliedDateTo)}`
      : appliedDateFrom
      ? `From ${formatShort(appliedDateFrom)}`
      : appliedDateTo
      ? `Until ${formatShort(appliedDateTo)}`
      : "Date Range";

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">

      {/* Add Material row */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <span className="text-sm text-gray-600 leading-relaxed sm:max-w-[70%]">
          {userRole === 'ADMIN'
            ? 'Add materials directly to the database'
            : 'Submit material requests for admin approval'}
        </span>

        <button
          onClick={() => setShowAddMaterial(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-400 text-black rounded-xl font-semibold cursor-pointer transition-colors shadow-sm hover:bg-yellow-500 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Add Material
        </button>
      </div>

      {/* Search / Filter / Date row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search materials, category, or project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent shadow-sm"
          />
        </div>
        <div className="relative" ref={filterRef}>
          <button
            type="button"
            onClick={() => setIsFilterOpen((open) => !open)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 bg-white border rounded-xl text-sm font-medium transition-colors shadow-sm w-full sm:w-auto ${
              projectFilter !== "All"
                ? "border-yellow-400 text-yellow-800 bg-yellow-50"
                : "border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Filter className={`w-4 h-4 ${projectFilter !== "All" ? "text-yellow-600" : "text-gray-500"}`} />
            {projectFilter === "All" ? "Filter" : projectFilter}
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {isFilterOpen && (
            <div className="absolute right-0 z-10 mt-1 w-56 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
              <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-50">
                Filter by Project
              </div>
              <div className="max-h-60 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => { setProjectFilter("All"); setIsFilterOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors ${
                    projectFilter === "All"
                      ? "bg-yellow-50 text-yellow-800 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  All Projects
                  {projectFilter === "All" && <Check className="w-4 h-4 text-yellow-600" />}
                </button>
                {usageProjectNames.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-400">No projects found</div>
                ) : (
                  usageProjectNames.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => { setProjectFilter(name); setIsFilterOpen(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors ${
                        projectFilter === name
                          ? "bg-yellow-50 text-yellow-800 font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="truncate">{name}</span>
                      {projectFilter === name && <Check className="w-4 h-4 text-yellow-600 shrink-0" />}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={dateRef}>
          <button
            type="button"
            onClick={() => {
              setDateFrom(appliedDateFrom);
              setDateTo(appliedDateTo);
              setIsDateOpen((open) => !open);
            }}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 bg-white border rounded-xl text-sm font-medium transition-colors whitespace-nowrap shadow-sm w-full sm:w-auto ${
              appliedDateFrom || appliedDateTo
                ? "border-yellow-400 text-yellow-800 bg-yellow-50"
                : "border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Calendar className={`w-4 h-4 ${appliedDateFrom || appliedDateTo ? "text-yellow-600" : "text-gray-500"}`} />
            {dateRangeLabel}
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {isDateOpen && (
            <div className="absolute right-0 z-10 mt-1 w-72 bg-white border border-gray-100 rounded-xl shadow-lg p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Filter by Date
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                    setAppliedDateFrom("");
                    setAppliedDateTo("");
                    setIsDateOpen(false);
                  }}
                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAppliedDateFrom(dateFrom);
                    setAppliedDateTo(dateTo);
                    setIsDateOpen(false);
                  }}
                  className="flex-1 px-3 py-2 bg-yellow-400 text-black text-sm font-semibold rounded-xl shadow-sm hover:bg-yellow-500 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          icon={Package}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          label="Total Materials"
          value={metrics.totalMaterials}
          sublabel="All Materials"
          sparklineColor="#7c3aed"
          sparklinePoints="0,26 20,20 40,22 60,10 80,14 100,4"
        />
        <StatCard
          icon={TrendingUp}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          label="Active in Projects"
          value={metrics.activeMaterials}
          sublabel="Currently Used"
          sparklineColor="#16a34a"
          sparklinePoints="0,24 20,22 40,16 60,18 80,8 100,12"
        />
        <StatCard
          icon={IndianRupee}
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
          label="Total Cost (Used)"
          value={formatIndianCurrency(metrics.totalCost)}
          sublabel="This Period"
          sparklineColor="#f97316"
          sparklinePoints="0,22 20,24 40,14 60,20 80,10 100,6"
        />
        <StatCard
          icon={ClipboardList}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          label="Pending Requests"
          value={metrics.pendingRequests ?? 0}
          sublabel="Awaiting Approval"
          sparklineColor="#2563eb"
          sparklinePoints="0,28 20,20 40,22 60,12 80,16 100,4"
        />
      </div>

      {/* Material Status Chart */}
      <MaterialTrendsChart metrics={metrics} usageLogs={usageLogs} />

      {/* Recent Material Usage Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Recent Material Usage</h2>
          
        </div>
        {filteredUsageLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No material usage recorded yet</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-yellow-400">
                  <tr>
                    {['Material', 'Project', 'Quantity', 'Unit', 'Used By', 'Date & Time'].map(h => (
                      <th key={h} className="px-4 sm:px-6 py-3 text-left font-bold text-black text-xs uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {paginatedUsageLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-gray-800 font-medium">{log.materialName}</td>
                      <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-yellow-700 hover:underline cursor-pointer">{log.projectName}</td>
                      <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-gray-600">{log.quantity}</td>
                      <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-gray-600">{log.unit}</td>
                      <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-gray-600">{log.userName}</td>
                      <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-gray-500">
                        {new Date(log.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {log.date && `, ${new Date(log.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          <Pagination
  currentPage={usageLogsPage}
  totalItems={filteredUsageLogs.length}
  pageSize={usageLogsPageSize}
  onPageChange={setUsageLogsPage}
  onPageSizeChange={setUsageLogsPageSize}
/>
          </>
        )}
      </div>

      {/* Add Material Modal */}
      <EmployeeModalMaterial
        isOpen={showAddMaterial}
        onClose={() => { setShowAddMaterial(false); setNewMaterial(emptyMaterial); }}
        title={
          userRole === 'ADMIN'
            ? (newMaterial.requestType === 'global' ? 'Add New Global Material' : 'Add Project-Specific Material')
            : (newMaterial.requestType === 'global' ? 'New Global Material' : 'Request Project-Specific Material')
        }
        footer={
          <>
            <button
              onClick={() => setShowAddMaterial(false)}
              className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitMaterial}
              disabled={
                !newMaterial.name ||
                !newMaterial.category ||
                (newMaterial.requestType === 'global'
                  ? (!newMaterial.defaultRate || !newMaterial.quantityNeeded)
                  : (!newMaterial.defaultRate || !newMaterial.quantityNeeded || !newMaterial.projectId)) ||
                submitting
              }
              className="px-6 py-2 bg-yellow-400 text-black font-semibold rounded-xl hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              Add Material
            </button>
          </>
        }
      >
        <div className="space-y-4">

          {/* Request Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Request Type</label>
            <div className="flex items-center gap-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="requestType"
                  value="global"
                  checked={newMaterial.requestType === 'global'}
                  onChange={(e) => setNewMaterial({...newMaterial, requestType: e.target.value, projectId: '', quantityNeeded: ''})}
                  className="w-4 h-4 text-yellow-500 focus:ring-yellow-400"
                />
                <span className="ml-2 text-sm text-gray-700">Global Material (Available for all projects)</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="requestType"
                  value="project"
                  checked={newMaterial.requestType === 'project'}
                  onChange={(e) => setNewMaterial({...newMaterial, requestType: e.target.value})}
                  className="w-4 h-4 text-yellow-500 focus:ring-yellow-400"
                />
                <span className="ml-2 text-sm text-gray-700">Project-Specific Material</span>
              </label>
            </div>
          </div>

          {/* Project Dropdown */}
          {newMaterial.requestType === 'project' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project <span className="text-red-500">*</span>
              </label>
              {loadingProjects ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading projects...</span>
                </div>
              ) : (
                <select
                  value={newMaterial.projectId}
                  onChange={(e) => setNewMaterial({...newMaterial, projectId: e.target.value})}
                  className={inputClass}
                >
                  <option value="">Select Project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Material Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Material Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newMaterial.name}
              onChange={(e) => setNewMaterial({...newMaterial, name: e.target.value})}
              className={inputClass}
              placeholder="e.g., Asian Paints Premium"
            />
          </div>

          {/* Category and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newMaterial.category}
                onChange={(e) => setNewMaterial({...newMaterial, category: e.target.value})}
                className={inputClass}
                placeholder="Paint"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
              <select
                value={newMaterial.unit}
                onChange={(e) => setNewMaterial({...newMaterial, unit: e.target.value})}
                className={inputClass}
              >
                {units.map(unit => (
                  <option key={unit} value={unit}>{unit.charAt(0).toUpperCase() + unit.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Default Rate / Project Price and Quantity Needed */}
          {newMaterial.requestType === 'global' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Rate (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={newMaterial.defaultRate}
                  onChange={(e) => setNewMaterial({...newMaterial, defaultRate: e.target.value})}
                  className={inputClass}
                  placeholder="450"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={newMaterial.quantityNeeded}
                  onChange={(e) => setNewMaterial({...newMaterial, quantityNeeded: e.target.value})}
                  className={inputClass}
                  placeholder="100"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Material Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={newMaterial.defaultRate}
                  onChange={(e) => setNewMaterial({...newMaterial, defaultRate: e.target.value})}
                  className={inputClass}
                  placeholder="450"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity Needed <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={newMaterial.quantityNeeded}
                  onChange={(e) => setNewMaterial({...newMaterial, quantityNeeded: e.target.value})}
                  className={inputClass}
                  placeholder="100"
                />
              </div>
            </div>
          )}

          {/* Vendor/Supplier and Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Vendor/Supplier</label>
              <input
                type="text"
                value={newMaterial.vendor}
                onChange={(e) => setNewMaterial({...newMaterial, vendor: e.target.value})}
                className={inputClass}
                placeholder="e.g., Asian Paints"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
              <input
                type="date"
                value={newMaterial.dueDate}
                min={getTodayDateInputValue()}
                onChange={(e) => setNewMaterial({...newMaterial, dueDate: e.target.value})}
                className={inputClass}
              />
            </div>
          </div>

          {/* Description/Remarks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description/Remarks</label>
            <textarea
              value={newMaterial.description}
              onChange={(e) => setNewMaterial({...newMaterial, description: e.target.value})}
              rows="3"
              className={inputClass}
              placeholder="Additional details about the material.."
            />
          </div>

        </div>
      </EmployeeModalMaterial>
    </div>
  );
};

export default DashboardTab;
