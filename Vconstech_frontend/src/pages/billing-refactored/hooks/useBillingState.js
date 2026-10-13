import { useState } from 'react';

export const useBillingState = () => {
  const [activeTab, setActiveTab] = useState('invoice');
  const [activeSection, setActiveSection] = useState('all');
  
  const [formData, setFormData] = useState({
    billType: 'invoice',
    billNumber: "",
    billDate: "",
    dueDate: "",
    adminCompanyName: "",
    companyAddress: "",
    companyGST: "",
    companyPhone: "",
    companyEmail: "",
    clientName: "",
    clientAddress: "",
    clientGST: "",
    clientPhone: "",
    clientEmail: "",
    companyName: "",
    projectName: "",
    projectLocation: "",
    workOrderNo: "",
    items: [{ 
      sno: 1,
      description: "", 
      HSN: 0,
      unit: "Nos", 
      quantity: 0, 
      rate: 0, 
      amount: 0 
    }],
    labourCharges: 0,
    transportCharges: 0,
    otherCharges: 0,
    otherChargesDescription: "",
    cgst: 9,
    sgst: 9,
    igst: 0,
    tds: 2,
    retention: 0,
    advancePaid: 0,
    previousBills: 0,
    remarks: "",
    termsAndConditions: "",
    status: "open",
  });

  const [bills, setBills] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [clientSuggestions, setClientSuggestions] = useState([]);
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [billingErrors, setBillingErrors] = useState({});
  const [clientErrors, setClientErrors] = useState({});
  
  const [newClient, setNewClient] = useState({
    clientName: "",
    clientAddress: "",
    clientGST: "",
    clientPhone: "",
    clientEmail: "",
  });

  return {
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
  };
};
