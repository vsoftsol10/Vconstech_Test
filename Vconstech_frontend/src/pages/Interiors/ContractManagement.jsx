// import React, { useState, useEffect } from 'react';
// import { Edit2, Trash2, Plus, Save, X, Search, ChevronDown, Check,AlertTriangle  } from 'lucide-react';
// import Navbar from '../../components/common/Navbar';
// import SidePannel from '../../components/common/SidePannel';
// import * as contractAPI from '../../api/contractAPI';
// import LoadingScreen from '../../components/common/Loadingscreen';
// import StandardPagination, { DEFAULT_PAGE_SIZE } from '../../components/common/Pagination';
// import { showToast } from '../../components/common/Toast';
// import { focusFirstInvalidField, getTodayDateInputValue, isDateBefore, validateFields } from '../../utils/formValidation';

// const ROWS_PER_PAGE = 8;

// // Reusable pagination bar — same pattern used across Dashboard/Projects/Request tabs
// const Pagination = ({ currentPage, totalItems, pageSize, onPageChange }) => {
//   const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
//   if (totalItems === 0) return null;

//   const start = (currentPage - 1) * pageSize + 1;
//   const end = Math.min(currentPage * pageSize, totalItems);

//   const pageNumbers = [];
//   for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);

//   return (
//     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-3 border-t border-gray-100">
//       <p className="text-xs sm:text-sm text-gray-500">
//         Showing <span className="font-medium text-gray-700">{start}</span>–
//         <span className="font-medium text-gray-700">{end}</span> of{" "}
//         <span className="font-medium text-gray-700">{totalItems}</span>
//       </p>
//       <div className="flex items-center gap-1.5 flex-wrap">
//         <button
//           onClick={() => onPageChange(Math.max(1, currentPage - 1))}
//           disabled={currentPage === 1}
//           className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
//         >
//           Prev
//         </button>
//         {pageNumbers.map((num) => (
//           <button
//             key={num}
//             onClick={() => onPageChange(num)}
//             className={`w-8 h-8 flex items-center justify-center text-xs font-medium rounded-lg transition-colors ${
//               currentPage === num
//                 ? "bg-yellow-400 text-black shadow-sm"
//                 : "text-gray-600 hover:bg-gray-50 border border-gray-200"
//             }`}
//           >
//             {num}
//           </button>
//         ))}
//         <button
//           onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
//           disabled={currentPage === totalPages}
//           className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
//         >
//           Next
//         </button>
//       </div>
//     </div>
//   );
// };

// export default function ContractManagement() {
//   const [contracts, setContracts] = useState([]);
//   const [projects, setProjects] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [editingId, setEditingId] = useState(null);
//   const [showAddForm, setShowAddForm] = useState(false);
//   const [editForm, setEditForm] = useState({});
//   const [contractErrors, setContractErrors] = useState({});
//   const todayDate = getTodayDateInputValue();
//   const [editContractErrors, setEditContractErrors] = useState({});
//   const [newContract, setNewContract] = useState({
//     projectId: '',
//     contractorName: '',
//     contactNumber: '',
//     contractAmount: '',
//     workStatus: 'Pending',
//     startDate: new Date().toISOString().split('T')[0],
//     endDate: new Date().toISOString().split('T')[0],
//     details: ''
//   });

//   // UI-only: search, status filter, pagination, filter dropdown open state
//   const [searchTerm, setSearchTerm] = useState('');
//   const [statusFilter, setStatusFilter] = useState('All');
//   const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_PAGE_SIZE);
//   const statusFilterRef = React.useRef(null);

//   // Fetch contracts from API
//   const fetchContracts = async () => {
//     try {
//       setLoading(true);
//       const data = await contractAPI.getAllContracts();
//       if (data.success) {
//         setContracts(data.contracts);
//       }
//     } catch (error) {
//       console.error('Error fetching contracts:', error);
//       showToast(error.error || 'Failed to fetch contracts', 'error');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Fetch projects for dropdown
//   const fetchProjects = async () => {
//     try {
//       const data = await contractAPI.getAllProjects();
//       if (data.projects) {
//         setProjects(data.projects);
//       }
//     } catch (error) {
//       console.error('Error fetching projects:', error);
//     }
//   };
//   useEffect(() => {
//       document.title = "Vconstech - Admin";
//     }, []);

//   useEffect(() => {
//     fetchContracts();
//     fetchProjects();
//   }, []);

//   // UI-only: reset to page 1 whenever the filtered set changes
//   useEffect(() => {
//     setCurrentPage(1);
//   }, [searchTerm, statusFilter, contracts.length]);

