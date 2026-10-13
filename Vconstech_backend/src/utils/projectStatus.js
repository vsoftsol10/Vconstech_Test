export const normalizeProjectStatus = (status) => {
  const normalized = String(status || '').trim().toLowerCase();
  if (['pending', 'planning'].includes(normalized)) return 'PLANNING';
  if (['ongoing', 'in progress', 'in_progress', 'active'].includes(normalized)) return 'IN_PROGRESS';
  if (['completed', 'complete'].includes(normalized)) return 'COMPLETED';
  return normalized.toUpperCase();
};

export const isProjectExecutionEnabled = (status) =>
  normalizeProjectStatus(status) === 'IN_PROGRESS';
