// import React, { useState, useEffect } from 'react';
// import { Calendar, IndianRupee, Eye, Edit, Trash2, ChevronDown, Percent, TrendingUp, AlertCircle, PieChart, File, MessageSquare } from 'lucide-react';
// import { FileDown } from 'lucide-react';
// import { projectAPI } from '../../api/projectAPI';
// import { getUserRole } from '../../utils/auth';
// import costCalculationService from '../../api/costCalculationService';
// import DailyProgressViewer from '../Admin/DailyProgressViewer.jsx';

// const ProjectCard = ({ project, onView, onEdit, onDelete, getStatusColor, getStatusIcon, onStatusChange, onProgressUpdate, onDownloadReport  }) => {
//   const statusOptions = ['Planning', 'In Progress', 'Completed'];
  
//   const [isDropdownOpen, setIsDropdownOpen] = useState(false);
//   const [isUpdating, setIsUpdating] = useState(false);
//   const [showProgressSlider, setShowProgressSlider] = useState(false);
//   const [tempProgress, setTempProgress] = useState(project.progress || 0);
//   const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);
//   const [showBreakdown, setShowBreakdown] = useState(false);
//   const [breakdown, setBreakdown] = useState(null);
//   const [loadingBreakdown, setLoadingBreakdown] = useState(false);
//   const [showDailyUpdates, setShowDailyUpdates] = useState(false);

//   const userRole = getUserRole();
//   const isAdmin = userRole === 'Admin';
//   const isEngineer = userRole === 'Site_Engineer';

//   // Calculate time-based progress for comparison
//   const calculateTimeProgress = () => {
//     if (!project.startDate || !project.endDate) return 50;
    
//     const start = new Date(project.startDate);
//     const end = new Date(project.endDate);
//     const now = new Date();
    
//     if (now < start) return 0;
//     if (now > end) return 100;
    
//     const total = end - start;
//     const elapsed = now - start;
//     return Math.round((elapsed / total) * 100);
//   };

//   const timeProgress = calculateTimeProgress();
//   const actualProgress = project.progress || 0;
  
//   // Determine if ahead/behind schedule
//   const progressDiff = actualProgress - timeProgress;
//   const isAhead = progressDiff > 10;
//   const isBehind = progressDiff < -10;

//   // Load spending breakdown
//   const loadBreakdown = async () => {
//     if (breakdown) {
//       setShowBreakdown(!showBreakdown);
//       return;
//     }

//     setLoadingBreakdown(true);
//     try {
//       const data = await costCalculationService.getSpendingBreakdown(project.dbId);
//       setBreakdown(data);
//       setShowBreakdown(true);
//     } catch (error) {
//       console.error('Error loading breakdown:', error);
//       showToast('Failed to load spending breakdown', 'error');
//     } finally {
//       setLoadingBreakdown(false);
//     }
//   };

//   // Handle status change
//   const handleStatusChange = async (newStatus) => {
//     if (newStatus === project.status) {
//       setIsDropdownOpen(false);
//       return;
//     }

//     setIsUpdating(true);
//     try {
//       if (onStatusChange) {
//         await onStatusChange(project.id, newStatus);
//       }
//       setIsDropdownOpen(false);
//     } catch (error) {
//       console.error('Error updating status:', error);
//       showToast('Failed to update project status. Please try again.', 'error');
//     } finally {
//       setIsUpdating(false);
//     }
//   };

//   // Handle progress update
//   const handleProgressUpdate = async () => {
//     if (tempProgress === project.progress) {
//       setShowProgressSlider(false);
//       return;
//     }

//     setIsUpdatingProgress(true);
//     try {
//       await projectAPI.updateProjectProgress(project.dbId, tempProgress);
      
//       // Notify parent to reload projects
//       if (onProgressUpdate) {
//         await onProgressUpdate();
//       }
      
