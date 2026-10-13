export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return "Email is required";
  if (!emailRegex.test(email)) return "Please enter a valid email address";
  return "";
};

export const validatePhone = (phone) => {
  if (!phone) return "Phone number is required";
  if (!/^\d+$/.test(phone)) return "Phone number must contain only digits";
  if (phone.length !== 10) return "Phone number must be exactly 10 digits";
  return "";
};

export const validatePassword = (password) => {
  if (!password) return "Password is required";
  if (password.length < 6) return "Password must be at least 6 characters";
  if (password.length > 50) return "Password must be less than 50 characters";
  return "";
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return "Please confirm your password";
  if (password !== confirmPassword) return "Passwords do not match";
  return "";
};

export const validateName = (name) => {
  if (!name) return "Name is required";
  if (name.length < 2) return "Name must be at least 2 characters";
  if (name.length > 100) return "Name must be less than 100 characters";
  return "";
};

export const validateCompanyName = (companyName) => {
  if (!companyName) return "Company name is required";
  if (companyName.length < 2) return "Company name must be at least 2 characters";
  return "";
};

export const validateCity = (city) => {
  if (!city) return "City is required";
  if (city.length < 2) return "City name must be at least 2 characters";
  return "";
};

export const validateAddress = (address) => {
  if (!address) return "Address is required";
  if (address.length < 10) return "Please enter a complete address";
  return "";
};

export const validateCustomMembers = (members) => {
  if (!members) return "Number of site engineers is required";
  const num = parseInt(members);
  if (isNaN(num) || num < 1) return "Must be at least 1";
  if (num > 1000) return "Must be less than 1000";
  return "";
};

export const validateCustomProjectLimit = (projects) => {
  if (!projects) return "Number of projects is required";
  const num = parseInt(projects, 10);
  if (!Number.isInteger(num) || num < 1) return "Must be at least 1";
  if (num > 10000) return "Must be less than 10000";
  return "";
};

export const validateCustomPrice = (price) => {
  if (price === "" || price === null || price === undefined) return "Custom price is required";
  const amount = Number(price);
  if (!Number.isFinite(amount) || amount < 0) return "Enter a valid price";
  return "";
};

export const validateCustomTemplateLimit = (templates) => {
  const value = Number(templates);
  if (!Number.isInteger(value) || value < 1 || value > 10) return "Enter a whole number from 1 to 10";
  return "";
};

export const validateCreateForm = (userData) => {
  const errors = {
    name: validateName(userData.name),
    email: validateEmail(userData.email),
    phoneNumber: validatePhone(userData.phoneNumber),
    companyName: validateCompanyName(userData.companyName),
    city: validateCity(userData.city),
    address: validateAddress(userData.address),
    password: validatePassword(userData.password),
    confirmPassword: validateConfirmPassword(userData.password, userData.confirmPassword),
  };
  if (!userData.role) errors.role = "Please select a role";
  if (!userData.package) errors.package = "Please select a package";
  if (userData.package === "Advanced") {
    errors.customMembers = validateCustomMembers(userData.customMembers);
    errors.customProjectLimit = validateCustomProjectLimit(userData.customProjectLimit);
    errors.customPrice = validateCustomPrice(userData.customPrice);
    errors.customTemplateLimit = validateCustomTemplateLimit(userData.customTemplateLimit);
  }
  return Object.fromEntries(Object.entries(errors).filter(([, v]) => v !== ""));
};

export const validateEditForm = (user) => {
  const errors = {
    name: validateName(user.name),
    email: validateEmail(user.email),
    phoneNumber: validatePhone(user.phoneNumber),
    companyName: validateCompanyName(user.companyName),
    city: validateCity(user.city),
    address: validateAddress(user.address),
  };
  if (!user.role) errors.role = "Please select a role";
  if (!user.package) errors.package = "Please select a package";
  if (user.package === "Advanced") {
    errors.customMembers = validateCustomMembers(user.customMembers);
    errors.customProjectLimit = validateCustomProjectLimit(user.customProjectLimit);
    errors.customPrice = validateCustomPrice(user.customPrice);
    errors.customTemplateLimit = validateCustomTemplateLimit(user.customTemplateLimit);
  }
  if (user.password) {
    errors.password = validatePassword(user.password);
    errors.confirmPassword = validateConfirmPassword(user.password, user.confirmPassword);
  }
  return Object.fromEntries(Object.entries(errors).filter(([, v]) => v !== ""));
};
