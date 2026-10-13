// import React, { useState, useEffect, useMemo, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import {
//   LayoutGrid, Package, DollarSign, FileText, TrendingUp,
//   Calendar, Users, ArrowRight, ChevronLeft, ChevronRight,
//   IndianRupee, AlertCircle, Loader, MapPin, Database
// } from 'lucide-react';
// import Navbar from '../../components/common/Navbar';
// import SidePannel from '../../components/common/SidePannel';
// import LoadingScreen from '../../components/common/Loadingscreen';
// import { getToken } from '../../utils/tabToken';

// const API_BASE_URL = import.meta.env.VITE_API_URL;

// /* ── tiny helpers ── */
// const DonutChart = ({ total, active, pending, completed }) => {
//   const cx = 90, cy = 90, r = 68, stroke = 14;
//   const circ = 2 * Math.PI * r;
//   const sum = total || 1;
//   const segments = [
//     { value: active, color: '#22C55E' },
//     { value: pending, color: '#FBBF24' },
//     { value: completed, color: '#3B82F6' },
//   ];
//   let offset = 0;
//   const arcs = segments.map((seg, i) => {
//     const dash = (seg.value / sum) * circ;
//     const arc = (
//       <circle key={i} cx={cx} cy={cy} r={r}
//         fill="none" stroke={seg.color} strokeWidth={stroke}
//         strokeDasharray={`${dash} ${circ - dash}`}
//         strokeDashoffset={-offset}
//         style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
//       />
//     );
//     offset += dash;
//     return arc;
//   });

//   return (
//     <svg width="180" height="180" viewBox="0 0 180 180">
//       <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
//       {total > 0 ? arcs : null}
//       <text x={cx} y={cy - 8} textAnchor="middle" fontSize="26" fontWeight="700" fill="#111827">{total}</text>
//       <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11" fill="#374151">Total Contracts</text>
//     </svg>
//   );
// };

// const Dashboard = () => {
//   const navigate = useNavigate();
//   const [currentSlide, setCurrentSlide] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [dashboardData, setDashboardData] = useState({
//     projects: [],
//     materials: { metrics: {}, usageLogs: [] },
//     financial: { projects: [], count: 0 },
//     engineers: [],
//     contractSummary: { total: 0, active: 0, completed: 0, pending: 0, totalContractValue: 0 }
//   });

//   useEffect(() => { document.title = "Vconstech - Admin"; }, []);

//   const getAuthToken = () => getToken();

//   const fetchData = async (endpoint) => {
//     const token = getAuthToken();
//     const response = await fetch(`${API_BASE_URL}${endpoint}`, {
//       headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
//     });
//     const contentType = response.headers.get('content-type');
//     if (!contentType || !contentType.includes('application/json')) {
//       throw new Error(`Expected JSON but got ${contentType || 'unknown'} from ${endpoint}`);
//     }
//     const data = await response.json();
//     if (!response.ok) throw new Error(data.error || 'An error occurred');
//     return data;
//   };

//   useEffect(() => {
//     const fetchAllData = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const token = getAuthToken();
//         if (!token) throw new Error('No authentication token found. Please login.');
//         const results = await Promise.allSettled([
//           fetchData('/projects'),
//           fetchData('/materials/dashboard-summary'),
//           fetchData('/employees'),
//           fetchData('/contracts/dashboard-summary')
//         ]);
//         const projects = results[0].status === 'fulfilled' ? results[0].value.projects || [] : [];
//         const materials = results[1].status === 'fulfilled' ? results[1].value.data || { metrics: {}, usageLogs: [] } : { metrics: {}, usageLogs: [] };
//         const materialCost = projects.reduce(
//           (sum, project) => sum + (parseFloat(project.materialCost ?? project.budgetSummary?.materialCost ?? 0) || 0),
//           0
//         );
//         setDashboardData({
//           projects,
//           materials: {
//             ...materials,
//             metrics: {
//               ...materials.metrics,
//               totalCost: Math.round(materialCost * 100) / 100
//             }
//           },
//           financial: { projects, count: projects.length },
//           engineers: results[2].status === 'fulfilled' ? results[2].value.employees || [] : [],
//           contractSummary: results[3].status === 'fulfilled'
//             ? results[3].value.summary || { total: 0, active: 0, completed: 0, pending: 0, totalContractValue: 0 }
//             : { total: 0, active: 0, completed: 0, pending: 0, totalContractValue: 0 }
//         });
//         results.forEach((res, idx) => {
//           if (res.status === 'rejected') console.warn(`Failed to fetch data [${idx}]:`, res.reason);
//         });
//       } catch (err) {
//         console.error('Dashboard data fetch error:', err);
//         setError(err.message || 'Failed to load dashboard data');
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchAllData();
//   }, []);

