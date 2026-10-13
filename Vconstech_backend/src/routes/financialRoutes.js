// src/routes/financialRoutes.js
import express from 'express';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { authenticateToken } from '../middlewares/authMiddlewares.js';
import { prisma } from '../config/database.js';
import BudgetCalculationService from '../services/BudgetCalculationService.js';

const router = express.Router();

const normalizeAmount = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
const reportCategories = [
  'Contract Expenses',
  'Office Expenses',
  'Labour Expenses',
  'Material Expenses',
  'Other Project Expenses',
];

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const fmtCurrency = (value) => `Rs.${currencyFormatter.format(Number(value || 0))}`;
const fmtDate = (value) => (value ? new Date(value).toLocaleDateString('en-IN') : '-');
const textValue = (value, fallback = '-') => {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
};

const safeFileName = (value) => (
  textValue(value, 'Project')
    .replace(/[<>:"/\\|?*;\x00-\x1F\x7F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120) || 'Project'
);

const buildReportFileName = (projectName, extension) => (
  `${safeFileName(projectName)} - Project Expense Report.${extension}`
);

const setAttachmentHeaders = (res, contentType, fileName) => {
  res.setHeader('Content-Type', contentType);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
  );
};

const getProjectExpenseCategory = (category) => (
  String(category || '').toLowerCase().includes('office')
    ? 'Office Expenses'
    : 'Other Project Expenses'
);

const addCategoryTotal = (totals, category, amount) => {
  totals[category] = normalizeAmount(Number(totals[category] || 0) + Number(amount || 0));
};

const buildProjectExpenseReport = async (projectId, companyId) => {
  const numericProjectId = Number(projectId);
  if (!Number.isInteger(numericProjectId)) {
    const error = new Error('Invalid project ID');
    error.statusCode = 400;
    throw error;
  }

  const project = await prisma.project.findFirst({
    where: {
      id: numericProjectId,
      companyId,
    },
    select: {
      id: true,
      projectId: true,
      name: true,
      description: true,
      clientName: true,
      projectType: true,
      location: true,
      status: true,
      startDate: true,
      endDate: true,
      dueDate: true,
      budget: true,
      quotationAmount: true,
      createdAt: true,
      assignedEngineer: { select: { id: true, name: true, empId: true } },
    },
  });

  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  const [
    budgetSummary,
    contracts,
    labours,
    materialUsages,
    projectExpenses,
  ] = await Promise.all([
    BudgetCalculationService.calculateProjectFinancials(numericProjectId, { companyId }),
    prisma.contract.findMany({
      where: {
        projectId: numericProjectId,
        project: { companyId },
      },
      orderBy: { startDate: 'desc' },
    }),
    prisma.labour.findMany({
      where: {
        projectId: numericProjectId,
        companyId,
      },
      include: {
        payments: {
          orderBy: { date: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.materialUsage.findMany({
      where: {
        projectId: numericProjectId,
        project: { companyId },
      },
      include: {
        material: true,
        engineer: {
          select: { name: true },
        },
      },
      orderBy: { date: 'desc' },
    }),
    prisma.projectExpense.findMany({
      where: {
        projectId: numericProjectId,
        project: { companyId },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const categoryTotals = reportCategories.reduce((totals, category) => {
    totals[category] = 0;
    return totals;
  }, {});
  const expenses = [];

  const pushExpense = (entry) => {
    const amount = normalizeAmount(entry.amount);
    expenses.push({
      ...entry,
      projectId: numericProjectId,
      amount,
    });
    addCategoryTotal(categoryTotals, entry.category, amount);
  };

  contracts.forEach((contract) => pushExpense({
    category: 'Contract Expenses',
    date: contract.startDate,
    description: contract.details || `Contractor: ${contract.contractorName}`,
    amount: contract.contractAmount,
    source: 'Contract',
  }));

  labours.forEach((labour) => {
    (labour.payments || []).forEach((payment) => pushExpense({
      category: 'Labour Expenses',
      date: payment.date,
      description: `${labour.name}${labour.designation ? ` (${labour.designation})` : ''}${payment.remarks ? ` - ${payment.remarks}` : ''}`,
      amount: payment.amount,
      source: 'Labour Payment',
    }));
  });

  materialUsages.forEach((usage) => {
    const quantity = Number(usage.quantity || 0);
    const rate = Number(usage.material?.defaultRate || 0);
    pushExpense({
      category: 'Material Expenses',
      date: usage.date,
      description: `${usage.material?.name || 'Material'} - ${quantity} ${usage.material?.unit || ''}${usage.remarks ? ` - ${usage.remarks}` : ''}`,
      amount: quantity * rate,
      source: 'Material Usage',
    });
  });

  projectExpenses.forEach((expense) => pushExpense({
    id: expense.id,
    category: getProjectExpenseCategory(expense.category),
    date: expense.createdAt,
    description: expense.category || 'Project expense',
    amount: expense.amount,
    source: 'Financial Management',
  }));

  expenses.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  const totalSpent = normalizeAmount(Object.values(categoryTotals).reduce(
    (sum, amount) => sum + Number(amount || 0),
    0
  ));

  return {
    project,
    generatedAt: new Date(),
    expenses,
    categoryTotals,
    totalSpent,
    totalBudget: budgetSummary.totalBudget,
    remainingAmount: normalizeAmount(budgetSummary.totalBudget - totalSpent),
    budgetSummary,
  };
};

const drawPdfTable = (doc, title, headers, rows, columnWidths) => {
  const margin = 36;
  const rowHeight = 24;
  const tableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
  const pageBottom = doc.page.height - 54;
  const ensureSpace = () => {
    if (doc.y + rowHeight > pageBottom) doc.addPage();
  };

  doc.moveDown(0.8).font('Helvetica-Bold').fontSize(12).fillColor('#111827').text(title, margin, doc.y, {
    width: tableWidth,
    align: 'center',
  });
  doc.moveDown(0.3);
  ensureSpace();

  let x = margin;
  const y = doc.y;
  doc.rect(margin, y, tableWidth, rowHeight).fill('#111827');
  headers.forEach((header, index) => {
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#FFFFFF').text(header, x + 5, y + 8, {
      width: columnWidths[index] - 10,
      lineBreak: false,
    });
    x += columnWidths[index];
  });
  doc.y = y + rowHeight;

  rows.forEach((row, rowIndex) => {
    ensureSpace();
    const currentY = doc.y;
    x = margin;
    doc.rect(margin, currentY, tableWidth, rowHeight).fill(rowIndex % 2 ? '#F9FAFB' : '#FFFFFF');
    row.forEach((cell, index) => {
      doc.font('Helvetica').fontSize(8).fillColor('#1F2937').text(textValue(cell, ''), x + 5, currentY + 7, {
        width: columnWidths[index] - 10,
        height: 10,
        ellipsis: true,
        lineBreak: false,
      });
      x += columnWidths[index];
    });
    doc.y = currentY + rowHeight;
  });
};

const styleExcelSectionTitle = (sheet, rowNumber, columnCount) => {
  sheet.mergeCells(rowNumber, 1, rowNumber, columnCount);
  const cell = sheet.getCell(rowNumber, 1);
  cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF111827' },
  };
  cell.alignment = { vertical: 'middle' };
  sheet.getRow(rowNumber).height = 22;
};

const styleExcelHeaderRow = (row) => {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF374151' },
  };
  row.alignment = { vertical: 'middle' };
};

const applyExcelBorders = (sheet) => {
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      };
      cell.alignment = {
        vertical: 'top',
        wrapText: true,
      };
    });
  });
};

const formatProject = (project, budgetSummary) => {
  return {
    id: project.id,
    name: project.name,
    budget: project.budget || 0,
    dueDate: project.dueDate || project.endDate,
    quotationAmount: project.quotationAmount || project.budget || 0,
    totalBudget: budgetSummary.totalBudget,
    materialCost: budgetSummary.materialCost,
    labourCost: budgetSummary.labourCost,
    contractCost: budgetSummary.contractCost,
    expenseCost: budgetSummary.expenseCost,
    engineerSalaryCost: budgetSummary.engineerSalaryCost,
    totalSpent: budgetSummary.totalSpent,
    remainingBudget: budgetSummary.remainingBudget,
    budgetSummary,
    expenses: project.expenses.map(exp => ({
      id: exp.id,
      category: exp.category,
      amount: exp.amount,
      createdAt: exp.createdAt,
      updatedAt: exp.updatedAt,
    }))
  };
};

const enrichProject = async (project, companyId) => {
  const [budgetSummary, report] = await Promise.all([
    BudgetCalculationService.calculateProjectFinancials(project.id, { companyId }),
    buildProjectExpenseReport(project.id, companyId),
  ]);
  return { ...formatProject(project, budgetSummary), financialHistory: report.expenses };
};

const enrichProjects = async (projects, companyId) => {
  const budgetSummaries = await BudgetCalculationService.calculateProjectsFinancials(projects, { companyId });
  return projects.map((project) => formatProject(project, budgetSummaries.get(project.id)));
};

// ============ GET ALL PROJECTS WITH FINANCIAL DATA ============
router.get('/projects', authenticateToken, async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const projects = await prisma.project.findMany({
      where: { companyId },
      include: {
        expenses: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const transformedProjects = await enrichProjects(projects, companyId);

    res.json({
      success: true,
      projects: transformedProjects,
      count: transformedProjects.length
    });
  } catch (error) {
    console.error('Get financial projects error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch projects',
      details: error.message
    });
  }
});

// ============ GET SINGLE PROJECT WITH EXPENSES ============
router.get('/projects/:id', authenticateToken, async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const companyId = req.user.companyId;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        companyId
      },
      include: {
        expenses: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const transformedProject = await enrichProject(project, companyId);

    res.json({
      success: true,
      project: transformedProject
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project',
      details: error.message
    });
  }
});

