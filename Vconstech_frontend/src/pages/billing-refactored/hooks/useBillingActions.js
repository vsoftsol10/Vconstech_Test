import { printBill } from '../utils/printBill';
import { getToken } from '../../../utils/tabToken';
import { showToast } from '../../../components/common/Toast';
import { focusFirstInvalidField, validateFields } from '../../../utils/formValidation';

export const useBillingActions = ({
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
}) => {
  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch bills
  const fetchBills = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/bills`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setBills(data.bills || []);
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch clients
  const fetchClients = async () => {
    try {
      const token = getToken();
      const companyId = localStorage.getItem('companyId');
      
      const response = await fetch(`${API_URL}/clients?companyId=${companyId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  // Handle input changes
const numericFields = [
  'labourCharges', 'transportCharges', 'otherCharges',
  'cgst', 'sgst', 'igst', 'tds', 'retention', 
  'advancePaid', 'previousBills', 'quoteNumber'
];

const handleInputChange = (e) => {
  const { name, value } = e.target;
  
  setFormData(prev => ({
    ...prev,
    [name]: numericFields.includes(name)
      ? (value === '' ? 0 : parseFloat(value) || 0)
      : value  // text fields stay as strings
  }));
};

  // Handle client name input with autocomplete
  const handleClientNameChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, clientName: value }));

    if (value.trim().length > 0) {
      const filtered = clients.filter(client =>
        client.clientName.toLowerCase().includes(value.toLowerCase())
      );
      setClientSuggestions(filtered);
      setShowClientSuggestions(true);
    } else {
      setClientSuggestions([]);
      setShowClientSuggestions(false);
    }
  };

  // Select client from suggestions
  const selectClient = (client) => {
    setFormData(prev => ({
      ...prev,
      clientName: client.clientName,
      companyName: client.companyName || '',
      clientAddress: client.clientAddress || '',
      clientGST: client.clientGST || '',
      clientPhone: client.clientPhone || '',
      clientEmail: client.clientEmail || '',
    }));
    setShowClientSuggestions(false);
  };

  // Handle item changes
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };

    // Calculate amount when quantity or rate changes
    if (field === "quantity" || field === "rate") {
      const qty = parseFloat(updatedItems[index].quantity) || 0;
      const rate = parseFloat(updatedItems[index].rate) || 0;
      updatedItems[index].amount = qty * rate;
    }

    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
    }));
  };

  // Add item
  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { 
        sno: prev.items.length + 1,
        description: "", 
        HSN: 0,
        unit: "Nos", 
        quantity: 0, 
        rate: 0, 
        amount: 0 
      }],
    }));
  };

  // Remove item
  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const updatedItems = formData.items.filter((_, i) => i !== index);
      updatedItems.forEach((item, idx) => {
        item.sno = idx + 1;
      });
      setFormData((prev) => ({
        ...prev,
        items: updatedItems,
      }));
    }
  };

  // Calculation functions
  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  };

  const calculateGrossAmount = () => {
    const subtotal = calculateSubtotal();
    const labour = parseFloat(formData.labourCharges || 0);
    const transport = parseFloat(formData.transportCharges || 0);
    const other = parseFloat(formData.otherCharges || 0);
    return subtotal + labour + transport + other;
  };

  const calculateCGST = () => {
    return (calculateGrossAmount() * parseFloat(formData.cgst || 0)) / 100;
  };

  const calculateSGST = () => {
    return (calculateGrossAmount() * parseFloat(formData.sgst || 0)) / 100;
  };

  const calculateIGST = () => {
    return (calculateGrossAmount() * parseFloat(formData.igst || 0)) / 100;
  };

  const calculateTotalWithTax = () => {
    return calculateGrossAmount() + calculateCGST() + calculateSGST() + calculateIGST();
  };

  const calculateTDS = () => {
    return (calculateTotalWithTax() * parseFloat(formData.tds || 0)) / 100;
  };

  const calculateRetention = () => {
    return (calculateTotalWithTax() * parseFloat(formData.retention || 0)) / 100;
  };

  const calculateNetPayable = () => {
  const total = calculateTotalWithTax();
  const tds = calculateTDS();
  const retention = calculateRetention();
  const advance = parseFloat(formData.advancePaid || 0);
  const previous = parseFloat(formData.previousBills || 0);

  if (formData.billType === 'quotation') {
    return total - tds - retention + advance + previous; // ← advance ADDED
  } else {
    return total - tds - retention - advance + previous; // ← advance SUBTRACTED
  }
};

  const validateBillForm = () => {
    const errors = validateFields([
      { name: 'billNumber', value: formData.billNumber, label: 'Bill number', rules: ['required'] },
      { name: 'billDate', value: formData.billDate, label: 'Bill date', rules: ['date'] },
      { name: 'clientName', value: formData.clientName, label: 'Client name', rules: ['name'] },
      { name: 'projectName', value: formData.projectName, label: 'Project name', rules: ['name'] },
      { name: 'clientPhone', value: formData.clientPhone, label: 'Client phone', rules: formData.clientPhone ? ['optionalMobile'] : [] },
      { name: 'clientEmail', value: formData.clientEmail, label: 'Client email', rules: formData.clientEmail ? ['optionalEmail'] : [] },
      ...formData.items.flatMap((item, index) => [
        { name: `items.${index}.description`, value: item.description, label: 'Item description', rules: ['textarea'] },
        { name: `items.${index}.quantity`, value: item.quantity, label: 'Quantity', rules: ['quantity'] },
        { name: `items.${index}.rate`, value: item.rate, label: 'Rate', rules: ['amount'] },
      ]),
    ]);
    setBillingErrors?.(errors);
    if (Object.keys(errors).length) focusFirstInvalidField(errors);
    return Object.keys(errors).length === 0;
  };

  // Generate bill
  const handleGenerateBill = async (isDraft = false) => {
    if (!validateBillForm()) return;

    try {
      const token = getToken();
      const billData = {
        ...formData,
        status: isDraft ? 'DRAFT' : 'SENT'
      };

      const response = await fetch(`${API_URL}/bills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(billData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const actionText = isDraft ? 'saved as draft' : 'created';
        showToast(`${formData.billType === 'invoice' ? 'Invoice' : 'Quotation'} ${formData.billNumber} ${actionText} successfully!`, "success");
        
        fetchBills();
        resetForm();
      } else {
        showToast(`Error: ${data.error || 'Failed to create bill'}`, "error");
      }
    } catch (error) {
      console.error('Error creating bill:', error);
      showToast('Failed to create bill. Please try again.', 'error');
    }
  };

  // Update bill
  const handleUpdateBill = async (isDraft = false, editingBill) => {
    if (!editingBill) return;
    if (!validateBillForm()) return;

    try {
      const token = getToken();
      const billData = {
        ...formData,
        status: isDraft ? 'DRAFT' : 'SENT'
      };

      const response = await fetch(`${API_URL}/bills/${editingBill._id || editingBill.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(billData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast(`Bill updated successfully!`, "success");
        fetchBills();
        setShowEditModal(false);
        setEditingBill(null);
        resetForm();
      } else {
        showToast(`Error: ${data.error || 'Failed to update bill'}`, "error");
      }
    } catch (error) {
      console.error('Error updating bill:', error);
      showToast('Failed to update bill. Please try again.', 'error');
    }
  };

  // Reset form
  const resetForm = () => {
  setFormData(prev => ({
    billType: activeTab,
    billNumber: "",
    billDate: "",
    dueDate: "",
    adminCompanyName: prev.adminCompanyName,  // ← CHANGED (preserve admin)
    companyAddress: prev.companyAddress,
    companyGST: prev.companyGST,
    companyPhone: prev.companyPhone,
    companyEmail: prev.companyEmail,
    clientName: "",
    clientAddress: "",
    clientGST: "",
    clientPhone: "",
    clientEmail: "",
    companyName: "",                          // ← reset client's company
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
    status: "SENT",
  }));
};

  // Edit bill
  const handleEditBill = (bill) => {
    setEditingBill(bill);
    
    setFormData({
      billType: bill.billType || 'invoice',
      billNumber: bill.billId || bill.billNumber || "",
      billDate: bill.billDate ? bill.billDate.split('T')[0] : "",
      dueDate: bill.dueDate ? bill.dueDate.split('T')[0] : "",
      companyName: bill.companyName || "",
      companyAddress: bill.companyAddress || "",
      companyGST: bill.companyGST || "",
      companyPhone: bill.companyPhone || "",
      companyEmail: bill.companyEmail || "",
      clientName: bill.clientName || "",
      clientAddress: bill.clientAddress || "",
      clientGST: bill.clientGST || "",
      clientPhone: bill.clientPhone || "",
      clientEmail: bill.clientEmail || "",
      projectName: bill.projectName || "",
      projectLocation: bill.projectLocation || "",
      workOrderNo: bill.workOrderNo || "",
      items: bill.BillItem || bill.items || [{ 
        sno: 1,
        description: "", 
        HSN: 0,
        unit: "Nos", 
        quantity: 0, 
        rate: 0, 
        amount: 0 
      }],
      labourCharges: bill.labourCharges || 0,
      transportCharges: bill.transportCharges || 0,
      otherCharges: bill.otherCharges || 0,
      otherChargesDescription: bill.otherChargesDescription || "",
      cgst: bill.cgstPercent || bill.cgst || 9,
      sgst: bill.sgstPercent || bill.sgst || 9,
      igst: bill.igstPercent || bill.igst || 0,
      tds: bill.tdsPercent || bill.tds || 2,
      retention: bill.retentionPercent || bill.retention || 0,
      advancePaid: bill.advancePaid || 0,
      previousBills: bill.previousBills || 0,
      remarks: bill.remarks || "",
      termsAndConditions: bill.termsAndConditions || "",
      status: bill.status || "SENT",
    });
    
    setShowEditModal(true);
  };

  // Delete bill
  const handleDeleteBill = async (billId) => {
    if (!billId) {
      showToast('Invalid bill ID', 'warning');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this bill?')) {
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/bills/${billId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast('Bill deleted successfully!', 'success');
        fetchBills();
      } else {
        showToast(`Error: ${data.error || 'Failed to delete bill'}`, "error");
      }
    } catch (error) {
      console.error('Error deleting bill:', error);
      showToast('Failed to delete bill. Please try again.', 'error');
    }
  };

  // Update status
  const handleUpdateStatus = async (billId, newStatus) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/bills/${billId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        fetchBills();
      } else {
        showToast(`Error: ${data.error || 'Failed to update status'}`, "error");
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Failed to update status. Please try again.', 'error');
    }
  };

// Add client
const handleAddClient = async () => {
  const errors = validateFields([
    { name: 'clientName', value: newClient.clientName, label: 'Client name', rules: ['name'] },
    { name: 'clientPhone', value: newClient.clientPhone, label: 'Phone number', rules: newClient.clientPhone ? ['optionalMobile'] : [] },
    { name: 'clientEmail', value: newClient.clientEmail, label: 'Email', rules: newClient.clientEmail ? ['optionalEmail'] : [] },
    { name: 'clientAddress', value: newClient.clientAddress, label: 'Client address', rules: newClient.clientAddress ? ['textarea'] : [] },
  ]);
  setClientErrors?.(errors);
  if (Object.keys(errors).length) {
    focusFirstInvalidField(errors);
    return;
  }

  try {
    const token = getToken();
    const companyId = localStorage.getItem('companyId');
    
    const response = await fetch(`${API_URL}/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ...newClient,
        companyId
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Add to local clients list
      setClients(prev => [...prev, data.client]);

      // Reset new client form
      setNewClient({
        clientName: '',
        companyName: '',
        clientAddress: '',
        clientGST: '',
        clientPhone: '',
        clientEmail: ''
      });

      // Close modal
      setShowClientModal(false);

      showToast('Client added successfully! You can now select it from the dropdown.', 'success');
    } else {
      showToast(`Error: ${data.error || 'Failed to add client'}`, "error");
    }
  } catch (error) {
    console.error('Error adding client:', error);
    showToast('Failed to add client. Please try again.', 'error');
  }
};

  const handlePrintBill = (bill) => {
    printBill(bill);
  };

  return {
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
  };
};
