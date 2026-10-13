import { getTodayDateInputValue } from "../../../utils/formValidation";

const EmployeeMaterialForm = ({ material, onChange, categories, isProjectSpecific = false, projects = [] }) => (
  <div className="flex flex-col gap-3">
    <div className="bg-white rounded-xl p-4 flex flex-col gap-3">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Basic Details</p>

      {isProjectSpecific && (
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">
            Project <span className="text-red-500">*</span>
          </label>
          <select
            value={material.projectId || ''}
            onChange={(e) => onChange({ ...material, projectId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white focus:outline-none focus:border-yellow-400"
          >
            <option value="">Select Project</option>
            {projects.map(proj => (
              <option key={proj.id} value={proj.id}>{proj.name}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-800 mb-1">Material Name</label>
        <input
          type="text"
          value={material.name}
          onChange={(e) => onChange({ ...material, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:border-yellow-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-800 mb-1">Vendor</label>
        <input
          type="text"
          value={material.vendor}
          onChange={(e) => onChange({ ...material, vendor: e.target.value })}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:border-yellow-400"
        />
      </div>
    </div>

    <div className="bg-white rounded-xl p-4 flex flex-col gap-3">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Material Details</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">Category</label>
          <input
            type="text"
            value={material.category}
            onChange={(e) => onChange({ ...material, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:border-yellow-400"
            placeholder="Paint"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">Unit</label>
          <select
            value={material.unit}
            onChange={(e) => onChange({ ...material, unit: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white focus:outline-none focus:border-yellow-400"
          >
            <option value="piece">Piece</option>
            <option value="liter">Liter</option>
            <option value="sq.ft">Sq.ft</option>
            <option value="meter">Meter</option>
            <option value="sheet">Sheet</option>
            <option value="kilogram">Kilogram</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">Price</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
            <input
              type="number"
              value={material.defaultRate}
              onChange={(e) => onChange({ ...material, defaultRate: e.target.value })}
              className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:border-yellow-400"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">Due Date</label>
          <input
            type="date"
            value={material.dueDate || ''}
            min={getTodayDateInputValue()}
            onChange={(e) => onChange({ ...material, dueDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:border-yellow-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-800 mb-1">
          Quantity <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={material.quantity || ''}
          onChange={(e) => onChange({ ...material, quantity: e.target.value })}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:border-yellow-400"
          placeholder="100"
        />
      </div>
    </div>

    <div className="bg-white rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700">Upload Document or Image</p>
          <p className="text-xs text-gray-400">PDF, JPG, PNG up to 10 MB</p>
        </div>
        <label
          htmlFor="quotation-upload"
          className="flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black text-sm font-semibold rounded-lg cursor-pointer transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload
        </label>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => {
            const file = e.target.files[0];
            onChange({ ...material, quotationFile: file });
          }}
          className="hidden"
          id="quotation-upload"
        />
      </div>

      {material.quotationFile ? (
        <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
          <span className="text-sm text-gray-700 truncate">{material.quotationFile.name}</span>
          <span
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onChange({ ...material, quotationFile: null });
              document.getElementById("quotation-upload").value = "";
            }}
            className="text-gray-400 hover:text-red-500 cursor-pointer text-lg leading-none ml-2 flex-shrink-0"
          >
            ×
          </span>
        </div>
      ) : null}
    </div>

    <div className="bg-white rounded-xl p-4">
      <label className="block text-sm font-medium text-gray-800 mb-2">Description</label>
      <textarea
        value={material.description}
        onChange={(e) => onChange({ ...material, description: e.target.value })}
        rows="3"
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:border-yellow-400 resize-none"
      />
    </div>
  </div>
);

export default EmployeeMaterialForm;