//   const calculateSummaryCards = useCallback(() => {
//     const ongoingProjects = dashboardData.projects.filter(p => ['ONGOING', 'In Progress'].includes(p.status));
//     const totalProjectBudget = dashboardData.financial.projects.reduce(
//       (sum, p) => sum + (parseFloat(p.totalBudget ?? p.budget ?? p.quotationAmount ?? 0) || 0),
//       0
//     );
//     const activeContracts = dashboardData.contractSummary.active || 0;
//     return [
//       {
//         title: 'Projects',
//         value: dashboardData.projects.length,
//         subtitle: `${ongoingProjects.length} Ongoing`,
//         iconBg: 'bg-orange-100',
//         iconColor: 'text-orange-500',
//         borderColor: 'border-b-orange-400',
//         sparkColor: '#f59e0b',
//         sparkPoints: '0,20 10,14 20,18 30,10 40,15 50,8 60,12',
//         Icon: LayoutGrid,
//       },
//       {
//         title: 'Materials',
//         value: dashboardData.materials.metrics?.totalMaterials || 0,
//         subtitle: `${dashboardData.materials.usageLogs?.length || 0} Recent`,
//         iconBg: 'bg-green-100',
//         iconColor: 'text-green-500',
//         borderColor: 'border-b-green-500',
//         sparkColor: '#22c55e',
//         sparkPoints: '0,18 10,22 20,12 30,16 40,8 50,14 60,10',
//         Icon: Package,
//       },
//       {
//         title: 'Finance',
//         value: `₹${(totalProjectBudget / 100000).toFixed(1)}L`,
//         subtitle: `${dashboardData.financial.count || 0} Projects`,
//         iconBg: 'bg-purple-100',
//         iconColor: 'text-purple-500',
//         borderColor: 'border-b-purple-500',
//         sparkColor: '#a855f7',
//         sparkPoints: '0,16 10,20 20,10 30,18 40,12 50,20 60,8',
//         Icon: IndianRupee,
//       },
//       {
//         title: 'Contracts',
//         value: dashboardData.contractSummary.total || 0,
//         subtitle: `${activeContracts} Active`,
//         iconBg: 'bg-red-100',
//         iconColor: 'text-red-500',
//         borderColor: 'border-b-red-400',
//         sparkColor: '#f97316',
//         sparkPoints: '0,12 10,18 20,14 30,20 40,10 50,16 60,12',
//         Icon: FileText,
//       },
//     ];
//   }, [dashboardData]);

//   const getOngoingProjects = useCallback(() => {
//     return dashboardData.projects
//       .filter(p => ['ONGOING', 'In Progress'].includes(p.status))
//       .slice(0, 4)
//       .map(project => {
//         const actualProgress = project.actualProgress || 0;
//         const start = new Date(project.startDate);
//         const end = new Date(project.endDate);
//         const totalDays = (end - start) / (1000 * 60 * 60 * 24);
//         const elapsed = (new Date() - start) / (1000 * 60 * 60 * 24);
//         const timeProgress = Math.min(Math.max(Math.round((elapsed / totalDays) * 100), 0), 100);
//         const progressStatus = actualProgress > timeProgress + 10 ? 'ahead' : actualProgress < timeProgress - 10 ? 'behind' : 'ontrack';
//         return {
//           ...project, progress: actualProgress, timeProgress, progressStatus,
//           client: project.clientName || 'N/A',
//           location: project.location || 'Not specified',
//           projectType: project.projectType || 'General'
//         };
//       });
//   }, [dashboardData.projects]);

//   const getContractStats = useCallback(() => {
//     return {
//       active: dashboardData.contractSummary.active || 0,
//       completed: dashboardData.contractSummary.completed || 0,
//       pending: dashboardData.contractSummary.pending || 0,
//       total: dashboardData.contractSummary.total || 0
//     };
//   }, [dashboardData.contractSummary]);

//   const summaryCards = useMemo(() => calculateSummaryCards(), [calculateSummaryCards]);
//   const ongoingProjects = useMemo(() => getOngoingProjects(), [getOngoingProjects]);
//   const contractStats = useMemo(() => getContractStats(), [getContractStats]);

