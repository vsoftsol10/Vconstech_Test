import { showToast } from '../../../components/common/Toast';
import { adaptBillToTemplate, renderTemplateDocument, templatePrintStyles, templateReferenceStyles, templateSevenStyles } from '../../../components/templates';
import { getPlanTemplateLimit } from '../../../config/planTemplateLimits';

const selectedTemplate = () => {
  const id = Number(localStorage.getItem('selectedTemplateId') || 1);
  const plan = localStorage.getItem('userPlan') || localStorage.getItem('package') || 'TRIAL';
  return id >= 1 && id <= getPlanTemplateLimit(plan) ? id : 1;
};

// This remains the existing Billing list print entry point. Its window is
// self-contained because CSS loaded by Vite/Tailwind is unavailable there.
export const printBill = (bill) => {
  if (!bill) return showToast('Invalid bill data', 'warning');
  if (!(bill.BillItem || bill.items || []).length) return showToast('No items found in this bill', 'warning');
  const printWindow = window.open('', '_blank');
  if (!printWindow) return showToast('Please allow pop-ups to print this document.', 'warning');
  const type = String(bill.billType || 'invoice').toLowerCase();
  const title = type === 'quotation' ? 'Quotation' : 'Invoice';
  printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><base href="${window.location.origin}/"><title>${title} - ${bill.billId || bill.billNumber || ''}</title><style>${templatePrintStyles}${templateReferenceStyles}${templateSevenStyles}.print-action{position:fixed;right:20px;top:15px;border:0;border-radius:8px;background:#ffbe2a;color:#111;padding:10px 16px;font-weight:bold;cursor:pointer}@media print{.print-action{display:none}}</style></head><body><button class="print-action" onclick="window.print()">Print ${title}</button>${renderTemplateDocument(selectedTemplate(), adaptBillToTemplate(bill))}</body></html>`);
  printWindow.document.close();
};
