import React from 'react'
import { User, Phone, Plus } from 'lucide-react'

const ClientInformation = ({
  formData,
  handleInputChange,
  handleClientNameChange,
  selectClient,
  clientSuggestions,
  showClientSuggestions,
  setShowClientSuggestions,
  setShowClientModal
}) => {
  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row gap-3 mb-4 items-start sm:items-center justify-between pb-2 border-b-2 border-[#ffbe2a]">
  <h2 className="text-xl font-bold text-gray-800">
    Client Information
  </h2>
  <button 
    type="button"
    onClick={() => setShowClientModal(true)}
    className="text-sm font-semibold text-black bg-[#ffbe2a] px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
  >
    <Plus className="w-4 h-4" />
    Add New Client
  </button>
</div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="relative">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Client Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              name="clientName"
              value={formData.clientName}
              onChange={handleClientNameChange}
              onFocus={() => formData.clientName && setShowClientSuggestions(true)}
              onBlur={() => setTimeout(() => setShowClientSuggestions(false), 300)}
              placeholder="Start typing client name..."
              className="w-full px-5 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none"
              required
            />
          </div>
          
          {/* Client Suggestions Dropdown */}
          {showClientSuggestions && formData.clientName && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {clientSuggestions.length > 0 ? (
                clientSuggestions.map((client, index) => (
                  <div
                    key={client.id || index}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectClient(client);
                    }}
                    className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                  >
                    <div className="font-semibold text-gray-800">{client.clientName}</div>
                    {client.clientPhone && (
                      <div className="text-sm text-gray-600">{client.clientPhone}</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-center">
                  <p className="text-gray-600 mb-3">No client found with this name</p>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setShowClientModal(true);
                      setShowClientSuggestions(false);
                    }}
                    className="inline-flex items-center gap-2 bg-[#ffbe2a] text-black px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Client
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Client GST Number
          </label>
          <input
            type="text"
            name="clientGST"
            value={formData.clientGST}
            onChange={handleInputChange}
            placeholder="29XXXXXXXXXXXXX"
            className="w-full px-5 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Client Address
          </label>
          <textarea
            name="clientAddress"
            value={formData.clientAddress}
            onChange={handleInputChange}
            rows="2"
            placeholder="Client Address"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Company Name
          </label>
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleInputChange}
            placeholder="Company Name"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none"
            
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Client Phone
          </label>
          <div className="relative">
            <input
              type="tel"
              name="clientPhone"
              value={formData.clientPhone}
              onChange={handleInputChange}
              placeholder="+91 XXXXX XXXXX"
              className="w-full px-5 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none"
              
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Client Email
          </label>
          <input
            type="email"
            name="clientEmail"
            value={formData.clientEmail}
            onChange={handleInputChange}
            placeholder="client@example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbe2a] focus:border-transparent outline-none"
            
          />
        </div>
      </div>
    </div>
  )
}

export default ClientInformation