//   useEffect(() => {
//     if (ongoingProjects.length === 0) return;
//     const timer = setInterval(() => {
//       setCurrentSlide(prev => (prev + 1) % ongoingProjects.length);
//     }, 5000);
//     return () => clearInterval(timer);
//   }, [ongoingProjects]);

//   if (loading) return <LoadingScreen message="Loading dashboard..." />;

//   if (error) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
//         <div className="bg-white rounded-2xl shadow p-8 max-w-sm w-full text-center">
//           <AlertCircle className="text-red-400 mx-auto mb-3" size={40} />
//           <h2 className="text-lg font-semibold text-gray-800 mb-2">Failed to load</h2>
//           <p className="text-gray-500 text-sm mb-5">{error}</p>
//           <button onClick={() => window.location.reload()}
//             className="bg-yellow-500 text-black px-6 py-2 rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors">
//             Retry
//           </button>
//         </div>
//       </div>
//     );
//   }

//   const navSlide = (dir) => setCurrentSlide(prev => (prev + dir + ongoingProjects.length) % ongoingProjects.length);

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Main content */}
//       <div className="pt-20 md:pl-64 md:pt-25">
//         <div className="px-4 sm:px-6 pt-4 pb-24 md:pb-10 max-w-6xl mx-auto space-y-6">

//           {/* Page heading */}
//           <div>
//             <h1 className="text-2xl font-bold leading-tight tracking-tight text-gray-900">Dashboard Overview</h1>
//             <p className="text-sm text-gray-500 mt-1">Here's what's happening with your projects.</p>
//           </div>

//           {/* ── Summary Cards ── */}
//           <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//             {summaryCards.map((card, i) => (
//               <div key={i}
//                 className="bg-white rounded-2xl px-4 pt-4 pb-3 shadow-sm border border-gray-100 border-b-4 flex flex-col gap-2 cursor-pointer hover:shadow-md transition-shadow"
//                 style={{ borderBottomColor: card.sparkColor }}
//               >
//                 {/* Icon + sparkline row */}
//                 <div className="flex items-center justify-between">
//                   <div className={`w-10 h-10 rounded-full ${card.iconBg} flex items-center justify-center flex-shrink-0`}>
//                     <card.Icon size={18} className={card.iconColor} strokeWidth={1.8} />
//                   </div>
//                 </div>
//                 {/* Value + label */}
//                 <div>
//                   <p className="text-xs text-gray-500 font-medium">{card.title}</p>
//                   <p className="text-2xl font-bold text-gray-900 leading-tight mt-0.5">{card.value}</p>
//                   <p className="text-xs text-gray-400 mt-0.5">{card.subtitle}</p>
//                 </div>
//               </div>
//             ))}
//           </div>

//           {/* ── Ongoing Projects Carousel (shown only when there are ongoing projects) ── */}
//           {ongoingProjects.length > 0 && (
//             <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
//               <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
//                 <h2 className="text-lg font-bold text-gray-800">Ongoing Projects</h2>
//                 <div className="flex gap-1.5">
//                   <button onClick={() => navSlide(-1)}
//                     className="p-1.5 rounded-lg bg-gray-100 hover:bg-yellow-400 transition-colors">
//                     <ChevronLeft size={16} />
//                   </button>
//                   <button onClick={() => navSlide(1)}
//                     className="p-1.5 rounded-lg bg-gray-100 hover:bg-yellow-400 transition-colors">
//                     <ChevronRight size={16} />
//                   </button>
//                 </div>
//               </div>

