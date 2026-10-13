// Pure calculation functions
export const calculateSubtotal = (items) => {
  return items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
};

export const calculateGrossAmount = (subtotal, charges) => {
  const { labourCharges, transportCharges, otherCharges } = charges;
  return subtotal + 
    parseFloat(labourCharges || 0) + 
    parseFloat(transportCharges || 0) + 
    parseFloat(otherCharges || 0);
};

export const calculateTaxAmount = (grossAmount, taxRate) => {
  return (grossAmount * parseFloat(taxRate || 0)) / 100;
};

export const calculateNetPayable = (totalWithTax, deductions, billType) => {
  const { tds, retention, advancePaid, previousBills } = deductions;
  
  const advance = parseFloat(advancePaid || 0);
  
  return billType === 'quotation'
    ? totalWithTax - tds - retention + advance + (previousBills || 0)  // ← added for quotation
    : totalWithTax - tds - retention - advance + (previousBills || 0); // ← subtracted for invoice
};