//   // UI-only: close the status filter dropdown when clicking outside it
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (statusFilterRef.current && !statusFilterRef.current.contains(event.target)) {
//         setIsStatusFilterOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const handleEdit = (contract) => {
//     setEditingId(contract.id);
//     setEditForm({ ...contract });
//     setEditContractErrors({});
//   };

//   const handleSave = async (id) => {
//     const errors = validateFields([
//       { name: 'editContractorName', value: editForm.contractorName, label: 'Contractor name', rules: ['lettersSpacesName'] },
//       { name: 'editContactNumber', value: editForm.contactNumber, label: 'Contact number', rules: ['mobile'] },
//       { name: 'editContractAmount', value: editForm.contractAmount, label: 'Contract amount', rules: ['amount'] },
//       { name: 'editWorkStatus', value: editForm.workStatus, label: 'Work status', rules: ['dropdown'] },
//     ]);
//     setEditContractErrors(errors);
//     if (Object.keys(errors).length) {
//       focusFirstInvalidField(errors);
//       return;
//     }

//     try {
//       const data = await contractAPI.updateContract(id, {
//         contractorName: editForm.contractorName,
//         contactNumber: editForm.contactNumber,
//         contractAmount: parseFloat(editForm.contractAmount),
//         workStatus: editForm.workStatus,
//         startDate: editForm.startDate,
//         endDate: editForm.endDate,
//         details: editForm.details
//       });

//       if (data.success) {
//         await fetchContracts();
//         setEditingId(null);
//         setEditForm({});
//         showToast('Contract updated successfully!', 'success');
//       }
//     } catch (error) {
//       console.error('Error updating contract:', error);
//       showToast(error.error || 'Failed to update contract', 'error');
//     }
//   };

//   const handleCancel = () => {
//     setEditingId(null);
//     setEditForm({});
//     setEditContractErrors({});
//   };

//   const handleDelete = async (id) => {
//     if (window.confirm('Are you sure you want to delete this contract?')) {
//       try {
//         const data = await contractAPI.deleteContract(id);
//         if (data.success) {
//           await fetchContracts();
//           showToast('Contract deleted successfully!', 'success');
//         }
//       } catch (error) {
//         console.error('Error deleting contract:', error);
//         showToast(error.error || 'Failed to delete contract', 'error');
//       }
//     }
//   };

//   const handleAddNew = async () => {
//     const errors = validateFields([
//       { name: 'projectId', value: newContract.projectId, label: 'Project', rules: ['dropdown'] },
//       { name: 'contractorName', value: newContract.contractorName, label: 'Contractor name', rules: ['lettersSpacesName'] },
//       { name: 'contactNumber', value: newContract.contactNumber, label: 'Contact number', rules: ['mobile'] },
//       { name: 'contractAmount', value: newContract.contractAmount, label: 'Contract amount', rules: ['amount'] },
//       { name: 'workStatus', value: newContract.workStatus, label: 'Work status', rules: ['dropdown'] },
//       { name: 'startDate', value: newContract.startDate, label: 'Start date', rules: ['todayOrFutureDate'] },
//       { name: 'endDate', value: newContract.endDate, label: 'End date', rules: ['date'] },
//       { name: 'details', value: newContract.details, label: 'Details', rules: ['textareaMin5'] },
//     ]);
//     if (isDateBefore(newContract.endDate, newContract.startDate)) {
//       errors.endDate = 'End date cannot be earlier than start date';
//     }
//     setContractErrors(errors);
//     if (Object.keys(errors).length) {
//       focusFirstInvalidField(errors);
//       return;
//     }
// const proj = projects.find((p) => String(p.id) === String(newContract.projectId));
// const budget = Number(proj?.budget ?? proj?.totalBudget ?? 0);
// const amount = parseFloat(newContract.contractAmount);

// if (budget > 0 && amount > budget) {
//   const proceed = window.confirm(
//     `Warning: Contract amount (₹ ${amount.toLocaleString()}) is more than the project budget (₹ ${budget.toLocaleString()}).\n\nDo you still want to add this contract?`
//   );
//   if (!proceed) return;
// }
//     try {
//       const data = await contractAPI.createContract({
//         projectId: parseInt(newContract.projectId),
//         contractorName: newContract.contractorName,
//         contactNumber: newContract.contactNumber,
//         contractAmount: parseFloat(newContract.contractAmount),
//         workStatus: newContract.workStatus,
//         startDate: newContract.startDate,
//         endDate: newContract.endDate,
//         details: newContract.details
//       });

//       if (data.success) {
//         await fetchContracts();
//         setNewContract({
//           projectId: '',
//           contractorName: '',
//           contactNumber: '',
//           contractAmount: '',
//           workStatus: 'Pending',
//           startDate: new Date().toISOString().split('T')[0],
//           endDate: new Date().toISOString().split('T')[0],
//           details: ''
//         });
//         setContractErrors({});
//         setShowAddForm(false);
//         showToast('Contract added successfully!', 'success');
//       }
//     } catch (error) {
//       console.error('Error adding contract:', error);
//       showToast(error.error || 'Failed to add contract', 'error');
//     }
//   };
// {selectedProject && projectBudget > 0 && (
//   <p className="text-gray-500 text-xs mt-1">
//     Project budget: <span className="font-semibold">₹ {projectBudget.toLocaleString()}</span>
//   </p>
// )}
//   const getStatusColor = (status) => {
//     switch (status) {
//       case 'Completed': return 'bg-green-100 text-green-800';
//       case 'In Progress': return 'bg-blue-100 text-blue-800';
//       case 'Pending': return 'bg-yellow-100 text-yellow-800';
//       default: return 'bg-gray-100 text-gray-800';
//     }
//   };

//   if (loading) return <LoadingScreen message="Loading contracts..." />;
// // Budget check for the "Add New Contract" form
// const selectedProject = projects.find(
//   (p) => String(p.id) === String(newContract.projectId)
// );
// const projectBudget = Number(selectedProject?.budget ?? selectedProject?.totalBudget ?? 0);
// const enteredAmount = parseFloat(newContract.contractAmount) || 0;
// const exceedsBudget = projectBudget > 0 && enteredAmount > projectBudget;
// const excessAmount = enteredAmount - projectBudget;
//   // UI-only: search + status filter over the contracts already in state
//   const filteredContracts = contracts
//     .filter((c) => {
//       if (!searchTerm) return true;
//       const term = searchTerm.toLowerCase();
//       return (
//         c.projectName?.toLowerCase().includes(term) ||
//         c.contractorName?.toLowerCase().includes(term) ||
//         c.contactNumber?.toLowerCase().includes(term)
//       );
//     })
//     .filter((c) => statusFilter === 'All' || c.workStatus === statusFilter);

//   // UI-only: paginated slice rendered in the table
//   const paginatedContracts = filteredContracts.slice(
//     (currentPage - 1) * rowsPerPage,
//     currentPage * rowsPerPage
//   );

//   return (
//     <div className="min-h-screen bg-gray-50">



//       <div className="pt-20 pl-0 md:pl-64 md:pt-25 pb-20 md:pb-0">
//         <div className="px-4 sm:px-6 lg:px-8 pt-4 pb-8">
//           <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
//             <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
//               <h1 className="text-2xl font-bold leading-tight tracking-tight text-gray-900">
//                 Contract Management
//               </h1>
//               <button
//                 onClick={() => setShowAddForm(!showAddForm)}
//                 className="flex items-center gap-1.5 px-4 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-black rounded-xl text-sm font-semibold transition-colors"
//               >
//               <Plus size={16} />
//               <span className="hidden sm:inline">Add New Contract</span>
//               <span className="sm:hidden">Add</span>
//               </button>
           
              
//             </div>

//             {/* Search + Status Filter row */}
//             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
//               <div className="relative flex-1">
//                 <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
//                 <input
//                   type="text"
//                   placeholder="Search by project, contractor, or contact..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent shadow-sm"
//                 />
//               </div>

//               <div className="relative" ref={statusFilterRef}>
//                 <button
//                   type="button"
//                   onClick={() => setIsStatusFilterOpen((open) => !open)}
//                   className={`flex items-center justify-center gap-2 px-4 py-2.5 bg-white border rounded-xl text-sm font-medium transition-colors shadow-sm w-full sm:w-auto ${
//                     statusFilter !== 'All'
//                       ? 'border-yellow-400 text-yellow-800 bg-yellow-50'
//                       : 'border-gray-200 text-gray-700 hover:bg-gray-50'
//                   }`}
//                 >
//                   {statusFilter === 'All' ? 'Work Status' : statusFilter}
//                   <ChevronDown className="w-4 h-4 text-gray-400" />
//                 </button>

//                 {isStatusFilterOpen && (
//                   <div className="absolute right-0 z-10 mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
//                     {['All', 'Pending', 'In Progress', 'Completed'].map((status) => (
//                       <button
//                         key={status}
//                         type="button"
//                         onClick={() => { setStatusFilter(status); setIsStatusFilterOpen(false); }}
//                         className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors ${
//                           statusFilter === status
//                             ? 'bg-yellow-50 text-yellow-800 font-medium'
//                             : 'text-gray-700 hover:bg-gray-50'
//                         }`}
//                       >
//                         {status === 'All' ? 'All Statuses' : status}
//                         {statusFilter === status && <Check className="w-4 h-4 text-yellow-600" />}
//                       </button>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             </div>

//             {showAddForm && (
//               <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center z-50 p-4">
//                 <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
//                   <div className="flex justify-between items-center mb-6">
//                     <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">New Contract Details</h2>
//                     <button 
//                       onClick={() => { setShowAddForm(false); setContractErrors({}); }} 
//                       className="text-gray-400 hover:text-gray-600 p-1"
//                     >
//                       <X size={24} />
//                     </button>
//                   </div>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div className="md:col-span-2">
//                       <label className="block text-sm font-medium text-gray-700 mb-1.5">
//                         Project <span className="text-red-500">*</span>
//                       </label>
//                       <select
//                         name="projectId"
//                         value={newContract.projectId}
//                         onChange={(e) => { setNewContract({ ...newContract, projectId: e.target.value }); setContractErrors((prev) => ({ ...prev, projectId: '' })); }}
//                         className={`w-full px-4 py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${contractErrors.projectId ? 'border-red-500' : 'border-gray-300'}`}
//                       >
//                         <option value="">Select Project</option>
//                         {projects.map(project => (
//                           <option key={project.id} value={project.id}>
//                             {project.name} 
//                           </option>
//                         ))}
//                       </select>
//                       {contractErrors.projectId && <p className="text-red-500 text-xs mt-1">{contractErrors.projectId}</p>}
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1.5">
//                         Contractor Name <span className="text-red-500">*</span>
//                       </label>
//                       <input
//                         name="contractorName"
//                         type="text"
//                         placeholder="Contractor Name"
//                         value={newContract.contractorName}
//                         onChange={(e) => { setNewContract({ ...newContract, contractorName: e.target.value }); setContractErrors((prev) => ({ ...prev, contractorName: '' })); }}
//                         className={`w-full px-4 py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${contractErrors.contractorName ? 'border-red-500' : 'border-gray-300'}`}
//                       />
//                       {contractErrors.contractorName && <p className="text-red-500 text-xs mt-1">{contractErrors.contractorName}</p>}
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1.5">
//                         Contact Number <span className="text-red-500">*</span>
//                       </label>
//                       <input
//                         name="contactNumber"
//                         type="text"
//                         placeholder="Contact Number"
//                         value={newContract.contactNumber}
//                         onChange={(e) => { setNewContract({ ...newContract, contactNumber: e.target.value }); setContractErrors((prev) => ({ ...prev, contactNumber: '' })); }}
//                         className={`w-full px-4 py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${contractErrors.contactNumber ? 'border-red-500' : 'border-gray-300'}`}
//                       />
//                       {contractErrors.contactNumber && <p className="text-red-500 text-xs mt-1">{contractErrors.contactNumber}</p>}
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1.5">
//                         Contract Amount <span className="text-red-500">*</span>
//                       </label>
//                       <input
//   name="contractAmount"
//   type="number"
//   placeholder="Contract Amount"
//   value={newContract.contractAmount}
//   onChange={(e) => { setNewContract({ ...newContract, contractAmount: e.target.value }); setContractErrors((prev) => ({ ...prev, contractAmount: '' })); }}
//   className={`w-full px-4 py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${
//     contractErrors.contractAmount
//       ? 'border-red-500'
//       : exceedsBudget
//         ? 'border-orange-500 bg-orange-50'
//         : 'border-gray-300'
//   }`}
// />
// {contractErrors.contractAmount && <p className="text-red-500 text-xs mt-1">{contractErrors.contractAmount}</p>}

// {exceedsBudget && (
//   <div className="mt-2 flex items-start gap-2 p-2.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 text-xs">
//     <AlertTriangle size={14} className="mt-0.5 shrink-0" />
//     <span>
//       Contract amount exceeds the project budget (₹ {projectBudget.toLocaleString()}) by{' '}
//       <b>₹ {excessAmount.toLocaleString()}</b>.
//     </span>
//   </div>
// )}
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1.5">Work Status</label>
//                       <select
//                         name="workStatus"
//                         value={newContract.workStatus}
//                         onChange={(e) => setNewContract({ ...newContract, workStatus: e.target.value })}
//                         className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
//                       >
//                         <option value="Pending">Pending</option>
//                         <option value="In Progress">In Progress</option>
//                         <option value="Completed">Completed</option>
//                       </select>
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
//                       <input
//                         name="startDate"
//                         type="date"
//                         value={newContract.startDate}
//                         min={todayDate}
//                         onChange={(e) => {
//                           const nextStartDate = e.target.value;
//                           setNewContract({
//                             ...newContract,
//                             startDate: nextStartDate,
//                             endDate: isDateBefore(newContract.endDate, nextStartDate) ? '' : newContract.endDate,
//                           });
//                           setContractErrors((prev) => ({ ...prev, startDate: '', endDate: '' }));
//                         }}
//                         className={`w-full px-4 py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${contractErrors.startDate ? 'border-red-500' : 'border-gray-300'}`}
//                       />
//                       {contractErrors.startDate && <p className="text-red-500 text-xs mt-1">{contractErrors.startDate}</p>}
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
//                       <input
//                         name="endDate"
//                         type="date"
//                         value={newContract.endDate}
//                         min={newContract.startDate || todayDate}
//                         onChange={(e) => {
//                           setNewContract({ ...newContract, endDate: e.target.value });
//                           setContractErrors((prev) => ({ ...prev, endDate: '' }));
//                         }}
//                         className={`w-full px-4 py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${contractErrors.endDate ? 'border-red-500' : 'border-gray-300'}`}
//                       />
//                       {contractErrors.endDate && <p className="text-red-500 text-xs mt-1">{contractErrors.endDate}</p>}
//                     </div>
//                     <div className="md:col-span-2">
//                       <label className="block text-sm font-medium text-gray-700 mb-1.5">
//                         Details <span className="text-red-500">*</span>
//                       </label>
//                       <textarea
//                         name="details"
//                         placeholder="Contract details..."
//                         value={newContract.details}
//                         onChange={(e) => { setNewContract({ ...newContract, details: e.target.value }); setContractErrors((prev) => ({ ...prev, details: '' })); }}
//                         rows="3"
//                         className={`w-full px-4 py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${contractErrors.details ? 'border-red-500' : 'border-gray-300'}`}
//                       />
//                       {contractErrors.details && <p className="text-red-500 text-xs mt-1">{contractErrors.details}</p>}
//                     </div>
//                   </div>
//                   <div className="flex gap-2 sm:gap-3 mt-6">
//                     <button
//                       onClick={() => { setShowAddForm(false); setContractErrors({}); }}
//                       className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors font-medium"
//                     >
//                       <X size={18} />
//                       Cancel
//                     </button>
//                     <button
//                       onClick={handleAddNew}
//                       className="flex-1 flex items-center justify-center gap-2 bg-yellow-400 text-black font-semibold px-4 py-2.5 rounded-xl hover:bg-yellow-500 transition-colors shadow-sm"
//                     >
//                       <Save size={18} />
//                       Add Contract
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             )}