//               <div className="relative overflow-hidden">
//                 <div className="flex transition-transform duration-500 ease-in-out"
//                   style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
//                   {ongoingProjects.map((project) => (
//                     <div key={project.id} className="min-w-full p-5">
//                       <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-4">
//                         <div>
//                           <div className="flex flex-wrap gap-1.5 mb-2">
//                             <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">{project.projectId}</span>
//                             <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">{project.projectType}</span>
//                           </div>
//                           <h3 className="text-xl font-bold text-gray-900">{project.name}</h3>
//                           {project.description && (
//                             <p className="text-xs text-gray-500 mt-1 line-clamp-2">{project.description}</p>
//                           )}
//                         </div>
//                         <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
//                           {[
//                             { icon: Users, label: 'Client', value: project.client, color: 'text-blue-500' },
//                             { icon: MapPin, label: 'Location', value: project.location, color: 'text-red-500' },
//                             ...(project.budget ? [{ icon: IndianRupee, label: 'Budget', value: `₹${(project.budget / 100000).toFixed(2)}L`, color: 'text-green-500' }] : []),
//                             { icon: Calendar, label: 'End Date', value: new Date(project.endDate).toLocaleDateString(), color: 'text-purple-500' }
//                           ].map((item, i) => (
//                             <div key={i} className="flex items-start gap-2 bg-white rounded-lg p-2.5 border border-gray-100">
//                               <item.icon size={14} className={`${item.color} mt-0.5 flex-shrink-0`} />
//                               <div className="min-w-0">
//                                 <p className="text-xs text-gray-400">{item.label}</p>
//                                 <p className="text-xs font-semibold text-gray-800 truncate">{item.value}</p>
//                               </div>
//                             </div>
//                           ))}
//                         </div>
//                         <div className="bg-white rounded-lg border border-gray-100 p-3">
//                           <div className="flex justify-between items-center mb-2">
//                             <span className="text-sm font-semibold text-gray-700">Progress</span>
//                             <span className="text-sm font-bold text-yellow-600">{project.progress}%</span>
//                           </div>
//                           <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
//                             <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-full rounded-full transition-all duration-500"
//                               style={{ width: `${project.progress}%` }} />
//                           </div>
//                           <div className="flex items-center justify-between mt-1.5 text-xs text-gray-400">
//                             <span>Time: {project.timeProgress}%</span>
//                             {project.progressStatus === 'ahead' && <span className="text-green-600 font-medium">↑ Ahead</span>}
//                             {project.progressStatus === 'behind' && <span className="text-red-500 font-medium">↓ Behind</span>}
//                             {project.progressStatus === 'ontrack' && <span className="text-blue-500 font-medium">→ On track</span>}
//                           </div>
//                         </div>
//                         <button
//                           onClick={() => navigate(`/project/${encodeURIComponent(project.projectId || project.id)}`)}
//                           className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-black text-sm font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-transform">
//                           View Project Details <ArrowRight size={15} />
//                         </button>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               <div className="flex justify-center gap-1.5 pb-3">
//                 {ongoingProjects.map((_, index) => (
//                   <button key={index} onClick={() => setCurrentSlide(index)}
//                     className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide ? 'bg-yellow-500 w-6' : 'bg-gray-300 w-2'}`} />
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* ── Bottom row: Contract Statistics + Quick Stats ── */}
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

//             {/* Contract Statistics */}
//             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
//               <div className="flex items-center justify-between mb-5">
//                 <div className="flex items-center gap-2">
//                   <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
//                     {/* bar chart icon */}
//                     <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
//                       <rect x="1" y="8" width="3" height="7" rx="1" fill="#f97316"/>
//                       <rect x="6" y="4" width="3" height="11" rx="1" fill="#f97316"/>
//                       <rect x="11" y="1" width="3" height="14" rx="1" fill="#f97316"/>
//                     </svg>
//                   </div>
//                   <h2 className="text-base font-bold text-gray-800">Contract Statistics</h2>
//                 </div>
//               </div>

//               <div className="flex items-center gap-6">
//                 {/* Donut chart */}
//                 <div className="flex-shrink-0">
//                   <DonutChart
//                     total={contractStats.total}
//                     active={contractStats.active}
//                     pending={contractStats.pending}
//                     completed={contractStats.completed}
//                   />
//                 </div>
//                 {/* Legend */}
//                 <div className="flex-1 space-y-3">
//                   {[
//                     { label: 'In Progress Contracts', value: contractStats.active,    dot: 'bg-[#22C55E]' },
//                     { label: 'Pending Contracts',   value: contractStats.pending,   dot: 'bg-[#FBBF24]' },
//                     { label: 'Completed Contracts', value: contractStats.completed, dot: 'bg-[#3B82F6]' },
//                   ].map((stat, i) => (
//                     <div key={i} className="flex items-center justify-between">
//                       <div className="flex items-center gap-2.5">
//                         <span className={`w-2.5 h-2.5 rounded-full ${stat.dot} flex-shrink-0`} />
//                         <span className="text-sm text-gray-700">{stat.label}</span>
//                       </div>
//                       <span className="text-sm font-bold text-gray-900">{stat.value}</span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>

