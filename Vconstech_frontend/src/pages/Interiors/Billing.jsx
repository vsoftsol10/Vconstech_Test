import React, { useState, useEffect } from "react";
import { FileText } from "lucide-react";
import Navbar from "../../components/common/Navbar";
import SidePannel from "../../components/common/SidePannel";
import BillingTabs from "../billing-refactored/components/BillingTabs";
import BillingForm from "../billing-refactored/components/BillingForm";
import BillsListSection from "../billing-refactored/components/BillsListSection";
import AddClientModal from "../billing-refactored/components/form-section/AddClientModal";
import EditBillModal from "../billing-refactored/components/EditBillModal";
import { useBillingState } from "../billing-refactored/hooks/useBillingState";
import { useBillingActions } from "../billing-refactored/hooks/useBillingActions";
import { getToken } from '../../utils/tabToken';

const Billing = () => {
  // State management
  const {
    activeTab,
    setActiveTab,
    activeSection,
    setActiveSection,
    formData,
    setFormData,
    bills,
    setBills,
    clients,
    setClients,
    loading,
    setLoading,
    showClientModal,
    setShowClientModal,
    showEditModal,
    setShowEditModal,
    editingBill,
    setEditingBill,
    searchTerm,
    setSearchTerm,
    dateFilter,
    setDateFilter,
    customDateRange,
    setCustomDateRange,
    showFilterDropdown,
    setShowFilterDropdown,
    clientSuggestions,
    setClientSuggestions,
    showClientSuggestions,
    setShowClientSuggestions,
    billingErrors,
    setBillingErrors,
    clientErrors,
    setClientErrors,
    newClient,
    setNewClient,
  } = useBillingState();

  // Actions
  const {
    fetchBills,
    fetchClients,
    handleInputChange,
    handleClientNameChange,
    selectClient,
    handleItemChange,
    addItem,
    removeItem,
    handleGenerateBill,
    handleUpdateBill,
    resetForm,
    handleEditBill,
    handlePrintBill,
    handleDeleteBill,
    handleUpdateStatus,
    handleAddClient,
    calculateSubtotal,
    calculateGrossAmount,
    calculateCGST,
    calculateSGST,
    calculateIGST,
    calculateTotalWithTax,
    calculateTDS,
    calculateRetention,
    calculateNetPayable,
  } = useBillingActions({
    formData,
    setFormData,
    bills,
    setBills,
    clients,
    setClients,
    setLoading,
    setShowClientModal,
    setShowEditModal,
    setEditingBill,
    setClientSuggestions,
    setShowClientSuggestions,
    newClient,
    setNewClient,
    activeTab,
    setBillingErrors,
    setClientErrors,
  });

  // Fetch company data
  const fetchCompanyData = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL;
      const userId = localStorage.getItem('userId');
      const token = getToken();

      if (!userId || !token) return;

      const response = await fetch(`${API_URL}/users/profile/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success && data.user) {
        setFormData((prev) => ({
          ...prev,
          adminCompanyName: data.user.company?.name || '',
          companyGST: data.user.gstNumber || '',
          companyAddress: data.user.address || '',
          companyPhone: data.user.phoneNumber || '',
          companyEmail: data.user.email || '',
        }));
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
    }
  };
useEffect(() => {
    document.title = "Vconstech - Admin";
  }, []);
  // Fetch data on mount
  useEffect(() => {
    fetchBills();
    fetchClients();
    fetchCompanyData(); // Add this line
  }, []);

  // Update billType when tab changes
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      billType: activeTab,
    }));
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">



      <div className="pt-20 pl-0 md:pl-64 md:pt-25 pb-20 md:pb-0">
        <div className="px-4 sm:px-6 lg:px-8 pt-4 pb-8 min-w-0">
          <div className="w-full">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 w-full">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-8 h-8 text-[#ffbe2a]" />
                <h1 className="text-2xl font-bold leading-tight tracking-tight text-gray-900">
                  Billing Management
                </h1>
              </div>
              <p className="text-gray-600">
                Generate professional invoices and quotations
              </p>
            </div>

            <div className="w-full">
              <BillingTabs activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>

            {/* Billing Form */}
            <div className="w-full">
              <BillingForm
                formData={formData}
                activeTab={activeTab}
                handleInputChange={handleInputChange}
                handleClientNameChange={handleClientNameChange}
                selectClient={selectClient}
                handleItemChange={handleItemChange}
                addItem={addItem}
                removeItem={removeItem}
                calculateSubtotal={calculateSubtotal}
                calculateGrossAmount={calculateGrossAmount}
                calculateCGST={calculateCGST}
                calculateSGST={calculateSGST}
                calculateIGST={calculateIGST}
                calculateTotalWithTax={calculateTotalWithTax}
                calculateTDS={calculateTDS}
                calculateRetention={calculateRetention}
                calculateNetPayable={calculateNetPayable}
                handleGenerateBill={handleGenerateBill}
                billingErrors={billingErrors}
                clientSuggestions={clientSuggestions}
                showClientSuggestions={showClientSuggestions}
                setShowClientSuggestions={setShowClientSuggestions}
                setShowClientModal={setShowClientModal}
              />
            </div>

            {/* Bills List Section */}
            <div className="w-full">
              <BillsListSection
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                bills={bills}
                loading={loading}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                dateFilter={dateFilter}
                setDateFilter={setDateFilter}
                customDateRange={customDateRange}
                setCustomDateRange={setCustomDateRange}
                showFilterDropdown={showFilterDropdown}
                setShowFilterDropdown={setShowFilterDropdown}
                handleEditBill={handleEditBill}
                handlePrintBill={handlePrintBill}
                handleDeleteBill={handleDeleteBill}
                handleUpdateStatus={handleUpdateStatus}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddClientModal
        showClientModal={showClientModal}
        setShowClientModal={setShowClientModal}
        newClient={newClient}
        setNewClient={setNewClient}
        handleAddClient={handleAddClient}
        clientErrors={clientErrors}
      />

      <EditBillModal
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        editingBill={editingBill}
        setEditingBill={setEditingBill}
        formData={formData}
        handleInputChange={handleInputChange}
        handleItemChange={handleItemChange}
        addItem={addItem}
        removeItem={removeItem}
        handleUpdateBill={handleUpdateBill}
        resetForm={resetForm}
        // Add these missing props
        handleClientNameChange={handleClientNameChange}
        selectClient={selectClient}
        clientSuggestions={clientSuggestions}
        showClientSuggestions={showClientSuggestions}
        setShowClientSuggestions={setShowClientSuggestions}
        setShowClientModal={setShowClientModal}
      />
    </div>
  );
};

export default Billing;