//             <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
//               <div className="overflow-x-auto">
//                 <table className="w-full text-sm divide-y divide-gray-100">
//                   <thead>
//                     <tr>
//                       <th className="px-4 lg:px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wide bg-yellow-400 whitespace-nowrap">Project Name</th>
//                       <th className="px-4 lg:px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wide bg-yellow-400 whitespace-nowrap">Contractor Name</th>
//                       <th className="px-4 lg:px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wide bg-yellow-400 whitespace-nowrap">Contact Number</th>
//                       <th className="px-4 lg:px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wide bg-yellow-400 whitespace-nowrap">Contract Amount</th>
//                       <th className="px-4 lg:px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wide bg-yellow-400 whitespace-nowrap">Work Status</th>
//                       <th className="px-4 lg:px-6 py-3 text-center text-xs font-bold text-black uppercase tracking-wide bg-yellow-400 whitespace-nowrap w-28">Actions</th>
//                     </tr>
//                   </thead>
//                   <tbody className="bg-white divide-y divide-gray-100">
//                     {paginatedContracts.length === 0 ? (
//                       <tr>
//                         <td colSpan="6" className="px-4 lg:px-6 py-8 text-center text-gray-500 text-sm">
//                           {contracts.length === 0
//                             ? "No contracts found. Add your first contract!"
//                             : "No contracts match your search or filter."}
//                         </td>
//                       </tr>
//                     ) : (
//                       paginatedContracts.map((contract) => (
//                         <tr key={contract.id} className="hover:bg-gray-50 transition-colors duration-200">
//                           {editingId === contract.id ? (
//                             <>
//                               <td className="px-4 lg:px-6 py-3">
//                                 <input
//                                   type="text"
//                                   value={editForm.projectName}
//                                   disabled
//                                   className="border border-gray-200 rounded-xl px-3 py-1.5 w-full bg-gray-100 text-sm"
//                                 />
//                               </td>
//                               <td className="px-4 lg:px-6 py-3">
//                                 <input
//                                   name="editContractorName"
//                                   type="text"
//                                   value={editForm.contractorName}
//                                   onChange={(e) => { setEditForm({ ...editForm, contractorName: e.target.value }); setEditContractErrors((prev) => ({ ...prev, editContractorName: '' })); }}
//                                   className={`border rounded-xl px-3 py-1.5 w-full text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${editContractErrors.editContractorName ? 'border-red-500' : 'border-gray-200'}`}
//                                 />
//                                 {editContractErrors.editContractorName && <p className="text-red-500 text-xs mt-1">{editContractErrors.editContractorName}</p>}
//                               </td>
//                               <td className="px-4 lg:px-6 py-3">
//                                 <input
//                                   name="editContactNumber"
//                                   type="text"
//                                   value={editForm.contactNumber}
//                                   onChange={(e) => { setEditForm({ ...editForm, contactNumber: e.target.value }); setEditContractErrors((prev) => ({ ...prev, editContactNumber: '' })); }}
//                                   className={`border rounded-xl px-3 py-1.5 w-full text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${editContractErrors.editContactNumber ? 'border-red-500' : 'border-gray-200'}`}
//                                 />
//                                 {editContractErrors.editContactNumber && <p className="text-red-500 text-xs mt-1">{editContractErrors.editContactNumber}</p>}
//                               </td>
//                               <td className="px-4 lg:px-6 py-3">
//                                 <input
//                                   name="editContractAmount"
//                                   type="number"
//                                   value={editForm.contractAmount}
//                                   onChange={(e) => { setEditForm({ ...editForm, contractAmount: e.target.value }); setEditContractErrors((prev) => ({ ...prev, editContractAmount: '' })); }}
//                                   className={`border rounded-xl px-3 py-1.5 w-full text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${editContractErrors.editContractAmount ? 'border-red-500' : 'border-gray-200'}`}
//                                 />
//                                 {editContractErrors.editContractAmount && <p className="text-red-500 text-xs mt-1">{editContractErrors.editContractAmount}</p>}
//                               </td>
//                               <td className="px-4 lg:px-6 py-3">
//                                 <select
//                                   name="editWorkStatus"
//                                   value={editForm.workStatus}
//                                   onChange={(e) => setEditForm({ ...editForm, workStatus: e.target.value })}
//                                   className="border border-gray-200 rounded-xl px-3 py-1.5 w-full text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
//                                 >
//                                   <option value="Pending">Pending</option>
//                                   <option value="In Progress">In Progress</option>
//                                   <option value="Completed">Completed</option>
//                                 </select>
//                               </td>
//                               <td className="px-4 lg:px-6 py-3">
//                                 <div className="flex justify-center gap-2">
//                                   <button
//                                     onClick={() => handleSave(contract.id)}
//                                     className="bg-yellow-400 text-black p-2 rounded-lg hover:bg-yellow-500 transition-colors"
//                                   >
//                                     <Save size={16} />
//                                   </button>
//                                   <button
//                                     onClick={handleCancel}
//                                     className="bg-gray-900 text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
//                                   >
//                                     <X size={16} />
//                                   </button>
//                                 </div>
//                               </td>
//                             </>
//                           ) : (
//                             <>
//                               <td className="px-4 lg:px-6 py-3 font-medium text-gray-900 text-sm">{contract.projectName}</td>
//                               <td className="px-4 lg:px-6 py-3 text-gray-600 text-sm">{contract.contractorName}</td>
//                               <td className="px-4 lg:px-6 py-3 text-gray-600 text-sm">{contract.contactNumber}</td>
//                               <td className="px-4 lg:px-6 py-3 text-gray-800 font-semibold text-sm whitespace-nowrap">
//                                 ₹ {contract.contractAmount.toLocaleString()}
//                               </td>
//                               <td className="px-4 lg:px-6 py-3">
//                                 <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(contract.workStatus)}`}>
//                                   {contract.workStatus}
//                                 </span>
//                               </td>
//                               <td className="px-4 lg:px-6 py-3">
//                                 <div className="flex justify-center gap-2">
//                                   <button
//                                     onClick={() => handleEdit(contract)}
//                                     className="bg-yellow-400 text-black p-2 rounded-lg hover:bg-yellow-500 transition-colors"
//                                   >
//                                     <Edit2 size={16} />
//                                   </button>
//                                   <button
//                                     onClick={() => handleDelete(contract.id)}
//                                     className="bg-gray-900 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
//                                   >
//                                     <Trash2 size={16} />
//                                   </button>
//                                 </div>
//                               </td>
//                             </>
//                           )}
//                         </tr>
//                       ))
//                     )}
//                   </tbody>
//                 </table>
//               </div>