//       setShowProgressSlider(false);
//       showToast(`Progress updated to ${tempProgress}%`, "success");
//     } catch (error) {
//       console.error('Error updating progress:', error);
//       alert(error.error || 'Failed to update progress. You may not have permission to update this project.');
//       setTempProgress(project.progress || 0);
//     } finally {
//       setIsUpdatingProgress(false);
//     }
//   };

//   // Check if user can update this project's progress
//   const canUpdateProgress = () => {
//     if (isAdmin) return true;
//     if (isEngineer && project.assignedEngineerName) {
//       return true;
//     }
//     return false;
//   };

//   // Calculate budget utilization percentage
//   const budgetUtilization = project.budget > 0 
//     ? ((project.spent / project.budget) * 100).toFixed(1)
//     : 0;

//   const isOverBudget = parseFloat(budgetUtilization) > 100;
//   const isNearBudget = parseFloat(budgetUtilization) > 80 && parseFloat(budgetUtilization) <= 100;

//   return (
//     <>
//       <div className="p-3 sm:p-4 lg:p-6  hover:bg-gray-50 transition-colors">
//         <div className="flex items-start justify-between mb-3 sm:mb-4">
          
//           <div className="flex-1 min-w-0">
            
//             <div className="flex flex-wrap items-center gap-2 mb-2">
              
//               <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{project.name}</h3>
//               {/* Status Dropdown */}
//               <div className="relative">
//                 <button
//                   onClick={() => setIsDropdownOpen(!isDropdownOpen)}
//                   disabled={isUpdating}
//                   className={`flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)} hover:opacity-80 transition-opacity ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
//                 >
//                   {getStatusIcon(project.status)}
//                   <span className="hidden xs:inline">{project.status}</span>
//                   <ChevronDown className="w-3 h-3" />
//                 </button>

//                 {isDropdownOpen && (
//                   <>
//                     <div 
//                       className="fixed inset-0 z-10" 
//                       onClick={() => setIsDropdownOpen(false)}
//                     />
//                     <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-20 min-w-[140px]">
//                       {statusOptions.map((status) => (
//                         <button
//                           key={status}
//                           onClick={() => handleStatusChange(status)}
//                           className={`w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors ${
//                             status === project.status ? 'bg-gray-100 font-medium' : ''
//                           }`}
//                         >
//                           <span className={`flex items-center gap-2`}>
//                             {getStatusIcon(status)}
//                             {status}
//                           </span>
//                         </button>
//                       ))}
//                     </div>
//                   </>
//                 )}
//               </div>

//               <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
//                 {project.type}
//               </span>

//               <button 
//                 onClick={() => onDownloadReport(project)}
//                 className="flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
//               >
//                 <FileDown className="w-3 h-3 sm:w-4 sm:h-4" />
//                 <span className=" xs:inline">Report</span>
//               </button>
//             </div>
//             <p className="text-xs sm:text-sm text-gray-600">{project.location} • {project.id}</p>
//             {project.assignedEngineerName && (
//               <p className="text-xs text-gray-500 mt-1">Engineer: {project.assignedEngineerName}</p>
//             )}
//           </div>
//         </div>

//         <div className="grid grid-cols-2 lg:grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
//           <div className="flex items-start gap-2 text-xs sm:text-sm">
//             <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
//             <div className="min-w-0">
//               <p className="text-gray-600">Timeline</p>
//               <p className="font-medium text-gray-900 truncate">{project.startDate} to {project.endDate}</p>
//             </div>
//           </div>
          