// ============ DOWNLOAD PROJECT EXPENSE REPORT PDF ============
router.get('/projects/:id/report/pdf', authenticateToken, async (req, res) => {
  try {
    const report = await buildProjectExpenseReport(req.params.id, req.user.companyId);
    const { project, expenses, categoryTotals, totalBudget, totalSpent, remainingAmount } = report;
    const generatedDate = fmtDate(report.generatedAt);
    const fileName = buildReportFileName(project.name, 'pdf');

    setAttachmentHeaders(res, 'application/pdf', fileName);

    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 36,
        bottom: 54,
        left: 36,
        right: 36,
      },
    });

    doc.pipe(res);

    doc.rect(36, 36, 523, 70).fill('#111827');
    doc.font('Helvetica-Bold').fontSize(18).fillColor('#FFFFFF').text('Project Expense Report', 52, 58, {
      width: 300,
      lineBreak: false,
    });
    doc.font('Helvetica').fontSize(10).fillColor('#FDE68A').text('Vconstech ERP Financial Management', 52, 82);
    doc.font('Helvetica').fontSize(9).fillColor('#FFFFFF').text(`Generated: ${generatedDate}`, 392, 58, {
      width: 150,
      align: 'right',
    });
    doc.rect(36, 102, 523, 4).fill('#FFBE2A');
    doc.y = 124;

    drawPdfTable(doc, 'Project Details', ['Field', 'Value'], [
      ['Project Name', project.name],
      ['Project Code', project.projectId],
      ['Client', project.clientName],
      ['Type', project.projectType],
      ['Location', project.location],
      ['Status', project.status],
      ['Start Date', fmtDate(project.startDate)],
      ['Due Date', fmtDate(project.dueDate || project.endDate)],
      ['Description', project.description],
    ], [150, 373]);

    drawPdfTable(doc, 'Financial Summary', ['Metric', 'Amount'], [
      ['Project Budget', fmtCurrency(totalBudget)],
      ['Total Amount Spent', fmtCurrency(totalSpent)],
      ['Remaining Amount', fmtCurrency(remainingAmount)],
    ], [250, 273]);

    drawPdfTable(doc, 'Category-wise Totals', ['Category', 'Total Amount'], reportCategories.map((category) => [
      category,
      fmtCurrency(categoryTotals[category]),
    ]), [250, 273]);

    drawPdfTable(doc, 'Expense Details', ['Date', 'Category', 'Description / Details', 'Amount'], (
      expenses.length
        ? expenses.map((expense) => [
            fmtDate(expense.date),
            expense.category,
            expense.description,
            fmtCurrency(expense.amount),
          ])
        : [['-', '-', 'No expenses recorded for this project.', fmtCurrency(0)]]
    ), [70, 120, 230, 103]);

    doc.end();
  } catch (error) {
    console.error('Download project expense PDF error:', error);
    if (!res.headersSent) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.statusCode ? error.message : 'Failed to generate project expense PDF report',
        details: error.message,
      });
    }
  }
});

