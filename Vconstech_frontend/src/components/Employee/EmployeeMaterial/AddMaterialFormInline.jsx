import { useState } from 'react';
import EmployeeMaterialForm from "../../Employee/EmployeeMaterial/EmployeeMaterialForm";

const EMPTY_MATERIAL = {
  name: "", category: "", unit: "piece", defaultRate: "",
  vendor: "", description: "", projectId: "", quantity: "", dueDate: "",
};

const AddMaterialFormInline = ({ categories, projects, loading, onClose, onSubmit }) => {
  const [requestType, setRequestType] = useState("GLOBAL");
  const [newMaterial, setNewMaterial] = useState(EMPTY_MATERIAL);

  const isSubmitDisabled =
    !newMaterial.name ||
    !newMaterial.defaultRate ||
    !newMaterial.quantity ||
    (requestType === "PROJECT" && !newMaterial.projectId) ||
    loading;

  const handleSubmit = async () => {
    await onSubmit(newMaterial, requestType);
    setNewMaterial(EMPTY_MATERIAL);
    setRequestType("GLOBAL");
  };

  return (
    <div className="flex flex-col gap-4 px-6 py-5 pb-8">

      {/* Tab Toggle */}
      <div className="flex rounded-xl border border-gray-200 overflow-hidden">
        <button
          type="button"
          onClick={() => {
            setRequestType("GLOBAL");
            setNewMaterial((m) => ({ ...m, projectId: "", quantity: "" }));
          }}
          className={`flex-1 py-2.5 text-sm font-semibold transition-all duration-200 ${
            requestType === "GLOBAL"
              ? "bg-yellow-400 text-black"
              : "bg-white text-gray-500 hover:bg-gray-50"
          }`}
        >
          Global Material
        </button>
        <button
          type="button"
          onClick={() => setRequestType("PROJECT")}
          className={`flex-1 py-2.5 text-sm font-semibold transition-all duration-200 ${
            requestType === "PROJECT"
              ? "bg-yellow-400 text-black"
              : "bg-white text-gray-500 hover:bg-gray-50"
          }`}
        >
          Project- Specific Material
        </button>
      </div>

      {/* Form */}
      <EmployeeMaterialForm
        material={newMaterial}
        onChange={setNewMaterial}
        categories={
          categories?.length > 1
            ? categories.filter((c) => c !== "All")
            : ["Paint", "Wood", "Flooring", "Electrical", "Fabric", "Hardware", "Plumbing"]
        }
        isProjectSpecific={requestType === "PROJECT"}
        projects={projects}
      />

      {/* Footer */}
      <div className="flex gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          className="flex-1 px-4 py-2.5 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      </div>

    </div>
  );
};

export default AddMaterialFormInline;