//               <StandardPagination
//                 currentPage={currentPage}
//                 totalItems={filteredContracts.length}
//                 pageSize={rowsPerPage}
//                 onPageChange={setCurrentPage}
//                 onPageSizeChange={setRowsPerPage}
//               />
//             </div>

//             <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
//               <div className="text-gray-600 text-sm">
//                 Total Contracts: <span className="font-semibold text-gray-900">{contracts.length}</span>
//                 {filteredContracts.length !== contracts.length && (
//                   <span className="text-gray-400"> ({filteredContracts.length} shown after filtering)</span>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Plus, Save, X, Search, ChevronDown, Check, AlertTriangle } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import SidePannel from '../../components/common/SidePannel';
import * as contractAPI from '../../api/contractAPI';
import LoadingScreen from '../../components/common/Loadingscreen';
import StandardPagination, { DEFAULT_PAGE_SIZE } from '../../components/common/Pagination';
import { showToast } from '../../components/common/Toast';
import { focusFirstInvalidField, getTodayDateInputValue, isDateBefore, validateFields } from '../../utils/formValidation';

const ROWS_PER_PAGE = 8;

// Reusable pagination bar — same pattern used across Dashboard/Projects/Request tabs
const Pagination = ({ currentPage, totalItems, pageSize, onPageChange }) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems === 0) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-3 border-t border-gray-100">
      <p className="text-xs sm:text-sm text-gray-500">
        Showing <span className="font-medium text-gray-700">{start}</span>–
        <span className="font-medium text-gray-700">{end}</span> of{" "}
        <span className="font-medium text-gray-700">{totalItems}</span>
      </p>
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Prev
        </button>
        {pageNumbers.map((num) => (
          <button
            key={num}
            onClick={() => onPageChange(num)}
            className={`w-8 h-8 flex items-center justify-center text-xs font-medium rounded-lg transition-colors ${
              currentPage === num
                ? "bg-yellow-400 text-black shadow-sm"
                : "text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            {num}
          </button>
        ))}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default function ContractManagement() {
  const [contracts, setContracts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [contractErrors, setContractErrors] = useState({});
  const todayDate = getTodayDateInputValue();
  const [editContractErrors, setEditContractErrors] = useState({});
  const [newContract, setNewContract] = useState({
    projectId: '',
    contractorName: '',
    contactNumber: '',
    contractAmount: '',
    workStatus: 'Pending',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    details: ''
  });

  // UI-only: search, status filter, pagination, filter dropdown open state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_PAGE_SIZE);
  const statusFilterRef = React.useRef(null);

  // Fetch contracts from API
  const fetchContracts = async () => {
    try {
      setLoading(true);
      const data = await contractAPI.getAllContracts();
      if (data.success) {
        setContracts(data.contracts);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
      showToast(error.error || 'Failed to fetch contracts', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch projects for dropdown
  const fetchProjects = async () => {
    try {
      const data = await contractAPI.getAllProjects();
      if (data.projects) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  useEffect(() => {
    document.title = "Vconstech - Admin";
  }, []);

  useEffect(() => {
    fetchContracts();
    fetchProjects();
  }, []);

  // UI-only: reset to page 1 whenever the filtered set changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, contracts.length]);

  // UI-only: close the status filter dropdown when clicking outside it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusFilterRef.current && !statusFilterRef.current.contains(event.target)) {
        setIsStatusFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEdit = (contract) => {
    setEditingId(contract.id);
    setEditForm({ ...contract });
    setEditContractErrors({});
  };

  const handleSave = async (id) => {
    const errors = validateFields([
      { name: 'editContractorName', value: editForm.contractorName, label: 'Contractor name', rules: ['lettersSpacesName'] },
      { name: 'editContactNumber', value: editForm.contactNumber, label: 'Contact number', rules: ['mobile'] },
      { name: 'editContractAmount', value: editForm.contractAmount, label: 'Contract amount', rules: ['amount'] },
      { name: 'editWorkStatus', value: editForm.workStatus, label: 'Work status', rules: ['dropdown'] },
    ]);
    setEditContractErrors(errors);
    if (Object.keys(errors).length) {
      focusFirstInvalidField(errors);
      return;
    }

    try {
      const data = await contractAPI.updateContract(id, {
        contractorName: editForm.contractorName,
        contactNumber: editForm.contactNumber,
        contractAmount: parseFloat(editForm.contractAmount),
        workStatus: editForm.workStatus,
        startDate: editForm.startDate,
        endDate: editForm.endDate,
        details: editForm.details
      });

      if (data.success) {
        await fetchContracts();
        setEditingId(null);
        setEditForm({});
        showToast('Contract updated successfully!', 'success');
      }
    } catch (error) {
      console.error('Error updating contract:', error);
      showToast(error.error || 'Failed to update contract', 'error');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
    setEditContractErrors({});
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this contract?')) {
      try {
        const data = await contractAPI.deleteContract(id);
        if (data.success) {
          await fetchContracts();
          showToast('Contract deleted successfully!', 'success');
        }
      } catch (error) {
        console.error('Error deleting contract:', error);
        showToast(error.error || 'Failed to delete contract', 'error');
      }
    }
  };

  const handleAddNew = async () => {
    const errors = validateFields([
      { name: 'projectId', value: newContract.projectId, label: 'Project', rules: ['dropdown'] },
      { name: 'contractorName', value: newContract.contractorName, label: 'Contractor name', rules: ['lettersSpacesName'] },
      { name: 'contactNumber', value: newContract.contactNumber, label: 'Contact number', rules: ['mobile'] },
      { name: 'contractAmount', value: newContract.contractAmount, label: 'Contract amount', rules: ['amount'] },
      { name: 'workStatus', value: newContract.workStatus, label: 'Work status', rules: ['dropdown'] },
      { name: 'startDate', value: newContract.startDate, label: 'Start date', rules: ['todayOrFutureDate'] },
      { name: 'endDate', value: newContract.endDate, label: 'End date', rules: ['date'] },
      { name: 'details', value: newContract.details, label: 'Details', rules: ['textareaMin5'] },
    ]);
    if (isDateBefore(newContract.endDate, newContract.startDate)) {
      errors.endDate = 'End date cannot be earlier than start date';
    }
    setContractErrors(errors);
    if (Object.keys(errors).length) {
      focusFirstInvalidField(errors);
      return;
    }

    // Warn (but allow) when the contract amount is more than the project budget
    const proj = projects.find((p) => String(p.id) === String(newContract.projectId));
    const budget = Number(proj?.budget ?? proj?.totalBudget ?? 0);
    const amount = parseFloat(newContract.contractAmount);

    if (budget > 0 && amount > budget) {
      const proceed = window.confirm(
        `Warning: Contract amount (₹ ${amount.toLocaleString()}) is more than the project budget (₹ ${budget.toLocaleString()}).\n\nDo you still want to add this contract?`
      );
      if (!proceed) return;
    }

    try {
      const data = await contractAPI.createContract({
        projectId: parseInt(newContract.projectId),
        contractorName: newContract.contractorName,
        contactNumber: newContract.contactNumber,
        contractAmount: parseFloat(newContract.contractAmount),
        workStatus: newContract.workStatus,
        startDate: newContract.startDate,
        endDate: newContract.endDate,
        details: newContract.details
      });

      if (data.success) {
        await fetchContracts();
        setNewContract({
          projectId: '',
          contractorName: '',
          contactNumber: '',
          contractAmount: '',
          workStatus: 'Pending',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          details: ''
        });
        setContractErrors({});
        setShowAddForm(false);
        showToast('Contract added successfully!', 'success');
      }
    } catch (error) {
      console.error('Error adding contract:', error);
      showToast(error.error || 'Failed to add contract', 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Budget check for the "Add New Contract" form
  const selectedProject = projects.find(
    (p) => String(p.id) === String(newContract.projectId)
  );
  const projectBudget = Number(selectedProject?.budget ?? selectedProject?.totalBudget ?? 0);
  const enteredAmount = parseFloat(newContract.contractAmount) || 0;
  const exceedsBudget = projectBudget > 0 && enteredAmount > projectBudget;
  const excessAmount = enteredAmount - projectBudget;

  if (loading) return <LoadingScreen message="Loading contracts..." />;

  // UI-only: search + status filter over the contracts already in state
  const filteredContracts = contracts
    .filter((c) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        c.projectName?.toLowerCase().includes(term) ||
        c.contractorName?.toLowerCase().includes(term) ||
        c.contactNumber?.toLowerCase().includes(term)
      );
    })
    .filter((c) => statusFilter === 'All' || c.workStatus === statusFilter);

  // UI-only: paginated slice rendered in the table
  const paginatedContracts = filteredContracts.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-20 pl-0 md:pl-64 md:pt-25 pb-20 md:pb-0">
        <div className="px-4 sm:px-6 lg:px-8 pt-4 pb-8">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h1 className="text-2xl font-bold leading-tight tracking-tight text-gray-900">
                Contract Management
              </h1>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-black rounded-xl text-sm font-semibold transition-colors"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Add New Contract</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>

            {/* Search + Status Filter row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by project, contractor, or contact..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent shadow-sm"
                />
              </div>

              <div className="relative" ref={statusFilterRef}>
                <button
                  type="button"
                  onClick={() => setIsStatusFilterOpen((open) => !open)}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 bg-white border rounded-xl text-sm font-medium transition-colors shadow-sm w-full sm:w-auto ${
                    statusFilter !== 'All'
                      ? 'border-yellow-400 text-yellow-800 bg-yellow-50'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {statusFilter === 'All' ? 'Work Status' : statusFilter}
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {isStatusFilterOpen && (
                  <div className="absolute right-0 z-10 mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
                    {['All', 'Pending', 'In Progress', 'Completed'].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => { setStatusFilter(status); setIsStatusFilterOpen(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors ${
                          statusFilter === status
                            ? 'bg-yellow-50 text-yellow-800 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {status === 'All' ? 'All Statuses' : status}
                        {statusFilter === status && <Check className="w-4 h-4 text-yellow-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {showAddForm && (
              <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">New Contract Details</h2>
                    <button
                      onClick={() => { setShowAddForm(false); setContractErrors({}); }}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Project <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="projectId"
                        value={newContract.projectId}
                        onChange={(e) => { setNewContract({ ...newContract, projectId: e.target.value }); setContractErrors((prev) => ({ ...prev, projectId: '' })); }}
                        className={`w-full px-4 py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${contractErrors.projectId ? 'border-red-500' : 'border-gray-300'}`}
                      >
                        <option value="">Select Project</option>
                        {projects.map(project => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                      {contractErrors.projectId && <p className="text-red-500 text-xs mt-1">{contractErrors.projectId}</p>}

                      {selectedProject && projectBudget > 0 && (
                        <p className="text-gray-500 text-xs mt-1">
                          Project budget: <span className="font-semibold">₹ {projectBudget.toLocaleString()}</span>
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Contractor Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="contractorName"
                        type="text"
                        placeholder="Contractor Name"
                        value={newContract.contractorName}
                        onChange={(e) => { setNewContract({ ...newContract, contractorName: e.target.value }); setContractErrors((prev) => ({ ...prev, contractorName: '' })); }}
                        className={`w-full px-4 py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${contractErrors.contractorName ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {contractErrors.contractorName && <p className="text-red-500 text-xs mt-1">{contractErrors.contractorName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Contact Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="contactNumber"
                        type="text"
                        placeholder="Contact Number"
                        value={newContract.contactNumber}
                        onChange={(e) => { setNewContract({ ...newContract, contactNumber: e.target.value }); setContractErrors((prev) => ({ ...prev, contactNumber: '' })); }}
                        className={`w-full px-4 py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${contractErrors.contactNumber ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {contractErrors.contactNumber && <p className="text-red-500 text-xs mt-1">{contractErrors.contactNumber}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Contract Amount <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="contractAmount"
                        type="number"
                        placeholder="Contract Amount"
                        value={newContract.contractAmount}
                        onChange={(e) => { setNewContract({ ...newContract, contractAmount: e.target.value }); setContractErrors((prev) => ({ ...prev, contractAmount: '' })); }}
                        className={`w-full px-4 py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${
                          contractErrors.contractAmount
                            ? 'border-red-500'
                            : exceedsBudget
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-300'
                        }`}
                      />
                      {contractErrors.contractAmount && <p className="text-red-500 text-xs mt-1">{contractErrors.contractAmount}</p>}

                      {exceedsBudget && (
                        <div className="mt-2 flex items-start gap-2 p-2.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 text-xs">
                          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                          <span>
                            Contract amount exceeds the project budget (₹ {projectBudget.toLocaleString()}) by{' '}
                            <b>₹ {excessAmount.toLocaleString()}</b>.
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Work Status</label>
                      <select
                        name="workStatus"
                        value={newContract.workStatus}
                        onChange={(e) => setNewContract({ ...newContract, workStatus: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
                      <input
                        name="startDate"
                        type="date"
                        value={newContract.startDate}
                        min={todayDate}
                        onChange={(e) => {
                          const nextStartDate = e.target.value;
                          setNewContract({
                            ...newContract,
                            startDate: nextStartDate,
                            endDate: isDateBefore(newContract.endDate, nextStartDate) ? '' : newContract.endDate,
                          });
                          setContractErrors((prev) => ({ ...prev, startDate: '', endDate: '' }));
                        }}
                        className={`w-full px-4 py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${contractErrors.startDate ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {contractErrors.startDate && <p className="text-red-500 text-xs mt-1">{contractErrors.startDate}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
                      <input
                        name="endDate"
                        type="date"
                        value={newContract.endDate}
                        min={newContract.startDate || todayDate}
                        onChange={(e) => {
                          setNewContract({ ...newContract, endDate: e.target.value });
                          setContractErrors((prev) => ({ ...prev, endDate: '' }));
                        }}
                        className={`w-full px-4 py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${contractErrors.endDate ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {contractErrors.endDate && <p className="text-red-500 text-xs mt-1">{contractErrors.endDate}</p>}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Details <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="details"
                        placeholder="Contract details..."
                        value={newContract.details}
                        onChange={(e) => { setNewContract({ ...newContract, details: e.target.value }); setContractErrors((prev) => ({ ...prev, details: '' })); }}
                        rows="3"
                        className={`w-full px-4 py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${contractErrors.details ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {contractErrors.details && <p className="text-red-500 text-xs mt-1">{contractErrors.details}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 sm:gap-3 mt-6">
                    <button
                      onClick={() => { setShowAddForm(false); setContractErrors({}); }}
                      className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors font-medium"
                    >
                      <X size={18} />
                      Cancel
                    </button>
                    <button
                      onClick={handleAddNew}
                      className="flex-1 flex items-center justify-center gap-2 bg-yellow-400 text-black font-semibold px-4 py-2.5 rounded-xl hover:bg-yellow-500 transition-colors shadow-sm"
                    >
                      <Save size={18} />
                      Add Contract
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm divide-y divide-gray-100">
                  <thead>
                    <tr>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wide bg-yellow-400 whitespace-nowrap">Project Name</th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wide bg-yellow-400 whitespace-nowrap">Contractor Name</th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wide bg-yellow-400 whitespace-nowrap">Contact Number</th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wide bg-yellow-400 whitespace-nowrap">Contract Amount</th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wide bg-yellow-400 whitespace-nowrap">Work Status</th>
                      <th className="px-4 lg:px-6 py-3 text-center text-xs font-bold text-black uppercase tracking-wide bg-yellow-400 whitespace-nowrap w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {paginatedContracts.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-4 lg:px-6 py-8 text-center text-gray-500 text-sm">
                          {contracts.length === 0
                            ? "No contracts found. Add your first contract!"
                            : "No contracts match your search or filter."}
                        </td>
                      </tr>
                    ) : (
                      paginatedContracts.map((contract) => (
                        <tr key={contract.id} className="hover:bg-gray-50 transition-colors duration-200">
                          {editingId === contract.id ? (
                            <>
                              <td className="px-4 lg:px-6 py-3">
                                <input
                                  type="text"
                                  value={editForm.projectName}
                                  disabled
                                  className="border border-gray-200 rounded-xl px-3 py-1.5 w-full bg-gray-100 text-sm"
                                />
                              </td>
                              <td className="px-4 lg:px-6 py-3">
                                <input
                                  name="editContractorName"
                                  type="text"
                                  value={editForm.contractorName}
                                  onChange={(e) => { setEditForm({ ...editForm, contractorName: e.target.value }); setEditContractErrors((prev) => ({ ...prev, editContractorName: '' })); }}
                                  className={`border rounded-xl px-3 py-1.5 w-full text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${editContractErrors.editContractorName ? 'border-red-500' : 'border-gray-200'}`}
                                />
                                {editContractErrors.editContractorName && <p className="text-red-500 text-xs mt-1">{editContractErrors.editContractorName}</p>}
                              </td>
                              <td className="px-4 lg:px-6 py-3">
                                <input
                                  name="editContactNumber"
                                  type="text"
                                  value={editForm.contactNumber}
                                  onChange={(e) => { setEditForm({ ...editForm, contactNumber: e.target.value }); setEditContractErrors((prev) => ({ ...prev, editContactNumber: '' })); }}
                                  className={`border rounded-xl px-3 py-1.5 w-full text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${editContractErrors.editContactNumber ? 'border-red-500' : 'border-gray-200'}`}
                                />
                                {editContractErrors.editContactNumber && <p className="text-red-500 text-xs mt-1">{editContractErrors.editContactNumber}</p>}
                              </td>
                              <td className="px-4 lg:px-6 py-3">
                                <input
                                  name="editContractAmount"
                                  type="number"
                                  value={editForm.contractAmount}
                                  onChange={(e) => { setEditForm({ ...editForm, contractAmount: e.target.value }); setEditContractErrors((prev) => ({ ...prev, editContractAmount: '' })); }}
                                  className={`border rounded-xl px-3 py-1.5 w-full text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${editContractErrors.editContractAmount ? 'border-red-500' : 'border-gray-200'}`}
                                />
                                {editContractErrors.editContractAmount && <p className="text-red-500 text-xs mt-1">{editContractErrors.editContractAmount}</p>}
                              </td>
                              <td className="px-4 lg:px-6 py-3">
                                <select
                                  name="editWorkStatus"
                                  value={editForm.workStatus}
                                  onChange={(e) => setEditForm({ ...editForm, workStatus: e.target.value })}
                                  className="border border-gray-200 rounded-xl px-3 py-1.5 w-full text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="In Progress">In Progress</option>
                                  <option value="Completed">Completed</option>
                                </select>
                              </td>
                              <td className="px-4 lg:px-6 py-3">
                                <div className="flex justify-center gap-2">
                                  <button
                                    onClick={() => handleSave(contract.id)}
                                    className="bg-yellow-400 text-black p-2 rounded-lg hover:bg-yellow-500 transition-colors"
                                  >
                                    <Save size={16} />
                                  </button>
                                  <button
                                    onClick={handleCancel}
                                    className="bg-gray-900 text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 lg:px-6 py-3 font-medium text-gray-900 text-sm">{contract.projectName}</td>
                              <td className="px-4 lg:px-6 py-3 text-gray-600 text-sm">{contract.contractorName}</td>
                              <td className="px-4 lg:px-6 py-3 text-gray-600 text-sm">{contract.contactNumber}</td>
                              <td className="px-4 lg:px-6 py-3 text-gray-800 font-semibold text-sm whitespace-nowrap">
                                ₹ {contract.contractAmount.toLocaleString()}
                              </td>
                              <td className="px-4 lg:px-6 py-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(contract.workStatus)}`}>
                                  {contract.workStatus}
                                </span>
                              </td>
                              <td className="px-4 lg:px-6 py-3">
                                <div className="flex justify-center gap-2">
                                  <button
                                    onClick={() => handleEdit(contract)}
                                    className="bg-yellow-400 text-black p-2 rounded-lg hover:bg-yellow-500 transition-colors"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(contract.id)}
                                    className="bg-gray-900 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <StandardPagination
                currentPage={currentPage}
                totalItems={filteredContracts.length}
                pageSize={rowsPerPage}
                onPageChange={setCurrentPage}
                onPageSizeChange={setRowsPerPage}
              />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="text-gray-600 text-sm">
                Total Contracts: <span className="font-semibold text-gray-900">{contracts.length}</span>
                {filteredContracts.length !== contracts.length && (
                  <span className="text-gray-400"> ({filteredContracts.length} shown after filtering)</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}