// ============ DOWNLOAD PROJECT EXPENSE REPORT EXCEL ============
router.get('/projects/:id/report/excel', authenticateToken, async (req, res) => {
  try {
    const report = await buildProjectExpenseReport(req.params.id, req.user.companyId);
    const { project, expenses, categoryTotals, totalBudget, totalSpent, remainingAmount } = report;
    const generatedDate = fmtDate(report.generatedAt);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Vconstech ERP';
    workbook.created = new Date();

    const reportSheet = workbook.addWorksheet('Project Expense Report', {
      views: [{ state: 'frozen', ySplit: 3 }],
    });
    reportSheet.columns = [
      { key: 'label', width: 28 },
      { key: 'value', width: 30 },
      { key: 'date', width: 16 },
      { key: 'category', width: 24 },
      { key: 'description', width: 52 },
      { key: 'amount', width: 18 },
    ];

    reportSheet.mergeCells('A1:F1');
    reportSheet.getCell('A1').value = 'Project Expense Report';
    reportSheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    reportSheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF111827' },
    };
    reportSheet.getCell('A1').alignment = { vertical: 'middle' };
    reportSheet.getRow(1).height = 28;
    reportSheet.mergeCells('A2:F2');
    reportSheet.getCell('A2').value = `Generated: ${generatedDate}`;
    reportSheet.getCell('A2').font = { italic: true, color: { argb: 'FF4B5563' } };

    let rowNumber = 4;
    styleExcelSectionTitle(reportSheet, rowNumber, 6);
    reportSheet.getCell(rowNumber, 1).value = 'Project Details';
    rowNumber += 1;
    const projectDetailRows = [
      ['Project Name', project.name],
      ['Project Code', project.projectId],
      ['Client', project.clientName],
      ['Type', project.projectType],
      ['Location', project.location],
      ['Status', project.status],
      ['Start Date', fmtDate(project.startDate)],
      ['Due Date', fmtDate(project.dueDate || project.endDate)],
      ['Description', project.description],
    ];
    projectDetailRows.forEach(([label, value]) => {
      reportSheet.getCell(rowNumber, 1).value = label;
      reportSheet.getCell(rowNumber, 2).value = textValue(value);
      reportSheet.getCell(rowNumber, 1).font = { bold: true };
      rowNumber += 1;
    });

    rowNumber += 1;
    styleExcelSectionTitle(reportSheet, rowNumber, 6);
    reportSheet.getCell(rowNumber, 1).value = 'Financial Summary';
    rowNumber += 1;
    [
      ['Project Budget', totalBudget],
      ['Total Amount Spent', totalSpent],
      ['Remaining Amount', remainingAmount],
    ].forEach(([label, value]) => {
      reportSheet.getCell(rowNumber, 1).value = label;
      reportSheet.getCell(rowNumber, 2).value = value;
      reportSheet.getCell(rowNumber, 1).font = { bold: true };
      reportSheet.getCell(rowNumber, 2).numFmt = '"Rs."#,##0.00';
      rowNumber += 1;
    });

    rowNumber += 1;
    styleExcelSectionTitle(reportSheet, rowNumber, 6);
    reportSheet.getCell(rowNumber, 1).value = 'Category-wise Expense Totals';
    rowNumber += 1;
    reportSheet.getRow(rowNumber).values = ['Category', 'Total Amount'];
    styleExcelHeaderRow(reportSheet.getRow(rowNumber));
    rowNumber += 1;
    reportCategories.forEach((category) => {
      reportSheet.getCell(rowNumber, 1).value = category;
      reportSheet.getCell(rowNumber, 2).value = categoryTotals[category];
      reportSheet.getCell(rowNumber, 2).numFmt = '"Rs."#,##0.00';
      rowNumber += 1;
    });

    rowNumber += 1;
    styleExcelSectionTitle(reportSheet, rowNumber, 6);
    reportSheet.getCell(rowNumber, 1).value = 'Complete Expense Details / Transactions';
    rowNumber += 1;
    reportSheet.getRow(rowNumber).values = [
      'Date',
      'Category',
      'Description / Details',
      'Source',
      'Amount',
      'Project ID',
    ];
    styleExcelHeaderRow(reportSheet.getRow(rowNumber));
    rowNumber += 1;

    const transactionRows = expenses.length
      ? expenses.map((expense) => [
          fmtDate(expense.date),
          expense.category,
          expense.description,
          expense.source,
          expense.amount,
          expense.projectId,
        ])
      : [['-', '-', 'No expenses recorded for this project.', '-', 0, project.id]];

    transactionRows.forEach((row) => {
      reportSheet.getRow(rowNumber).values = row;
      reportSheet.getCell(rowNumber, 5).numFmt = '"Rs."#,##0.00';
      rowNumber += 1;
    });

    const transactionsSheet = workbook.addWorksheet('Transactions', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });
    transactionsSheet.columns = [
      { header: 'Date', key: 'date', width: 16 },
      { header: 'Category', key: 'category', width: 26 },
      { header: 'Description / Details', key: 'description', width: 58 },
      { header: 'Source', key: 'source', width: 22 },
      { header: 'Amount', key: 'amount', width: 18 },
      { header: 'Project ID', key: 'projectId', width: 12 },
    ];
    styleExcelHeaderRow(transactionsSheet.getRow(1));
    transactionsSheet.addRows(transactionRows.map(([date, category, description, source, amount, projectId]) => ({
      date,
      category,
      description,
      source,
      amount,
      projectId,
    })));
    transactionsSheet.getColumn('amount').numFmt = '"Rs."#,##0.00';

    [reportSheet, transactionsSheet].forEach(applyExcelBorders);

    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = buildReportFileName(project.name, 'xlsx');
    setAttachmentHeaders(res, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', fileName);
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Download project expense Excel error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.statusCode ? error.message : 'Failed to generate project expense Excel report',
      details: error.message,
    });
  }
});

