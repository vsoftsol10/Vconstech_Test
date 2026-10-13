// import React, { useState } from 'react';
// import { X, Calendar, MapPin, User, IndianRupee, Clock, MessageSquare, FileText, FolderOpen } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';
// const ProjectDetailsModal = ({ project, onClose, getStatusColor, getStatusIcon }) => {
//   const navigate = useNavigate();
//   if (!project) return null;

//   const formatDate = (date) => {
//     if (!date) return 'Not set';
//     return new Date(date).toLocaleDateString('en-IN', {
//       day: 'numeric',
//       month: 'long',
//       year: 'numeric'
//     });
//   };

//   const formatCurrency = (amount) => {
//     if (!amount) return 'Rs.0';
//     return `Rs.${parseFloat(amount).toLocaleString('en-IN')}`;
//   };

//   const calculateBudgetUsage = () => {
//     if (!project.budget || project.budget === 0) return 0;
//     return Math.min(((project.spent || 0) / project.budget) * 100, 100);
//   };

//   const budgetUsagePercent = calculateBudgetUsage();
//   const remainingBudget = (project.budget || 0) - (project.spent || 0);

//   return (
//     <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
//         {/* Header */}
//         <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-yellow-400 to-yellow-500">
//           <div className="flex-1">
//             <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
//             <p className="text-sm text-gray-600 mt-1">
//               Project ID: {project.id} - Client: {project.client}
//             </p>
//           </div>
//           <div className="flex items-center ml-4 gap-2">
//  <button
//   onClick={() => navigate('/file-managememt')}
//   className="flex items-center gap-2 px-4 py-2 bg-white text-yellow-600 font-medium text-sm rounded-lg hover:bg-yellow-50 transition-colors shadow-sm"
// >
//   <FolderOpen className="w-4 h-4" />
//   View your files here
// </button>
//   <button
//     onClick={onClose}
//     className="text-white hover:text-gray-600 transition-colors"
//   >
//     <X className="w-6 h-6" />
//   </button>
// </div>
//         </div>

//         {/* Content */}
//         <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
//           <div className="p-6 space-y-6">
//             {/* Status and Progress */}
//             <div className="grid grid-cols-1  md:grid-cols-2 gap-4">
//               <div className="bg-gray-50 rounded-lg p-4">
//                 <div className="flex items-center  justify-between mb-2">
//                   <span className="text-lg font-semibold text-gray-600">Status</span>
//                   <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
//                     {getStatusIcon(project.status)}
//                     {project.status}
//                   </span>
//                 </div>
//               </div>
//               <div className="bg-gray-50 rounded-lg p-4">
//                 <div className="flex items-center justify-between mb-2">
//                   <span className="text-lg text-gray-600">Progress</span>
//                   <span className="text-lg font-bold text-green-600">{project.progress || 0}%</span>
//                 </div>
//                 <div className="w-full bg-gray-200 rounded-full h-2">
//                   <div
//                     className="bg-green-600 h-2 rounded-full transition-all"
//                     style={{ width: `${project.progress || 0}%` }}
//                   />
//                 </div>
//               </div>
//             </div>

//             {/* Project Details */}
//             <div>
//               <h3 className="text-xl font-semibold text-gray-900 mb-3">Project Details</h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
//                   <FileText className="w-5 h-7 text-gray-600 mt-0.5" />
//                   <div>
//                     <p className="text-lg text-gray-600">Type</p>
//                     <p className="font-medium text-gray-900">{project.type || 'Not specified'}</p>
//                   </div>
//                 </div>
//                 <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
//                   <MapPin className="w-5 h-7 text-gray-600 mt-0.5" />
//                   <div>
//                     <p className="text-lg text-gray-600">Location</p>
//                     <p className="font-medium text-gray-900">{project.location || 'Not specified'}</p>
//                   </div>
//                 </div>
//                 <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
//                   <Calendar className="w-5 h-7 text-gray-600 mt-0.5" />
//                   <div>
//                     <p className="text-lg text-gray-600">Start Date</p>
//                     <p className="font-medium text-gray-900">{formatDate(project.startDate)}</p>
//                   </div>
//                 </div>
//                 <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
//                   <Clock className="w-5 h-7 text-gray-600 mt-0.5" />
//                   <div>
//                     <p className="text-lg text-gray-600">End Date</p>
//                     <p className="font-medium text-gray-900">{formatDate(project.endDate)}</p>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Budget Information */}
//             <div>
//               <h3 className="text-xl font-bold text-gray-900 mb-3">Budget Overview</h3>
//               <div className="bg-gray-50 rounded-lg p-4 space-y-4">
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <div>
//                     <p className="text-lg text-black mb-1">Total Budget</p>
//                     <p className="text-x font-bold text-gray-900">{formatCurrency(project.budget)}</p>
//                   </div>
//                   <div>
//                     <p className="text-lg font-bold text-black mb-1">Amount Spent</p>
//                     <p className="text-x  text-gray-800">{formatCurrency(project.spent)}</p>
//                   </div>
//                   <div>
//                     <p className="text-lg font-extrabold text-black mb-1">Remaining</p>
//                     <p className={`text-x  ${remainingBudget < 0 ? 'text-red-600' : 'text-green-600'}`}>
//                       {formatCurrency(remainingBudget)}
//                     </p>
//                   </div>
//                 </div>
                
