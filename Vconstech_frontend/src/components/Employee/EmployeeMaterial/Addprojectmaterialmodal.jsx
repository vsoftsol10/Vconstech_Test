import { useState } from "react";
import EmployeeModalMaterial from "../../Employee/EmployeeMaterial/EmployeeModalMaterial";

const EMPTY_PROJECT_MATERIAL = {
  materialId: "",
  assigned: "",
  used: 0,
  status: "Active",
};

const formatCurrency = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
}).format(Number(value || 0));

const AddProjectMaterialModal = ({ isOpen, onClose, onSubmit, materials, loading }) => {
  const [newProjectMaterial, setNewProjectMaterial] = useState(EMPTY_PROJECT_MATERIAL);

  const handleClose = () => {
    setNewProjectMaterial(EMPTY_PROJECT_MATERIAL);
    onClose();
  };

  const handleSubmit = async () => {
    await onSubmit(newProjectMaterial);
    setNewProjectMaterial(EMPTY_PROJECT_MATERIAL);
  };

  return (
    <EmployeeModalMaterial
      isOpen={isOpen}
      onClose={handleClose}
      title="Request to Add Material to Project"
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
            disabled={!newProjectMaterial.materialId || !newProjectMaterial.assigned || loading}
            className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting..." : "Submit Request"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This request will be sent to your supervisor
            for approval before the material is added to the project.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Material <span className="text-red-500">*</span>
          </label>
          <select
            value={newProjectMaterial.materialId}
            onChange={(e) =>
              setNewProjectMaterial({ ...newProjectMaterial, materialId: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose a material...</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.category} - {formatCurrency(m.defaultRate)}/{m.unit})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assigned Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={newProjectMaterial.assigned}
              onChange={(e) =>
                setNewProjectMaterial({ ...newProjectMaterial, assigned: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Used Quantity
            </label>
            <input
              type="number"
              value={newProjectMaterial.used}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
              placeholder="0"
            />
          </div>
        </div>
      </div>
    </EmployeeModalMaterial>
  );
};

export default AddProjectMaterialModal;
