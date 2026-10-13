// import React from 'react';
// import BillInformation from './form-section/BillInformation';
// import ClientInformation from './form-section/ClientInformation';
// import BillSummary from './form-section/BillSummary';
// import BillItems from './form-section/BillItems';
// import AdditionalInfo from './form-section/AdditionalInfo';
// import CompanyInformation from './form-section/CompanyInformation';
// import PaymentDetails from './form-section/PaymentDetails';
// import TaxAndDeductions from './form-section/TaxAndDeductions';

// const BillingForm = ({
//   formData,
//   activeTab,
//   handleInputChange,
//   handleClientNameChange,
//   selectClient,
//   handleItemChange,
//   addItem,
//   removeItem,
//   calculateSubtotal,
//   calculateGrossAmount,
//   calculateCGST,
//   calculateSGST,
//   calculateIGST,
//   calculateTotalWithTax,
//   calculateTDS,
//   calculateRetention,
//   calculateNetPayable,
//   handleGenerateBill,
//   clientSuggestions,
//   showClientSuggestions,
//   setShowClientSuggestions,
//   setShowClientModal,
// }) => {
  
//   // Handle form submission with validation
//   const handleSubmit = (e) => {
//     e.preventDefault(); // Prevent default form submission that clears data
//     handleGenerateBill(false); // false means not a draft
//   };

//   return (
//     <div className="bg-white rounded-lg shadow-md p-6 mb-6">
//       <form onSubmit={handleSubmit}>
//         <CompanyInformation
//           formData={formData}
//           handleInputChange={handleInputChange}
//         />
//         {/* Client Information Section */}
//         <ClientInformation
//           formData={formData}
//           handleInputChange={handleInputChange}
//           handleClientNameChange={handleClientNameChange}
//           showClientSuggestions={showClientSuggestions}
//           setShowClientSuggestions={setShowClientSuggestions}
//           clientSuggestions={clientSuggestions}
//           selectClient={selectClient}
//           setShowClientModal={setShowClientModal}
//         />



//         {/* Project Information */}
//         <div className="mb-8">
//           <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-[#ffbe2a]">
//             Project Information
//           </h2>
//           <div className="grid md:grid-cols-2 gap-6">
//             <div>
//               <label className="block text-sm font-semibold text-gray-700 mb-2">
//                 Project Name <span className="text-red-500">*</span>
//               </label>
//               <input
//                 type="text"
//                 name="projectName"
//                 value={formData.projectName}
//                 onChange={handleInputChange}
//                 placeholder="Enter project name"
//                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-semibold text-gray-700 mb-2">
//                 Project Location
//               </label>
//               <input
//                 type="text"
//                 name="projectLocation"
//                 value={formData.projectLocation}
//                 onChange={handleInputChange}
//                 placeholder="Enter project location"
//                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-semibold text-gray-700 mb-2">
//                 Work Order No.
//               </label>
//               <input
//                 type="text"
//                 name="workOrderNo"
//                 value={formData.workOrderNo}
//                 onChange={handleInputChange}
//                 placeholder="Enter work order number"
//                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none"
//               />
//             </div>
//           </div>
//         </div>

//         <BillInformation 
//           formData={formData}
//           handleInputChange={handleInputChange}
//           activeTab={activeTab}
//         />
        
//         <PaymentDetails
//           formData={formData} 
//           activeTab={activeTab} 
//           handleInputChange={handleInputChange}
//         />

//         <BillItems
//           formData={formData}
//           activeTab={activeTab}
//           handleItemChange={handleItemChange}
//           addItem={addItem}
//           removeItem={removeItem}
//         />
 
//         <TaxAndDeductions 
//           formData={formData}
//           handleInputChange={handleInputChange}
//         />

//         <AdditionalInfo
//           formData={formData}
//           handleInputChange={handleInputChange} 
//         />

//         {/* Bill Summary Section */}
//         <BillSummary
//           formData={formData}
//           activeTab={activeTab}
//           calculateSubtotal={calculateSubtotal}
//           calculateGrossAmount={calculateGrossAmount}
//           calculateCGST={calculateCGST}
//           calculateSGST={calculateSGST}
//           calculateIGST={calculateIGST}
//           calculateTotalWithTax={calculateTotalWithTax}
//           calculateTDS={calculateTDS}
//           calculateRetention={calculateRetention}
//           calculateNetPayable={calculateNetPayable}
//         />

//         {/* Submit Buttons */}
//         <div className="flex justify-end gap-4">
//           <button
//             type="button"
//             onClick={() => handleGenerateBill(true)}
//             className="bg-gray-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
//           >
//             Save as Draft
//           </button>
//           <button
//             type="submit"
//             className="bg-[#ffbe2a] text-black px-8 py-3 rounded-lg font-semibold hover:bg-[#e5ab26] transition-colors"
//           >
//             Generate {activeTab === 'invoice' ? 'Invoice' : 'Quotation'}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default BillingForm;

