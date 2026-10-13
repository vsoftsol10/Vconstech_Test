export const PASSWORD_CHANGE_PURPOSE = 'password-change';

export const isStrongPassword = (password) => (
  typeof password === 'string' &&
  password.length >= 12 &&
  /[a-z]/.test(password) &&
  /[A-Z]/.test(password) &&
  /\d/.test(password) &&
  /[^A-Za-z0-9]/.test(password)
);

export const isSubscriptionExpired = (user, now = new Date()) => {
  const status = String(user.subscriptionStatus || '').trim().toUpperCase();
  const accountStatus = String(user.accountStatus || '').trim().toUpperCase();
  if (['TRIAL_EXPIRED', 'SUBSCRIPTION_EXPIRED', 'INACTIVE', 'CANCELLED', 'EXPIRED'].includes(status)) return true;
  if (accountStatus && accountStatus !== 'ACTIVE') return true;
  return Boolean(user.trialEndDate && new Date(user.trialEndDate) < now);
};

export const isTemporaryPasswordExpired = (user, now = new Date()) =>
  Boolean(user.passwordExpiresAt && new Date(user.passwordExpiresAt) < now);
