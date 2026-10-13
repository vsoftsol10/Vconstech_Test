export const UNIT_OPTIONS = [
  "Nos", "Sqft", "Sqm", "Rft", "Rmt", "Cum", "Cft", 
  "Kg", "Ton", "Litre", "Day", "Month", "Lumpsum", "others"
];

export const STATUS_OPTIONS = {
  OPEN: 'open',
  SENT: 'sent',
  PAID: 'paid',
  DRAFT: 'draft',
};

export const STATUS_COLORS = {
  [STATUS_OPTIONS.OPEN]: 'bg-yellow-100 text-yellow-700',
  [STATUS_OPTIONS.SENT]: 'bg-blue-100 text-blue-700',
  [STATUS_OPTIONS.PAID]: 'bg-green-100 text-green-700',
  [STATUS_OPTIONS.DRAFT]: 'bg-gray-100 text-gray-700',
};

export const DEFAULT_ITEM = {
  sno: 1,
  description: "", 
  HSN: 0,
  unit: "Nos", 
  quantity: 0, 
  rate: 0, 
  amount: 0
};