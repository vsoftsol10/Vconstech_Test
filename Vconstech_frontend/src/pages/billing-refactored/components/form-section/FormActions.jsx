import React from 'react';

const FormActions = ({
  activeTab,
  handleGenerateBill,
  handleSaveAsDraft
}) => {
  return (
    <div className="flex justify-center pb-6 gap-4 flex-wrap">
      <button
        onClick={() => handleGenerateBill(false)}
        className="px-6 py-2 bg-black text-white font-bold text-xl rounded-lg hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-2xl transform hover:scale-105"
      >
        Generate {activeTab === 'invoice' ? 'Invoice' : 'Quotation'}
      </button>

      <button
        onClick={() => handleGenerateBill(false)}
        className="px-6 py-2 bg-[#ffbe2a] text-black font-bold text-xl rounded-lg hover:bg-[#e5ab26] transition-all duration-200 shadow-lg hover:shadow-2xl transform hover:scale-105"
      >
        Save {activeTab === 'invoice' ? 'Invoice' : 'Quotation'}
      </button>

     {/* <button
        onClick={handleSaveAsDraft}
        className="px-6 py-2 bg-gray-500 text-white font-bold text-xl rounded-lg hover:bg-gray-600 transition-all duration-200 shadow-lg hover:shadow-2xl transform hover:scale-105"
      >
        Save as Draft
      </button>  */}
    </div>
  );
};

export default FormActions;