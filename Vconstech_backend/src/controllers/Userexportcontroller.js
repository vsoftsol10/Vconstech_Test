// src/controllers/userExportController.js
import { prisma } from '../config/database.js';
import ExcelJS from 'exceljs';
import jwt from 'jsonwebtoken';

// Helper: format date
const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN') : 'N/A';
const fmtCurrency = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '₹0.00';

// Header style helper
const headerStyle = (color = '1E3A5F') => ({
  font: { bold: true, color: { argb: 'FFFFFF' }, size: 10, name: 'Arial' },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: color } },
  alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
  border: {
    top: { style: 'thin', color: { argb: 'CCCCCC' } },
    bottom: { style: 'thin', color: { argb: 'CCCCCC' } },
    left: { style: 'thin', color: { argb: 'CCCCCC' } },
    right: { style: 'thin', color: { argb: 'CCCCCC' } },
  },
});

const cellStyle = (even = false) => ({
  font: { size: 9, name: 'Arial' },
  fill: even
    ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F0F4FF' } }
    : { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } },
  alignment: { vertical: 'middle', wrapText: true },
  border: {
    top: { style: 'thin', color: { argb: 'E0E0E0' } },
    bottom: { style: 'thin', color: { argb: 'E0E0E0' } },
    left: { style: 'thin', color: { argb: 'E0E0E0' } },
    right: { style: 'thin', color: { argb: 'E0E0E0' } },
  },
});