//           {/* Enhanced Budget Display */}
//           <div className="flex items-start gap-2 text-xs sm:text-sm">
//             <IndianRupee className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
//             <div className="min-w-0 flex-1">
//               <div className="flex items-center justify-between mb-1">
//                 <p className="text-gray-600">Budget</p>
//                 <button
//                   onClick={loadBreakdown}
//                   disabled={loadingBreakdown}
//                   className="text-yellow-900 hover:text-yellow-700 transition-colors"
//                   title="View spending breakdown"
//                 >
//                   <PieChart className="w-3 h-3" />
//                 </button>
//               </div>
//               <p className={`font-medium truncate ${isOverBudget ? 'text-red-600' : isNearBudget ? 'text-yellow-600' : 'text-gray-900'}`}>
//                 ₹{(project.spent/1000).toFixed(0)}k/₹{(project.budget/1000).toFixed(0)}k
//               </p>
//               <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
//                 <div
//                   className={`h-full rounded-full transition-all ${
//                     isOverBudget ? 'bg-red-500' : isNearBudget ? 'bg-yellow-500' : 'bg-green-500'
//                   }`}
//                   style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
//                 />
//               </div>
//               <p className={`text-xs mt-0.5 ${isOverBudget ? 'text-red-600' : isNearBudget ? 'text-yellow-600' : 'text-gray-500'}`}>
//                 {budgetUtilization}% utilized
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Spending Breakdown (Expandable) */}
//         {showBreakdown && breakdown && (
//           <div className="mb-3 sm:mb-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
//             <div className="flex items-center justify-between mb-2">
//               <h4 className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center gap-1">
//                 <PieChart className="w-3 h-3 sm:w-4 sm:h-4" />
//                 Spending Breakdown
//               </h4>
//               <button
//                 onClick={() => setShowBreakdown(false)}
//                 className="text-xs text-gray-500 hover:text-gray-700"
//               >
//                 Hide
//               </button>
//             </div>
            
//             <div className="space-y-2">
//               {breakdown.categories.map((cat, idx) => (
//                 cat.amount > 0 && (
//                   <div key={idx} className="flex items-center justify-between text-xs">
//                     <div className="flex items-center gap-2 flex-1">
//                       <div className={`w-2 h-2 rounded-full ${
//                         cat.name === 'Financial' ? 'bg-blue-500' :
//                         cat.name === 'Materials' ? 'bg-green-500' :
//                         cat.name === 'Labour' ? 'bg-yellow-500' :
//                         'bg-purple-500'
//                       }`} />
//                       <span className="text-gray-700">{cat.name}</span>
//                     </div>
//                     <div className="flex items-center gap-2">
//                       <span className="font-medium text-gray-900">₹{(cat.amount/1000).toFixed(1)}k</span>
//                       <span className="text-gray-500 min-w-[3rem] text-right">{cat.percentage}%</span>
//                     </div>
//                   </div>
//                 )
//               ))}
//             </div>
            
//             <div className="mt-2 pt-2 border-t border-purple-200">
//               <div className="flex items-center justify-between text-xs font-semibold">
//                 <span className="text-gray-700">Total Spent</span>
//                 <span className="text-gray-900">₹{(breakdown.totalSpent/1000).toFixed(1)}k</span>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Progress Section */}
//         <div className="mb-3 sm:mb-4 p-3  rounded-lg border border-yellow-600">
//           <div className="flex items-center justify-between mb-2">
//             <span className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-1">
//               <Percent className="w-3 h-3 sm:w-4 sm:h-4" />
//               Actual Progress
//             </span>
//             <div className="flex items-center gap-2">
//               <span className="text-sm sm:text-base  font-bold text-black">{actualProgress}%</span>
//               {canUpdateProgress() && !showProgressSlider && (
//                 <button
//                   onClick={() => {
//                     setTempProgress(actualProgress);
//                     setShowProgressSlider(true);
//                   }}
//                   className="text-xs px-2 py-1 bg-yellow-400 text-black font-bold rounded cursor-pointer transition-colors"
//                 >
//                   Update
//                 </button>
//               )}
//             </div>
//           </div>
          
//           {/* Progress Bar */}
//           <div className="w-full bg-white rounded-full h-2 mb-2">
//             <div
//               className="bg-gradient-to-r from-yellow-300 to-yellow-600 h-full rounded-full transition-all duration-300"
//               style={{ width: `${actualProgress}%` }}
//             />
//           </div>

