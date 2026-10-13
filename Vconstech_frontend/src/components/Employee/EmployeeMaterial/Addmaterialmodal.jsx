import { useState } from "react";
import EmployeeModalMaterial from "../../Employee/EmployeeMaterial/EmployeeModalMaterial";
import EmployeeMaterialForm from "../../Employee/EmployeeMaterial/EmployeeMaterialForm";

const EMPTY_MATERIAL = {
  name: "",
  category: "",
  unit: "",
  defaultRate: "",
  vendor: "",
  description: "",
  projectId: "",
  quantity: "",
  dueDate: "",
};

const AddMaterialModal = ({ isOpen, onClose, onSubmit, categories, projects, loading }) => {
  const [requestType, setRequestType] = useState("GLOBAL");
  const [newMaterial, setNewMaterial] = useState(EMPTY_MATERIAL);

  const handleClose = () => {
    setNewMaterial(EMPTY_MATERIAL);
    setRequestType("GLOBAL");
    onClose();
  };

  const handleSubmit = async () => {
    await onSubmit(newMaterial, requestType);
    setNewMaterial(EMPTY_MATERIAL);
    setRequestType("GLOBAL");
  };

  const isSubmitDisabled =
    !newMaterial.name ||
    !newMaterial.defaultRate ||
    !newMaterial.quantity ||
    (requestType === "PROJECT" && !newMaterial.projectId) ||
    loading;

  return (
    <EmployeeModalMaterial
      isOpen={isOpen}
      onClose={handleClose}
      title={
        requestType === "GLOBAL"
          ? "Request New Global Material"
          : "Request Project-Specific Material"
      }
      footer={
        <>
          <button
            onClick={handleClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting..." : "Submit Request"}
          </button>
        </>
      }
    >
      <div className="mb-4">
        <label className="block text-ld font-bold text-gray-900 mb-2">
          Request Type
        </label>

        {/* Toggle Button */}
        <div className="inline-flex rounded-xl border border-gray-200 bg-gray-100 p-1 gap-1">
          <button
            type="button"
            onClick={() => {
              setRequestType("GLOBAL");
              setNewMaterial((m) => ({ ...m, projectId: "", quantity: "" }));
            }}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              requestType === "GLOBAL"
                ? "bg-white text-yellow-700 shadow-sm border border-gray-200"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Global Material
          </button>
          <button
            type="button"
            onClick={() => setRequestType("PROJECT")}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              requestType === "PROJECT"
                ? "bg-white text-yellow-700 shadow-sm border border-gray-200"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Project-Specific
          </button>
        </div>

        <p className="mt-2 text-xs text-gray-400">
          {requestType === "GLOBAL"
            ? "Available for all projects"
            : "Linked to a specific project"}
        </p>
      </div>

      <EmployeeMaterialForm
        material={newMaterial}
        onChange={setNewMaterial}
        categories={
          categories.length > 1
            ? categories.filter((c) => c !== "All")
            : ["Paint", "Wood", "Flooring", "Electrical", "Fabric", "Hardware", "Plumbing"]
        }
        isProjectSpecific={requestType === "PROJECT"}
        projects={projects}
      />
    </EmployeeModalMaterial>
  );
};

export default AddMaterialModal;
