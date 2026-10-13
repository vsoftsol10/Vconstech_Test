import { useState } from "react";
import EmployeeModalMaterial from "../../Employee/EmployeeMaterial/EmployeeModalMaterial";

const EMPTY_USAGE_LOG = {
  date: new Date().toISOString().split("T")[0],
  materialId: "",
  quantity: "",
  remarks: "",
};

const LogUsageModal = ({
  isOpen,
  onClose,
  onSubmit,
  projectMaterialsWithDetails,
  getSelectedMaterialRemaining,
  loading,
}) => {
  const [newUsageLog, setNewUsageLog] = useState(EMPTY_USAGE_LOG);

  const handleClose = () => {
    setNewUsageLog(EMPTY_USAGE_LOG);
    onClose();
  };

  const handleSubmit = async () => {
    await onSubmit(newUsageLog);
    setNewUsageLog(EMPTY_USAGE_LOG);
  };

  const materialInfo = getSelectedMaterialRemaining(newUsageLog.materialId);
  const quantityEntered = parseFloat(newUsageLog.quantity);
  const exceedsStock =
    materialInfo && newUsageLog.quantity && quantityEntered > materialInfo.remaining;

  return (
    <EmployeeModalMaterial
      isOpen={isOpen}
      onClose={handleClose}
      title="Log Material Usage"
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
            disabled={!newUsageLog.materialId || !newUsageLog.quantity || loading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Logging..." : "Log Usage"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Stock warning */}
        {exceedsStock && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 font-semibold">
              ⚠️ Warning: Quantity exceeds available stock!
            </p>
            <p className="text-xs text-red-700 mt-1">
              Available: {materialInfo.remaining} {materialInfo.unit} | You
              entered: {newUsageLog.quantity} {materialInfo.unit} | Excess:{" "}
              {(quantityEntered - materialInfo.remaining).toFixed(2)}{" "}
              {materialInfo.unit}
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
          <input
            type="date"
            value={newUsageLog.date}
            onChange={(e) => setNewUsageLog({ ...newUsageLog, date: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Material
          </label>
          <select
            value={newUsageLog.materialId}
            onChange={(e) =>
              setNewUsageLog({ ...newUsageLog, materialId: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose a material...</option>
            {projectMaterialsWithDetails.map((pm) => (
              <option key={pm.materialId} value={pm.materialId}>
                {pm.material?.name} (Remaining: {pm.remaining} {pm.material?.unit})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity Used
            {materialInfo && (
              <span className="text-xs text-gray-500 ml-2">
                (Max: {materialInfo.remaining} {materialInfo.unit})
              </span>
            )}
          </label>
          <input
            type="number"
            value={newUsageLog.quantity}
            onChange={(e) =>
              setNewUsageLog({ ...newUsageLog, quantity: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="20"
            step="0.01"
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
          <textarea
            value={newUsageLog.remarks}
            onChange={(e) =>
              setNewUsageLog({ ...newUsageLog, remarks: e.target.value })
            }
            rows="3"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., For Living Room wall"
          />
        </div>
      </div>
    </EmployeeModalMaterial>
  );
};

export default LogUsageModal;