//           {/* Progress Update Slider */}
//           {showProgressSlider && (
//             <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
//               <div className="flex items-center justify-between mb-2">
//                 <label className="text-xs font-medium text-gray-700">
//                   Update Progress: {tempProgress}%
//                 </label>
//                 <div className="flex gap-2">
//                   <button
//                     onClick={() => setShowProgressSlider(false)}
//                     className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded"
//                     disabled={isUpdatingProgress}
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     onClick={handleProgressUpdate}
//                     disabled={isUpdatingProgress || tempProgress === project.progress}
//                     className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
//                   >
//                     {isUpdatingProgress ? 'Saving...' : 'Save'}
//                   </button>
//                 </div>
//               </div>
//               <input
//                 type="range"
//                 min="0"
//                 max="100"
//                 value={tempProgress}
//                 onChange={(e) => setTempProgress(parseInt(e.target.value))}
//                 className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
//                 disabled={isUpdatingProgress}
//               />
//               <div className="flex justify-between text-xs text-gray-500 mt-1">
//                 <span>0%</span>
//                 <span>50%</span>
//                 <span>100%</span>
//               </div>
//             </div>
//           )}
//         </div>

//         <div className="flex flex-wrap items-center gap-2">
//           <button onClick={() => onView(project)} className="flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm text-black hover:bg-gray-100 rounded-lg transition-colors">
//             <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
//             <span className="hidden xs:inline">View</span>
//           </button>
//           <button onClick={() => onEdit(project)} className="flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
//             <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
//             <span className="hidden xs:inline">Edit</span>
//           </button>
//           <button onClick={() => onDelete(project.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
//             <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
//             <span className="hidden xs:inline">Delete</span>
//           </button>
//           {isAdmin && (
//             <button 
//               onClick={() => setShowDailyUpdates(true)} 
//               className="flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
//             >
//               <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" /> View Updates 
//               <span className="hidden xs:inline">View Updates</span>
//             </button>
//           )}
//         </div>
//       </div>

//       {/* Daily Progress Updates Modal */}
//       {showDailyUpdates && (
//         <DailyProgressViewer
//           projectId={project.dbId}
//           projectName={project.name}
//           onClose={() => setShowDailyUpdates(false)}
//         />
//       )}
//     </>
//   );
// };

// export default ProjectCard;

import React, { useState } from 'react';
import {
  Eye, Edit, Trash2, ChevronDown, Percent, MessageSquare,
  Calendar, IndianRupee, MapPin, Home, Building2, Factory, Wrench, Building,
} from 'lucide-react';
import { FileDown } from 'lucide-react';
import { projectAPI } from '../../api/projectAPI';
import { getUserRole } from '../../utils/auth';
import DailyProgressViewer from '../Admin/DailyProgressViewer.jsx';

import { showToast } from '../common/Toast';

/* ── Circular progress ring ── */
const CircleProgress = ({ progress, color = '#22c55e' }) => {
  const r = 14, circ = 2 * Math.PI * r;
  const dash = (Math.min(progress, 100) / 100) * circ;
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" className="flex-shrink-0">
      <circle cx="18" cy="18" r={r} fill="none" stroke="#e5e7eb" strokeWidth="3" />
      <circle cx="18" cy="18" r={r} fill="none" stroke={color} strokeWidth="3"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        style={{ transform: 'rotate(-90deg)', transformOrigin: '18px 18px' }}
      />
    </svg>
  );
};

/* ── Project type icon ── */
const ProjectIcon = ({ type }) => {
  const cfg = {
    Residential: { Icon: Home,     bg: 'bg-green-100',  color: 'text-green-600'  },
    Commercial:  { Icon: Building2, bg: 'bg-blue-100',   color: 'text-blue-600'   },
    Industrial:  { Icon: Factory,   bg: 'bg-purple-100', color: 'text-purple-600' },
    Renovation:  { Icon: Wrench,    bg: 'bg-orange-100', color: 'text-orange-600' },
  }[type] || { Icon: Building, bg: 'bg-gray-100', color: 'text-gray-600' };

  return (
    <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
      <cfg.Icon size={18} className={cfg.color} strokeWidth={1.8} />
    </div>
  );
};

