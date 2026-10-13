  // src/controllers/labourController.js
  import * as labourService from '../services/labourService.js';
  import ExcelJS from 'exceljs';

  const getCellText = (value) => {
    if (value == null) return '';
    if (typeof value === 'object') {
      if (value.text) return String(value.text).trim();
      if (value.result != null) return String(value.result).trim();
      if (Array.isArray(value.richText)) return value.richText.map((part) => part.text).join('').trim();
    }
    return String(value).trim();
  };

  const normalizeHeader = (value) => getCellText(value).toLowerCase().replace(/[^a-z0-9]/g, '');

  const parseCsvRows = (text) => {
    const rows = [];
    let row = [];
    let cell = '';
    let inQuotes = false;

    for (let index = 0; index < text.length; index += 1) {
      const char = text[index];
      const nextChar = text[index + 1];

      if (char === '"' && inQuotes && nextChar === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(cell.trim());
        cell = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') index += 1;
        row.push(cell.trim());
        if (row.some(Boolean)) rows.push(row);
        row = [];
        cell = '';
      } else {
        cell += char;
      }
    }

    row.push(cell.trim());
    if (row.some(Boolean)) rows.push(row);
    return rows;
  };

  const parseLabourFile = async (file) => {
    const extension = file.originalname.split('.').pop()?.toLowerCase();

    if (extension !== 'xlsx') {
      throw new Error('Only Excel (.xlsx) files are allowed. Please use the official template.');
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer);
    const worksheet = workbook.worksheets[0];
    const rows = [];

    worksheet.eachRow((worksheetRow) => {
      const values = [];
      worksheetRow.eachCell({ includeEmpty: true }, (cell) => {
        values.push(getCellText(cell.value));
      });
      if (values.some(Boolean)) rows.push(values);
    });

    return rows;
  };

  const pickValue = (row, headerMap, keys) => {
    const index = keys.map((key) => headerMap[key]).find((value) => value !== undefined);
    return index === undefined ? '' : getCellText(row[index]);
  };

  export const downloadLabourTemplate = async (req, res) => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Labour List');

      const headers = ['Name', 'Phone Number', 'Designation', 'Project', 'Address'];
      const sampleRow = ['Ramesh', '9876543210', 'Electrician', 'Apartment Project', 'Chennai'];

      worksheet.columns = headers.map((header, index) => ({
        key: header.toLowerCase().replace(/[^a-z0-9]/g, ''),
        width: Math.max(header.length, sampleRow[index].length) + 6
      }));

      const headerRow = worksheet.addRow(headers);
      const exampleRow = worksheet.addRow(sampleRow);

      headerRow.height = 22;
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FF111827' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF3F4F6' }
        };
        cell.alignment = {
          horizontal: 'center',
          vertical: 'middle'
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };
      });

      exampleRow.eachCell((cell) => {
        cell.alignment = {
          horizontal: 'left',
          vertical: 'middle'
        };
      });

      worksheet.views = [{ state: 'frozen', ySplit: 1 }];
      worksheet.autoFilter = 'A1:E1';

      const instructionsSheet = workbook.addWorksheet('Instructions');
      instructionsSheet.columns = [
        { key: 'instruction', width: 92 }
      ];

      instructionsSheet.getCell('A1').value = 'Labour Import Instructions';
      instructionsSheet.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF111827' } };
      instructionsSheet.getCell('A1').alignment = { horizontal: 'left', vertical: 'middle' };

      const instructionRows = [
        'Only Excel (.xlsx) files are supported.',
        'Do not rename or delete the column headers.',
        'Phone Number should contain valid mobile numbers.',
        'Leave no mandatory fields empty.',
        'Use the official template only.',
        'Maximum upload size: 5 MB.'
      ];

      instructionRows.forEach((text) => {
        const row = instructionsSheet.addRow([`- ${text}`]);
        row.getCell(1).alignment = { wrapText: true, vertical: 'top' };
      });

      instructionsSheet.getRow(1).height = 24;
      instructionsSheet.views = [{ state: 'frozen', ySplit: 1 }];

      const buffer = await workbook.xlsx.writeBuffer();

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="labour-list-template.xlsx"');
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error('Download labour template error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to download labour template',
        details: error.message
      });
    }
  };

  // Get all labourers for a company
  export const getAllLabourers = async (req, res) => {
    try {
      const companyId = req.user.companyId;
      const { projectId } = req.query;
      
      const engineerId = req.user.type === 'engineer' ? (req.user.engineerId || req.user.id) : null;
      const labourers = await labourService.getAllLabourers(companyId, projectId, engineerId);
      
      res.json({
        success: true,
        data: labourers,
        count: labourers.length
      });
    } catch (error) {
      console.error('Get all labourers error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch labourers',
        details: error.message
      });
    }
  };

  // Get single labourer by ID
  export const getLabourerById = async (req, res) => {
    try {
      const { id } = req.params;
      const companyId = req.user.companyId;
      
      const labourer = await labourService.getLabourerById(parseInt(id), companyId);

      if (req.user.type === 'engineer' && !await labourService.isLabourAssignedToEngineer(
        parseInt(id), companyId, req.user.engineerId || req.user.id
      )) {
        return res.status(404).json({ success: false, error: 'Labourer not found' });
      }
      
      if (!labourer) {
        return res.status(404).json({
          success: false,
          error: 'Labourer not found'
        });
      }
      
      res.json({
        success: true,
        data: labourer
      });
    } catch (error) {
      console.error('Get labourer by ID error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch labourer',
        details: error.message
      });
    }
  };

  // Create new labourer
  export const createLabourer = async (req, res) => {
    try {
      const companyId = req.user.companyId;
      
      console.log('📝 Create labourer request body:', req.body);
      console.log('👤 User info:', { companyId, userId: req.user.id });
      
      const { name, phone, address, projectId, designation, project } = req.body;
      
      // Validation
      if (!name || !phone) {
        console.log('❌ Validation failed - missing name or phone');
        return res.status(400).json({
          success: false,
          error: 'Name and phone are required'
        });
      }
      
      const labourerData = {
    name: name.trim(),
    phone: phone.trim(),
    address: address ? address.trim() : null,
    designation: designation ? designation.trim() : null,  // ← ADD
    project: project ? project.trim() : null,              // ← ADD
    companyId,
    projectId: projectId ? parseInt(projectId) : null
  };
      
      console.log('✅ Validated labourer data:', labourerData);
      
      const labourer = await labourService.createLabourer(labourerData);
      
      console.log('✅ Labourer created successfully:', labourer.id);
      
      res.status(201).json({
        success: true,
        data: labourer,
        message: 'Labourer created successfully'
      });
    } catch (error) {
      console.error('❌ Create labourer error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create labourer',
        details: error.message
      });
    }
  };

  // Update labourer
  export const updateLabourer = async (req, res) => {
    try {
      const { id } = req.params;
      const companyId = req.user.companyId;
      const { name, phone, address, projectId, designation, project } = req.body;
      
      // Validation
      if (!name || !phone) {
        return res.status(400).json({
          success: false,
          error: 'Name and phone are required'
        });
      }
      
    

  const updateData = {
    name: name.trim(),
    phone: phone.trim(),
    address: address ? address.trim() : null,
    designation: designation ? designation.trim() : null,  // ← ADD
    project: project ? project.trim() : null,              // ← ADD
    projectId: projectId ? parseInt(projectId) : null
  };
      
      const labourer = await labourService.updateLabourer(
        parseInt(id), 
        companyId, 
        updateData
      );
      
      if (!labourer) {
        return res.status(404).json({
          success: false,
          error: 'Labourer not found'
        });
      }
      
      res.json({
        success: true,
        data: labourer,
        message: 'Labourer updated successfully'
      });
    } catch (error) {
      console.error('Update labourer error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update labourer',
        details: error.message
      });
    }
  };

  // Delete labourer
  export const deleteLabourer = async (req, res) => {
    try {
      const { id } = req.params;
      const companyId = req.user.companyId;
      
      const result = await labourService.deleteLabourer(parseInt(id), companyId);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'Labourer not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Labourer deleted successfully'
      });
    } catch (error) {
      console.error('Delete labourer error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete labourer',
        details: error.message
      });
    }
  };

  // Add payment to labourer
  export const addPayment = async (req, res) => {
    try {
      const { id } = req.params;
      const companyId = req.user.companyId;
      const { amount, date, remarks } = req.body;
      
      console.log('💰 Add payment request:', { labourId: id, amount, date });
      
      // Validation
      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Valid amount is required'
        });
      }
      
      const paymentData = {
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date(),
        remarks: remarks || null
      };
      
      const payment = await labourService.addPayment(
        parseInt(id), 
        companyId, 
        paymentData
      );
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'Labourer not found'
        });
      }
      
      console.log('✅ Payment added successfully');
      
      res.status(201).json({
        success: true,
        data: payment,
        message: 'Payment added successfully'
      });
    } catch (error) {
      console.error('Add payment error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add payment',
        details: error.message
      });
    }
  };

  export const saveAttendance = async (req, res) => {
    try {
      const companyId = req.user.companyId;
      const { labourId, projectId, attendanceDate, headWage, headDayType, fullHelpers, halfHelpers, helperRate, entryStatus, notes } = req.body;
      if (!labourId || !attendanceDate) {
        return res.status(400).json({ success: false, error: 'Labour and attendance date are required' });
      }
      if (!projectId || !headWage || !helperRate) {
        return res.status(400).json({ success: false, error: 'Site, head wage, and helper rate are required' });
      }
      const attendance = await labourService.saveAttendance(parseInt(labourId, 10), companyId, { projectId, attendanceDate, headWage, headDayType, fullHelpers, halfHelpers, helperRate, entryStatus, notes });
      if (!attendance) return res.status(404).json({ success: false, error: 'Labourer not found' });
      res.status(201).json({ success: true, data: attendance, message: 'Attendance saved successfully' });
    } catch (error) {
      console.error('Save attendance error:', error);
      res.status(500).json({ success: false, error: 'Failed to save attendance', details: error.message });
    }
  };

  export const getLabourAttendance = async (req, res) => {
    try {
      if (req.user.type === 'engineer' && !await labourService.isLabourAssignedToEngineer(
        parseInt(req.params.id, 10), req.user.companyId, req.user.engineerId || req.user.id
      )) {
        return res.status(404).json({ success: false, error: 'Labourer not found' });
      }
      const attendance = await labourService.getLabourAttendance(parseInt(req.params.id, 10), req.user.companyId);
      res.json({ success: true, data: attendance });
    } catch (error) {
      console.error('Get attendance error:', error);
      res.status(error.message === 'Labourer not found or access denied' ? 404 : 500).json({ success: false, error: error.message || 'Failed to fetch attendance' });
    }
  };

  // Get all payments for a labourer
  export const getLabourerPayments = async (req, res) => {
    try {
      const { id } = req.params;
      const companyId = req.user.companyId;

      if (req.user.type === 'engineer' && !await labourService.isLabourAssignedToEngineer(
        parseInt(id, 10), companyId, req.user.engineerId || req.user.id
      )) {
        return res.status(404).json({ success: false, error: 'Labourer not found' });
      }
      
      const payments = await labourService.getLabourerPayments(
        parseInt(id), 
        companyId
      );
      
      res.json({
        success: true,
        data: payments,
        count: payments.length
      });
    } catch (error) {
      console.error('Get labourer payments error:', error);
      
      if (error.message === 'Labourer not found or access denied') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to fetch payments',
        details: error.message
      });
    }
  };

  // Delete payment
  export const deletePayment = async (req, res) => {
    try {
      const { labourId, paymentId } = req.params;
      const companyId = req.user.companyId;
      
      const result = await labourService.deletePayment(
        parseInt(paymentId),
        parseInt(labourId),
        companyId
      );
      
      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'Payment not found or access denied'
        });
      }
      
      res.json({
        success: true,
        message: 'Payment deleted successfully'
      });
    } catch (error) {
      console.error('Delete payment error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete payment',
        details: error.message
      });
    }
  };

  // Get labourers by project
  export const getLabourersByProject = async (req, res) => {
    try {
      const { projectId } = req.params;
      const companyId = req.user.companyId;

      if (req.user.type === 'engineer' && !await labourService.isProjectAssignedToEngineer(
        projectId, companyId, req.user.engineerId || req.user.id
      )) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }
      
      const labourers = await labourService.getLabourersByProject(
        parseInt(projectId), 
        companyId
      );
      
      res.json({
        success: true,
        data: labourers,
        count: labourers.length
      });
    } catch (error) {
      console.error('Get labourers by project error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch labourers for project',
        details: error.message
      });
    }
  };

  // Get labour statistics
  export const getLabourStatistics = async (req, res) => {
    try {
      const companyId = req.user.companyId;
      const { projectId } = req.query;
      
      const statistics = await labourService.getLabourStatistics(
        companyId,
        projectId ? parseInt(projectId) : null
      );
      
      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('Get labour statistics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch labour statistics',
        details: error.message
      });
    }
  };

  export const uploadLabourList = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }

      const companyId = req.user.companyId;
      const rows = await parseLabourFile(req.file);

      if (rows.length < 2) {
        return res.status(400).json({ success: false, error: 'Upload file must include a header row and at least one labour row' });
      }

      const headerMap = rows[0].map(normalizeHeader).reduce((map, header, index) => ({ ...map, [header]: index }), {});
      const created = [];
      const skipped = [];

      for (const row of rows.slice(1)) {
        const name = pickValue(row, headerMap, ['name', 'labourname', 'labourername', 'workername']);
        const phone = pickValue(row, headerMap, ['phone', 'phonenumber', 'mobile', 'mobilenumber', 'contact', 'contactnumber']);

        if (!name || !phone) {
          skipped.push({ row: created.length + skipped.length + 2, reason: 'Missing name or phone' });
          continue;
        }

        const projectId = pickValue(row, headerMap, ['projectid']);
        const labourer = await labourService.createLabourer({
          name,
          phone,
          address: pickValue(row, headerMap, ['address']),
          designation: pickValue(row, headerMap, ['designation', 'role', 'trade']),
          project: pickValue(row, headerMap, ['project', 'projectname', 'assignedproject']),
          projectId: projectId ? parseInt(projectId, 10) : null,
          companyId
        });
        created.push(labourer);
      }

      if (created.length === 0) {
        return res.status(400).json({ success: false, error: 'No valid labour rows found', skipped });
      }

      res.status(201).json({
        success: true,
        data: created,
        skipped,
        count: created.length,
        message: `Uploaded ${created.length} labour${created.length === 1 ? '' : 'ers'} successfully${skipped.length ? `, skipped ${skipped.length}` : ''}.`
      });
    } catch (error) {
      console.error('Upload labour list error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload labour list',
        details: error.message
      });
    }
  };
