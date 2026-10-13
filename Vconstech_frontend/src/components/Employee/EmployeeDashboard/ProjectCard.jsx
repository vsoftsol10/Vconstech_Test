import React from 'react';
import { FileDown, Percent, MessageSquare, X, Send } from 'lucide-react';
import ProgressSlider from './ProgressSlider';
import ProgressMessageInput from './ProgressMessageInput';
import { isProjectExecutionEnabled } from '../../../utils/dashboardUtils';

const formatProjectDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const getAssignedTeam = (project) => {
  const team = [
    project.assignedEngineer?.name,
    ...(project.teamMembers || []).map((member) => member.name || member.employee?.name),
    ...(project.assignments || []).map((assignment) => assignment.user?.name || assignment.engineer?.name)
  ].filter(Boolean);

  return [...new Set(team)].join(', ') || 'N/A';
};

const ProjectCard = ({
  project,
  showProgressSlider,
  tempProgress,
  isUpdatingProgress,
  showProgressMessage,
  progressMessage,
  isSubmittingMessage,
  onOpenProgressSlider,
  onCloseProgressSlider,
  onUpdateProgress,
  onProgressChange,
  onToggleProgressMessage,
  onCloseProgressMessage,
  onSubmitProgressMessage,
  onProgressMessageChange,
  onDownloadReport,
  getStatusColor,
  getStatusDisplay
}) => {
  const canExecute = isProjectExecutionEnabled(project.status);

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-yellow-300 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{project.name}</h3>
          <p className="text-sm text-gray-600">{project.clientName}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
            {getStatusDisplay(project.status)}
          </span>
          <button 
            onClick={() => onDownloadReport(project)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            title="Download Project Report"
          >
            <FileDown className="w-4 h-4" />
            <span className="hidden sm:inline">Report</span>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-3">
        <div>
          <p className="text-gray-600">Type</p>
          <p className="font-medium text-gray-900">{project.projectType || 'N/A'}</p>
        </div>
        <div>
          <p className="text-gray-600">Location</p>
          <p className="font-medium text-gray-900">{project.location || 'N/A'}</p>
        </div>
        <div>
          <p className="text-gray-600">Start Date</p>
          <p className="font-medium text-gray-900">{formatProjectDate(project.startDate)}</p>
        </div>
        <div>
          <p className="text-gray-600">End Date</p>
          <p className="font-medium text-gray-900">{formatProjectDate(project.endDate)}</p>
        </div>
        <div>
          <p className="text-gray-600">Assigned Team</p>
          <p className="font-medium text-gray-900">{getAssignedTeam(project)}</p>
        </div>
      </div>
      
      {project.budget && (
        <div className="text-sm text-gray-600">
          Budget: ₹{parseFloat(project.budget).toLocaleString('en-IN')}
        </div>
      )}

      {/* Progress Section */}
      <div className="mt-5 mb-3 p-3 bg-gradient-to-r from-yellow-50 to-yellow-50 rounded-lg border border-yellow-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <Percent className="w-4 h-4" />
            Project Progress
          </span>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-black-600">{project.progress || 0}%</span>
            {canExecute && !showProgressSlider[project.id] && !showProgressMessage[project.id] && (
              <>
                <button
                  onClick={() => onOpenProgressSlider(project.id, project.progress || 0)}
                  className="text-xs px-2 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                >
                  Update
                </button>
                <button
                  onClick={() => onToggleProgressMessage(project.id)}
                  className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-1"
                  title="Add daily progress message"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span className="hidden sm:inline">Message</span>
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${project.progress || 0}%` }}
          />
        </div>

        {/* Progress Update Slider */}
        {!canExecute && (
          <p className="text-xs text-yellow-700 mt-2">
            Planning stage is read-only. Execution actions unlock when the project is In Progress.
          </p>
        )}

        {canExecute && showProgressSlider[project.id] && (
          <ProgressSlider
            projectId={project.id}
            tempProgress={tempProgress[project.id]}
            currentProgress={project.progress}
            isUpdating={isUpdatingProgress[project.id]}
            onProgressChange={onProgressChange}
            onClose={onCloseProgressSlider}
            onSave={onUpdateProgress}
          />
        )}

        {/* Daily Progress Message Input */}
        {canExecute && showProgressMessage[project.id] && (
          <ProgressMessageInput
            projectId={project.id}
            message={progressMessage[project.id]}
            isSubmitting={isSubmittingMessage[project.id]}
            onMessageChange={onProgressMessageChange}
            onClose={onCloseProgressMessage}
            onSubmit={onSubmitProgressMessage}
          />
        )}
      </div>
    </div>
  );
};

export default ProjectCard;