function addSheet(wb, sheetName, columns, rows, tabColor = '1E3A5F') {
  const ws = wb.addWorksheet(sheetName, { properties: { tabColor: { argb: tabColor } } });

  // Title row
  ws.addRow([sheetName.toUpperCase()]);
  ws.mergeCells(1, 1, 1, columns.length);
  const titleCell = ws.getCell(1, 1);
  titleCell.font = { bold: true, size: 13, name: 'Arial', color: { argb: 'FFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: tabColor } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 30;

  // Header row
  const headerRow = ws.addRow(columns.map((c) => c.header));
  headerRow.height = 22;
  headerRow.eachCell((cell) => Object.assign(cell, headerStyle(tabColor)));

  // Column widths
  columns.forEach((col, i) => {
    ws.getColumn(i + 1).width = col.width || 18;
  });

  // Data rows
  rows.forEach((row, idx) => {
    const dataRow = ws.addRow(row);
    dataRow.height = 18;
    dataRow.eachCell((cell) => Object.assign(cell, cellStyle(idx % 2 === 0)));
  });

  // Total row count note
  ws.addRow([]);
  const countRow = ws.addRow([`Total Records: ${rows.length}`]);
  countRow.getCell(1).font = { bold: true, italic: true, size: 9, name: 'Arial', color: { argb: '555555' } };

  return ws;
}

export const downloadUserData = async (req, res) => {
  try {
    const { userId } = req.params;

    // ── Auth: accept super admin plain token OR regular JWT ────────────────
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, error: 'Access token required' });
    }

    let companyId = null;
    let isSuperAdmin = false;

    // Super admin uses a plain string token (not a JWT)
    if (token.startsWith('super_admin_token_')) {
      isSuperAdmin = true;
    } else {
      // Regular JWT admin
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        companyId = decoded.companyId;
      } catch {
        return res.status(403).json({ success: false, error: 'Invalid or expired token' });
      }
    }

    // Fetch user + company
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Regular JWT admin: enforce company scope; super admin can access any user
    if (!isSuperAdmin && user.companyId !== companyId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const cId = user.companyId;

    // ── Parallel data fetch (each wrapped so one failure won't break the export) ─
    const safe = async (fn) => { try { return await fn(); } catch(e) { console.warn('Export query failed:', e.message); return []; } };

    const [projects, bills, clients, contracts, labourers, materials, matRequests] =
      await Promise.all([
        // Project - schema: Project model, relation assignedEngineer -> Engineer
        safe(() => prisma.project.findMany({
          where: { companyId: cId },
          include: { assignedEngineer: { select: { name: true, empId: true } } },
        })),
        // Bill - schema: Bill model, companyId field
        safe(() => prisma.bill.findMany({
          where: { companyId: cId },
          include: { BillItem: true },
        })),
        // Client - schema: Client model
        safe(() => prisma.client.findMany({ where: { companyId: cId } })),
        // Contract - schema: Contract model, relation project -> Project
        safe(() => prisma.contract.findMany({
          where: { project: { companyId: cId } },
          include: { project: { select: { name: true, projectId: true } } },
        })),
        // Labour - schema: Labour model (NOT labourer), relation payments -> LabourPayment[]
        safe(() => prisma.labour.findMany({
          where: { companyId: cId },
          include: { payments: true },
        })),
        // Material - schema: Material model
        safe(() => prisma.material.findMany({ where: { companyId: cId } })),
        // MaterialRequest - schema: MaterialRequest, employee -> Engineer (has companyId String)
        safe(() => prisma.materialRequest.findMany({
          where: { employee: { companyId: cId } },
          include: {
            employee: { select: { name: true } },
            project: { select: { name: true } },
          },
        })),
      ]);

    // ── Build Workbook ───────────────────────────────────────────────────────
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Material Management System';
    wb.created = new Date();

    // ── 1. User Profile ──────────────────────────────────────────────────────
    addSheet(
      wb,
      'User Profile',
      [
        { header: 'Field', width: 22 },
        { header: 'Value', width: 40 },
      ],
      [
        ['Name', user.name],
        ['Email', user.email],
        ['Phone', user.phoneNumber || 'N/A'],
        ['City', user.city || 'N/A'],
        ['Address', user.address || 'N/A'],
        ['GST Number', user.gstNumber || 'N/A'],
        ['Role', user.role],
        ['Package', user.package || 'N/A'],
        ['Custom Members', user.customMembers || 'N/A'],
        ['Company', user.company?.name || 'N/A'],
        ['Member Since', fmt(user.createdAt)],
      ],
      '1E3A5F'
    );

    // ── 2. Projects ──────────────────────────────────────────────────────────
    addSheet(
      wb,
      'Projects',
      [
        { header: 'Project ID', width: 14 },
        { header: 'Name', width: 28 },
        { header: 'Client', width: 22 },
        { header: 'Type', width: 18 },
        { header: 'Status', width: 14 },
        { header: 'Location', width: 22 },
        { header: 'Budget', width: 16 },
        { header: 'Quotation', width: 16 },
        { header: 'Progress %', width: 12 },
        { header: 'Assigned Engineer', width: 22 },
        { header: 'Start Date', width: 14 },
        { header: 'End Date', width: 14 },
      ],
      projects.map((p) => [
        p.projectId,
        p.name,
        p.clientName,
        p.projectType,
        p.status,
        p.location || 'N/A',
        fmtCurrency(p.budget),
        fmtCurrency(p.quotationAmount),
        p.actualProgress ?? 0,
        p.assignedEngineer?.name || 'Unassigned',
        fmt(p.startDate),
        fmt(p.endDate),
      ]),
      '2563EB'
    );

    // ── 3. Bills ─────────────────────────────────────────────────────────────
    addSheet(
      wb,
      'Bills',
      [
        { header: 'Bill ID', width: 16 },
        { header: 'Type', width: 12 },
        { header: 'Date', width: 13 },
        { header: 'Due Date', width: 13 },
        { header: 'Client', width: 22 },
        { header: 'Project', width: 22 },
        { header: 'Subtotal', width: 14 },
        { header: 'Tax Amount', width: 14 },
        { header: 'Net Payable', width: 14 },
        { header: 'Status', width: 12 },
      ],
      bills.map((b) => [
        b.billId,
        b.billType,
        fmt(b.billDate),
        fmt(b.dueDate),
        b.clientName,
        b.projectName,
        fmtCurrency(b.subtotal),
        fmtCurrency((b.cgstAmount || 0) + (b.sgstAmount || 0) + (b.igstAmount || 0)),
        fmtCurrency(b.netPayable),
        b.status,
      ]),
      '059669'
    );

    // ── 4. Clients ───────────────────────────────────────────────────────────
    addSheet(
      wb,
      'Clients',
      [
        { header: 'Client Name', width: 24 },
        { header: 'Company', width: 24 },
        { header: 'Address', width: 30 },
        { header: 'GST', width: 18 },
        { header: 'Phone', width: 16 },
        { header: 'Email', width: 26 },
        { header: 'Created', width: 14 },
      ],
      clients.map((c) => [
        c.clientName,
        c.companyName || 'N/A',
        c.clientAddress || 'N/A',
        c.clientGST || 'N/A',
        c.clientPhone || 'N/A',
        c.clientEmail || 'N/A',
        fmt(c.createdAt),
      ]),
      'D97706'
    );

    // ── 5. Contracts ─────────────────────────────────────────────────────────
    addSheet(
      wb,
      'Contracts',
      [
        { header: 'Project', width: 24 },
        { header: 'Project ID', width: 14 },
        { header: 'Contractor', width: 22 },
        { header: 'Contact', width: 16 },
        { header: 'Amount', width: 16 },
        { header: 'Status', width: 16 },
        { header: 'Start Date', width: 13 },
        { header: 'End Date', width: 13 },
        { header: 'Details', width: 30 },
      ],
      contracts.map((c) => [
        c.project?.name || 'N/A',
        c.project?.projectId || 'N/A',
        c.contractorName,
        c.contactNumber,
        fmtCurrency(c.contractAmount),
        c.workStatus,
        fmt(c.startDate),
        fmt(c.endDate),
        c.details || 'N/A',
      ]),
      'DC2626'
    );

    // ── 6. Labour ────────────────────────────────────────────────────────────
    addSheet(
      wb,
      'Labour',
      [
        { header: 'Name', width: 22 },
        { header: 'Phone', width: 16 },
        { header: 'Address', width: 28 },
        { header: 'Total Payments', width: 16 },
        { header: 'Payment Count', width: 14 },
        { header: 'Created', width: 14 },
      ],
      labourers.map((l) => [
        l.name,
        l.phone,
        l.address || 'N/A',
        fmtCurrency(l.payments?.reduce((s, p) => s + p.amount, 0) || 0),
        l.payments?.length || 0,
        fmt(l.createdAt),
      ]),
      '7C3AED'
    );

    // ── 7. Materials ─────────────────────────────────────────────────────────
    addSheet(
      wb,
      'Materials',
      [
        { header: 'Material ID', width: 14 },
        { header: 'Name', width: 26 },
        { header: 'Category', width: 18 },
        { header: 'Unit', width: 10 },
        { header: 'Default Rate', width: 14 },
        { header: 'Vendor', width: 22 },
        { header: 'Description', width: 30 },
        { header: 'Created', width: 14 },
      ],
      materials.map((m) => [
        m.materialId,
        m.name,
        m.category,
        m.unit,
        fmtCurrency(m.defaultRate),
        m.vendor || 'N/A',
        m.description || 'N/A',
        fmt(m.createdAt),
      ]),
      '0891B2'
    );

    // ── 8. Material Requests ─────────────────────────────────────────────────
    addSheet(
      wb,
      'Material Requests',
      [
        { header: 'Request ID', width: 14 },
        { header: 'Name', width: 24 },
        { header: 'Category', width: 18 },
        { header: 'Unit', width: 10 },
        { header: 'Rate', width: 14 },
        { header: 'Type', width: 20 },
        { header: 'Project', width: 22 },
        { header: 'Quantity', width: 12 },
        { header: 'Status', width: 12 },
        { header: 'Requested By', width: 20 },
        { header: 'Request Date', width: 14 },
        { header: 'Review Date', width: 14 },
        { header: 'Rejection Reason', width: 28 },
      ],
      matRequests.map((r) => [
        r.requestId,
        r.name,
        r.category,
        r.unit,
        fmtCurrency(r.defaultRate),
        r.type,
        r.project?.name || 'N/A',
        r.quantity ?? 'N/A',
        r.status,
        r.employee?.name || 'N/A',
        fmt(r.requestDate),
        fmt(r.reviewDate),
        r.rejectionReason || 'N/A',
      ]),
      'BE185D'
    );

    // ── Send response ─────────────────────────────────────────────────────────
    const safeName = (user.name || 'user').replace(/[^a-z0-9]/gi, '_');
    const filename = `${safeName}_data_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await wb.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export user data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export user data',
      details: error.message,
    });
  }
};