//             {/* Quick Stats */}
//             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
//               <div className="flex items-center justify-between mb-5">
//                 <div className="flex items-center gap-2">
//                   <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center">
//                     <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
//                       <circle cx="8" cy="8" r="6" stroke="#f59e0b" strokeWidth="1.5"/>
//                       <path d="M8 5v3l2 2" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
//                     </svg>
//                   </div>
//                   <h2 className="text-base font-bold text-gray-800">Quick Stats</h2>
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-3">
//                 {[
//                   {
//                     label: 'Active Engineers',
//                     value: dashboardData.engineers.filter((engineer) => (engineer.status || 'Active') === 'Active').length,
//                     cardBg: 'bg-[#ECFDF5]',
//                     iconBg: 'bg-[#ECFDF5]',
//                     Icon: Users,
//                     iconColor: 'text-[#16A34A]',
//                   },
//                   {
//                     label: 'Total Materials',
//                     value: dashboardData.materials.metrics?.totalMaterials || 0,
//                     cardBg: 'bg-[#EFF6FF]',
//                     iconBg: 'bg-[#EFF6FF]',
//                     Icon: Package,
//                     iconColor: 'text-[#2563EB]',
//                   },
//                   {
//                     label: 'Total Projects',
//                     value: dashboardData.financial.count || 0,
//                     cardBg: 'bg-[#F3E8FF]',
//                     iconBg: 'bg-[#F3E8FF]',
//                     Icon: IndianRupee,
//                     iconColor: 'text-[#9333EA]',
//                   },
//                   {
//                     label: 'Total Contract Value',
//                     value: `₹${((dashboardData.contractSummary.totalContractValue || 0) / 100000).toFixed(1)}L`,
//                     cardBg: 'bg-[#FFFBEB]',
//                     iconBg: 'bg-[#FFFBEB]',
//                     Icon: Database,
//                     iconColor: 'text-[#D97706]',
//                   },
//                 ].map((stat, i) => (
//                   <div key={i} className={`${stat.cardBg} rounded-2xl border border-gray-200 shadow-sm p-3 flex flex-col gap-2`}>
//                     <div className="flex items-start justify-between">
//                       <div className={`w-10 h-10 rounded-full ${stat.iconBg} flex items-center justify-center flex-shrink-0`}>
//                         <stat.Icon size={18} className={stat.iconColor} strokeWidth={1.8} />
//                       </div>
//                     </div>
//                     <div>
//                       <p className="text-xs text-gray-500">{stat.label}</p>
//                       <p className="text-xl font-bold text-gray-900 mt-0.5">{stat.value}</p>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>

//           </div>

//           {/* Footer */}
//           <p className="text-center text-xs text-gray-400 pb-4">
//             © 2025 vSoft Technologies. All rights reserved.
//           </p>

//         </div>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;


import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutGrid, Package, FileText, FileSpreadsheet,
  Calendar, Users, User, Box, Clock, ArrowRight, ChevronLeft, ChevronRight,
  IndianRupee, AlertCircle, MapPin
} from 'lucide-react';
import LoadingScreen from '../../components/common/Loadingscreen';
import { getToken } from '../../utils/tabToken';

const API_BASE_URL = import.meta.env.VITE_API_URL;

/* ── tiny helpers ── */
const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
};

const getProjectInfoItems = (project) => {
  const budget = parseFloat(project.budget ?? project.totalBudget ?? project.quotationAmount ?? 0) || 0;
  return [
    { icon: Users, label: 'Client', value: project.client, color: 'text-blue-500' },
    { icon: MapPin, label: 'Location', value: project.location, color: 'text-red-500' },
    ...(budget > 0
      ? [{ icon: IndianRupee, label: 'Budget', value: `₹${(budget / 100000).toFixed(2)}L`, color: 'text-green-500' }]
      : []),
    { icon: Calendar, label: 'End Date', value: formatDate(project.endDate), color: 'text-purple-500' },
  ];
};