// ============ ADD NEW PROJECT ============
router.post('/projects', authenticateToken, async (req, res) => {
  try {
    const { name, budget, quotationAmount, dueDate } = req.body;
    const companyId = req.user.companyId;

    // Validation
    if (!name || !budget || !quotationAmount || !dueDate) {
      return res.status(400).json({
        success: false,
        error: 'Name, budget, quotation amount, and due date are required'
      });
    }

    // Generate unique projectId
    const projectCount = await prisma.project.count({
      where: { companyId }
    });
    const projectId = `PRJ-${Date.now()}-${projectCount + 1}`;

    const project = await prisma.project.create({
      data: {
        projectId,
        name,
        budget: parseFloat(budget),
        quotationAmount: parseFloat(quotationAmount),
        dueDate: new Date(dueDate),
        clientName: 'N/A', // Required field
        projectType: 'Interior', // Default value
        companyId,
        status: 'ONGOING'
      },
      include: {
        expenses: true
      }
    });

    const transformedProject = {
      id: project.id,
      name: project.name,
      budget: project.budget,
      dueDate: project.dueDate,
      quotationAmount: project.quotationAmount,
      expenses: []
    };

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project: transformedProject
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create project',
      details: error.message
    });
  }
});

// ============ ADD EXPENSE TO PROJECT ============
router.post(
  '/projects/:id/expenses',
  authenticateToken,
  async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { amount, category } = req.body;
      const companyId = req.user.companyId;

      // Validation
      if (!amount) {
        return res.status(400).json({
          success: false,
          error: 'Amount is required'
        });
      }

      const expenseCategory = typeof category === 'string' ? category : '';
      if (!expenseCategory.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Expense category is required'
        });
      }

      // Verify project belongs to user's company
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          companyId
        }
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }

      // Create expense
      const expense = await prisma.projectExpense.create({
        data: {
          projectId,
          category: expenseCategory,
          amount: parseFloat(amount)
        }
      });

      res.status(201).json({
        success: true,
        message: 'Expense added successfully',
        expense: {
          id: expense.id,
          category: expense.category,
          amount: expense.amount
        },
        projectId // ✅ IMPORTANT: Include projectId for middleware
      });
    } catch (error) {
      console.error('Add expense error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add expense',
        details: error.message
      });
    }
  }
);

