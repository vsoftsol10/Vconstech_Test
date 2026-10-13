import React, { useState, useEffect } from 'react';
import {
  Edit2, Printer, Plus, Save, X, Trash2,
  Eye, Search, Filter, ArrowUpDown,
  FileText, Building2, Download, FileSpreadsheet, FolderOpen, BarChart3, Coins, PieChart
} from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import SidePannel from '../../components/common/SidePannel';
import { financialAPI } from '../../api/financialAPI';
import LoadingScreen from '../../components/common/Loadingscreen';

import { showToast } from '../../components/common/Toast';
import { focusFirstInvalidField, validateFields } from '../../utils/formValidation';

/* -- Pagination helper -- */
const getPaginationItems = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '...', current - 1, current, current + 1, '...', total];
};

/* -- Status badge -- */
const StatusBadge = ({ status }) => {
  const cfg = {
    Active:    'bg-green-100 text-green-700',
    Planning:  'bg-blue-100 text-blue-700',
    'On Hold': 'bg-orange-100 text-orange-700',
    Completed: 'bg-purple-100 text-purple-700',
  }[status] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cfg}`}>{status || 'Active'}</span>
  );
};

const FinancialManagement = () => {
  const [projects, setProjects]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [searchQuery, setSearchQuery]         = useState('');
  const [showFilterDrop, setShowFilterDrop]   = useState(false);
  const [showDateSortDrop, setShowDateSortDrop] = useState(false);
  const [filterStatus, setFilterStatus]       = useState('all');
  const [dueDateRange, setDueDateRange]       = useState({ from: '', to: '' });

  /* pagination */
  const [currentPage, setCurrentPage]         = useState(1);
  const [rowsPerPage, setRowsPerPage]         = useState(10);

  /* right drawer */
  const [drawerProject, setDrawerProject]     = useState(null);

  /* expense state */
  const [editingExpense, setEditingExpense]   = useState(null);
  const [addingExpense, setAddingExpense]     = useState(false);
  const [newExpense, setNewExpense]           = useState({ amount: '', category: '' });
  const [expenseErrors, setExpenseErrors]     = useState({});
  const [editExpenseErrors, setEditExpenseErrors] = useState({});
  const [downloadingReport, setDownloadingReport] = useState(null);

  useEffect(() => {
    document.title = 'Vconstech - Admin';
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await financialAPI.getProjects();
      setProjects(response.projects || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
      showToast(`Error loading projects: ${error.error || error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  /* -- helpers -- */
  const getProjectBudgetSummary = (project) => {
    const summary = project?.budgetSummary || {};
    const totalBudget = Number(summary.totalBudget ?? project?.totalBudget ?? project?.budget ?? project?.quotationAmount ?? 0);
    const totalSpent = Number(summary.totalSpent ?? project?.totalSpent ?? 0);

    return {
      totalBudget,
      totalSpent,
      materialCost: Number(summary.materialCost ?? project?.materialCost ?? summary.breakdown?.materialCost ?? 0),
      labourCost: Number(summary.labourCost ?? project?.labourCost ?? summary.breakdown?.labourCost ?? 0),
      contractCost: Number(summary.contractCost ?? project?.contractCost ?? summary.breakdown?.contractAmount ?? 0),
      expenseCost: Number(summary.expenseCost ?? project?.expenseCost ?? summary.breakdown?.expenseCost ?? summary.breakdown?.financialExpenses ?? 0),
      remainingBudget: Number(summary.remainingBudget ?? project?.remainingBudget ?? (totalBudget - totalSpent)),
    };
  };

  const getAvailableBudgetForExpense = (project, existingExpenseId = null) => {
    const budgetSummary = getProjectBudgetSummary(project);
    const existingExpense = existingExpenseId
      ? (project?.expenses || []).find((expense) => String(expense.id || expense._id) === String(existingExpenseId))
      : null;

    return budgetSummary.remainingBudget + Number(existingExpense?.amount || 0);
  };

  const exceedsProjectBudget = (project, nextAmount, existingExpenseId = null) => {
    const availableBudget = getAvailableBudgetForExpense(project, existingExpenseId);
    return Number(nextAmount || 0) > availableBudget;
  };

  const getProjectStatus = (project) =>
    project.status || 'Active';

  const fmtCurrency = (v) =>
    `Rs.${Number(v || 0).toLocaleString('en-IN')}`;

  const fmtDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  /* -- filtered + paginated -- */
  const filteredProjects = projects.filter((p) => {
    const matchSearch = String(p.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = filterStatus === 'all' || getProjectStatus(p) === filterStatus;
    const dueDate = p.dueDate ? new Date(p.dueDate).toISOString().slice(0, 10) : '';
    const matchFrom = !dueDateRange.from || (dueDate && dueDate >= dueDateRange.from);
    const matchTo = !dueDateRange.to || (dueDate && dueDate <= dueDateRange.to);
    return matchSearch && matchFilter && matchFrom && matchTo;
  }).sort((a, b) => {
    const dateA = a.dueDate ? new Date(a.dueDate).getTime() : NaN;
    const dateB = b.dueDate ? new Date(b.dueDate).getTime() : NaN;
    if (Number.isNaN(dateA)) return Number.isNaN(dateB) ? 0 : 1;
    if (Number.isNaN(dateB)) return -1;
    return dateA - dateB;
  });

  // The dashboard cards intentionally use the same result set as the table so
  // searching or choosing a status gives an immediately useful financial roll-up.
  const filteredSummary = filteredProjects.reduce((summary, project) => {
    const projectSummary = getProjectBudgetSummary(project);
    summary.totalBudget += projectSummary.totalBudget;
    summary.remainingBudget += projectSummary.remainingBudget;
    if (getProjectStatus(project) === 'Active') summary.activeProjects += 1;
    return summary;
  }, { totalBudget: 0, remainingBudget: 0, activeProjects: 0 });

  const totalPages  = Math.max(1, Math.ceil(filteredProjects.length / rowsPerPage));
  const startIdx    = (currentPage - 1) * rowsPerPage;
  const endIdx      = Math.min(startIdx + rowsPerPage, filteredProjects.length);
  const pageProjects = filteredProjects.slice(startIdx, endIdx);

  const handleRowsPerPageChange = (val) => {
    setRowsPerPage(Number(val));
    setCurrentPage(1);
  };

  /* -- drawer open/close -- */
  const openDrawer = async (project) => {
    setDrawerProject(project);
    setAddingExpense(false);
    setEditingExpense(null);
    setNewExpense({ amount: '', category: '' });
    try {
      const response = await financialAPI.getProjectById(project.id);
      if (response.project) setDrawerProject(response.project);
    } catch (error) {
      showToast(`Could not load the full finance history: ${error.error || error.message}`, 'error');
    }
  };
  const closeDrawer = () => {
    setDrawerProject(null);
    setEditingExpense(null);
    setAddingExpense(false);
  };

  /* sync drawer project when projects reload */
  useEffect(() => {
    if (drawerProject) {
      const updated = projects.find(p => p.id === drawerProject.id);
      if (updated) setDrawerProject(updated);
    }
  }, [projects]);

  /* -- expense handlers (backend unchanged) -- */
  const refreshProjectFinance = async (projectId) => {
    const projectResponse = await financialAPI.getProjectById(projectId);
    const updatedProject = projectResponse.project;

    if (updatedProject) {
      setProjects((prev) => prev.map((project) => (
        project.id === projectId ? updatedProject : project
      )));
      setDrawerProject(updatedProject);
    }

    return updatedProject;
  };

  const handleSaveExpense = async () => {
    const errors = validateFields([
      { name: 'editExpenseAmount', value: editingExpense.amount, label: 'Amount', rules: ['amount'] },
    ]);
    setEditExpenseErrors(errors);
    if (Object.keys(errors).length) {
      focusFirstInvalidField(errors);
      return;
    }

    const nextAmount = parseFloat(editingExpense.amount);
    if (exceedsProjectBudget(drawerProject, nextAmount, editingExpense.id)) {
      showToast('Expense exceeds the remaining project budget.', 'warning');
      return;
    }

    try {
      await financialAPI.updateExpense(editingExpense.id, {
        amount: nextAmount,
      });
      await refreshProjectFinance(editingExpense.projectId || drawerProject.id);
      setEditingExpense(null);
      setEditExpenseErrors({});
      showToast('Expense updated successfully!', 'success');
    } catch (error) {
      showToast(`Error: ${error.error || error.message}`, "error");
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      const response = await financialAPI.deleteExpense(expenseId);
      await refreshProjectFinance(response.projectId || drawerProject.id);
      showToast('Expense deleted successfully!', 'success');
    } catch (error) {
      showToast(`Error: ${error.error || error.message}`, "error");
    }
  };

  const handleAddExpense = async () => {
    const errors = validateFields([
      { name: 'expenseCategory', value: newExpense.category, label: 'Expense Category', rules: ['required'] },
      { name: 'expenseAmount', value: newExpense.amount, label: 'Amount', rules: ['amount'] },
    ]);
    setExpenseErrors(errors);
    if (Object.keys(errors).length) {
      focusFirstInvalidField(errors);
      return;
    }
    const newAmount   = parseFloat(newExpense.amount);
    if (exceedsProjectBudget(drawerProject, newAmount)) {
      showToast('Expense exceeds the remaining project budget.', 'warning');
      return;
    }
    await addExpenseToProject(drawerProject.id);
  };

  const addExpenseToProject = async (projectId) => {
    try {
      await financialAPI.addExpense(projectId, {
        category: newExpense.category,
        amount: parseFloat(newExpense.amount),
      });

      await refreshProjectFinance(projectId);

      setAddingExpense(false);
      setNewExpense({ amount: '', category: '' });
      setExpenseErrors({});
      showToast('Expense added successfully!', 'success');
    } catch (error) {
      showToast(`Error: ${error.error || error.message}`, "error");
    }
  };

  const handlePrint = (project) => {
    const printWindow = window.open('', '_blank');
    const budgetSummary = getProjectBudgetSummary(project);
    const totalSpent = budgetSummary.totalSpent;
    const remaining  = budgetSummary.remainingBudget;
    const generatedDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const expenseRows = (project.expenses || []).map((expense, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${expense.category || '--'}</td>
        <td>${fmtCurrency(expense.amount)}</td>
        <td><span class="status-pill">Paid</span></td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html><head><title>Financial Report - ${project.name}</title>
      <style>
        *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact;color-adjust:exact}
        html,body{background:#f3f4f6!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
        body{font-family:'Segoe UI',Arial,sans-serif;margin:0;background:#f3f4f6;color:#111827}
        .page{padding:32px}
        .report{background:#ffffff!important;border-radius:18px;overflow:hidden;box-shadow:0 18px 45px rgba(15,23,42,.12)}
        .hero{background:#111827!important;color:#ffffff!important;padding:28px 32px;display:flex;justify-content:space-between;gap:24px;align-items:flex-start;border-bottom:5px solid #ffbe2a}
        .brand{font-size:13px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#ffbe2a!important;margin-bottom:8px}
        h1{font-size:28px;margin:0 0 8px;font-weight:800}
        .muted{color:#d1d5db!important;font-size:13px;margin:0}
        .meta{background:#1f2937!important;border:1px solid #374151;border-radius:14px;padding:14px 16px;min-width:220px}
        .meta-row{display:flex;justify-content:space-between;gap:16px;font-size:12px;padding:4px 0}
        .meta-row span:first-child{color:#d1d5db!important}
        .meta-row span:last-child{font-weight:700;color:#ffffff!important}
        .content{padding:28px 32px}
        .section-title{font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#111827!important;border-left:4px solid #ffbe2a;padding-left:10px;margin:0 0 14px}
        .cards{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:28px}
        .card{background:#f9fafb!important;border:1px solid #e5e7eb;border-radius:14px;padding:16px}
        .card-label{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#6b7280!important;font-weight:700;margin-bottom:8px}
        .card-value{font-size:18px;font-weight:800;color:#111827!important}
        .positive{color:#059669!important}.negative{color:#dc2626!important}
        .project-box{background:#f9fafb!important;border:1px solid #e5e7eb;border-radius:14px;padding:16px;margin-bottom:28px}
        .project-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px 22px;font-size:13px}
        .label{color:#6b7280!important;font-weight:600}.value{font-weight:800;color:#111827!important}
        table{width:100%;border-collapse:separate;border-spacing:0;overflow:hidden;border:1px solid #e5e7eb;border-radius:14px}
        th{background:#111827!important;color:#ffbe2a!important;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.08em;padding:13px 14px}
        td{padding:13px 14px;border-top:1px solid #e5e7eb;font-size:13px}
        tbody tr:nth-child(even){background:#f9fafb!important}
        .status-pill{display:inline-block;background:#dcfce7!important;color:#166534!important;border-radius:999px;padding:4px 10px;font-size:11px;font-weight:800}
        .empty{padding:24px;text-align:center;color:#6b7280!important;background:#f9fafb!important;border:1px dashed #d1d5db;border-radius:14px}
        .footer{display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e5e7eb;margin-top:28px;padding-top:16px;color:#6b7280!important;font-size:12px}
        @media print{*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}body{background:#ffffff!important}.page{padding:0}.report{background:#ffffff!important;box-shadow:none;border-radius:0}.hero,th{background:#111827!important}.card,.project-box,.empty,tbody tr:nth-child(even){background:#f9fafb!important}.status-pill{background:#dcfce7!important}.footer:after{content:'Page ' counter(page)}}
      </style></head><body>
      <div class="page">
        <div class="report">
          <div class="hero">
            <div>
              <div class="brand">Vconstech ERP</div>
              <h1>Project Financial Report</h1>
              <p class="muted">Professional budget, quotation, and expense summary</p>
            </div>
            <div class="meta">
              <div class="meta-row"><span>Generated</span><span>${generatedDate}</span></div>
              <div class="meta-row"><span>Project</span><span>${project.name}</span></div>
              <div class="meta-row"><span>Due Date</span><span>${fmtDate(project.dueDate)}</span></div>
            </div>
          </div>
          <div class="content">
            <p class="section-title">Financial Summary</p>
            <div class="cards">
              <div class="card"><div class="card-label">Budget</div><div class="card-value">${fmtCurrency(project.budget)}</div></div>
              <div class="card"><div class="card-label">Quotation</div><div class="card-value">${fmtCurrency(project.quotationAmount)}</div></div>
              <div class="card"><div class="card-label">Total Spent</div><div class="card-value">${fmtCurrency(totalSpent)}</div></div>
              <div class="card"><div class="card-label">Remaining</div><div class="card-value ${remaining >= 0 ? 'positive' : 'negative'}">${fmtCurrency(remaining)}</div></div>
            </div>
            <p class="section-title">Project Details</p>
            <div class="project-box">
              <div class="project-grid">
                <div><span class="label">Project Name</span><div class="value">${project.name}</div></div>
                <div><span class="label">Status</span><div class="value">${project.status || 'Active'}</div></div>
                <div><span class="label">Due Date</span><div class="value">${fmtDate(project.dueDate)}</div></div>
                <div><span class="label">Expenses</span><div class="value">${(project.expenses || []).length}</div></div>
              </div>
            </div>
            <p class="section-title">Expense Breakdown</p>
            ${(project.expenses || []).length > 0 ? `
              <table>
                <thead><tr><th>#</th><th>Expense</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>${expenseRows}</tbody>
              </table>
            ` : '<div class="empty">No expenses recorded yet.</div>'}
            <div class="footer">
              <span>Vconstech ERP Financial Management</span>
              <span>Generated Date: ${generatedDate}</span>
            </div>
          </div>
        </div>
      </div>
      <script>window.print();window.onafterprint=()=>window.close();</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  const handleDownloadProjectExpenseReport = async (project, format) => {
    if (!project?.id) {
      showToast('Please select a valid project before downloading the report.', 'warning');
      return;
    }

    const downloadKey = `${project.id}-${format}`;
    try {
      setDownloadingReport(downloadKey);
      await financialAPI.downloadProjectExpenseReport(project.id, format);
      showToast(`Project expense report downloaded as ${format === 'excel' ? 'Excel' : 'PDF'}.`, 'success');
    } catch (error) {
      showToast(`Failed to download report: ${error.error || error.message}`, 'error');
    } finally {
      setDownloadingReport(null);
    }
  };

  if (loading) return <LoadingScreen message="Loading Financial Data..." />;

  /* -- drawer expense filtered -- */
  const drawerBudgetSummary = getProjectBudgetSummary(drawerProject);
  const drawerTotalBudget   = drawerBudgetSummary.totalBudget;
  const drawerTotalSpent    = drawerBudgetSummary.totalSpent;
  const drawerRemaining     = drawerBudgetSummary.remainingBudget;
  const drawerExpenses      = drawerProject?.expenses || [];
  const drawerHistory = drawerProject?.financialHistory || drawerExpenses.map((expense) => ({
    ...expense,
    date: expense.createdAt,
    description: expense.category,
    source: 'Financial Management',
  }));
  const historySections = [
    { title: 'Labour Payments', source: 'Labour Payment', badge: 'bg-orange-50 text-orange-700' },
    { title: 'Material Usage Cost', source: 'Material Usage', badge: 'bg-sky-50 text-sky-700' },
    { title: 'Contract Amounts', source: 'Contract', badge: 'bg-indigo-50 text-indigo-700' },
    { title: 'Manual Expenses', source: 'Financial Management', badge: 'bg-green-50 text-green-700' },
  ].map((section) => ({ ...section, entries: drawerHistory.filter((entry) => entry.source === section.source) }));

  const renderHistorySection = (section) => {
    if (section.entries.length === 0) return null;
    const isManualExpense = section.source === 'Financial Management';
    return (
      <div key={section.source}>
        <div className="mb-2 flex items-center justify-between">
          <h5 className="text-sm font-semibold text-gray-800">{section.title}</h5>
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${section.badge}`}>{section.entries.length} record{section.entries.length === 1 ? '' : 's'}</span>
        </div>
        <div className="rounded-xl border border-gray-100 overflow-x-auto">
          <table className="min-w-[620px] w-full text-sm">
            <thead><tr className="bg-amber-50 border-b border-gray-100"><th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Date</th><th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Details</th><th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Amount (Rs.)</th>{isManualExpense && <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Action</th>}</tr></thead>
            <tbody className="divide-y divide-gray-50">
              {section.entries.map((expense, index) => (
                <tr key={`${section.source}-${expense.id || index}`} className="hover:bg-gray-50 transition-colors">
                  {isManualExpense && editingExpense && editingExpense.id === expense.id ? (
                    <td colSpan={4} className="px-4 py-3"><div className="flex flex-wrap items-center gap-2"><input name="editExpenseAmount" type="number" value={editingExpense.amount} onChange={(e) => { setEditingExpense({ ...editingExpense, amount: e.target.value }); setEditExpenseErrors((prev) => ({ ...prev, editExpenseAmount: '' })); }} className={`w-32 px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 ${editExpenseErrors.editExpenseAmount ? 'border-red-500' : 'border-gray-200'}`} placeholder="Amount" /><button onClick={handleSaveExpense} className="flex items-center gap-1 bg-yellow-400 text-black px-3 py-1.5 rounded-lg text-xs font-semibold"><Save size={12} /> Save</button><button onClick={() => { setEditingExpense(null); setEditExpenseErrors({}); }} className="flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-xs"><X size={12} /> Cancel</button></div>{editExpenseErrors.editExpenseAmount && <p className="mt-1 text-xs text-red-500">{editExpenseErrors.editExpenseAmount}</p>}</td>
                  ) : (
                    <>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500">{fmtDate(expense.date || expense.createdAt)}</td>
                      <td className="max-w-[280px] px-4 py-3 text-gray-700">{expense.description || expense.category || '--'}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{fmtCurrency(expense.amount)}</td>
                      {isManualExpense && (
                        <td className="px-4 py-3"><div className="flex items-center gap-2"><button onClick={() => setEditingExpense({ ...expense, projectId: drawerProject.id })} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Edit expense"><Edit2 size={14} /></button><button onClick={() => handleDeleteExpense(expense.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete expense"><Trash2 size={14} /></button></div></td>
                      )}
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* -- Main content -- */}
      <div className="pt-20 md:pl-64 md:pt-25">
        <div className="px-4 md:px-8 pb-10">

          {/* Page header */}
          <div className="mb-4">
            <div>
              <h1 className="text-[22px] font-bold tracking-tight text-[#111827]">Financial Management</h1>
              <p className="mt-0.5 text-xs text-[#53627b]">Manage all your projects, quotations, budgets, and expenses.</p>
            </div>
          </div>

          {/* Filter-aware financial overview */}
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Total Projects', value: filteredProjects.length, icon: FolderOpen, iconClass: 'text-amber-700', iconBg: 'bg-amber-100' },
              { label: 'Active Projects', value: filteredSummary.activeProjects, icon: BarChart3, iconClass: 'text-amber-700', iconBg: 'bg-amber-100' },
              { label: 'Total Budget', value: fmtCurrency(filteredSummary.totalBudget), icon: Coins, iconClass: 'text-amber-700', iconBg: 'bg-amber-100' },
              { label: 'Remaining Budget', value: fmtCurrency(filteredSummary.remainingBudget), icon: PieChart, iconClass: filteredSummary.remainingBudget >= 0 ? 'text-amber-700' : 'text-red-600', iconBg: filteredSummary.remainingBudget >= 0 ? 'bg-amber-100' : 'bg-red-100' },
            ].map(({ label, value, icon: Icon, iconClass, iconBg }) => (
              <div key={label} className="flex h-[66px] items-center gap-3 rounded-lg bg-white px-3 shadow-[0_4px_16px_rgba(31,51,88,0.04)]">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
                  <Icon size={22} strokeWidth={1.9} className={iconClass} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-[#53627b]">{label}</p>
                  <p className="mt-0.5 truncate text-lg font-bold leading-none text-[#111827]">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Search and filters */}
          <div className="mb-3 flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
              <input
                type="text"
                placeholder="Search Project..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="h-10 w-full rounded-lg border border-[#e2e8f0] bg-white py-2 pl-11 pr-4 text-xs text-gray-700 shadow-sm outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
              />
            </div>
            <div className="relative shrink-0">
              <button onClick={() => setShowFilterDrop(!showFilterDrop)}
                className="flex h-10 items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white px-4 text-xs font-medium text-[#1f2937] shadow-sm hover:bg-gray-50">
                <Filter className="h-4 w-4" /> Filter
                {filterStatus !== 'all' && <span className="h-2 w-2 rounded-full bg-yellow-400" />}
              </button>
              {showFilterDrop && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowFilterDrop(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-40 rounded-xl border border-gray-100 bg-white py-1 text-sm shadow-lg">
                    {['all', 'Active', 'Planning', 'On Hold', 'Completed'].map(s => (
                      <button key={s} onClick={() => { setFilterStatus(s); setShowFilterDrop(false); setCurrentPage(1); }}
                        className={`w-full px-3 py-2 text-left transition-colors ${filterStatus === s ? 'bg-yellow-50 font-medium text-yellow-800' : 'text-gray-700 hover:bg-gray-50'}`}>
                        {s === 'all' ? 'All Status' : s}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="relative shrink-0">
              <button onClick={() => setShowDateSortDrop((open) => !open)}
                className={`flex h-10 items-center gap-2 rounded-lg border px-4 text-xs font-medium shadow-sm transition ${dueDateRange.from || dueDateRange.to ? 'border-yellow-400 bg-yellow-50 text-yellow-900' : 'border-[#e2e8f0] bg-white text-[#1f2937] hover:bg-gray-50'}`}>
                <ArrowUpDown className="h-4 w-4" /> Sort By
                {(dueDateRange.from || dueDateRange.to) && <span className="h-2 w-2 rounded-full bg-yellow-400" />}
              </button>
              {showDateSortDrop && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowDateSortDrop(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-64 space-y-3 rounded-xl border border-gray-100 bg-white p-4 text-sm shadow-lg">
                    <p className="text-xs font-semibold text-gray-700">Due date range</p>
                    <label className="block text-xs text-gray-500">
                      From
                      <input type="date" value={dueDateRange.from} max={dueDateRange.to || undefined}
                        onChange={(e) => { setDueDateRange((range) => ({ ...range, from: e.target.value })); setCurrentPage(1); }}
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700" />
                    </label>
                    <label className="block text-xs text-gray-500">
                      To
                      <input type="date" value={dueDateRange.to} min={dueDateRange.from || undefined}
                        onChange={(e) => { setDueDateRange((range) => ({ ...range, to: e.target.value })); setCurrentPage(1); }}
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700" />
                    </label>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => { setDueDateRange({ from: '', to: '' }); setCurrentPage(1); }}
                        className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50">Clear</button>
                      <button onClick={() => setShowDateSortDrop(false)}
                        className="flex-1 rounded-lg bg-yellow-400 px-3 py-2 text-xs font-semibold text-gray-900 hover:bg-yellow-500">Done</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Table card */}
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-[0_4px_16px_rgba(31,51,88,0.04)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="bg-yellow-400">
                    {['Project Name', 'Budget (Rs.)', 'Spent (Rs.)', 'Remaining (Rs.)', 'Due Date', 'Status', 'Action'].map((h) => (
                      <th key={h} className="px-5 py-4 text-left text-xs font-bold text-black uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pageProjects.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <FileText className="mx-auto text-gray-300 mb-3" size={48} />
                        <p className="text-sm text-gray-500">No projects found</p>
                      </td>
                    </tr>
                  ) : pageProjects.map((project) => {
                    const projectSummary = getProjectBudgetSummary(project);
                    const totalSpent = projectSummary.totalSpent;
                    const remaining  = projectSummary.remainingBudget;
                    return (
                      <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4 text-sm font-semibold text-gray-900">{project.name}</td>
                        <td className="px-5 py-4 text-sm text-gray-700">{fmtCurrency(projectSummary.totalBudget)}</td>
                        <td className="px-5 py-4 text-sm text-gray-700">{fmtCurrency(totalSpent)}</td>
                        <td className="px-5 py-4 text-sm font-medium">
                          <span className={remaining >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {fmtCurrency(remaining)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-700 whitespace-nowrap">{fmtDate(project.dueDate)}</td>
                        <td className="px-5 py-4"><StatusBadge status={getProjectStatus(project)} /></td>
                        <td className="px-5 py-4">
                          <button onClick={() => openDrawer(project)}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors">
                            <Eye size={14} /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* -- Pagination -- */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-gray-100">
              {/* Left: Showing info + Show rows dropdown */}
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>
                  Showing {filteredProjects.length === 0 ? 0 : startIdx + 1}-{endIdx} of {filteredProjects.length} Records
                </span>
                <div className="flex items-center gap-1.5">
                  <span>Show:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => handleRowsPerPageChange(e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 cursor-pointer"
                  >
                    {[10, 25, 50, 100].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Right: Prev / pages / Next */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Prev
                </button>
                {getPaginationItems(currentPage, totalPages).map((item, i) =>
                  item === '...'
                    ? <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">...</span>
                    : <button key={item} onClick={() => setCurrentPage(item)}
                        className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors ${currentPage === item ? 'bg-yellow-400 text-black' : 'text-gray-500 hover:bg-gray-100'}`}>
                        {item}
                      </button>
                )}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================== */}
      {/* -- RIGHT DRAWER OVERLAY -- */}
      {/* ====================================================== */}
      {drawerProject && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 z-50"
            onClick={closeDrawer}
          />
          {/* Drawer panel */}
          <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white z-50 shadow-2xl flex flex-col overflow-hidden animate-slide-in-right">

            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Project Finance Details</h2>
              <button onClick={closeDrawer} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Scrollable drawer body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 space-y-4 sm:space-y-5">

              {/* Project title row */}
              <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                <div className="w-11 h-11 sm:w-14 sm:h-14 bg-orange-100 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Building2 size={20} className="text-orange-500 sm:hidden" />
                  <Building2 size={24} className="text-orange-500 hidden sm:block" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-xl font-bold text-gray-900 break-words">{drawerProject.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5 leading-relaxed">
                    Budget: {fmtCurrency(drawerProject.budget)}
                    <span className="mx-1.5 text-gray-300">|</span>
                    Due Date: {fmtDate(drawerProject.dueDate)}
                  </p>
                </div>
              </div>

              {/* 3 summary cards */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[
                  { label: 'Total Budget',      value: fmtCurrency(drawerTotalBudget),             color: 'text-blue-600',   bg: 'bg-blue-50',   icon: '' },
                  { label: 'Total Spent',       value: fmtCurrency(drawerTotalSpent),              color: 'text-green-600', bg: 'bg-green-50',  icon: '' },
                  { label: 'Remaining Budget',  value: fmtCurrency(drawerRemaining),               color: drawerRemaining >= 0 ? 'text-orange-500' : 'text-red-600', bg: 'bg-orange-50', icon: '' },
                ].map((card) => (
                  <div key={card.label} className={`${card.bg} min-w-0 rounded-xl p-2.5 sm:p-4`}>
                    <p className="text-[10px] sm:text-xs text-gray-500 mb-1 sm:mb-2 leading-tight">{card.label}</p>
                    <p className={`text-xs sm:text-lg font-bold break-words ${card.color}`}>{card.value}</p>
                  </div>
                ))}
              </div>

              {/* Expense History section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base font-bold text-gray-900">Expense History</h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setAddingExpense(true); setNewExpense({ amount: '', category: '' }); setExpenseErrors({}); }}
                      className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Plus size={12} /> Add Expense
                    </button>
                  </div>
                </div>

                {/* Add Expense inline form */}
                {addingExpense && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-3">
                    <h5 className="text-sm font-semibold text-gray-800 mb-3">Add New Expense</h5>
                    <div className="grid grid-cols-1 gap-3 mb-3">
                      <input
                        name="expenseCategory"
                        type="text"
                        value={newExpense.category}
                        onChange={(e) => { setNewExpense({ ...newExpense, category: e.target.value }); setExpenseErrors((prev) => ({ ...prev, expenseCategory: '' })); }}
                        className={`px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 ${expenseErrors.expenseCategory ? 'border-red-500' : 'border-gray-200'}`}
                        placeholder="Enter Expense Category"
                      />
                      {expenseErrors.expenseCategory && (
                        <div>
                          <p className="text-xs text-red-500">{expenseErrors.expenseCategory}</p>
                        </div>
                      )}
                      <input
                        name="expenseAmount"
                        type="number"
                        value={newExpense.amount}
                        onChange={(e) => { setNewExpense({ ...newExpense, amount: e.target.value }); setExpenseErrors((prev) => ({ ...prev, expenseAmount: '' })); }}
                        className={`px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 ${expenseErrors.expenseAmount ? 'border-red-500' : 'border-gray-200'}`}
                        placeholder="Amount (Rs.)"
                      />
                    </div>
                    {expenseErrors.expenseAmount && (
                      <div className="mb-3">
                        <p className="text-xs text-red-500">{expenseErrors.expenseAmount}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button onClick={handleAddExpense}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                        <Save size={14} /> Add Expense
                      </button>
                      <button onClick={() => { setAddingExpense(false); setNewExpense({ amount: '', category: '' }); setExpenseErrors({}); }}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                        <X size={14} /> Cancel
                      </button>
                    </div>
                  </div>
                )}

                {drawerHistory.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-sm text-gray-400">No project cost history recorded yet</div>
                ) : <div className="space-y-5">{historySections.map(renderHistorySection)}</div>}
              </div>
            </div>

            {/* Drawer footer */}
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-gray-100 flex-shrink-0 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => handleDownloadProjectExpenseReport(drawerProject, 'pdf')}
                disabled={downloadingReport === `${drawerProject.id}-pdf`}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-yellow-400 rounded-xl text-sm font-semibold text-black hover:bg-yellow-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                <Download size={16} />
                {downloadingReport === `${drawerProject.id}-pdf` ? 'Downloading PDF...' : 'Download PDF'}
              </button>
              <button
                onClick={() => handleDownloadProjectExpenseReport(drawerProject, 'excel')}
                disabled={downloadingReport === `${drawerProject.id}-excel`}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 rounded-xl text-sm font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                <FileSpreadsheet size={16} />
                {downloadingReport === `${drawerProject.id}-excel` ? 'Downloading Excel...' : 'Download Excel'}
              </button>
              <button onClick={() => handlePrint(drawerProject)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <Printer size={16} /> Print Report
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FinancialManagement;
