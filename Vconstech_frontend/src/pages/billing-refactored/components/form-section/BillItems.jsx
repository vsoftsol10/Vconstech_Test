import React, { useState } from 'react';
import { showToast } from '../../../../components/common/Toast';
import {UNIT_OPTIONS} from "../../constants/billingConstants"

const BillItems = ({ formData, activeTab, handleItemChange, addItem, removeItem }) => {

  const [errors, setErrors] = useState({});

  // Validate current items before adding new one
  const validateItems = () => {
    const newErrors = {};
    let isValid = true;

    formData.items.forEach((item, index) => {
      const itemErrors = {};
      
      if (!item.description || !item.description.trim()) {
        itemErrors.description = "Description is required";
        isValid = false;
      }
      
      if (!item.quantity || Number(item.quantity) <= 0) {
        itemErrors.quantity = "Valid quantity is required";
        isValid = false;
      }
      
      if (!item.rate || Number(item.rate) <= 0) {
        itemErrors.rate = "Valid rate is required";
        isValid = false;
      }

      if (Object.keys(itemErrors).length > 0) {
        newErrors[index] = itemErrors;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleAddItem = () => {
    // Validate all existing items before adding new one
    if (!validateItems()) {
      showToast("Please fill all required fields (Description, Quantity, Rate) in existing items before adding a new one.", "warning");
      return;
    }

    // Call the parent's addItem function
    addItem();
    
    // Clear errors
    setErrors({});
  };

  const handleRemoveItem = (index) => {
    removeItem(index);
    
    // Clear errors for removed item
    const newErrors = { ...errors };
    delete newErrors[index];
    setErrors(newErrors);
  };

  const handleChange = (index, field, value) => {
    handleItemChange(index, field, value);

    // Clear error for this field when user starts typing
    if (errors[index] && errors[index][field]) {
      const newErrors = { ...errors };
      delete newErrors[index][field];
      if (Object.keys(newErrors[index]).length === 0) {
        delete newErrors[index];
      }
      setErrors(newErrors);
    }
  };

  // Calculate subtotal
  const subtotal = formData.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-[#ffbe2a]">
        {activeTab === 'invoice' ? 'Bill' : 'Quote'} Items
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700 border">S.No</th>
              <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700 border" style={{minWidth: '300px'}}>
                Description of Work <span className="text-red-500">*</span>
              </th>
              <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700 border">HSN/SAC</th>
              <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700 border">Unit</th>
              <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700 border">
                Quantity <span className="text-red-500">*</span>
              </th>
              <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700 border">
                Rate <span className="text-red-500">*</span>
              </th>
              <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700 border">Amount</th>
              <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700 border">Action</th>
            </tr>
          </thead>
          <tbody>
            {formData.items.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="px-3 py-3 border text-center font-semibold align-top">
                  {item.sno}
                </td>
                <td className="px-3 py-3 border">
                  <textarea
                    value={item.description || ""}
                    onChange={(e) => handleChange(index, "description", e.target.value)}
                    placeholder="Enter detailed work description..."
                    className={`w-full px-2 py-1 border rounded focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none resize-none overflow-hidden ${
                      errors[index]?.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                    style={{
                      minHeight: '60px',
                      height: 'auto',
                      fieldSizing: 'content'
                    }}
                    onInput={(e) => {
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                  />
                  {errors[index]?.description && (
                    <p className="text-red-500 text-xs mt-1">{errors[index].description}</p>
                  )}
                </td>
                <td className="px-3 py-3 border align-top">
                  <input
                    type="text"
                    value={item.HSN || ""}
                    onChange={(e) => handleChange(index, "HSN", e.target.value)}
                    placeholder="HSN/SAC"
                    className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none"
                  />
                </td>
                <td className="px-2 sm:px-3 py-2 sm:py-3 border align-top">
  <select
    value={item.unit || "Nos"}
    onChange={(e) => handleChange(index, "unit", e.target.value)}
    className="w-full min-w-[80px] px-2 py-1 text-sm sm:text-base border border-gray-300 rounded focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none"
  >
    {UNIT_OPTIONS.map((unit) => (
      <option key={unit} value={unit}>
        {unit}
      </option>
    ))}
  </select>
</td>
                <td className="px-3 py-3 border align-top">
                  <input
                    type="number"
                    value={item.quantity || ""}
                    onChange={(e) => handleChange(index, "quantity", e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="0"
                    className={`w-24 px-2 py-1 border rounded focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none ${
                      errors[index]?.quantity ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors[index]?.quantity && (
                    <p className="text-red-500 text-xs mt-1">{errors[index].quantity}</p>
                  )}
                </td>
                <td className="px-3 py-3 border align-top">
                  <input
                    type="number"
                    value={item.rate || ""}
                    onChange={(e) => handleChange(index, "rate", e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="0"
                    className={`w-28 px-2 py-1 border rounded focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none ${
                      errors[index]?.rate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors[index]?.rate && (
                    <p className="text-red-500 text-xs mt-1">{errors[index].rate}</p>
                  )}
                </td>
                <td className="px-3 py-3 border align-top">
                  <div className="flex items-center gap-1 text-gray-700 font-semibold">
                    ₹ {(parseFloat(item.amount) || 0).toFixed(2)}
                  </div>
                </td>
                <td className="px-3 py-3 border text-center align-top">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    disabled={formData.items.length === 1}
                    className={`px-3 py-1 text-xs rounded ${
                      formData.items.length === 1
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-red-500 text-white hover:bg-red-600"
                    }`}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="flex justify-between items-center mt-4">
        <button
          type="button"
          onClick={handleAddItem}
          className="px-4 py-2 bg-[#ffbe2a] text-black font-semibold rounded-lg hover:bg-[#e5ab26] transition-colors"
        >
          + Add Item
        </button>
        
        <div className="text-right">
          <p className="text-lg font-semibold text-gray-700">
            Subtotal: <span className="text-[#ffbe2a]">₹ {subtotal.toFixed(2)}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default BillItems;