const DonutChart = ({ total, active, pending, completed }) => {
  const cx = 90, cy = 90, r = 68, stroke = 14;
  const circ = 2 * Math.PI * r;
  const sum = total || 1;
  const segments = [
    { value: active, color: '#22C55E' },
    { value: pending, color: '#FBBF24' },
    { value: completed, color: '#3B82F6' },
  ];
  let offset = 0;
  const arcs = segments.map((seg, i) => {
    const dash = (seg.value / sum) * circ;
    const arc = (
      <circle key={i} cx={cx} cy={cy} r={r}
        fill="none" stroke={seg.color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={-offset}
        style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
      />
    );
    offset += dash;
    return arc;
  });

  return (
    <svg width="180" height="180" viewBox="0 0 180 180">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
      {total > 0 ? arcs : null}
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize="26" fontWeight="700" fill="#111827">{total}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11" fill="#374151">Total Contracts</text>
    </svg>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    projects: [],
    materials: { metrics: {}, usageLogs: [] },
    financial: { projects: [], count: 0 },
    engineers: [],
    contractSummary: { total: 0, active: 0, completed: 0, pending: 0, totalContractValue: 0 }
  });

  useEffect(() => { document.title = "Vconstech - Admin"; }, []);

  const getAuthToken = () => getToken();

  const fetchData = async (endpoint) => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Expected JSON but got ${contentType || 'unknown'} from ${endpoint}`);
    }
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'An error occurred');
    return data;
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getAuthToken();
        if (!token) throw new Error('No authentication token found. Please login.');
        const results = await Promise.allSettled([
          fetchData('/projects'),
          fetchData('/materials/dashboard-summary'),
          fetchData('/employees'),
          fetchData('/contracts/dashboard-summary')
        ]);
        const projects = results[0].status === 'fulfilled' ? results[0].value.projects || [] : [];
        const materials = results[1].status === 'fulfilled' ? results[1].value.data || { metrics: {}, usageLogs: [] } : { metrics: {}, usageLogs: [] };
        const materialCost = projects.reduce(
          (sum, project) => sum + (parseFloat(project.materialCost ?? project.budgetSummary?.materialCost ?? 0) || 0),
          0
        );
        setDashboardData({
          projects,
          materials: {
            ...materials,
            metrics: {
              ...materials.metrics,
              totalCost: Math.round(materialCost * 100) / 100
            }
          },
          financial: { projects, count: projects.length },
          engineers: results[2].status === 'fulfilled' ? results[2].value.employees || [] : [],
          contractSummary: results[3].status === 'fulfilled'
            ? results[3].value.summary || { total: 0, active: 0, completed: 0, pending: 0, totalContractValue: 0 }
            : { total: 0, active: 0, completed: 0, pending: 0, totalContractValue: 0 }
        });
        results.forEach((res, idx) => {
          if (res.status === 'rejected') console.warn(`Failed to fetch data [${idx}]:`, res.reason);
        });
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const calculateSummaryCards = useCallback(() => {
    const ongoingProjects = dashboardData.projects.filter(p => ['ONGOING', 'In Progress'].includes(p.status));
    const totalProjectBudget = dashboardData.financial.projects.reduce(
      (sum, p) => sum + (parseFloat(p.totalBudget ?? p.budget ?? p.quotationAmount ?? 0) || 0),
      0
    );
    const activeContracts = dashboardData.contractSummary.active || 0;
    return [
      {
        title: 'Projects',
        value: dashboardData.projects.length,
        subtitle: `${ongoingProjects.length} Ongoing`,
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-500',
        borderColor: 'border-b-orange-400',
        sparkColor: '#f59e0b',
        sparkPoints: '0,20 10,14 20,18 30,10 40,15 50,8 60,12',
        Icon: LayoutGrid,
      },
      {
        title: 'Materials',
        value: dashboardData.materials.metrics?.totalMaterials || 0,
        subtitle: `${dashboardData.materials.usageLogs?.length || 0} Recent`,
        iconBg: 'bg-green-100',
        iconColor: 'text-green-500',
        borderColor: 'border-b-green-500',
        sparkColor: '#22c55e',
        sparkPoints: '0,18 10,22 20,12 30,16 40,8 50,14 60,10',
        Icon: Package,
      },
      {
        title: 'Finance',
        value: `₹${(totalProjectBudget / 100000).toFixed(1)}L`,
        subtitle: `${dashboardData.financial.count || 0} Projects`,
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-500',
        borderColor: 'border-b-purple-500',
        sparkColor: '#a855f7',
        sparkPoints: '0,16 10,20 20,10 30,18 40,12 50,20 60,8',
        Icon: IndianRupee,
      },
      {
        title: 'Contracts',
        value: dashboardData.contractSummary.total || 0,
        subtitle: `${activeContracts} Active`,
        iconBg: 'bg-red-100',
        iconColor: 'text-red-500',
        borderColor: 'border-b-red-400',
        sparkColor: '#f97316',
        sparkPoints: '0,12 10,18 20,14 30,20 40,10 50,16 60,12',
        Icon: FileText,
      },
    ];
  }, [dashboardData]);

  const getOngoingProjects = useCallback(() => {
    return dashboardData.projects
      .filter(p => ['ONGOING', 'In Progress'].includes(p.status))
      .slice(0, 4)
      .map(project => {
        const actualProgress = project.actualProgress || 0;
        const start = new Date(project.startDate);
        const end = new Date(project.endDate);
        const totalDays = (end - start) / (1000 * 60 * 60 * 24);
        const elapsed = (new Date() - start) / (1000 * 60 * 60 * 24);
        const rawTimeProgress = totalDays > 0 ? Math.round((elapsed / totalDays) * 100) : 0;
        const timeProgress = Math.min(Math.max(Number.isFinite(rawTimeProgress) ? rawTimeProgress : 0, 0), 100);
        const progressStatus = actualProgress > timeProgress + 10 ? 'ahead' : actualProgress < timeProgress - 10 ? 'behind' : 'ontrack';
        return {
          ...project, progress: actualProgress, timeProgress, progressStatus,
          client: project.clientName || 'N/A',
          location: project.location || 'Not specified',
          projectType: project.projectType || 'General'
        };
      });
  }, [dashboardData.projects]);

  const getContractStats = useCallback(() => {
    return {
      active: dashboardData.contractSummary.active || 0,
      completed: dashboardData.contractSummary.completed || 0,
      pending: dashboardData.contractSummary.pending || 0,
      total: dashboardData.contractSummary.total || 0
    };
  }, [dashboardData.contractSummary]);

  const summaryCards = useMemo(() => calculateSummaryCards(), [calculateSummaryCards]);
  const ongoingProjects = useMemo(() => getOngoingProjects(), [getOngoingProjects]);
  const contractStats = useMemo(() => getContractStats(), [getContractStats]);

  useEffect(() => {
    if (ongoingProjects.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % ongoingProjects.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [ongoingProjects]);

  if (loading) return <LoadingScreen message="Loading dashboard..." />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow p-8 max-w-sm w-full text-center">
          <AlertCircle className="text-red-400 mx-auto mb-3" size={40} />
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Failed to load</h2>
          <p className="text-gray-500 text-sm mb-5">{error}</p>
          <button onClick={() => window.location.reload()}
            className="bg-yellow-500 text-black px-6 py-2 rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const navSlide = (dir) => setCurrentSlide(prev => (prev + dir + ongoingProjects.length) % ongoingProjects.length);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main content */}
      <div className="pt-20 md:pl-64 md:pt-25">
        <div className="px-4 sm:px-6 pt-4 pb-24 md:pb-10 max-w-6xl mx-auto space-y-6">

          {/* Page heading */}
          <div>
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-gray-900">Dashboard Overview</h1>
            <p className="text-sm text-gray-500 mt-1">Here's what's happening with your projects.</p>
          </div>

          {/* ── Summary Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {summaryCards.map((card, i) => (
              <div key={i}
                className="bg-white rounded-2xl px-4 pt-4 pb-3 shadow-sm border border-gray-100 border-b-4 flex flex-col gap-2 cursor-pointer hover:shadow-md transition-shadow"
                style={{ borderBottomColor: card.sparkColor }}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-full ${card.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <card.Icon size={18} className={card.iconColor} strokeWidth={1.8} />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 leading-tight mt-0.5">{card.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{card.subtitle}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Ongoing Projects Carousel ── */}
          {ongoingProjects.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-800">Ongoing Projects</h2>
                <div className="flex gap-1.5">
                  <button onClick={() => navSlide(-1)}
                    className="p-1.5 rounded-lg bg-gray-100 hover:bg-yellow-400 transition-colors">
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={() => navSlide(1)}
                    className="p-1.5 rounded-lg bg-gray-100 hover:bg-yellow-400 transition-colors">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div className="relative overflow-hidden">
                <div className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                  {ongoingProjects.map((project) => {
                    const infoItems = getProjectInfoItems(project);
                    return (
                      <div key={project.id} className="min-w-full p-5">
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-4">
                          <div>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">{project.projectId}</span>
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">{project.projectType}</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">{project.name}</h3>
                            {project.description && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{project.description}</p>
                            )}
                          </div>

                          {/* Info cards: 2 per row on mobile/tablet, one row on laptop */}
                          <div
                            className={`grid grid-cols-2 gap-2 ${
                              infoItems.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
                            }`}
                          >
                            {infoItems.map((item, i) => (
                              <div key={i} className="flex items-start gap-2 bg-white rounded-lg p-2.5 border border-gray-100">
                                <item.icon size={14} className={`${item.color} mt-0.5 flex-shrink-0`} />
                                <div className="min-w-0">
                                  <p className="text-xs text-gray-400">{item.label}</p>
                                  <p className="text-xs font-semibold text-gray-800 truncate" title={String(item.value)}>
                                    {item.value}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="bg-white rounded-lg border border-gray-100 p-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-semibold text-gray-700">Progress</span>
                              <span className="text-sm font-bold text-yellow-600">{project.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                              <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${project.progress}%` }} />
                            </div>
                            <div className="flex items-center justify-between mt-1.5 text-xs text-gray-400">
                              <span>Time: {project.timeProgress}%</span>
                              {project.progressStatus === 'ahead' && <span className="text-green-600 font-medium">↑ Ahead</span>}
                              {project.progressStatus === 'behind' && <span className="text-red-500 font-medium">↓ Behind</span>}
                              {project.progressStatus === 'ontrack' && <span className="text-blue-500 font-medium">→ On track</span>}
                            </div>
                          </div>

                          <button
                            onClick={() => navigate(`/project/${encodeURIComponent(project.projectId || project.id)}`)}
                            className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-black text-sm font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-transform">
                            View Project Details <ArrowRight size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-center gap-1.5 pb-3">
                {ongoingProjects.map((_, index) => (
                  <button key={index} onClick={() => setCurrentSlide(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide ? 'bg-yellow-500 w-6' : 'bg-gray-300 w-2'}`} />
                ))}
              </div>
            </div>
          )}

         {/* ── Bottom row: Contract Statistics + Quick Stats ── */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

  {/* Contract Statistics */}
  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
    <div className="flex items-center gap-2 mb-5">
      <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
        <FileText size={16} className="text-orange-500" strokeWidth={1.8} />
      </div>
      <h2 className="text-base font-bold text-gray-800">Contract Statistics</h2>
    </div>

    <div className="flex items-center gap-6">
      <div className="flex-shrink-0">
        <DonutChart
          total={contractStats.total}
          active={contractStats.active}
          pending={contractStats.pending}
          completed={contractStats.completed}
        />
      </div>
      <div className="flex-1 space-y-3">
        {[
          { label: 'In Progress Contracts', value: contractStats.active,    dot: 'bg-[#22C55E]' },
          { label: 'Pending Contracts',     value: contractStats.pending,   dot: 'bg-[#FBBF24]' },
          { label: 'Completed Contracts',   value: contractStats.completed, dot: 'bg-[#3B82F6]' },
        ].map((stat, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full ${stat.dot} flex-shrink-0`} />
              <span className="text-sm text-gray-700">{stat.label}</span>
            </div>
            <span className="text-sm font-bold text-gray-900">{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  </div>

  {/* Quick Stats */}
  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
    <div className="flex items-center gap-2 mb-5">
      <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center">
        <Clock size={16} className="text-amber-500" strokeWidth={1.8} />
      </div>
      <h2 className="text-base font-bold text-gray-800">Quick Stats</h2>
    </div>

    <div className="grid grid-cols-2 gap-3">
      {[
        {
          label: 'Active Engineers',
          value: dashboardData.engineers.filter((e) => (e.status || 'Active') === 'Active').length,
          cardBg: 'bg-[#ECFDF5]',
          Icon: User,
          iconColor: 'text-[#16A34A]',
        },
        {
          label: 'Total Materials',
          value: dashboardData.materials.metrics?.totalMaterials || 0,
          cardBg: 'bg-[#EFF6FF]',
          Icon: Box,
          iconColor: 'text-[#2563EB]',
        },
        {
          label: 'Total Projects',
          value: dashboardData.financial.count || 0,
          cardBg: 'bg-[#F3E8FF]',
          Icon: FileText,
          iconColor: 'text-[#9333EA]',
        },
        {
          label: 'Total Contract Value',
          value: `₹${((dashboardData.contractSummary.totalContractValue || 0) / 100000).toFixed(1)}L`,
          cardBg: 'bg-[#FFFBEB]',
          Icon: FileSpreadsheet,
          iconColor: 'text-[#D97706]',
        },
      ].map((stat, i) => (
        <div key={i} className={`${stat.cardBg} rounded-2xl border border-gray-200 shadow-sm p-3 flex flex-col gap-2`}>
          <stat.Icon size={22} className={stat.iconColor} strokeWidth={1.6} />
          <div>
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  </div>

</div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 pb-4">
            © 2025 vSoft Technologies. All rights reserved.
          </p>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;