// ============ UPDATE EXPENSE ============
router.put(
  '/expenses/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const expenseId = parseInt(req.params.id);
      const { amount } = req.body;
      const category = typeof req.body.category === 'string' ? req.body.category.trim() : '';
      const companyId = req.user.companyId;

      // Validation
      if (!amount) {
        return res.status(400).json({
          success: false,
          error: 'Amount is required'
        });
      }

      // Verify expense belongs to user's company project
      const expense = await prisma.projectExpense.findFirst({
        where: { id: expenseId },
        include: { project: true }
      });

      if (!expense || expense.project.companyId !== companyId) {
        return res.status(404).json({
          success: false,
          error: 'Expense not found'
        });
      }

      // Update expense
      const updatedExpense = await prisma.projectExpense.update({
        where: { id: expenseId },
        data: {
          ...(category ? { category } : {}),
          amount: parseFloat(amount)
        }
      });

      res.json({
        success: true,
        message: 'Expense updated successfully',
        expense: {
          id: updatedExpense.id,
          category: updatedExpense.category,
          amount: updatedExpense.amount
        },
        projectId: expense.projectId // ✅ IMPORTANT: Include projectId for middleware
      });
    } catch (error) {
      console.error('Update expense error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update expense',
        details: error.message
      });
    }
  }
);

