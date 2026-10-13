import React from 'react';
import { X } from 'lucide-react';
import BillInformation from './form-section/BillInformation';
import CompanyInformation from './form-section/CompanyInformation';
import ClientInformation from './form-section/ClientInformation';
import ProjectInformation from './form-section/ProjectInformation';
import BillItems from './form-section/BillItems';
import TaxAndDeductions from './form-section/TaxAndDeductions';
import AdditionalInfo from './form-section/AdditionalInfo';
import PaymentDetails from './form-section/PaymentDetails';

const EditBillModal = ({
  showEditModal,
  setShowEditModal,
  editingBill,
  setEditingBill,
  formData,
  handleInputChange,
  handleItemChange,
  addItem,
  removeItem,
  handleUpdateBill,
  resetForm,
  // Add these new props for ClientInformation component
  handleClientNameChange,
  selectClient,
  clientSuggestions,
  showClientSuggestions,
  setShowClientSuggestions,
  setShowClientModal,
}) => {
  if (!showEditModal) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full my-8">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-lg z-10">
          <h2 className="text-2xl font-bold text-gray-800">
            Edit {formData.billType === 'invoice' ? 'Invoice' : 'Quotation'}
          </h2>
          <button
            onClick={() => {
              setShowEditModal(false);
              setEditingBill(null);
              resetForm();
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <div className="space-y-6">
            {/* Bill Information */}
            <BillInformation
              formData={formData}
              handleInputChange={handleInputChange}
              activeTab={formData.billType}
            />

            {/* Company Information */}
            <CompanyInformation
              formData={formData}
              handleInputChange={handleInputChange}
            />

            {/* Client Information */}
            <ClientInformation
              formData={formData}
              handleInputChange={handleInputChange}
              handleClientNameChange={handleClientNameChange}
              selectClient={selectClient}
              clientSuggestions={clientSuggestions}
              showClientSuggestions={showClientSuggestions}
              setShowClientSuggestions={setShowClientSuggestions}
              setShowClientModal={setShowClientModal}
            />

            {/* Project Information */}
            <ProjectInformation
              formData={formData}
              handleInputChange={handleInputChange}
            />

            {/* Bill Items */}
            <BillItems
              formData={formData}
              activeTab={formData.billType}
              handleItemChange={handleItemChange}
              addItem={addItem}
              removeItem={removeItem}
            />

            {/* Tax & Deductions */}
            <TaxAndDeductions
              formData={formData}
              handleInputChange={handleInputChange}
            />

            {/* Payment Details */}
            <PaymentDetails
              formData={formData}
              activeTab={formData.billType}
              handleInputChange={handleInputChange}
            />

            {/* Additional Information */}
            <AdditionalInfo
              formData={formData}
              handleInputChange={handleInputChange}
            />
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t">
            <button
              onClick={() => handleUpdateBill(false, editingBill)}
              className="flex-1 bg-[#ffbe2a] text-black font-semibold py-2 px-4 rounded-lg hover:bg-[#e5ab26] transition-colors"
            >
              Update Bill
            </button>
            
            <button
              onClick={() => handleUpdateBill(true, editingBill)}
              className="flex-1 bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Save as Draft
            </button>
            <button
              onClick={() => {
                setShowEditModal(false);
                setEditingBill(null);
                resetForm();
              }}
              className="flex-1 bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditBillModal;