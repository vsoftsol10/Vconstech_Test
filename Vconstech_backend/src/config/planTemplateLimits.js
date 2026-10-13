export const PLAN_TEMPLATE_LIMITS = Object.freeze({ TRIAL: 1, FREE: 1, BASIC: 2, PREMIUM: 5, ADVANCED: 10 });

export const getPlanTemplateLimit = (plan, customTemplateLimit) => {
  const normalizedPlan = String(plan || 'TRIAL').trim().toUpperCase();
  if (normalizedPlan === 'ADVANCED' && Number.isInteger(Number(customTemplateLimit))) {
    return Math.min(10, Math.max(1, Number(customTemplateLimit)));
  }
  return PLAN_TEMPLATE_LIMITS[normalizedPlan] || PLAN_TEMPLATE_LIMITS.TRIAL;
};
