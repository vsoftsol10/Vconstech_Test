const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_PATTERN = /^\d{10}$/;
const PINCODE_PATTERN = /^\d{6}$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const LETTERS_SPACES_PATTERN = /^[A-Za-z\s]+$/;

export const trimValue = (value) => (typeof value === 'string' ? value.trim() : value);

export const getTodayDateInputValue = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const isDateBefore = (value, minValue) => (
  Boolean(value && minValue && String(value) < String(minValue))
);

export const validators = {
  required: (value, label = 'This field') => {
    const nextValue = trimValue(value);
    return nextValue === undefined || nextValue === null || nextValue === ''
      ? `${label} is required`
      : '';
  },

  name: (value, label = 'Name') => {
    const requiredError = validators.required(value, label);
    if (requiredError) return requiredError;
    const nextValue = trimValue(value);
    if (nextValue.length < 2) return `${label} must be at least 2 characters`;
    if (nextValue.length > 100) return `${label} must be 100 characters or less`;
    return '';
  },

  lettersSpacesName: (value, label = 'Name') => {
    const requiredError = validators.required(value, label);
    if (requiredError) return requiredError;
    const nextValue = trimValue(value);
    if (nextValue.length < 3) return `${label} must be at least 3 characters`;
    if (nextValue.length > 100) return `${label} must be 100 characters or less`;
    return LETTERS_SPACES_PATTERN.test(nextValue)
      ? ''
      : `${label} can contain letters and spaces only`;
  },

  designation: (value, label = 'Designation') => {
    const requiredError = validators.required(value, label);
    if (requiredError) return requiredError;
    return trimValue(value).length >= 2 ? '' : `${label} must be at least 2 characters`;
  },

  email: (value, label = 'Email') => {
    const requiredError = validators.required(value, label);
    if (requiredError) return requiredError;
    return EMAIL_PATTERN.test(trimValue(value)) ? '' : `Enter a valid ${label.toLowerCase()}`;
  },

  optionalEmail: (value, label = 'Email') => {
    if (!trimValue(value)) return '';
    return EMAIL_PATTERN.test(trimValue(value)) ? '' : `Enter a valid ${label.toLowerCase()}`;
  },

  mobile: (value, label = 'Mobile number') => {
    const requiredError = validators.required(value, label);
    if (requiredError) return requiredError;
    return MOBILE_PATTERN.test(String(value)) ? '' : `${label} must be exactly 10 digits`;
  },

  optionalMobile: (value, label = 'Phone number') => {
    if (!trimValue(value)) return '';
    return MOBILE_PATTERN.test(String(value)) ? '' : `${label} must be exactly 10 digits`;
  },

  password: (value, label = 'Password') => {
    const requiredError = validators.required(value, label);
    if (requiredError) return requiredError;
    return PASSWORD_PATTERN.test(value)
      ? ''
      : `${label} must be 8+ chars with uppercase, lowercase, number, and special character`;
  },

  pincode: (value, label = 'Pincode') => {
    const requiredError = validators.required(value, label);
    if (requiredError) return requiredError;
    return PINCODE_PATTERN.test(String(value)) ? '' : `${label} must be exactly 6 digits`;
  },

  amount: (value, label = 'Amount') => {
    const requiredError = validators.required(value, label);
    if (requiredError) return requiredError;
    const numberValue = Number(value);
    return Number.isFinite(numberValue) && numberValue > 0 ? '' : `${label} must be a positive amount`;
  },

  optionalAmount: (value, label = 'Amount') => {
    if (!trimValue(value)) return '';
    return validators.amount(value, label);
  },

  quantity: (value, label = 'Quantity') => {
    const requiredError = validators.required(value, label);
    if (requiredError) return requiredError;
    const numberValue = Number(value);
    return Number.isInteger(numberValue) && numberValue > 0 ? '' : `${label} must be a positive whole number`;
  },

  optionalQuantity: (value, label = 'Quantity') => {
    if (!trimValue(value) && value !== 0) return '';
    return validators.quantity(value, label);
  },

  date: (value, label = 'Date') => {
    const requiredError = validators.required(value, label);
    if (requiredError) return requiredError;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? `${label} must be a valid date` : '';
  },

  todayOrFutureDate: (value, label = 'Date') => {
    const dateError = validators.date(value, label);
    if (dateError) return dateError;
    return isDateBefore(value, getTodayDateInputValue()) ? `${label} cannot be in the past` : '';
  },

  dropdown: (value, label = 'Selection') => {
    const requiredError = validators.required(value, label);
    if (requiredError) return requiredError;
    return String(value).toLowerCase() === 'select' ? `Please select ${label.toLowerCase()}` : '';
  },

  textarea: (value, label = 'Comment') => validators.required(value, label),

  textareaMin5: (value, label = 'Details') => {
    const requiredError = validators.required(value, label);
    if (requiredError) return requiredError;
    return trimValue(value).length >= 5 ? '' : `${label} must be at least 5 characters`;
  },

  file: (value, label = 'File') => {
    if (Array.isArray(value)) return value.length > 0 ? '' : `${label} is required`;
    if (value?.length !== undefined) return value.length > 0 ? '' : `${label} is required`;
    return value ? '' : `${label} is required`;
  },
};

export const validateFields = (fields) => {
  const errors = {};

  fields.forEach(({ name, value, label, rules = [] }) => {
    for (const rule of rules) {
      const validator = typeof rule === 'function' ? rule : validators[rule];
      if (!validator) continue;
      const error = validator(value, label);
      if (error) {
        errors[name] = error;
        break;
      }
    }
  });

  return errors;
};

export const focusFirstInvalidField = (errors, root = document) => {
  const firstField = Object.keys(errors)[0];
  if (!firstField) return;

  const selector = `[name="${firstField}"], [data-field="${firstField}"]`;
  const element = root?.querySelector?.(selector);
  if (element?.focus) element.focus();
};
