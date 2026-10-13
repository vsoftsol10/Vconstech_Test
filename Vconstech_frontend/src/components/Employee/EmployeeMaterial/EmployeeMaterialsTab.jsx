import { useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import AddMaterialFormInline from "./AddMaterialFormInline";
import ModalShell, { MODAL_PRIMARY_BUTTON_CLASS } from "../../common/ModalShell";

const formatCurrency = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
}).format(Number(value || 0));

const formatDisplayValue = (value) => {
  if (value === null || value === undefined || value === "") return "N/A";
  return value;
};

const formatDetailCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "N/A";
  return formatCurrency(value);
};

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-IN");
};

const DetailRow = ({ label, value }) => (
  <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-1 sm:gap-6 px-5 sm:px-6 py-3.5 border-b border-gray-100 last:border-b-0">
    <dt className="text-sm font-medium text-gray-500">{label}</dt>
    <dd className="text-sm font-semibold text-gray-900 sm:text-right break-words">{formatDisplayValue(value)}</dd>
  </div>
);

const EmployeeMaterialsTab = ({
  materials,
  searchTerm,
  setSearchTerm,
  filterCategory,
  setFilterCategory,
  categories,
  projects,
  loading,
  onAddMaterial,
  canRequestMaterials = true,
}) => {
  const [sliderOpen, setSliderOpen] = useState(false);
  const [viewingMaterial, setViewingMaterial] = useState(null);

  return (
    <div className="space-y-6 relative">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Materials</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or vendor..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setSliderOpen(true)}
            disabled={!canRequestMaterials}
            title={canRequestMaterials ? undefined : "Available when an assigned project is In Progress"}
            className={`px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center gap-2 whitespace-nowrap ${canRequestMaterials ? '' : 'opacity-60 cursor-not-allowed hover:bg-black'}`}
          >
            <Plus className="w-5 h-5" />
            Request Material
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {materials.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <p>No materials found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-yellow-500">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-extrabold text-black uppercase">Material Name</th>
                  <th className="px-6 py-3 text-left text-xs font-extrabold text-black uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-extrabold text-black uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-extrabold text-black uppercase">Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-extrabold text-black uppercase">Default Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-extrabold text-black uppercase">Vendor Name</th>
                  <th className="px-6 py-3 text-left text-xs font-extrabold text-black uppercase">Project Name</th>
                  <th className="px-6 py-3 text-left text-xs font-extrabold text-black uppercase">View</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {materials.map(material => (
                  <tr key={material.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{material.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        {material.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                      {material.quantity ?? '--'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">{material.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">{formatCurrency(material.defaultRate)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">{material.vendor || '--'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">{material.projectName || '--'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        type="button"
                        onClick={() => setViewingMaterial(material)}
                        className="px-3 py-1.5 bg-yellow-400 text-black text-xs font-semibold rounded-lg hover:bg-yellow-500 transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewingMaterial && (
        <ModalShell
          panelClassName="max-w-3xl rounded-xl !max-h-[85vh] !overflow-hidden flex flex-col"
        >
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-5 sm:px-6 py-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-gray-900">Material Details</h3>
              <p className="mt-1 text-sm font-medium text-gray-500 truncate">
                {formatDisplayValue(viewingMaterial.name)}
              </p>
            </div>
            <button
              onClick={() => setViewingMaterial(null)}
              className="shrink-0 p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close material details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-white">
            <dl className="divide-y-0">
              <DetailRow label="Material Name" value={viewingMaterial.name} />
              <DetailRow label="Category" value={viewingMaterial.category} />
              <DetailRow label="Quantity" value={viewingMaterial.quantity} />
              <DetailRow
                label="Available Quantity"
                value={viewingMaterial.availableQuantity !== null && viewingMaterial.availableQuantity !== undefined && viewingMaterial.availableQuantity !== ""
                  ? `${viewingMaterial.availableQuantity}${viewingMaterial.unit ? ` ${viewingMaterial.unit}` : ""}`
                  : "N/A"}
              />
              <DetailRow label="Unit" value={viewingMaterial.unit} />
              <DetailRow label="Default Rate" value={formatDetailCurrency(viewingMaterial.defaultRate)} />
              <DetailRow label="Vendor Name" value={viewingMaterial.vendor} />
              <DetailRow label="Project Name" value={viewingMaterial.projectName} />
              <DetailRow label="Description" value={viewingMaterial.description} />
              <DetailRow label="Created Date" value={formatDate(viewingMaterial.createdAt)} />
              <DetailRow label="Last Updated" value={formatDate(viewingMaterial.updatedAt)} />
            </dl>
          </div>

          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-5 sm:px-6 py-4 flex justify-end">
            <button
              onClick={() => setViewingMaterial(null)}
              className={MODAL_PRIMARY_BUTTON_CLASS}
            >
              Close
            </button>
          </div>
        </ModalShell>
      )}

      {sliderOpen && (
        <div
          className="fixed inset-0 bg-black/20 bg-opacity-30 z-40"
          onClick={() => setSliderOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
          sliderOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-base font-semibold text-gray-900">Request Material</h2>
          <button
            onClick={() => setSliderOpen(false)}
            className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col scrollbar-hide">
          {sliderOpen && (
            <AddMaterialFormInline
              categories={categories}
              projects={projects}
              loading={loading}
              onClose={() => setSliderOpen(false)}
              onSubmit={async (data, type) => {
                await onAddMaterial(data, type);
                setSliderOpen(false);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeMaterialsTab;