// ============ DELETE EXPENSE ============
router.delete(
  '/expenses/:id',
  authenticateToken,

  async (req, res) => {
    try {
      const expenseId = parseInt(req.params.id);
      const companyId = req.user.companyId;

      // Verify expense belongs to user's company project
      const expense = await prisma.projectExpense.findFirst({
        where: { id: expenseId },
        include: { project: true }
      });

      if (!expense || expense.project.companyId !== companyId) {
        return res.status(404).json({
          success: false,
          error: 'Expense not found'
        });
      }

      const projectId = expense.projectId; // ✅ Store projectId before deletion

      // Delete expense
      await prisma.projectExpense.delete({
        where: { id: expenseId }
      });

      res.json({
        success: true,
        message: 'Expense deleted successfully',
        projectId // ✅ IMPORTANT: Include projectId for middleware
      });
    } catch (error) {
      console.error('Delete expense error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete expense',
        details: error.message
      });
    }
  }
);

// ============ GET FINANCIAL SUMMARY ============
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const projects = await prisma.project.findMany({
      where: { companyId },
      include: {
        expenses: true
      }
    });

    let totalBudget = 0;
    let totalSpent = 0;
    let totalProjects = projects.length;
    let projectsOverBudget = 0;

    const summaries = await Promise.all(projects.map((project) => (
      BudgetCalculationService.calculateProjectFinancials(project.id, { companyId })
    )));

    summaries.forEach((summary) => {
      totalBudget += summary.totalBudget;
      totalSpent += summary.totalSpent;

      if (summary.totalSpent > summary.totalBudget) {
        projectsOverBudget++;
      }
    });

    res.json({
      success: true,
      summary: {
        totalBudget: normalizeAmount(totalBudget),
        totalSpent: normalizeAmount(totalSpent),
        totalRemaining: normalizeAmount(totalBudget - totalSpent),
        totalProjects,
        projectsOverBudget,
        utilizationPercentage: totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch summary',
      details: error.message
    });
  }
});

export default router;