/* ── Progress bar color by value ── */
const progressBarColor = (pct) =>
  pct >= 80 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#f97316';

const ProjectCard = ({
  project, onView, onEdit, onDelete,
  getStatusColor, getStatusIcon,
  onStatusChange, onProgressUpdate, onDownloadReport,
  columnColor,
}) => {
  const statusOptions = ['Planning', 'In Progress', 'On Hold', 'Completed'];

  const [isDropdownOpen, setIsDropdownOpen]       = useState(false);
  const [isUpdating, setIsUpdating]               = useState(false);
  const [showProgressSlider, setShowProgressSlider] = useState(false);
  const [tempProgress, setTempProgress]           = useState(project.progress || 0);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);
  const [showDailyUpdates, setShowDailyUpdates]   = useState(false);
  const [showMoreMenu, setShowMoreMenu]           = useState(false);

  const userRole = getUserRole();
  const isAdmin    = userRole === 'Admin';
  const isEngineer = userRole === 'Site_Engineer';
  const canViewDailyUpdates = isAdmin || (isEngineer && (project.assignedEngineerName || project.assignedEngineer?.name));

  const budgetUtilization = project.budget > 0
    ? ((project.spent / project.budget) * 100).toFixed(1)
    : 0;
  const isOverBudget  = parseFloat(budgetUtilization) > 100;
  const isNearBudget  = parseFloat(budgetUtilization) > 80 && parseFloat(budgetUtilization) <= 100;

  const barColor = columnColor || progressBarColor(project.progress);

  const canUpdateProgress = () => isAdmin || (isEngineer && project.assignedEngineerName);

  const handleStatusChange = async (newStatus) => {
    if (newStatus === project.status) { setIsDropdownOpen(false); return; }
    setIsUpdating(true);
    setIsDropdownOpen(false);
    try {
      if (onStatusChange) await onStatusChange(project.id, newStatus);
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleProgressUpdate = async () => {
    if (tempProgress === project.progress) { setShowProgressSlider(false); return; }
    setIsUpdatingProgress(true);
    try {
      await projectAPI.updateProjectProgress(project.dbId, tempProgress);
      if (onProgressUpdate) await onProgressUpdate();
      setShowProgressSlider(false);
      showToast(`Progress updated to ${tempProgress}%`, "success");
    } catch (error) {
      console.error('Error updating progress:', error);
      showToast(error.error || 'Failed to update progress.', 'error');
      setTempProgress(project.progress || 0);
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  /* Format dates compactly */
  const fmtDate = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  /* Budget display */
  const fmtBudget = (v) => {
    if (!v) return '₹0';
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`;
    if (v >= 100000)   return `₹${(v / 100000).toFixed(2)}L`;
    if (v >= 1000)     return `₹${(v / 1000).toFixed(0)}K`;
    return `₹${v}`;
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-visible">

        {/* Card top */}
        <div className="px-4 pt-4 pb-3">
          {/* Row 1: project ID + ⋮ */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-medium">{project.id}</span>

            {/* ⋮ menu */}
            <div className="relative">
              <button onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="text-gray-400 hover:text-gray-600 p-0.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                </svg>
              </button>
              {showMoreMenu && (
                <>
                  <div className="fixed inset-0 z-10" onPointerDown={() => setShowMoreMenu(false)} />
                  <div className="absolute right-0 top-6 bg-white rounded-xl shadow-lg border border-gray-100 z-20 w-40 py-1 text-sm">
                    <button onClick={() => { onDownloadReport(project); setShowMoreMenu(false); }}
                      className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <FileDown className="w-3.5 h-3.5" /> Download Report
                    </button>
                    {canViewDailyUpdates && (
                      <button onClick={() => { setShowDailyUpdates(true); setShowMoreMenu(false); }}
                        className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5" /> View Updates
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Row 2: icon + name + location */}
          <div className="flex items-start gap-3 mb-3">
            <ProjectIcon type={project.type} />
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">{project.name}</h3>
              {project.location && (
                <div className="flex items-center gap-1 mt-1">
                  <MapPin size={11} className="text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-500 truncate">{project.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status badge */}
          <div className="mb-3">
            <div className="relative inline-block">
              <button
                type="button"
                onPointerDown={() => setIsDropdownOpen((isOpen) => !isOpen)}
                onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setIsDropdownOpen((isOpen) => !isOpen); } }}
                disabled={isUpdating}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(project.status)} ${isUpdating ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
              >
                {isUpdating ? 'Saving...' : project.status}
                {!isUpdating && <ChevronDown className="pointer-events-none w-3 h-3" />}
              </button>
              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onPointerDown={() => setIsDropdownOpen(false)} />
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 z-20 min-w-[150px] py-1">
                    {statusOptions.map((s) => (
                      <button key={s} onClick={() => handleStatusChange(s)}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 ${s === project.status ? 'bg-gray-50 font-semibold' : ''}`}>
                        {getStatusIcon(s)} {s}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="flex items-start gap-2 mb-2">
            <Calendar size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Timeline</p>
              <p className="text-xs font-medium text-gray-700">
                {fmtDate(project.startDate)} – {fmtDate(project.endDate)}
              </p>
            </div>
          </div>

          {/* Budget */}
          <div className="flex items-start gap-2 mb-3">
            <IndianRupee size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400">Budget</p>
              <p className={`text-sm font-bold ${isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
                {fmtBudget(project.budget)}
              </p>
            </div>
          </div>

          {/* Progress row */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <CircleProgress progress={project.progress} color={barColor} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Progress</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-800">{project.progress}%</span>
                    {canUpdateProgress() && !showProgressSlider && (
                      <button
                        onClick={() => { setTempProgress(project.progress); setShowProgressSlider(true); }}
                        className="text-[10px] px-1.5 py-0.5 bg-yellow-400 text-black font-bold rounded"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${project.progress}%`, backgroundColor: barColor }} />
                </div>
              </div>
            </div>

            {/* Progress slider */}
            {showProgressSlider && (
              <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-700">Update: {tempProgress}%</label>
                  <div className="flex gap-1.5">
                    <button onClick={() => setShowProgressSlider(false)} disabled={isUpdatingProgress}
                      className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-200 rounded">Cancel</button>
                    <button onClick={handleProgressUpdate}
                      disabled={isUpdatingProgress || tempProgress === project.progress}
                      className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400">
                      {isUpdatingProgress ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
                <input type="range" min="0" max="100" value={tempProgress}
                  onChange={(e) => setTempProgress(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  disabled={isUpdatingProgress} />
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>0%</span><span>50%</span><span>100%</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card footer: action icons */}
        <div className="border-t border-gray-100 px-4 py-2.5 flex items-center justify-around">
          <button onClick={() => onView(project)}
            className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors" title="View">
            <Eye size={16} />
          </button>
          <button onClick={() => onEdit(project)}
            className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
            <Edit size={16} />
          </button>
          <button onClick={() => onDelete(project.id)}
            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
            <Trash2 size={16} />
          </button>
          {canViewDailyUpdates && (
            <button onClick={() => setShowDailyUpdates(true)}
              className="p-1.5 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors" title="Updates">
              <MessageSquare size={16} />
            </button>
          )}
        </div>
      </div>

      {showDailyUpdates && (
        <DailyProgressViewer
          projectId={project.dbId}
          projectName={project.name}
          onClose={() => setShowDailyUpdates(false)}
        />
      )}
    </>
  );
};

export default ProjectCard;
