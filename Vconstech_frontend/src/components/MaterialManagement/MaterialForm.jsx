import React from 'react';

const MaterialForm = ({ material, onChange, categories, errors = {} }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-bold text-black mb-2">Material Name</label>
      <input
        name="materialName"
        type="text"
        value={material.name}
        onChange={(e) => onChange({ ...material, name: e.target.value })}
        className={`w-full px-4 py-2 border rounded-lg ${errors.materialName ? 'border-red-500' : 'border-gray-900'}`}
        placeholder="e.g., Asian Paints Premium"
      />
      {errors.materialName && <p className="text-red-500 text-sm mt-1">{errors.materialName}</p>}
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
        <select
          name="materialCategory"
          value={material.category}
          onChange={(e) => onChange({ ...material, category: e.target.value })}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.materialCategory ? 'border-red-500' : 'border-gray-300'}`}
        >
          {categories.filter(c => c !== 'All').map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        {errors.materialCategory && <p className="text-red-500 text-sm mt-1">{errors.materialCategory}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
        <select
          value={material.unit}
          onChange={(e) => onChange({ ...material, unit: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="piece">Piece</option>
          <option value="liter">Liter</option>
          <option value="sq.ft">Sq.ft</option>
          <option value="meter">Meter</option>
          <option value="sheet">Sheet</option>
          <option value="kg">Kilogram</option>
        </select>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Default Rate (₹)</label>
        <input
          name="materialDefaultRate"
          type="number"
          value={material.defaultRate}
          onChange={(e) => onChange({ ...material, defaultRate: e.target.value })}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.materialDefaultRate ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="450"
        />
        {errors.materialDefaultRate && <p className="text-red-500 text-sm mt-1">{errors.materialDefaultRate}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quantity <span className="text-red-500">*</span>
        </label>
        <input
          name="materialQuantity"
          type="number"
          min="0.01"
          step="0.01"
          value={material.quantity}
          onChange={(e) => onChange({ ...material, quantity: e.target.value })}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.materialQuantity ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="100"
        />
        {errors.materialQuantity && <p className="text-red-500 text-sm mt-1">{errors.materialQuantity}</p>}
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Vendor/Supplier</label>
      <input
        name="materialVendor"
        type="text"
        value={material.vendor}
        onChange={(e) => onChange({ ...material, vendor: e.target.value })}
        className="w-full px-4 py-2 border border-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500"
        placeholder="e.g., Asian Paints"
      />
      {errors.materialVendor && <p className="text-red-500 text-sm mt-1">{errors.materialVendor}</p>}
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Description/Remarks</label>
      <textarea
        name="materialDescription"
        value={material.description}
        onChange={(e) => onChange({ ...material, description: e.target.value })}
        rows="3"
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        placeholder="Additional details about the material..."
      />
      {errors.materialDescription && <p className="text-red-500 text-sm mt-1">{errors.materialDescription}</p>}
    </div>

    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm font-medium text-gray-700">Upload Document or Image</p>
          <p className="text-xs text-gray-400">PDF, JPG, PNG up to 10 MB</p>
        </div>
        <label
          htmlFor="material-form-upload"
          className="flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black text-sm font-semibold rounded-lg cursor-pointer transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload
        </label>
        <input
          type="file"
          id="material-form-upload"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files[0];
            onChange({ ...material, quotationFile: file });
          }}
        />
      </div>

      {material.quotationFile ? (
        <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 mt-2">
          <div className="flex items-center gap-2 min-w-0">
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <span className="text-sm text-gray-700 truncate">{material.quotationFile.name}</span>
            <span className="text-xs text-gray-400 shrink-0">
              {material.quotationFile.size > 1024 * 1024
                ? `${(material.quotationFile.size / (1024 * 1024)).toFixed(1)} MB`
                : `${(material.quotationFile.size / 1024).toFixed(1)} KB`}
            </span>
          </div>
          <span
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onChange({ ...material, quotationFile: null });
              document.getElementById('material-form-upload').value = '';
            }}
            className="text-gray-400 hover:text-red-500 cursor-pointer text-lg leading-none ml-2 shrink-0"
          >
            ×
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          No file selected
        </div>
      )}
    </div>
  </div>
);

export default MaterialForm;
