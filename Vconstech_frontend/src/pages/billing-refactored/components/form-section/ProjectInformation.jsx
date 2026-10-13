import React from 'react';
import { Building2, FileSignature, MapPin } from 'lucide-react';

const ProjectInformation = ({ formData, handleInputChange }) => {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-[#ffbe2a]">
        Project Information
      </h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Project Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              name="projectName"
              value={formData.projectName}
              onChange={handleInputChange}
              placeholder="Project Name"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Work Order No.
          </label>
          <div className="relative">
            <FileSignature className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              name="workOrderNo"
              value={formData.workOrderNo}
              onChange={handleInputChange}
              placeholder="WO-001"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Project Location
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <textarea
              name="projectLocation"
              value={formData.projectLocation}
              onChange={handleInputChange}
              rows="2"
              placeholder="Project Site Address"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectInformation;