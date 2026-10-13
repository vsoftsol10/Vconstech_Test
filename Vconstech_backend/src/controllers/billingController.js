import { prisma } from '../config/database.js';

// ========== CREATE BILL ==========
export const createBill = async (req, res) => {
  try {
    const {
      billType,
      billNumber,
      billDate,
      dueDate,
      companyName,
      companyAddress,
      companyGST,
      companyPhone,
      companyEmail,
      clientName,
      clientAddress,
      clientGST,
      clientPhone,
      clientEmail,
      projectName,
      projectLocation,
      workOrderNo,
      projectId,
      items,
      labourCharges,
      transportCharges,
      otherCharges,
      otherChargesDescription,
      cgst,
      sgst,
      igst,
      tds,
      retention,
      advancePaid,
      previousBills,
      remarks,
      termsAndConditions,
      status,
    } = req.body;

    const companyId = req.user.companyId;
    const createdBy = req.user.userId;

    console.log('Creating bill:', { billNumber, billType, status });

    // Validate required fields
    if (!billNumber || !billDate || !clientName || !projectName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: billNumber, billDate, clientName, projectName'
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one bill item is required'
      });
    }

    // Check if bill number already exists
    const existingBill = await prisma.bill.findUnique({
      where: { billId: billNumber }
    });

    if (existingBill) {
      return res.status(400).json({
        success: false,
        error: `Bill number ${billNumber} already exists`
      });
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    
    const grossAmount = subtotal + 
      parseFloat(labourCharges || 0) + 
      parseFloat(transportCharges || 0) + 
      parseFloat(otherCharges || 0);
    
    const cgstAmount = (grossAmount * parseFloat(cgst || 0)) / 100;
    const sgstAmount = (grossAmount * parseFloat(sgst || 0)) / 100;
    const igstAmount = (grossAmount * parseFloat(igst || 0)) / 100;
    
    const totalWithTax = grossAmount + cgstAmount + sgstAmount + igstAmount;
    
    const tdsAmount = (totalWithTax * parseFloat(tds || 0)) / 100;
    const retentionAmount = (totalWithTax * parseFloat(retention || 0)) / 100;
    
    const netPayable = totalWithTax - tdsAmount - retentionAmount - 
      parseFloat(advancePaid || 0) + parseFloat(previousBills || 0);

    const billData = {
      billId: billNumber,
      billType: billType || 'invoice',
      billDate: new Date(billDate),
      dueDate: dueDate ? new Date(dueDate) : null,
      
      companyName,
      companyAddress,
      companyGST,
      companyPhone,
      companyEmail,
      
      clientName,
      clientAddress,
      clientGST,
      clientPhone,
      clientEmail,
      
      projectId: projectId ? parseInt(projectId) : null,
      projectName,
      projectLocation,
      workOrderNo,
      
      labourCharges: parseFloat(labourCharges || 0),
      transportCharges: parseFloat(transportCharges || 0),
      otherCharges: parseFloat(otherCharges || 0),
      otherChargesDescription,
      
      cgstPercent: parseFloat(cgst || 0),
      sgstPercent: parseFloat(sgst || 0),
      igstPercent: parseFloat(igst || 0),
      tdsPercent: parseFloat(tds || 0),
      retentionPercent: parseFloat(retention || 0),
      
      cgstAmount,
      sgstAmount,
      igstAmount,
      tdsAmount,
      retentionAmount,
      
      advancePaid: parseFloat(advancePaid || 0),
      previousBills: parseFloat(previousBills || 0),
      
      subtotal,
      grossAmount,
      totalWithTax,
      netPayable,
      
      remarks,
      termsAndConditions,
      
      companyId,
      status: status || 'open',
      createdBy: createdBy,

      BillItem: {
        create: items
          .filter(item => item.description && item.description.trim() !== '')
          .map((item, index) => ({
            sno: item.sno || index + 1,
            description: item.description,
            HSN: item.HSN || "",
            unit: item.unit || "Nos",
            quantity: parseFloat(item.quantity || 0),
            rate: parseFloat(item.rate || 0),
            amount: parseFloat(item.amount || 0),
          })),
      },
    };

    const bill = await prisma.bill.create({
      data: billData,
      include: {
        BillItem: {
          orderBy: { sno: 'asc' }
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Bill created successfully',
      bill,
    });

  } catch (error) {
    console.error('Error creating bill:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create bill',
      details: error.message,
    });
  }
};

// ========== GET ALL BILLS ==========
export const getAllBills = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { status, projectId, startDate, endDate, limit = 50, page = 1 } = req.query;

    const where = { companyId };

    if (status) where.status = status;
    if (projectId) where.projectId = parseInt(projectId);
    if (startDate || endDate) {
      where.billDate = {};
      if (startDate) where.billDate.gte = new Date(startDate);
      if (endDate) where.billDate.lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where,
        include: {
          BillItem: { orderBy: { sno: 'asc' } },
          // ✅ Include company data with logo
          companies: {
            select: {
              id: true,
              name: true,
              logo: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip,
      }),
      prisma.bill.count({ where })
    ]);

    // ✅ Transform bills to include company at bill level
    const billsData = bills.map(bill => ({
      ...bill,
      items: bill.BillItem,
      company: {
        id: bill.companies?.id,
        name: bill.companies?.name || bill.companyName,
        logo: bill.companies?.logo,
      }
    }));

    res.json({
      success: true,
      bills: billsData,  // ✅ Send transformed bills
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch bills',
      details: error.message 
    });
  }
};

// ========== GET BILL BY ID ==========
export const getBillById = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const bill = await prisma.bill.findFirst({
      where: { id: parseInt(id), companyId },
      include: {
        BillItem: { orderBy: { sno: 'asc' } },
        // ✅ Include company data with logo
        companies: {
          select: {
            id: true,
            name: true,
            logo: true,  // ✅ This is the important field
          }
        }
      }
    });

    if (!bill) {
      return res.status(404).json({ success: false, error: 'Bill not found' });
    }

    // ✅ Transform the response to include company at bill level
    const billData = {
      ...bill,
      items: bill.BillItem,  // Rename BillItem to items for frontend
      company: {
        id: bill.companies?.id,
        name: bill.companies?.name || bill.companyName,
        logo: bill.companies?.logo,  // ✅ Logo is now available
      }
    };

    res.json({ success: true, bill: billData });
  } catch (error) {
    console.error('Error fetching bill:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch bill',
      details: error.message 
    });
  }
};


// ========== GET BILLS BY PROJECT ==========
export const getBillsByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const companyId = req.user.companyId;

    const bills = await prisma.bill.findMany({
      where: { projectId: parseInt(projectId), companyId },
      include: {
        BillItem: { orderBy: { sno: 'asc' } },
        // ✅ Include company data with logo
        companies: {
          select: {
            id: true,
            name: true,
            logo: true,
          }
        }
      },
      orderBy: { billDate: 'desc' }
    });

    // ✅ Transform bills
    const billsData = bills.map(bill => ({
      ...bill,
      items: bill.BillItem,
      company: {
        id: bill.companies?.id,
        name: bill.companies?.name || bill.companyName,
        logo: bill.companies?.logo,
      }
    }));

    const summary = {
      totalBills: billsData.length,
      totalBilled: billsData.reduce((sum, bill) => sum + bill.netPayable, 0),
      paidBills: billsData.filter(b => b.status === 'paid').length,
      pendingBills: billsData.filter(b => b.status === 'sent' || b.status === 'open').length,
      overdueBills: billsData.filter(b => b.status === 'overdue').length,
    };

    res.json({ success: true, bills: billsData, summary });
  } catch (error) {
    console.error('Error fetching project bills:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch project bills',
      details: error.message 
    });
  }
};

// ========== UPDATE BILL STATUS ==========
export const updateBillStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const companyId = req.user.companyId;

    const validStatuses = ['draft', 'open', 'sent', 'paid', 'overdue'];
    
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const bill = await prisma.bill.updateMany({
      where: { id: parseInt(id), companyId },
      data: { status: status.toLowerCase() }
    });

    if (bill.count === 0) {
      return res.status(404).json({ success: false, error: 'Bill not found' });
    }

    res.json({ success: true, message: `Bill status updated to ${status}` });
  } catch (error) {
    console.error('Error updating bill status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update bill status',
      details: error.message 
    });
  }
};