import React from 'react';
import { FolderOpen } from 'lucide-react';
import BillInformation from './form-section/BillInformation';
import ClientInformation from './form-section/ClientInformation';
import BillSummary from './form-section/BillSummary';
import BillItems from './form-section/BillItems';
import AdditionalInfo from './form-section/AdditionalInfo';
import CompanyInformation from './form-section/CompanyInformation';
import PaymentDetails from './form-section/PaymentDetails';
import TaxAndDeductions from './form-section/TaxAndDeductions';

const BillingForm = ({
  formData,
  activeTab,
  handleInputChange,
  handleClientNameChange,
  selectClient,
  handleItemChange,
  addItem,
  removeItem,
  calculateSubtotal,
  calculateGrossAmount,
  calculateCGST,
  calculateSGST,
  calculateIGST,
  calculateTotalWithTax,
  calculateTDS,
  calculateRetention,
  calculateNetPayable,
  handleGenerateBill,
  billingErrors = {},
  clientSuggestions,
  showClientSuggestions,
  setShowClientSuggestions,
  setShowClientModal,
}) => {
  
  // Handle form submission with validation
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default form submission that clears data
    handleGenerateBill(false); // false means not a draft
  };
  const billingErrorMessages = Object.values(billingErrors).filter(Boolean);

  return (
    <div className="mb-6">
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Company Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6">
          <CompanyInformation
            formData={formData}
            handleInputChange={handleInputChange}
          />
        </div>

        {/* Client Information Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6">
          <ClientInformation
            formData={formData}
            handleInputChange={handleInputChange}
            handleClientNameChange={handleClientNameChange}
            showClientSuggestions={showClientSuggestions}
            setShowClientSuggestions={setShowClientSuggestions}
            clientSuggestions={clientSuggestions}
            selectClient={selectClient}
            setShowClientModal={setShowClientModal}
          />
        </div>

        {/* Project Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="w-8 h-8 rounded-lg bg-[#fff3d6] flex items-center justify-center flex-shrink-0">
              <FolderOpen className="w-4 h-4 text-[#ffbe2a]" />
            </span>
            <h2 className="text-lg font-bold text-gray-800">Project Information</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="projectName"
                value={formData.projectName}
                onChange={handleInputChange}
                placeholder="Enter project name"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none ${billingErrors.projectName ? 'border-red-500' : 'border-gray-300'}`}
              />
              {billingErrors.projectName && <p className="text-red-500 text-xs mt-1">{billingErrors.projectName}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Project Location
              </label>
              <input
                type="text"
                name="projectLocation"
                value={formData.projectLocation}
                onChange={handleInputChange}
                placeholder="Enter project location"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Work Order No.
              </label>
              <input
                type="text"
                name="workOrderNo"
                value={formData.workOrderNo}
                onChange={handleInputChange}
                placeholder="Enter work order number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        {/* Invoice / Bill Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6">
          <BillInformation
            formData={formData}
            handleInputChange={handleInputChange}
            activeTab={activeTab}
          />
        </div>

        {/* Payment Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6">
          <PaymentDetails
            formData={formData}
            activeTab={activeTab}
            handleInputChange={handleInputChange}
          />
        </div>

        {/* Bill Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6">
          <BillItems
            formData={formData}
            activeTab={activeTab}
            handleItemChange={handleItemChange}
            addItem={addItem}
            removeItem={removeItem}
          />
        </div>

        {/* Tax and Deductions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6">
          <TaxAndDeductions
            formData={formData}
            handleInputChange={handleInputChange}
          />
        </div>

        {/* Bill Summary + Additional Information side by side */}
        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6">
            <BillSummary
              formData={formData}
              activeTab={activeTab}
              calculateSubtotal={calculateSubtotal}
              calculateGrossAmount={calculateGrossAmount}
              calculateCGST={calculateCGST}
              calculateSGST={calculateSGST}
              calculateIGST={calculateIGST}
              calculateTotalWithTax={calculateTotalWithTax}
              calculateTDS={calculateTDS}
              calculateRetention={calculateRetention}
              calculateNetPayable={calculateNetPayable}
            />
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6">
            <AdditionalInfo
              formData={formData}
              handleInputChange={handleInputChange}
            />
          </div>
        </div>

        {/* Submit Buttons */}
        {billingErrorMessages.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {billingErrorMessages.slice(0, 5).map((message, index) => (
              <p key={`${message}-${index}`} className="text-red-600 text-sm">{message}</p>
            ))}
          </div>
        )}
        <div className="flex justify-end gap-3 sm:gap-4 pt-1">
          <button
            type="button"
            onClick={() => handleGenerateBill(true)}
            className="bg-gray-700 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base hover:bg-gray-800 transition-colors"
          >
            Save as Draft
          </button>
          <button
            type="submit"
            className="bg-[#ffbe2a] text-black px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base hover:bg-[#e5ab26] transition-colors shadow-sm"
          >
            Generate {activeTab === 'invoice' ? 'Invoice' : 'Quotation'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BillingForm;