//                 <div>
//                   <div className="flex justify-between text-sm mb-2">
//                     <span className="text-gray-600">Budget Utilization</span>
//                     <span className={`font-medium ${budgetUsagePercent > 100 ? 'text-red-600' : budgetUsagePercent > 80 ? 'text-orange-600' : 'text-green-600'}`}>
//                       {budgetUsagePercent.toFixed(1)}%
//                     </span>
//                   </div>
//                   <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
//                     <div
//                       className={`h-3 rounded-full transition-all ${
//                         budgetUsagePercent > 100 ? 'bg-red-500' :
//                         budgetUsagePercent > 80 ? 'bg-orange-500' : 'bg-green-500'
//                       }`}
//                       style={{ width: `${Math.min(budgetUsagePercent, 100)}%` }}
//                     />
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Team Information */}
//             {project.assignedEngineerName && (
//               <div>
//                 <h3 className="text-xl font-semibold text-gray-900 mb-3">Assigned Team</h3>
//                 <div className="bg-gray-50 rounded-lg p-4">
//                   <div className="flex items-center gap-3">
//                     <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center text-white font-semibold">
//                       {project.assignedEngineerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
//                     </div>
//                     <div>
//                       <p className="font-medium text-gray-900">{project.assignedEngineerName}</p>
//                       <p className="text-sm text-gray-600">
//                         Site Engineer
//                         {project.assignedEngineerEmpId && ` - ID: ${project.assignedEngineerEmpId}`}
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* Description */}
//             {project.description && (
//               <div>
//                 <h3 className="text-xl font-semibold text-gray-900 mb-3">Description</h3>
//                 <div className="bg-gray-50 rounded-lg p-4">
//                   <p className="text-gray-700 whitespace-pre-wrap">{project.description}</p>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div> 
//       </div>
//     </div>
//   );
// };

// export default ProjectDetailsModal;
import React, { useState } from 'react';
import { X, Calendar, MapPin, User, IndianRupee, Clock, MessageSquare, FileText, FolderOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
const ProjectDetailsModal = ({ project, onClose, getStatusColor, getStatusIcon }) => {
  const navigate = useNavigate();
  if (!project) return null;

  const formatDate = (date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'Rs.0';
    return `Rs.${parseFloat(amount).toLocaleString('en-IN')}`;
  };

  const calculateBudgetUsage = () => {
    if (!project.budget || project.budget === 0) return 0;
    return Math.min(((project.spent || 0) / project.budget) * 100, 100);
  };

  const budgetUsagePercent = calculateBudgetUsage();
  const remainingBudget = (project.budget || 0) - (project.spent || 0);

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex flex-col">
      <div className="bg-white w-full h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-yellow-400 to-yellow-500 flex-shrink-0">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
            <p className="text-sm text-gray-600 mt-1">
              Project ID: {project.id} - Client: {project.client}
            </p>
          </div>
          <div className="flex items-center ml-4 gap-2">
 <button
  onClick={() => navigate('/file-managememt')}
  className="flex items-center gap-2 px-4 py-2 bg-white text-yellow-600 font-medium text-sm rounded-lg hover:bg-yellow-50 transition-colors shadow-sm"
>
  <FolderOpen className="w-4 h-4" />
  View your files here
</button>
  <button
    onClick={onClose}
    className="text-white hover:text-gray-600 transition-colors"
  >
    <X className="w-6 h-6" />
  </button>
</div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          <div className="p-6 space-y-6">
            {/* Status and Progress */}
            <div className="grid grid-cols-1  md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center  justify-between mb-2">
                  <span className="text-lg font-semibold text-gray-600">Status</span>
                  <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                    {getStatusIcon(project.status)}
                    {project.status}
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg text-gray-600">Progress</span>
                  <span className="text-lg font-bold text-green-600">{project.progress || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${project.progress || 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Project Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <FileText className="w-5 h-7 text-gray-600 mt-0.5" />
                  <div>
                    <p className="text-lg text-gray-600">Type</p>
                    <p className="font-medium text-gray-900">{project.type || 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="w-5 h-7 text-gray-600 mt-0.5" />
                  <div>
                    <p className="text-lg text-gray-600">Location</p>
                    <p className="font-medium text-gray-900">{project.location || 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-7 text-gray-600 mt-0.5" />
                  <div>
                    <p className="text-lg text-gray-600">Start Date</p>
                    <p className="font-medium text-gray-900">{formatDate(project.startDate)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Clock className="w-5 h-7 text-gray-600 mt-0.5" />
                  <div>
                    <p className="text-lg text-gray-600">End Date</p>
                    <p className="font-medium text-gray-900">{formatDate(project.endDate)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Budget Information */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Budget Overview</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-lg text-black mb-1">Total Budget</p>
                    <p className="text-x font-bold text-gray-900">{formatCurrency(project.budget)}</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-black mb-1">Amount Spent</p>
                    <p className="text-x  text-gray-800">{formatCurrency(project.spent)}</p>
                  </div>
                  <div>
                    <p className="text-lg font-extrabold text-black mb-1">Remaining</p>
                    <p className={`text-x  ${remainingBudget < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(remainingBudget)}
                    </p>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Budget Utilization</span>
                    <span className={`font-medium ${budgetUsagePercent > 100 ? 'text-red-600' : budgetUsagePercent > 80 ? 'text-orange-600' : 'text-green-600'}`}>
                      {budgetUsagePercent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        budgetUsagePercent > 100 ? 'bg-red-500' :
                        budgetUsagePercent > 80 ? 'bg-orange-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(budgetUsagePercent, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Team Information */}
            {project.assignedEngineerName && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Assigned Team</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center text-white font-semibold">
                      {project.assignedEngineerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{project.assignedEngineerName}</p>
                      <p className="text-sm text-gray-600">
                        Site Engineer
                        {project.assignedEngineerEmpId && ` - ID: ${project.assignedEngineerEmpId}`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            {project.description && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Description</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{project.description}</p>
                </div>
              </div>
            )}
          </div>
        </div> 
      </div>
    </div>
  );
};

export default ProjectDetailsModal;