// ========== UPDATE BILL ==========
export const updateBill = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    
    const {
      billType,
      billNumber,
      billDate,
      dueDate,
      companyName,
      companyAddress,
      companyGST,
      companyPhone,
      companyEmail,
      clientName,
      clientAddress,
      clientGST,
      clientPhone,
      clientEmail,
      projectName,
      projectLocation,
      workOrderNo,
      projectId,
      items,
      labourCharges,
      transportCharges,
      otherCharges,
      otherChargesDescription,
      cgst,
      sgst,
      igst,
      tds,
      retention,
      advancePaid,
      previousBills,
      remarks,
      termsAndConditions,
      status,
    } = req.body;
    
    const existingBill = await prisma.bill.findFirst({
      where: { id: parseInt(id), companyId }
    });

    if (!existingBill) {
      return res.status(404).json({ success: false, error: 'Bill not found' });
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    
    const grossAmount = subtotal + 
      parseFloat(labourCharges || 0) + 
      parseFloat(transportCharges || 0) + 
      parseFloat(otherCharges || 0);
    
    const cgstAmount = (grossAmount * parseFloat(cgst || 0)) / 100;
    const sgstAmount = (grossAmount * parseFloat(sgst || 0)) / 100;
    const igstAmount = (grossAmount * parseFloat(igst || 0)) / 100;
    
    const totalWithTax = grossAmount + cgstAmount + sgstAmount + igstAmount;
    
    const tdsAmount = (totalWithTax * parseFloat(tds || 0)) / 100;
    const retentionAmount = (totalWithTax * parseFloat(retention || 0)) / 100;
    
    const netPayable = totalWithTax - tdsAmount - retentionAmount - 
      parseFloat(advancePaid || 0) + parseFloat(previousBills || 0);

    // Delete existing items
    await prisma.billItem.deleteMany({
      where: { billId: parseInt(id) }
    });

    // Update bill
    const updatedBill = await prisma.bill.update({
      where: { id: parseInt(id) },
      data: {
        billType: billType || existingBill.billType,
        billDate: billDate ? new Date(billDate) : existingBill.billDate,
        dueDate: dueDate ? new Date(dueDate) : null,
        
        companyName,
        companyAddress,
        companyGST,
        companyPhone,
        companyEmail,
        
        clientName,
        clientAddress,
        clientGST,
        clientPhone,
        clientEmail,
        
        projectId: projectId ? parseInt(projectId) : null,
        projectName,
        projectLocation,
        workOrderNo,
        
        labourCharges: parseFloat(labourCharges || 0),
        transportCharges: parseFloat(transportCharges || 0),
        otherCharges: parseFloat(otherCharges || 0),
        otherChargesDescription,
        
        cgstPercent: parseFloat(cgst || 0),
        sgstPercent: parseFloat(sgst || 0),
        igstPercent: parseFloat(igst || 0),
        tdsPercent: parseFloat(tds || 0),
        retentionPercent: parseFloat(retention || 0),
        
        cgstAmount,
        sgstAmount,
        igstAmount,
        tdsAmount,
        retentionAmount,
        
        advancePaid: parseFloat(advancePaid || 0),
        previousBills: parseFloat(previousBills || 0),
        
        subtotal,
        grossAmount,
        totalWithTax,
        netPayable,
        
        remarks,
        termsAndConditions,
        status: status || existingBill.status,

        BillItem: {
          create: items
            .filter(item => item.description && item.description.trim() !== '')
            .map((item, index) => ({
              sno: item.sno || index + 1,
              description: item.description,
              HSN: item.HSN || "",
              unit: item.unit || "Nos",
              quantity: parseFloat(item.quantity || 0),
              rate: parseFloat(item.rate || 0),
              amount: parseFloat(item.amount || 0),
            })),
        },
      },
      include: {
        BillItem: {
          orderBy: { sno: 'asc' }
        },
      },
    });

    res.json({ 
      success: true, 
      message: 'Bill updated successfully',
      bill: updatedBill
    });
  } catch (error) {
    console.error('Error updating bill:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update bill',
      details: error.message 
    });
  }
};

// ========== DELETE BILL ==========
export const deleteBill = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const bill = await prisma.bill.findFirst({
      where: { id: parseInt(id), companyId }
    });

    if (!bill) {
      return res.status(404).json({ success: false, error: 'Bill not found' });
    }

    await prisma.bill.delete({ where: { id: parseInt(id) } });

    res.json({ success: true, message: 'Bill deleted successfully' });
  } catch (error) {
    console.error('Error deleting bill:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete bill',
      details: error.message 
    });
  }
};
