import React, { useState, useEffect } from "react";
import { X, Upload } from "lucide-react";
import { projectAPI } from "../../api/projectAPI";
import {
  focusFirstInvalidField,
  getTodayDateInputValue,
  isDateBefore,
  validateFields,
  validators,
} from "../../utils/formValidation";

// Project Form Modal Component
const ProjectFormModal = ({
  isOpen,
  onClose,
  project,
  onChange,
  onSubmit,
  title,
  submitLabel,
  isEditMode = false,
}) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const statusOptions = ["Planning", "In Progress", "On Hold", "Completed"];

  const getDisplayProgress = (status, progress) => {
    if (status === "Planning") return 0;
    if (status === "Completed") return 100;

    const parsedProgress = Number.parseInt(progress, 10);
    return Number.isNaN(parsedProgress) ? 0 : parsedProgress;
  };

  const displayedProgress = getDisplayProgress(project.status, project.progress);
  const isProgressEditable = project.status === "In Progress";
  const progressDisplayText =
    project.status === "Planning"
      ? "0% (Not Started)"
      : `${displayedProgress}%`;
  const todayDate = getTodayDateInputValue();

  // Load employees when modal opens
  useEffect(() => {
    if (isOpen) {
      loadEmployees();
      // Set existing file preview if editing (only when modal first opens, not on every render)
      if (project.designFile && !selectedFile) {
        setFilePreview(project.designFile);
      }
      // Clear validation errors when modal opens
      setValidationErrors({});
      setError(null);
    } else {
      // Reset file state when modal closes
      setSelectedFile(null);
      setFilePreview(null);
      setValidationErrors({});
      setError(null);
    }
  }, [isOpen]); // Removed project.designFile from dependencies to prevent re-rendering issues

  const loadEmployees = async () => {
    try {
      setError(null);
      const data = await projectAPI.getEmployees();
      console.log("Loaded employees:", data.employees); // Debug log
      setEmployees(data.employees || []);
    } catch (err) {
      console.error("Failed to load employees:", err);

      // Check if it's an auth error
      if (err.error === "Invalid or expired token" || err.status === 403) {
        setError("Session expired. Please log in again.");
        // Redirect to login after a short delay
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        setError("Failed to load site engineers. Please try again.");
      }
    }
  };

  const activeEmployees = employees.filter((emp) => (emp.status || "Active") === "Active");
  const selectedEngineer = project.assignedEmployee
    ? employees.find((emp) => String(emp.id) === String(project.assignedEmployee))
    : null;
  const availableEmployees = selectedEngineer && !activeEmployees.some((emp) => emp.id === selectedEngineer.id)
    ? [selectedEngineer, ...activeEmployees]
    : activeEmployees;

  const validateForm = () => {
    const errors = validateFields([
      { name: 'name', value: project.name, label: 'Project name', rules: ['name'] },
      { name: 'client', value: project.client, label: 'Client name', rules: ['name'] },
      { name: 'location', value: project.location, label: 'Project location', rules: ['required'] },
      { name: 'budget', value: project.budget, label: 'Budget', rules: ['optionalAmount'] },
      { name: 'quotationAmount', value: project.quotationAmount, label: 'Quotation amount', rules: ['optionalAmount'] },
    ]);

    // Existing projects can have past dates. Do not block edits to unrelated
    // fields because of the dates already stored on the project.
    if (!isEditMode) {
      if (project.startDate) {
        const startDateError = validators.todayOrFutureDate(project.startDate, 'Start date');
        if (startDateError) errors.startDate = startDateError;
      }

      if (project.endDate) {
        const endDateError = validators.date(project.endDate, 'End date');
        if (endDateError) errors.endDate = endDateError;
      }

      if (project.startDate && project.endDate) {
        const start = new Date(project.startDate);
        const end = new Date(project.endDate);

        if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end < start) {
          errors.endDate = "End date cannot be earlier than start date";
        }
      }
    }

    return errors;
  };

  const handleSubmit = async () => {
    // Validate form
    const errors = validateForm();

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError("Please fix the validation errors before submitting");
      focusFirstInvalidField(errors);
      return;
    }

    setLoading(true);
    setError(null);
    setValidationErrors({});

    try {
      // Pass the selected file to the parent component
      await onSubmit(selectedFile);
      // Parent component will handle success message and modal closing
    } catch (err) {
      console.error("Submit error:", err);
      setError(err.message || err.error || "Failed to save project");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type (3D design files)
      const validTypes = [
        ".dwg",
        ".dxf",
        ".skp",
        ".obj",
        ".fbx",
        ".3ds",
        ".stl",
        ".rvt",
        ".ifc",
        ".pdf",
        ".docx",
        ".png",
        ".jpg",
        ".jpeg",
      ];
      const fileExtension = "." + file.name.split(".").pop().toLowerCase();

      if (!validTypes.includes(fileExtension)) {
        setError(
          "Invalid file type. Please upload a valid design file (.dwg, .dxf, .skp, .obj, .fbx, .3ds, .stl, .rvt, .ifc, .pdf, .docx)"
        );
        return;
      }

      // Validate file size (e.g., max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setError("File size too large. Maximum size is 50MB");
        return;
      }

      // Set the file and preview
      setSelectedFile(file);
      setFilePreview(file.name);
      setError(null);
      
      console.log("File selected:", file.name); // Debug log
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    // Clear the file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = '';
    }
    // Also notify parent to clear the file
    onChange({ ...project, designFile: null });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-4 sm:mx-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Project Name */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-extrabold text-gray-700 mb-2">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                type="text"
                value={project.name || ""}
                onChange={(e) => {
                  onChange({ ...project, name: e.target.value });
                  if (validationErrors.name) {
                    setValidationErrors({
                      ...validationErrors,
                      name: undefined,
                    });
                  }
                }}
                className={`w-full px-3 py-2 text-sm text-gray-500 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter project name"
                disabled={loading}
              />
              {validationErrors.name && (
                <p className="text-red-500 text-xs mt-1">
                  {validationErrors.name}
                </p>
              )}
            </div>

            {/* Project ID (only for new projects) */}
            {/* {!project.id && (
              <div>
                <label className="block text-sm font-extrabold text-gray-700 mb-2">
                  Project ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={project.projectId || ""}
                  onChange={(e) => {
                    onChange({ ...project, projectId: e.target.value });
                    if (validationErrors.projectId) {
                      setValidationErrors({
                        ...validationErrors,
                        projectId: undefined,
                      });
                    }
                  }}
                  className={`w-full px-3 py-2 text-sm text-gray-500 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.projectId
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="e.g., PRJ005"
                  disabled={loading}
                />
                {validationErrors.projectId && (
                  <p className="text-red-500 text-xs mt-1">
                    {validationErrors.projectId}
                  </p>
                )}
              </div>
            )} */}

            {/* Client Name */}
            <div className={!project.id ? "" : "sm:col-span-2"}>
              <label className="block text-sm font-extrabold text-gray-700 mb-2">
                Client Name <span className="text-red-500">*</span>
              </label>
              <input
                name="client"
                type="text"
                value={project.client || ""}
                onChange={(e) => {
                  onChange({ ...project, client: e.target.value });
                  if (validationErrors.client) {
                    setValidationErrors({
                      ...validationErrors,
                      client: undefined,
                    });
                  }
                }}
                className={`w-full px-3 py-2 text-sm text-gray-500 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.client ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter client name"
                disabled={loading}
              />
              {validationErrors.client && (
                <p className="text-red-500 text-xs mt-1">
                  {validationErrors.client}
                </p>
              )}
            </div>

            {/* Project Type */}
            <div>
              <label className="block text-sm font-extrabold text-gray-700 mb-2">
                Project Type
              </label>
              <select
                value={project.type || "Residential"}
                onChange={(e) => onChange({ ...project, type: e.target.value })}
                className="w-full px-3 py-2 text-sm text-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Renovation">Renovation</option>
                <option value="Industrial">Industrial</option>
              </select>
            </div>

            {project.id && (
              <>
                <div>
                  <label className="block text-sm font-extrabold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={project.status || "Planning"}
                    onChange={(e) => onChange({ ...project, status: e.target.value })}
                    className="w-full px-3 py-2 text-sm text-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-extrabold text-gray-700 mb-2">
                    Actual Progress (%)
                  </label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={displayedProgress}
                      onChange={(e) => {
                        if (!isProgressEditable) return;
                        onChange({ ...project, progress: parseInt(e.target.value, 10) });
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      disabled={loading || !isProgressEditable}
                    />
                    <div className="flex items-center justify-between">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={displayedProgress}
                        onChange={(e) => {
                          if (!isProgressEditable) return;
                          const val = parseInt(e.target.value, 10);
                          if (val >= 0 && val <= 100) {
                            onChange({ ...project, progress: val });
                          }
                        }}
                        className="w-20 px-3 py-2 text-sm text-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        disabled={loading || !isProgressEditable}
                      />
                      <span className="text-sm text-gray-600">
                        Current: <span className="font-semibold text-blue-600">{progressDisplayText}</span>
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {isProgressEditable
                      ? "Manually set the actual work completion percentage"
                      : project.status === "Planning"
                        ? "Read only based on project status"
                        : project.status === "Completed"
                          ? "Automatically set to 100%"
                          : "Read only based on project status"}
                  </p>
                </div>
              </>
            )}

            {/* Budget */}
            <div>
              <label className="block text-sm font-extrabold text-gray-700 mb-2">
                Budget (Rs.)
              </label>
              <input
                name="budget"
                type="number"
                value={project.budget || ""}
                onChange={(e) => {
                  onChange({ ...project, budget: e.target.value });
                  if (validationErrors.budget) {
                    setValidationErrors({
                      ...validationErrors,
                      budget: undefined,
                    });
                  }
                }}
                className={`w-full px-3 py-2 text-sm text-gray-500 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.budget ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., 150000"
                disabled={loading}
                min="0"
              />
              {validationErrors.budget && (
                <p className="text-red-500 text-xs mt-1">
                  {validationErrors.budget}
                </p>
              )}
            </div>

            {/* Quotation Amount */}
            <div>
              <label className="block text-sm font-extrabold text-gray-700 mb-2">
                Quotation Amount (Rs.)
              </label>
              <input
                name="quotationAmount"
                type="number"
                value={project.quotationAmount || ""}
                onChange={(e) => {
                  onChange({ ...project, quotationAmount: e.target.value });
                  if (validationErrors.quotationAmount) {
                    setValidationErrors({
                      ...validationErrors,
                      quotationAmount: undefined,
                    });
                  }
                }}
                className={`w-full px-3 py-2 text-sm text-gray-500 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.quotationAmount ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., 150000"
                disabled={loading}
                min="0"
              />
              {validationErrors.quotationAmount && (
                <p className="text-red-500 text-xs mt-1">
                  {validationErrors.quotationAmount}
                </p>
              )}
              
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-extrabold text-gray-700 mb-2">
                Start Date
              </label>
              <input
                name="startDate"
                type="date"
                value={project.startDate || ""}
                min={todayDate}
                onChange={(e) => {
                  const nextStartDate = e.target.value;
                  onChange({
                    ...project,
                    startDate: nextStartDate,
                    endDate: isDateBefore(project.endDate, nextStartDate) ? "" : project.endDate,
                  });
                  if (validationErrors.startDate || validationErrors.endDate) {
                    setValidationErrors({
                      ...validationErrors,
                      startDate: undefined,
                      endDate: undefined,
                    });
                  }
                }}
                className={`w-full px-3 py-2 text-sm text-gray-500 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.startDate
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                disabled={loading}
              />
              {validationErrors.startDate && (
                <p className="text-red-500 text-xs mt-1">
                  {validationErrors.startDate}
                </p>
              )}
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-extrabold text-gray-700 mb-2">
                End Date
              </label>
              <input
                name="endDate"
                type="date"
                value={project.endDate || ""}
                min={project.startDate || todayDate}
                onChange={(e) => {
                  onChange({ ...project, endDate: e.target.value });
                  if (validationErrors.endDate) {
                    setValidationErrors({
                      ...validationErrors,
                      endDate: undefined,
                    });
                  }
                }}
                className={`w-full px-3 py-2 text-sm text-gray-500 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.endDate
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                disabled={loading}
              />
              {validationErrors.endDate && (
                <p className="text-red-500 text-xs mt-1">
                  {validationErrors.endDate}
                </p>
              )}
            </div>

            {/* Project Location */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-extrabold text-gray-700 mb-2">
                Project Location <span className="text-red-500">*</span>
              </label>
              <input
                name="location"
                type="text"
                value={project.location || ""}
                onChange={(e) => {
                  onChange({ ...project, location: e.target.value });
                  if (validationErrors.location) {
                    setValidationErrors({
                      ...validationErrors,
                      location: undefined,
                    });
                  }
                }}
                className={`w-full px-3 py-2 text-sm text-gray-500 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.location
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="Enter project location/address"
                disabled={loading}
              />
              {validationErrors.location && (
                <p className="text-red-500 text-xs mt-1">
                  {validationErrors.location}
                </p>
              )}
            </div>

            {/* Assign Site Engineer */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-extrabold text-gray-700 mb-2">
                Assign Site Engineer{" "}
                {/* {!project.id && <span className="text-red-500">*</span>} */}
              </label>
              <select
                value={project.assignedEmployee || ""}
                onChange={(e) => {
                  onChange({ ...project, assignedEmployee: e.target.value });
                  if (validationErrors.assignedEmployee) {
                    setValidationErrors({
                      ...validationErrors,
                      assignedEmployee: undefined,
                    });
                  }
                }}
                className={`w-full px-3 py-2 text-sm text-gray-500 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.assignedEmployee
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                disabled={loading || availableEmployees.length === 0}
              >
                <option value="">Select Site Engineer</option>
                {availableEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.empId})
                  </option>
                ))}
              </select>
            
              {activeEmployees.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {activeEmployees.length} active site engineer
                  {activeEmployees.length !== 1 ? "s" : ""} available
                </p>
              )}
            </div>

            {/* Upload 3D Design File */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-extrabold text-gray-700 mb-2">
                Upload 3D Design File (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-yellow-500 transition-colors">
                {!filePreview ? (
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".dwg,.dxf,.skp,.obj,.fbx,.3ds,.stl,.rvt,.ifc,.pdf,.docx"
                      disabled={loading}
                    />
                    <div className="flex flex-col items-center justify-center py-2">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 mb-1">
                        Click to upload 3D design file
                      </p>
                      <p className="text-xs text-gray-500">
                        Supported: DWG, DXF, SKP, OBJ, FBX, 3DS, STL, RVT, IFC, PDF, DOCX
                        (Max 50MB)
                      </p>
                    </div>
                  </label>
                ) : (
                  <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        <Upload className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {filePreview}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          File ready for upload
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveFile}
                      className="ml-3 flex-shrink-0 text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                      disabled={loading}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Project Description */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-extrabold text-gray-700 mb-2">
                Project Description
              </label>
              <textarea
                rows="4"
                value={project.description || ""}
                onChange={(e) =>
                  onChange({ ...project, description: e.target.value })
                }
                className="w-full px-3 py-2 text-sm text-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                placeholder="Describe the project..."
                disabled={loading}
              ></textarea>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end gap-3 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="w-full sm:w-auto px-4 py-2 bg-yellow-600 text-white rounded-lg  disabled:bg-yellow-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
disabled={loading}            type="button"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Saving...</span>
              </>
            ) : (
              submitLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectFormModal;
