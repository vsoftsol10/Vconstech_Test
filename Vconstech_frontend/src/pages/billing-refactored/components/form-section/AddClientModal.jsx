import React from 'react';
import { X } from 'lucide-react';

const AddClientModal = ({
  showClientModal,
  setShowClientModal,
  newClient,
  setNewClient,
  handleAddClient,
  clientErrors = {}
}) => {
  if (!showClientModal) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Add New Client</h2>
          <button
            onClick={() => setShowClientModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Client Name <span className="text-red-500">*</span>
              </label>
              <input
                name="clientName"
                type="text"
                value={newClient.clientName || ''}
                onChange={(e) => setNewClient(prev => ({ ...prev, clientName: e.target.value }))}
                placeholder="Client/Company Name"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none ${clientErrors.clientName ? 'border-red-500' : 'border-gray-300'}`}
              />
              {clientErrors.clientName && <p className="text-red-500 text-xs mt-1">{clientErrors.clientName}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={newClient.companyName || ''}
                onChange={(e) => setNewClient(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="Company Name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Client Address
              </label>
              <textarea
                name="clientAddress"
                value={newClient.clientAddress || ''}
                onChange={(e) => setNewClient(prev => ({ ...prev, clientAddress: e.target.value }))}
                rows="3"
                placeholder="Full Address"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none resize-none ${clientErrors.clientAddress ? 'border-red-500' : 'border-gray-300'}`}
              />
              {clientErrors.clientAddress && <p className="text-red-500 text-xs mt-1">{clientErrors.clientAddress}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                GST Number
              </label>
              <input
                type="text"
                value={newClient.clientGST || ''}
                onChange={(e) => setNewClient(prev => ({ ...prev, clientGST: e.target.value }))}
                placeholder="29XXXXXXXXXXXXX"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                name="clientPhone"
                type="tel"
                value={newClient.clientPhone || ''}
                onChange={(e) => setNewClient(prev => ({ ...prev, clientPhone: e.target.value }))}
                placeholder="+91 XXXXX XXXXX"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none ${clientErrors.clientPhone ? 'border-red-500' : 'border-gray-300'}`}
              />
              {clientErrors.clientPhone && <p className="text-red-500 text-xs mt-1">{clientErrors.clientPhone}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                name="clientEmail"
                type="email"
                value={newClient.clientEmail || ''}
                onChange={(e) => setNewClient(prev => ({ ...prev, clientEmail: e.target.value }))}
                placeholder="client@example.com"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none ${clientErrors.clientEmail ? 'border-red-500' : 'border-gray-300'}`}
              />
              {clientErrors.clientEmail && <p className="text-red-500 text-xs mt-1">{clientErrors.clientEmail}</p>}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleAddClient}
              className="flex-1 bg-[#ffbe2a] text-black font-semibold py-2 px-4 rounded-lg hover:bg-[#e5ab26] transition-colors"
            >
              Add Client
            </button>
            <button
              onClick={() => setShowClientModal(false)}
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

export default AddClientModal;
