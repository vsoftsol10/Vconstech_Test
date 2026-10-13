import React from 'react'

const BillSummary = ({ 
  formData, 
  activeTab,
  calculateSubtotal,
  calculateGrossAmount,
  calculateCGST,
  calculateSGST,
  calculateIGST,
  calculateTotalWithTax,
  calculateTDS,
  calculateRetention,
  calculateNetPayable
}) => {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 mb-6 border-2 border-gray-200">
      <h2 className="text-xl font-bold text-gray-800 mb-6 pb-2 border-b-2 border-[#ffbe2a]">
        {activeTab === 'invoice' ? 'Bill' : 'Quote'} Summary
      </h2>
      <div className="space-y-3">
        <div className="flex justify-between text-gray-700 text-l">
          <span className="font-semibold">Subtotal (Items):</span>
          <span className="font-bold">₹ {calculateSubtotal().toFixed(2)}</span>
        </div>
        
        {(formData.labourCharges > 0 || formData.transportCharges > 0 || formData.otherCharges > 0) && (
          <>
            {formData.labourCharges > 0 && (
              <div className="flex justify-between text-gray-600">
                <span className="pl-4">+ Labour Charges:</span>
                <span>₹ {parseFloat(formData.labourCharges).toFixed(2)}</span>
              </div>
            )}
            {formData.transportCharges > 0 && (
              <div className="flex justify-between text-gray-600">
                <span className="pl-4">+ Transport Charges:</span>
                <span>₹ {parseFloat(formData.transportCharges).toFixed(2)}</span>
              </div>
            )}
            {formData.otherCharges > 0 && (
              <div className="flex justify-between text-gray-600">
                <span className="pl-4">+ Other Charges:</span>
                <span>₹ {parseFloat(formData.otherCharges).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-700 text-lg pt-2 border-t border-gray-300">
              <span className="font-semibold">Gross Amount:</span>
              <span className="font-bold">₹ {calculateGrossAmount().toFixed(2)}</span>
            </div>
          </>
        )}
        
        {Number(formData.cgst) > 0 && 
          <div className="flex justify-between text-gray-600">
            <span className="text-l pl-4">+ CGST ({formData.cgst}%):</span>
            <span>₹ {calculateCGST().toFixed(2)}</span>
          </div>
        
}
        {formData.sgst > 0 && (
          <div className="flex justify-between text-gray-600">
            <span className="text-l pl-4">+ SGST ({formData.sgst}%):</span>
            <span>₹ {calculateSGST().toFixed(2)}</span>
          </div>
        )}
        {formData.igst > 0 && (
          <div className="flex justify-between text-gray-600">
            <span className="text-l pl-4">+ IGST ({formData.igst}%):</span>
            <span>₹ {calculateIGST().toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-gray-700 text-l pt-2 border-t border-gray-300">
          <span className="font-semibold">Total with Tax:</span>
          <span className="font-bold">₹ {calculateTotalWithTax().toFixed(2)}</span>
        </div>
        
        {formData.tds > 0 && (
          <div className="flex justify-between text-black">
            <span className=" text-l pl-4">- TDS ({formData.tds}%):</span>
            <span>₹ {calculateTDS().toFixed(2)}</span>
          </div>
        )}
        {formData.retention > 0 && (
          <div className="flex justify-between text-black">
            <span className="pl-4">- Retention ({formData.retention}%):</span>
            <span>₹ {calculateRetention().toFixed(2)}</span>
          </div>
        )}
        {formData.advancePaid > 0 && (
  <div className={`flex justify-between ${activeTab === 'quotation' ? 'text-black' : 'text-black'}`}>
    <span className="pl-4">{activeTab === 'quotation' ? '+ Advance to be Paid:' : '- Advance Paid:'}</span>
    <span>₹ {parseFloat(formData.advancePaid).toFixed(2)}</span>
  </div>
)}
        {formData.previousBills > 0 && activeTab === 'invoice' && (
          <div className="flex justify-between text-black">
            <span className="pl-4">+ Previous Bills:</span>
            <span>₹ {parseFloat(formData.previousBills).toFixed(2)}</span>
          </div>
        )}
        
        <div className="border-t-4 border-[#ffbe2a] pt-4 mt-4">
          <div className="flex justify-between text-l font-bold">
            <span className="text-gray-900">
              {activeTab === 'invoice' ? 'Net Payable Amount:' : 'Total Quoted Amount:'}
            </span>
            <span className="text-black">₹ {calculateNetPayable().toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BillSummary