import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PDF_THEME = {
  primary: '#FFBE2A',
  ink: '#111827',
  text: '#1F2937',
  muted: '#6B7280',
  border: '#E5E7EB',
  surface: '#F9FAFB',
  rowAlt: '#FFFDF7',
  white: '#FFFFFF',
  green: '#10B981',
};

const PAGE = {
  margin: 36,
  footerHeight: 52,
};

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const quantityFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 2,
});

const money = (amount) => currencyFormatter.format(Number(amount || 0));

const formatQuantity = (amount) => quantityFormatter.format(Number(amount || 0));

const textValue = (value, fallback = 'N/A') => {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
};

const getGeneratedAtText = (generatedDate, generatedTime) => {
  if (generatedDate && generatedTime) return `${generatedDate} at ${generatedTime}`;
  if (generatedDate) return generatedDate;
  return new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });
};

const getFontPath = (fileNames) => {
  const candidates = [
    ...fileNames.map((fileName) => path.resolve('C:/Windows/Fonts', fileName)),
    ...fileNames.map((fileName) => path.resolve('/usr/share/fonts/truetype/dejavu', fileName)),
    ...fileNames.map((fileName) => path.resolve('/usr/share/fonts/truetype/liberation2', fileName)),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
};

const registerReportFonts = (doc) => {
  const regularFont = getFontPath(['arial.ttf', 'DejaVuSans.ttf', 'LiberationSans-Regular.ttf']);
  const boldFont = getFontPath(['arialbd.ttf', 'DejaVuSans-Bold.ttf', 'LiberationSans-Bold.ttf']);

  if (regularFont) doc.registerFont('ERP-Regular', regularFont);
  if (boldFont) doc.registerFont('ERP-Bold', boldFont);

  return {
    regular: regularFont ? 'ERP-Regular' : 'Helvetica',
    bold: boldFont ? 'ERP-Bold' : 'Helvetica-Bold',
  };
};

const drawHeader = (doc, ctx, title, projectName, generatedAtText, fonts) => {
  const headerHeight = 86;

  doc
    .roundedRect(ctx.margin, ctx.y, ctx.contentWidth, headerHeight, 6)
    .fillAndStroke(PDF_THEME.white, PDF_THEME.border);

  doc
    .rect(ctx.margin, ctx.y, ctx.contentWidth, 8)
    .fill(PDF_THEME.ink);

  doc
    .font(fonts.bold)
    .fontSize(20)
    .fillColor(PDF_THEME.ink)
    .text(title, ctx.margin + 16, ctx.y + 30, {
      width: ctx.contentWidth - 230,
      lineBreak: false,
    });

  doc
    .font(fonts.regular)
    .fontSize(10)
    .fillColor(PDF_THEME.muted)
    .text(projectName, ctx.margin + 16, ctx.y + 56, {
      width: ctx.contentWidth - 230,
      lineBreak: false,
    });

  doc
    .font(fonts.regular)
    .fontSize(9)
    .fillColor(PDF_THEME.muted)
    .text('Generated Date & Time', ctx.pageWidth - ctx.margin - 160, ctx.y + 28, {
      width: 152,
      align: 'right',
    });

  doc
    .font(fonts.bold)
    .fontSize(10)
    .fillColor(PDF_THEME.ink)
    .text(generatedAtText, ctx.pageWidth - ctx.margin - 190, ctx.y + 46, {
      width: 182,
      align: 'right',
    });

  doc
    .rect(ctx.margin, ctx.y + headerHeight - 4, ctx.contentWidth, 4)
    .fill(PDF_THEME.primary);

  ctx.y += headerHeight + 18;
};

const ensureSpace = (doc, ctx, height) => {
  if (ctx.y + height > ctx.pageHeight - PAGE.footerHeight) {
    doc.addPage();
    ctx.y = ctx.margin;
  }
};

const drawMetricCards = (doc, ctx, cards, fonts) => {
  const gap = 10;
  const cardHeight = 56;
  const cardWidth = (ctx.contentWidth - (gap * (cards.length - 1))) / cards.length;

  ensureSpace(doc, ctx, cardHeight + 14);

  cards.forEach((card, index) => {
    const x = ctx.margin + index * (cardWidth + gap);

    doc
      .roundedRect(x, ctx.y, cardWidth, cardHeight, 6)
      .fillAndStroke(card.fill || '#FFF7D6', '#F2CF68');

    doc
      .font(fonts.bold)
      .fontSize(7.5)
      .fillColor(PDF_THEME.muted)
      .text(String(card.label).toUpperCase(), x + 8, ctx.y + 12, {
        width: cardWidth - 16,
        lineBreak: false,
      });

    doc
      .font(fonts.bold)
      .fontSize(12)
      .fillColor(card.text || PDF_THEME.text)
      .text(String(card.value), x + 8, ctx.y + 30, {
        width: cardWidth - 16,
        height: 18,
        ellipsis: true,
      });
  });

  ctx.y += 70;
};

const drawSectionTitle = (doc, ctx, title, fonts) => {
  ensureSpace(doc, ctx, 38);

  doc
    .roundedRect(ctx.margin, ctx.y, ctx.contentWidth, 24, 5)
    .fillAndStroke(PDF_THEME.surface, PDF_THEME.border);

  doc
    .rect(ctx.margin, ctx.y, 5, 24)
    .fill(PDF_THEME.primary);

  doc
    .font(fonts.bold)
    .fontSize(11)
    .fillColor(PDF_THEME.ink)
    .text(title, ctx.margin + 14, ctx.y + 7, {
      width: ctx.contentWidth - 28,
      lineBreak: false,
    });

  ctx.y += 34;
};

const drawTableHeader = (doc, ctx, columns, rowHeight, fonts) => {
  doc
    .rect(ctx.margin, ctx.y, ctx.contentWidth, rowHeight)
    .fill(PDF_THEME.ink);

  columns.forEach((column) => {
    doc
      .font(fonts.bold)
      .fontSize(8)
      .fillColor(PDF_THEME.white)
      .text(column.label, column.x + 5, ctx.y + 9, {
        width: column.width - 10,
        align: column.align || 'left',
        lineBreak: false,
      });
  });

  ctx.y += rowHeight;
};

const drawMaterialTable = (doc, ctx, usageLogs, fonts) => {
  drawSectionTitle(doc, ctx, 'Material Usage Details', fonts);

  const headerHeight = 30;
  const rowHeight = 25;
  const columns = [
    { key: 'date', label: 'Date', width: 64, align: 'center' },
    { key: 'materialName', label: 'Material', width: 112, align: 'left' },
    { key: 'category', label: 'Category', width: 76, align: 'left' },
    { key: 'quantity', label: 'Qty', width: 48, align: 'center' },
    { key: 'unit', label: 'Unit', width: 48, align: 'center' },
    { key: 'rate', label: 'Rate (\u20B9)', width: 80, align: 'right' },
    { key: 'cost', label: 'Cost (\u20B9)', width: 95, align: 'right' },
  ];

  columns.reduce((x, column) => {
    column.x = x;
    return x + column.width;
  }, ctx.margin);

  ensureSpace(doc, ctx, headerHeight + rowHeight);
  drawTableHeader(doc, ctx, columns, headerHeight, fonts);

  usageLogs.forEach((log, index) => {
    if (ctx.y + rowHeight > ctx.pageHeight - PAGE.footerHeight) {
      doc.addPage();
      ctx.y = ctx.margin;
      drawTableHeader(doc, ctx, columns, headerHeight, fonts);
    }

    const fill = index % 2 === 0 ? PDF_THEME.white : PDF_THEME.rowAlt;
    doc
      .rect(ctx.margin, ctx.y, ctx.contentWidth, rowHeight)
      .fillAndStroke(fill, PDF_THEME.border);

    const row = {
      date: textValue(log.date),
      materialName: textValue(log.materialName),
      category: textValue(log.category),
      quantity: formatQuantity(log.quantity),
      unit: textValue(log.unit, 'unit'),
      rate: money(log.rate),
      cost: money(log.cost),
    };

    columns.forEach((column) => {
      doc
        .font(fonts.regular)
        .fontSize(8)
        .fillColor(PDF_THEME.text)
        .text(row[column.key], column.x + 5, ctx.y + 8, {
          width: column.width - 10,
          height: 10,
          align: column.align || 'left',
          ellipsis: true,
          lineBreak: false,
        });
    });

    ctx.y += rowHeight;
  });

  ctx.y += 16;
};

const addFooter = (doc, generatedAtText, fonts) => {
  const range = doc.bufferedPageRange();

  for (let index = range.start; index < range.start + range.count; index += 1) {
    doc.switchToPage(index);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const pageNumber = index + 1;

    doc
      .moveTo(PAGE.margin, pageHeight - 32)
      .lineTo(pageWidth - PAGE.margin, pageHeight - 32)
      .stroke(PDF_THEME.border);

    doc
      .font(fonts.regular)
      .fontSize(8)
      .fillColor(PDF_THEME.muted)
      .text('Generated by ERP', PAGE.margin, pageHeight - 22, {
        width: 150,
        lineBreak: false,
      });

    doc
      .text(generatedAtText, pageWidth / 2 - 120, pageHeight - 22, {
        width: 240,
        align: 'center',
        lineBreak: false,
      });

    doc
      .text(`Page ${pageNumber} of ${range.count}`, pageWidth - PAGE.margin - 120, pageHeight - 22, {
        width: 120,
        align: 'right',
        lineBreak: false,
      });
  }
};

/**
 * Generate Material Usage Report PDF
 * POST /api/reports/usage-pdf
 */
export const generateUsageReportPDF = async (req, res) => {
  try {
    const {
      projectName,
      generatedDate,
      generatedTime,
      usageLogs,
      totalEntries,
      grandTotal,
    } = req.body;

    if (!usageLogs || usageLogs.length === 0) {
      return res.status(400).json({ error: 'No usage logs provided' });
    }

    const safeProjectName = textValue(projectName, 'Material_Usage_Report').replace(/\s+/g, '_');
    const generatedAtText = getGeneratedAtText(generatedDate, generatedTime);
    const totalQuantity = usageLogs.reduce((sum, log) => sum + (Number(log.quantity) || 0), 0);
    const totalCost = Number(grandTotal ?? usageLogs.reduce((sum, log) => sum + (Number(log.cost) || 0), 0)) || 0;
    const entryCount = Number(totalEntries ?? usageLogs.length) || usageLogs.length;

    const doc = new PDFDocument({
      size: 'A4',
      bufferPages: true,
      margins: {
        top: PAGE.margin,
        bottom: PAGE.footerHeight,
        left: PAGE.margin,
        right: PAGE.margin,
      },
    });
    const fonts = registerReportFonts(doc);

    const ctx = {
      margin: PAGE.margin,
      pageWidth: doc.page.width,
      pageHeight: doc.page.height,
      contentWidth: doc.page.width - (PAGE.margin * 2),
      y: PAGE.margin,
    };

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${safeProjectName}_Usage_Report_${new Date().toISOString().split('T')[0]}.pdf`
    );

    doc.pipe(res);

    drawHeader(doc, ctx, 'Material Usage Report', textValue(projectName), generatedAtText, fonts);
    drawMetricCards(doc, ctx, [
      { label: 'Project Name', value: textValue(projectName) },
      { label: 'Total Entries', value: entryCount },
      { label: 'Total Quantity', value: formatQuantity(totalQuantity) },
      { label: 'Grand Total Cost', value: money(totalCost), text: PDF_THEME.green },
    ], fonts);
    drawMaterialTable(doc, ctx, usageLogs, fonts);
    addFooter(doc, generatedAtText, fonts);

    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate PDF report', details: error.message });
    }
  }
};
